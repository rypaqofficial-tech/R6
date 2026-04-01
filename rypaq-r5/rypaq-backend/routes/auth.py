"""Registration, login, OAuth, password reset, email verification."""

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session, select

from activity_service import log_activity
from auth_utils import (
    COOKIE_NAME,
    create_access_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from database import get_session
from dependencies import CurrentUser
from models import User
from seed_users import DEMO_EMAIL

router = APIRouter(prefix="/api/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
BACKEND_PUBLIC = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000").rstrip("/")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


def _set_auth_cookie(response: Response, user_id: int) -> None:
    token = create_access_token(user_id)
    secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=7 * 24 * 3600,
        samesite="lax",
        secure=secure,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


@router.post("/register")
def register(body: RegisterBody, response: Response, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.email == body.email.lower())).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    raw_token = secrets.token_urlsafe(32)
    user = User(
        open_id=f"local:{body.email.lower()}",
        email=body.email.lower(),
        name=body.name,
        role="analyst",
        hashed_password=hash_password(body.password),
        email_verified=False,
        verification_token=raw_token,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    verify_link = f"{FRONTEND_URL}/verify-email?token={raw_token}"
    if os.getenv("SMTP_HOST"):
        pass
    else:
        print(f"[email] Verify account: {verify_link}")
    log_activity(session, user.id, "register", "user", str(user.id), {"email": user.email})
    _set_auth_cookie(response, user.id)
    return {"ok": True, "email": user.email, "email_verified": user.email_verified}


@router.post("/login")
def login(body: LoginBody, response: Response, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email.lower())).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    log_activity(session, user.id, "login", "user", str(user.id))
    _set_auth_cookie(response, user.id)
    return {
        "ok": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_demo": user.is_demo,
            "email_verified": user.email_verified,
        },
    }


@router.post("/demo-login")
def demo_login(response: Response, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == DEMO_EMAIL)).first()
    if not user:
        raise HTTPException(status_code=503, detail="Demo account not seeded — restart backend")
    log_activity(session, user.id, "demo_login", "user", str(user.id))
    _set_auth_cookie(response, user.id)
    return {
        "ok": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_demo": user.is_demo,
            "email_verified": True,
        },
    }


@router.post("/logout")
def logout(response: Response):
    _clear_auth_cookie(response)
    return {"ok": True}


@router.get("/me")
def me(user: CurrentUser):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "is_demo": user.is_demo,
        "email_verified": user.email_verified,
    }


@router.get("/verify-email")
def verify_email(token: str, response: Response, session: Session = Depends(get_session)):
    u = session.exec(select(User).where(User.verification_token == token)).first()
    if not u:
        raise HTTPException(status_code=400, detail="Invalid or expired link")
    u.email_verified = True
    u.verification_token = None
    session.add(u)
    session.commit()
    _set_auth_cookie(response, u.id)
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?verified=1", status_code=302)


@router.post("/forgot-password")
def forgot_password(body: ForgotBody, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email.lower())).first()
    raw = secrets.token_urlsafe(32)
    if user and user.hashed_password:
        user.reset_token_hash = hash_reset_token(raw)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        session.add(user)
        session.commit()
        link = f"{FRONTEND_URL}/reset-password?token={raw}"
        if os.getenv("SMTP_HOST"):
            pass
        else:
            print(f"[email] Password reset: {link}")
    return {"ok": True}


@router.post("/reset-password")
def reset_password(body: ResetBody, session: Session = Depends(get_session)):
    h = hash_reset_token(body.token)
    user = session.exec(select(User).where(User.reset_token_hash == h)).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.hashed_password = hash_password(body.password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    session.add(user)
    session.commit()
    return {"ok": True}


@router.get("/google/start")
def google_oauth_start():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    state = secrets.token_urlsafe(24)
    from urllib.parse import urlencode

    params = urlencode(
        {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": f"{BACKEND_PUBLIC}/api/auth/google/callback",
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    r = RedirectResponse(url=url, status_code=302)
    r.set_cookie(
        "oauth_google_state",
        state,
        httponly=True,
        max_age=600,
        samesite="lax",
        path="/",
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
    )
    return r


@router.get("/google/callback")
def google_callback(
    code: str,
    state: str,
    session: Session = Depends(get_session),
    oauth_google_state: Optional[str] = Cookie(None),
):
    if not oauth_google_state or oauth_google_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    if not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": f"{BACKEND_PUBLIC}/api/auth/google/callback",
        "grant_type": "authorization_code",
    }
    with httpx.Client(timeout=30.0) as client:
        tr = client.post(token_url, data=data)
        if tr.status_code != 200:
            raise HTTPException(status_code=400, detail="Token exchange failed")
        tokens = tr.json()
        access = tokens.get("access_token")
        ui = client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access}"},
        )
        if ui.status_code != 200:
            raise HTTPException(status_code=400, detail="Userinfo failed")
        info = ui.json()
    sub = info.get("id")
    email = (info.get("email") or "").lower()
    name = info.get("name")
    if not sub or not email:
        raise HTTPException(status_code=400, detail="Incomplete Google profile")
    user = session.exec(select(User).where(User.google_sub == sub)).first()
    if not user:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            user.google_sub = sub
            user.email_verified = True
            session.add(user)
        else:
            user = User(
                open_id=f"google:{sub}",
                email=email,
                name=name,
                role="analyst",
                google_sub=sub,
                email_verified=True,
            )
            session.add(user)
        session.commit()
        session.refresh(user)
    else:
        session.refresh(user)
    log_activity(session, user.id, "login_google", "user", str(user.id))
    r = RedirectResponse(url=f"{FRONTEND_URL}/dashboard", status_code=302)
    _set_auth_cookie(r, user.id)
    r.delete_cookie("oauth_google_state", path="/")
    return r
