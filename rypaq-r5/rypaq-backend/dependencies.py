"""FastAPI auth dependencies."""

from typing import Annotated, Optional

from fastapi import Cookie, Depends, HTTPException, status
from sqlmodel import Session, select

from auth_utils import COOKIE_NAME, decode_token
from database import get_session
from models import User


def get_current_user(
    session: Session = Depends(get_session),
    access_token: Optional[str] = Cookie(None, alias=COOKIE_NAME),
) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(access_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    try:
        uid = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    user = session.exec(select(User).where(User.id == uid)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_gp(user: User = Depends(get_current_user)) -> User:
    if user.role == "lp":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="LP accounts use the investor portal")
    return user


def require_lp(user: User = Depends(get_current_user)) -> User:
    if user.role != "lp":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Investor portal only")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
GPUser = Annotated[User, Depends(require_gp)]
LPUser = Annotated[User, Depends(require_lp)]
