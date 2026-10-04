import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .db import get_session
from .models import User, UserSession
from .schemas import LoginIn, UserOut

COOKIE_NAME = "session"
SESSION_TTL = timedelta(days=7)
# パスワードのハッシュの強度。ユーザーを作る SQL（crypt('pw', gen_salt('bf', 12))）と必ずそろえる
BCRYPT_COST = 12
# ユーザーが存在しないときも bcrypt の照合をして、応答時間で存在を推測されないようにする。
# cost が実際のユーザーのハッシュと違うと照合時間に差が出て、かえって存在が分かってしまう
_DUMMY_HASH = bcrypt.hashpw(b"dummy", bcrypt.gensalt(rounds=BCRYPT_COST)).decode()

router = APIRouter(prefix="/api/auth", tags=["auth"])

SessionDep = Annotated[Session, Depends(get_session)]


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def get_current_user(
    session: SessionDep,
    token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None,
) -> User:
    """ログイン必須の API の依存関係。未ログイン・期限切れ・停止中のユーザーは 401。"""
    if token:
        user_session = session.scalar(
            select(UserSession).where(
                UserSession.token_hash == _hash_token(token),
                UserSession.expires_at > func.now(),
            )
        )
        if user_session and user_session.user.is_active:
            return user_session.user
    raise HTTPException(status_code=401, detail="ログインしてください")


CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, response: Response, session: SessionDep):
    user = session.scalar(select(User).where(User.email == payload.email))
    password_ok = _verify_password(payload.password, user.password_hash if user else _DUMMY_HASH)
    # どこが間違っているか（メール・パスワード・停止中）は区別して返さない
    if user is None or not password_ok or not user.is_active:
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")

    token = secrets.token_urlsafe(32)
    session.add(
        UserSession(
            token_hash=_hash_token(token),
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + SESSION_TTL,
        )
    )
    session.commit()

    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        samesite="lax",
        # ローカルは http なので secure を付けない。https で公開するときは True にする
        secure=False,
    )
    return user


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    session: SessionDep,
    token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None,
):
    if token:
        session.execute(delete(UserSession).where(UserSession.token_hash == _hash_token(token)))
        session.commit()
    response.delete_cookie(COOKIE_NAME)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
