import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any


_DEFAULT_SECRET = "local-development-only-change-before-deploying"
SECRET_KEY = os.getenv("EDUAI_SECRET_KEY", _DEFAULT_SECRET)


def validate_secret() -> None:
    if os.getenv("ENVIRONMENT", "").lower() == "production" and (
        SECRET_KEY == _DEFAULT_SECRET or len(SECRET_KEY) < 32
    ):
        raise RuntimeError("Set EDUAI_SECRET_KEY to a unique value of at least 32 characters in production.")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"{base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(derived).decode()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        salt_part, digest_part = encoded.split("$", 1)
        salt = base64.urlsafe_b64decode(salt_part.encode())
        expected = base64.urlsafe_b64decode(digest_part.encode())
    except (ValueError, TypeError):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return hmac.compare_digest(actual, expected)


def create_access_token(user_id: str) -> str:
    header = _encode({"alg": "HS256", "typ": "JWT"})
    payload = _encode({"sub": user_id, "exp": int(time.time()) + 60 * 60 * 24 * 7})
    signing_input = f"{header}.{payload}"
    signature = hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64encode(signature)}"


def read_access_token(token: str) -> str | None:
    try:
        header_part, payload_part, signature_part = token.split(".")
        signing_input = f"{header_part}.{payload_part}"
        expected = hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64decode(signature_part)):
            return None
        header = json.loads(_b64decode(header_part))
        payload: dict[str, Any] = json.loads(_b64decode(payload_part))
        if header.get("alg") != "HS256" or int(payload.get("exp", 0)) <= int(time.time()):
            return None
        subject = payload.get("sub")
        return subject if isinstance(subject, str) and subject else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def _encode(value: dict[str, Any]) -> str:
    return _b64encode(json.dumps(value, separators=(",", ":")).encode())


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
