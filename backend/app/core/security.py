import os
import hmac
import hashlib
import secrets
import base64
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from app.core.config import settings

# ---------------------------------------------------------------------------
# Password Hashing using PBKDF2-HMAC-SHA256 (Industry standard, 100,000 rounds)
# ---------------------------------------------------------------------------
PBKDF2_ROUNDS = 100000

def get_password_hash(password: str) -> str:
    """Generate a cryptographically secure password hash with unique random salt."""
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PBKDF2_ROUNDS)
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    key_b64 = base64.b64encode(key).decode('utf-8')
    return f"$pbkdf2-sha256${PBKDF2_ROUNDS}${salt_b64}${key_b64}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed representation in constant time."""
    if not hashed_password or not hashed_password.startswith("$pbkdf2-sha256$"):
        return False
    try:
        parts = hashed_password.split("$")
        # Format: ["", "pbkdf2-sha256", "100000", "<salt_b64>", "<key_b64>"]
        rounds = int(parts[2])
        salt = base64.b64decode(parts[3])
        expected_key = base64.b64decode(parts[4])
        computed_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, rounds)
        return hmac.compare_digest(expected_key, computed_key)
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Refresh Token & One-Time Token Generation and Hashing
# ---------------------------------------------------------------------------
def generate_secure_token(nbytes: int = 32) -> str:
    """Generate a high-entropy random token string for refresh/reset tokens."""
    return secrets.token_urlsafe(nbytes)

def hash_token(token: str) -> str:
    """Hash a token string using SHA-256 for secure database storage."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

# ---------------------------------------------------------------------------
# JWT (JSON Web Token) Implementation (HS256 Standard RFC 7519)
# ---------------------------------------------------------------------------
def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _base64url_decode(data_str: str) -> bytes:
    padding = '=' * ((4 - len(data_str) % 4) % 4)
    return base64.urlsafe_b64decode((data_str + padding).encode('utf-8'))

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token with expiration and claims."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "kharchyapani-api"
    })

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(to_encode, separators=(',', ':')).encode('utf-8'))

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(settings.JWT_SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a signed JWT access token. Returns None if invalid or expired."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts

        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(settings.JWT_SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        provided_sig = _base64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload = json.loads(_base64url_decode(payload_b64).decode('utf-8'))

        # Verify expiration
        exp = payload.get("exp")
        if not exp or int(exp) < int(time.time()):
            return None

        return payload
    except Exception:
        return None
