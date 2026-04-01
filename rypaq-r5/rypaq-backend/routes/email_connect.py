"""
Gmail / Microsoft Graph OAuth — start URLs and callbacks.
Stores refresh tokens (use encryption + KMS in production).
"""

import os
import secrets
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from activity_service import log_activity
from database import get_session
from dependencies import GPUser
from models import EmailConnection

router = APIRouter(prefix="/api/email", tags=["email"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
BACKEND_PUBLIC = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000").rstrip("/")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
MS_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
MS_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")


def _store_connection(session: Session, user_id: int, provider: str, refresh_token: str, email: Optional[str]):
    existing = session.exec(
        select(EmailConnection).where(
            EmailConnection.user_id == user_id, EmailConnection.provider == provider
        )
    ).first()
    if existing:
        existing.refresh_token_encrypted = refresh_token
        existing.account_email = email
        session.add(existing)
    else:
        session.add(
            EmailConnection(
                user_id=user_id,
                provider=provider,
                refresh_token_encrypted=refresh_token,
                account_email=email,
            )
        )
    session.commit()


@router.get("/gmail/start")
def gmail_start(user: GPUser):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(503, detail="Set GOOGLE_CLIENT_ID for Gmail connect")
    state = secrets.token_urlsafe(24)
    params = urlencode(
        {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": f"{BACKEND_PUBLIC}/api/email/gmail/callback",
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    r = RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}", status_code=302)
    r.set_cookie(
        "email_oauth_state",
        f"gmail:{state}:{user.id}",
        httponly=True,
        max_age=600,
        samesite="lax",
        path="/",
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
    )
    return r


@router.get("/gmail/callback")
def gmail_callback(
    code: str,
    state: str,
    session: Session = Depends(get_session),
    email_oauth_state: Optional[str] = Cookie(None),
):
    if not email_oauth_state or not email_oauth_state.startswith("gmail:"):
        raise HTTPException(400, detail="Invalid OAuth state")
    parts = email_oauth_state.split(":", 2)
    if len(parts) != 3 or parts[1] != state:
        raise HTTPException(400, detail="State mismatch")
    user_id = int(parts[2])
    if not GOOGLE_CLIENT_SECRET:
        raise HTTPException(503, detail="GOOGLE_CLIENT_SECRET required")
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": f"{BACKEND_PUBLIC}/api/email/gmail/callback",
        "grant_type": "authorization_code",
    }
    with httpx.Client(timeout=30.0) as client:
        tr = client.post("https://oauth2.googleapis.com/token", data=data)
        if tr.status_code != 200:
            raise HTTPException(400, detail="Token exchange failed")
        tokens = tr.json()
        refresh = tokens.get("refresh_token") or tokens.get("access_token", "")
        ui = client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        email = None
        if ui.status_code == 200:
            email = ui.json().get("email")
    _store_connection(session, user_id, "gmail", refresh, email)
    log_activity(session, user_id, "email_connect", "integration", "gmail", {"email": email})
    r = RedirectResponse(f"{FRONTEND_URL}/settings?gmail=connected", status_code=302)
    r.delete_cookie("email_oauth_state", path="/")
    return r


@router.get("/outlook/start")
def outlook_start(user: GPUser):
    if not MS_CLIENT_ID:
        raise HTTPException(503, detail="Set MICROSOFT_CLIENT_ID for Outlook connect")
    state = secrets.token_urlsafe(24)
    tenant = os.getenv("MICROSOFT_TENANT_ID", "common")
    params = urlencode(
        {
            "client_id": MS_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": f"{BACKEND_PUBLIC}/api/email/outlook/callback",
            "response_mode": "query",
            "scope": "offline_access User.Read Mail.Read",
            "state": state,
        }
    )
    r = RedirectResponse(
        f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?{params}",
        status_code=302,
    )
    r.set_cookie(
        "email_oauth_state",
        f"outlook:{state}:{user.id}",
        httponly=True,
        max_age=600,
        samesite="lax",
        path="/",
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
    )
    return r


@router.get("/outlook/callback")
def outlook_callback(
    code: str,
    state: str,
    session: Session = Depends(get_session),
    email_oauth_state: Optional[str] = Cookie(None),
):
    if not email_oauth_state or not email_oauth_state.startswith("outlook:"):
        raise HTTPException(400, detail="Invalid OAuth state")
    parts = email_oauth_state.split(":", 2)
    if len(parts) != 3 or parts[1] != state:
        raise HTTPException(400, detail="State mismatch")
    user_id = int(parts[2])
    tenant = os.getenv("MICROSOFT_TENANT_ID", "common")
    if not MS_CLIENT_SECRET:
        raise HTTPException(503, detail="MICROSOFT_CLIENT_SECRET required")
    data = {
        "client_id": MS_CLIENT_ID,
        "client_secret": MS_CLIENT_SECRET,
        "code": code,
        "redirect_uri": f"{BACKEND_PUBLIC}/api/email/outlook/callback",
        "grant_type": "authorization_code",
    }
    with httpx.Client(timeout=30.0) as client:
        tr = client.post(
            f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            data=data,
        )
        if tr.status_code != 200:
            raise HTTPException(400, detail="Token exchange failed")
        tokens = tr.json()
        refresh = tokens.get("refresh_token") or ""
    _store_connection(session, user_id, "outlook", refresh, None)
    log_activity(session, user_id, "email_connect", "integration", "outlook", {})
    r = RedirectResponse(f"{FRONTEND_URL}/settings?outlook=connected", status_code=302)
    r.delete_cookie("email_oauth_state", path="/")
    return r


@router.get("/status")
def email_status(user: GPUser, session: Session = Depends(get_session)):
    rows = session.exec(select(EmailConnection).where(EmailConnection.user_id == user.id)).all()
    return [
        {"provider": r.provider, "email": r.account_email, "connected": bool(r.refresh_token_encrypted)}
        for r in rows
    ]
