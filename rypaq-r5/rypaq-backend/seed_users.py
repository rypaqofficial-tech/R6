"""Ensure built-in demo and LP preview accounts exist."""

import os
from sqlmodel import Session, select

from auth_utils import hash_password
from models import User

DEMO_EMAIL = "demo@rypaq.local"
LP_EMAIL = "lp@rypaq.local"


def ensure_seed_users(session: Session) -> None:
    demo_pw = os.getenv("DEMO_USER_PASSWORD", "DemoRypaq2026!")
    lp_pw = os.getenv("LP_USER_PASSWORD", "LpPortal2026!")

    if not session.exec(select(User).where(User.email == DEMO_EMAIL)).first():
        session.add(
            User(
                open_id=f"local:{DEMO_EMAIL}",
                email=DEMO_EMAIL,
                name="Demo User",
                role="analyst",
                tier="free",
                hashed_password=hash_password(demo_pw),
                email_verified=True,
                is_demo=True,
            )
        )
    if not session.exec(select(User).where(User.email == LP_EMAIL)).first():
        session.add(
            User(
                open_id=f"local:{LP_EMAIL}",
                email=LP_EMAIL,
                name="LP Preview",
                role="lp",
                tier="free",
                hashed_password=hash_password(lp_pw),
                email_verified=True,
                is_demo=True,
            )
        )
    session.commit()
