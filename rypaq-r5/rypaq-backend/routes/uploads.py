import os
import json
import time
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from activity_service import log_activity
from database import get_session
from dependencies import GPUser
from demo_data import DEMO_UPLOADS
from models import Company, DueDiligenceReport, ExtractedData, MacroIndicator, UploadedPDF
from pypdf import PdfReader

from ai_models import pesa_risk_model

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

_gemini_client = None


def _get_gemini_client():
    global _gemini_client
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    if _gemini_client is None:
        from google import genai

        _gemini_client = genai.Client(api_key=key)
    return _gemini_client


@router.get("/list")
async def list_uploads(user: GPUser, session: Session = Depends(get_session)):
    if user.is_demo:
        return DEMO_UPLOADS
    uploads = session.exec(select(UploadedPDF).order_by(UploadedPDF.upload_date.desc())).all()
    result = []
    for upload in uploads:
        company = None
        if upload.company_id:
            company = session.exec(select(Company).where(Company.id == upload.company_id)).first()
        result.append(
            {
                "id": upload.id,
                "filename": upload.filename,
                "file_size_mb": round(upload.file_size_mb, 2),
                "upload_date": upload.upload_date.isoformat(),
                "company_id": company.external_id if company else None,
                "company_name": company.name if company else None,
            }
        )
    return result


@router.delete("/{upload_id}")
async def delete_upload(upload_id: int, user: GPUser, session: Session = Depends(get_session)):
    if user.is_demo:
        raise HTTPException(status_code=403, detail="Uploads are disabled in demo mode")
    upload = session.exec(select(UploadedPDF).where(UploadedPDF.id == upload_id)).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    company_id = upload.company_id
    extracted_entries = session.exec(select(ExtractedData).where(ExtractedData.pdf_id == upload_id)).all()
    for e in extracted_entries:
        session.delete(e)

    session.delete(upload)
    session.commit()
    log_activity(session, user.id, "upload_delete", "upload", str(upload_id), {"filename": upload.filename})

    if company_id:
        remaining = session.exec(select(UploadedPDF).where(UploadedPDF.company_id == company_id)).all()
        if len(remaining) == 0:
            report = session.exec(
                select(DueDiligenceReport).where(DueDiligenceReport.company_id == company_id)
            ).first()
            if report:
                session.delete(report)
            company = session.exec(select(Company).where(Company.id == company_id)).first()
            if company:
                session.delete(company)
            session.commit()

    return {"message": "Upload deleted successfully", "id": upload_id}


def _clamp(value, min_val, max_val):
    if value is None:
        return (min_val + max_val) / 2
    try:
        return round(max(min_val, min(max_val, float(value))), 1)
    except Exception:
        return (min_val + max_val) / 2


@router.post("/pdf")
async def upload_pdf(
    user: GPUser,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    if user.is_demo:
        raise HTTPException(status_code=403, detail="PDF upload is disabled in demo mode. Use a full account.")
    client = _get_gemini_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Document AI is not configured (set GEMINI_API_KEY in the server environment).",
        )

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_location = None
    try:
        file_location = f"/tmp/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        reader = PdfReader(file_location)
        text_content = ""
        for page in reader.pages:
            text_content += (page.extract_text() or "") + "\n"

        llm_prompt = f"""You are a financial analyst. Extract data from this document.
If a value like revenue or debt is listed as 'millions', convert to absolute numbers (e.g. 5M -> 5000000).
If 'Revenue' is not explicitly found, look for 'Total Sales', 'Total Income', or 'Turnover'.
Respond ONLY with a valid JSON object.

Required fields:
- company_name, sector, revenue (float), ebitda (float/null), debt (float/null), enterprise_value (float/null)
- red_flags (list), green_flags (list)
- market_risk_score, financial_health_score, operational_efficiency_score, customer_concentration_score, macro_sensitivity_score, data_integrity_score (all 1-10)

Text: {text_content[:10000]}

JSON:"""

        max_retries = 2
        extracted_data_json = None

        for attempt in range(max_retries + 1):
            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=llm_prompt,
                    config={"response_mime_type": "application/json"},
                )
                extracted_data_json = json.loads(response.text)
                break
            except Exception as e:
                if "429" in str(e) and attempt < max_retries:
                    print(f"Rate limit hit. Waiting 60s (Attempt {attempt + 1}/{max_retries})...")
                    time.sleep(60)
                    continue
                raise e

        required_fields = ["company_name", "sector", "revenue"]
        for field in required_fields:
            if field not in extracted_data_json or extracted_data_json[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"LLM failed to extract required field: {field}",
                )

        macro = session.exec(select(MacroIndicator).order_by(MacroIndicator.timestamp.desc())).first()
        gdp = macro.gdp_growth if macro else 5.2
        inflation = macro.inflation_rate if macro else 3.8

        _revenue_val = float(extracted_data_json.get("revenue") or 1)
        _debt_val = float(extracted_data_json.get("debt") or 0)
        _debt_ratio = _debt_val / _revenue_val if _revenue_val > 0 else 0.5

        risk_inputs = {
            "gdpGrowth": gdp,
            "inflation": inflation,
            "revenueGrowth": 15.0,
            "debtRatio": _debt_ratio,
            "volatility": 0.15,
        }
        risk_results = pesa_risk_model.predict(risk_inputs)

        company = session.exec(
            select(Company).where(Company.name == extracted_data_json["company_name"])
        ).first()
        if not company:
            company = Company(
                name=extracted_data_json["company_name"],
                external_id=f"comp_{extracted_data_json['company_name'].replace(' ', '_').lower()}",
                sector=extracted_data_json["sector"],
                revenue=extracted_data_json["revenue"],
                enterprise_value=float(extracted_data_json.get("enterprise_value") or 0.0),
                ebitda=extracted_data_json.get("ebitda"),
                debt=extracted_data_json.get("debt"),
                probability_3x_return=float(risk_results.get("confidence") or 0.85) * 100,
                alpha_score=float(risk_results.get("predictedIrr", 15.0)) / 2,
                signals=json.dumps([f"Risk Label: {risk_results['riskLabel']}"]),
            )
            session.add(company)
            session.commit()
            session.refresh(company)

        _file_size = os.path.getsize(file_location) / (1024 * 1024) if os.path.exists(file_location) else 0.0
        uploaded_pdf = UploadedPDF(
            company_id=company.id,
            filename=file.filename or "upload.pdf",
            file_path=file_location,
            file_size_mb=_file_size,
        )
        session.add(uploaded_pdf)
        session.flush()

        extracted_db_entry = ExtractedData(
            pdf_id=uploaded_pdf.id,
            company_id=company.id,
            company_name=extracted_data_json["company_name"],
            sector=extracted_data_json["sector"],
            revenue=extracted_data_json["revenue"],
        )
        session.add(extracted_db_entry)

        existing_report = session.exec(
            select(DueDiligenceReport).where(DueDiligenceReport.company_id == company.id)
        ).first()
        if existing_report:
            session.delete(existing_report)
            session.flush()

        diligence_report = DueDiligenceReport(
            company_id=company.id,
            market_risk=_clamp(extracted_data_json.get("market_risk_score"), 1.0, 10.0),
            financial_health=_clamp(extracted_data_json.get("financial_health_score"), 1.0, 10.0),
            operational_efficiency=_clamp(extracted_data_json.get("operational_efficiency_score"), 1.0, 10.0),
            customer_concentration=_clamp(extracted_data_json.get("customer_concentration_score"), 1.0, 10.0),
            macro_sensitivity=_clamp(extracted_data_json.get("macro_sensitivity_score"), 1.0, 10.0),
            data_integrity_score=_clamp(extracted_data_json.get("data_integrity_score"), 1.0, 10.0),
            red_flags=json.dumps(extracted_data_json.get("red_flags") or []),
            green_flags=json.dumps(extracted_data_json.get("green_flags") or []),
        )
        session.add(diligence_report)
        session.commit()

        log_activity(
            session,
            user.id,
            "upload_pdf",
            "upload",
            str(uploaded_pdf.id),
            {"company": extracted_data_json["company_name"], "filename": file.filename},
        )

        if os.path.exists(file_location):
            os.remove(file_location)

        return {
            "message": "success",
            "company_id": company.external_id,
            "extracted_data": {
                "company_name": extracted_data_json["company_name"],
                "sector": extracted_data_json["sector"],
                "revenue": float(extracted_data_json["revenue"]),
                "ebitda": extracted_data_json.get("ebitda"),
                "debt": extracted_data_json.get("debt"),
                "enterprise_value": extracted_data_json.get("enterprise_value"),
            },
        }

    except HTTPException as http_exc:
        if file_location and os.path.exists(file_location):
            os.remove(file_location)
        raise http_exc

    except Exception as e:
        if file_location and os.path.exists(file_location):
            os.remove(file_location)
        print(f"Server Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
