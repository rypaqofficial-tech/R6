import os
import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import UploadedPDF, ExtractedData, Company, DueDiligenceReport, MacroIndicator
from typing import List
from pypdf import PdfReader
from google import genai
from ai_models import pesa_risk_model

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# ====================== GOOGLE GEMINI SETUP ======================

gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError(
        "❌ GEMINI_API_KEY is missing in .env!\n"
        "Get it free from: https://aistudio.google.com/app/apikey"
    )

client = genai.Client(api_key=gemini_api_key)
print("✅ Google Gemini client initialized (free tier)")
# =======================================================


@router.get("/list")
async def list_uploads(session: Session = Depends(get_session)):
    """List all uploaded PDFs with their associated company info."""
    uploads = session.exec(select(UploadedPDF).order_by(UploadedPDF.upload_date.desc())).all()
    result = []
    for upload in uploads:
        company = None
        if upload.company_id:
            company = session.exec(select(Company).where(Company.id == upload.company_id)).first()
        result.append({
            "id": upload.id,
            "filename": upload.filename,
            "file_size_mb": round(upload.file_size_mb, 2),
            "upload_date": upload.upload_date.isoformat(),
            "company_id": company.external_id if company else None,
            "company_name": company.name if company else None,
        })
    return result


@router.delete("/{upload_id}")
async def delete_upload(upload_id: int, session: Session = Depends(get_session)):
    """Delete an uploaded PDF and its associated data."""
    upload = session.exec(select(UploadedPDF).where(UploadedPDF.id == upload_id)).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    company_id = upload.company_id

    # Delete extracted data linked to this PDF
    extracted_entries = session.exec(select(ExtractedData).where(ExtractedData.pdf_id == upload_id)).all()
    for e in extracted_entries:
        session.delete(e)

    # Delete the upload record
    session.delete(upload)
    session.commit()

    # Check if company has any other uploads; if not, delete company + diligence report
    if company_id:
        remaining = session.exec(
            select(UploadedPDF).where(UploadedPDF.company_id == company_id)
        ).all()
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


@router.post("/pdf")
async def upload_pdf(
    file: UploadFile = File(..., max_size=50 * 1024 * 1024),  # 50 MB limit
    session: Session = Depends(get_session)
):
    """Upload a PDF, extract text, interpret with LLM, run PesaRiskNet, and store data."""
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_location = None
    try:
        # Save the uploaded file temporarily
        file_location = f"/tmp/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # Extract text using pypdf
        reader = PdfReader(file_location)
        text_content = ""
        for page in reader.pages:
            text_content += page.extract_text() + "\n"

        
        # === INTERPRET WITH GOOGLE GEMINI ===
        llm_prompt = f"""You are a financial data extraction assistant for a private equity firm.
Extract structured financial data AND risk assessment from the text below.
If a value is not found, return null.
Respond with ONLY a valid JSON object - no extra text, no explanations.

Required keys:
- company_name (string)
- sector (string)
- revenue (float, in absolute numbers e.g. 5000000 for $5M)
- ebitda (float or null)
- debt (float or null)
- enterprise_value (float or null)
- red_flags (array of strings - specific risks, concerns, or negative indicators found in the document, max 5)
- green_flags (array of strings - specific strengths, positive indicators, or opportunities found in the document, max 5)
- market_risk_score (float 1-10, higher = more risky, based on market position and competition)
- financial_health_score (float 1-10, higher = healthier, based on revenue, margins, debt)
- operational_efficiency_score (float 1-10, higher = more efficient)
- customer_concentration_score (float 1-10, higher = more concentrated/risky)
- macro_sensitivity_score (float 1-10, higher = more sensitive to macro changes)

Text: {text_content[:8000]}

JSON:"""

        # This is the actual API call to Gemini (2026 SDK)
        response = client.models.generate_content(
            model="gemini-2.5-flash",                    # ← Best free/fast model in March 2026
            contents=llm_prompt,                         # Simple text prompt (string works)
            config={
                "response_mime_type": "application/json" # ← Forces perfect JSON output
            }
        )
        
        # Extract the text and parse it as JSON
        extracted_data_raw = response.text
        extracted_data_json = json.loads(extracted_data_raw)
        # =====================================================================

        # Validate extracted data
        required_fields = ["company_name", "sector", "revenue"]
        for field in required_fields:
            if field not in extracted_data_json or extracted_data_json[field] is None:
                raise HTTPException(status_code=400, detail=f"LLM failed to extract required field: {field}")

        # Get latest macro indicators for PesaRiskNet
        macro = session.exec(select(MacroIndicator).order_by(MacroIndicator.timestamp.desc())).first()
        gdp = macro.gdp_growth if macro else 5.2
        inflation = macro.inflation_rate if macro else 3.8

        # Run PesaRiskNet
        _revenue_val = float(extracted_data_json.get("revenue") or 1)
        _debt_val = float(extracted_data_json.get("debt") or 0)
        _debt_ratio = _debt_val / _revenue_val if _revenue_val > 0 else 0.5

        risk_inputs = {
            "gdpGrowth": gdp,
            "inflation": inflation,
            "revenueGrowth": 15.0,
            "debtRatio": _debt_ratio,
            "volatility": 0.15
        }
        risk_results = pesa_risk_model.predict(risk_inputs)

        # Create or get Company entry
        company = session.exec(select(Company).where(Company.name == extracted_data_json["company_name"])).first()
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
                signals=json.dumps([
                    f"Risk Label: {risk_results['riskLabel']}",
                    f"Predicted IRR: {risk_results['predictedIrr']}%",
                    f"Risk-Adjusted Return: {risk_results['riskAdjustedReturn']}%"
                ])
            )
            session.add(company)
            session.commit()
            session.refresh(company)

        # Store UploadedPDF metadata
        _file_size = os.path.getsize(file_location) / (1024 * 1024) if os.path.exists(file_location) else 0.0
        uploaded_pdf = UploadedPDF(
            company_id=company.id,
            filename=file.filename,
            file_path=file_location,
            file_size_mb=_file_size
        )
        session.add(uploaded_pdf)
        session.commit()
        session.refresh(uploaded_pdf)

        # Store ExtractedData
        extracted_db_entry = ExtractedData(
            pdf_id=uploaded_pdf.id,
            company_id=company.id,
            company_name=extracted_data_json["company_name"],
            sector=extracted_data_json["sector"],
            revenue=extracted_data_json["revenue"],
            ebitda=extracted_data_json.get("ebitda"),
            debt=extracted_data_json.get("debt"),
            enterprise_value=extracted_data_json.get("enterprise_value"),
        )
        session.add(extracted_db_entry)
        
        # Build AI-derived due diligence scores (from LLM extraction, NOT random)
        _market_risk = _clamp(extracted_data_json.get("market_risk_score"), 1.0, 10.0)
        _financial_health = _clamp(extracted_data_json.get("financial_health_score"), 1.0, 10.0)
        _operational_efficiency = _clamp(extracted_data_json.get("operational_efficiency_score"), 1.0, 10.0)
        _customer_concentration = _clamp(extracted_data_json.get("customer_concentration_score"), 1.0, 10.0)
        _macro_sensitivity = _clamp(extracted_data_json.get("macro_sensitivity_score"), 1.0, 10.0)

        # Data integrity score: derived from how complete the extracted data is
        _completeness_fields = ["ebitda", "debt", "enterprise_value", "red_flags", "green_flags"]
        _filled = sum(1 for f in _completeness_fields if extracted_data_json.get(f) is not None)
        _data_integrity_score = round(7.0 + (_filled / len(_completeness_fields)) * 2.5, 1)

        # Red/green flags from LLM
        _red_flags = extracted_data_json.get("red_flags") or []
        _green_flags = extracted_data_json.get("green_flags") or []

        # Fallback: derive from risk model if LLM didn't provide
        if not _red_flags:
            if risk_results["riskScore"] > 0.6:
                _red_flags.append(f"High risk score: {risk_results['riskLabel']}")
            if _debt_ratio > 1.0:
                _red_flags.append("High debt-to-revenue ratio")
            if not _red_flags:
                _red_flags.append("Macro sensitivity identified by risk model")

        if not _green_flags:
            if risk_results["predictedIrr"] > 15:
                _green_flags.append(f"Strong predicted IRR: {risk_results['predictedIrr']}%")
            if _debt_ratio < 0.5:
                _green_flags.append("Conservative debt structure")
            if not _green_flags:
                _green_flags.append("Positive risk-adjusted return profile")

        # Delete old diligence report if exists (re-upload scenario)
        _old_report = session.exec(
            select(DueDiligenceReport).where(DueDiligenceReport.company_id == company.id)
        ).first()
        if _old_report:
            session.delete(_old_report)
            session.commit()

        diligence_report = DueDiligenceReport(
            company_id=company.id,
            market_risk=_market_risk,
            financial_health=_financial_health,
            operational_efficiency=_operational_efficiency,
            customer_concentration=_customer_concentration,
            macro_sensitivity=_macro_sensitivity,
            data_integrity_score=_data_integrity_score,
            red_flags=json.dumps(_red_flags),
            green_flags=json.dumps(_green_flags)
        )
        session.add(diligence_report)
        session.commit()

        # Clean up temporary file
        if os.path.exists(file_location):
            os.remove(file_location)

        return {
            "message": "success", 
            "company_id": company.external_id, 
            "extracted_data": extracted_data_json,
            "risk_results": risk_results
        }

    except Exception as e:
        if file_location and os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

def _clamp(value, min_val: float, max_val: float) -> float:
    """Clamp a value between min and max, with fallback to midpoint."""
    if value is None:
        return round((min_val + max_val) / 2, 1)
    try:
        v = float(value)
        return round(max(min_val, min(max_val, v)), 1)
    except (TypeError, ValueError):
        return round((min_val + max_val) / 2, 1)
