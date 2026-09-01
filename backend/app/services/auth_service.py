from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import httpx
from app.models.user import User, RefreshToken, PasswordResetToken
from app.models.category import Category
from app.schemas.auth import UserRegister
from app.core.security import (
    get_password_hash,
    verify_password,
    generate_secure_token,
    hash_token,
    create_access_token
)
from app.core.config import settings

STARTER_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Health",
    "Entertainment",
    "Other"
]

class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.strip().lower()).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @classmethod
    def register_user(cls, db: Session, user_in: UserRegister) -> User:
        """Register a new user and seed their default starter categories."""
        existing_user = cls.get_user_by_email(db, user_in.email)
        if existing_user:
            raise ValueError("An account with this email already exists.")

        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email.strip().lower(),
            hashed_password=hashed_password,
            full_name=user_in.full_name.strip(),
            is_active=True,
            is_verified=False
        )
        db.add(db_user)
        db.flush()

        # Seed starter categories for the new user
        for cat_name in STARTER_CATEGORIES:
            db.add(Category(user_id=db_user.id, name=cat_name))

        db.commit()
        db.refresh(db_user)
        return db_user

    @classmethod
    def authenticate_user(cls, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        user = cls.get_user_by_email(db, email)
        if not user or not user.hashed_password:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    @classmethod
    async def authenticate_google(cls, db: Session, credential: str) -> User:
        """Verify Google ID token, find or provision user, and seed starter categories if new."""
        credential = credential.strip()
        if not credential:
            raise ValueError("Google authentication credential cannot be empty.")

        # Support dev mock credentials in non-production environments for local testing
        if settings.APP_ENV.lower() != "production" and (
            credential.startswith("dev_google_") or credential == "demo_google_credential"
        ):
            email = "demo.google.user@kharchyapani.local"
            google_id = "google_dev_1092837465"
            full_name = "Google Demo User"
            if ":" in credential:
                parts = [p.strip() for p in credential.split(":") if p.strip()]
                found_email = next((p for p in parts if "@" in p), None)
                if found_email:
                    email = found_email.lower()
                    google_id = f"google_dev_{abs(hash(email)) % 10000000000}"
                    name_parts = [p for p in parts if p != found_email and not p.startswith("dev_google")]
                    if name_parts:
                        full_name = " ".join(name_parts)
                    else:
                        full_name = email.split("@")[0].capitalize()
        else:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                    timeout=10.0
                )

            if resp.status_code != 200:
                raise ValueError("Invalid or expired Google authentication credential.")

            token_info = resp.json()
            email = token_info.get("email")
            google_id = token_info.get("sub")
            full_name = token_info.get("name") or (email.split("@")[0] if email else "Google User")

            if not email or not google_id:
                raise ValueError("Google credential missing required claims.")

            # Validate audience against GOOGLE_CLIENT_ID if configured
            configured_client_id = settings.GOOGLE_CLIENT_ID.strip('"').strip("'").strip()
            if configured_client_id:
                aud = token_info.get("aud")
                if aud and aud != configured_client_id:
                    raise ValueError("Google credential audience mismatch.")

        email = email.strip().lower()

        # 1. Find by Google ID
        user = db.query(User).filter(User.google_id == google_id).first()
        if not user:
            # 2. Find by email (Account linking)
            user = cls.get_user_by_email(db, email)
            if user:
                user.google_id = google_id
                user.is_verified = True
                db.commit()
                db.refresh(user)
            else:
                # 3. Create new user
                user = User(
                    email=email,
                    full_name=full_name,
                    google_id=google_id,
                    is_active=True,
                    is_verified=True,
                    hashed_password=None
                )
                db.add(user)
                db.flush()

                # Seed starter categories
                for cat_name in STARTER_CATEGORIES:
                    db.add(Category(user_id=user.id, name=cat_name))

                db.commit()
                db.refresh(user)

        if not user.is_active:
            raise ValueError("Account is deactivated.")

        return user

    @staticmethod
    def issue_refresh_token(
        db: Session,
        user_id: int,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> str:
        """Generate high-entropy random refresh token, store SHA-256 hash in DB, return plain token."""
        plain_token = generate_secure_token(48)
        hashed = hash_token(plain_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        db_token = RefreshToken(
            user_id=user_id,
            token_hash=hashed,
            expires_at=expires_at,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address[:45] if ip_address else None
        )
        db.add(db_token)
        db.commit()
        return plain_token

    @classmethod
    def rotate_refresh_token(
        cls,
        db: Session,
        plain_refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Tuple[str, str, User]]:
        """
        Validate presented refresh token:
        - If already revoked: breach detection! Invalidate all tokens for user.
        - If valid: revoke current, issue new pair (access_token, new_refresh_token, user).
        """
        hashed = hash_token(plain_refresh_token)
        db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == hashed).first()

        if not db_token:
            return None

        # Breach detection: reuse of revoked token!
        if db_token.revoked_at is not None:
            # Revoke all active tokens for this user
            now = datetime.now(timezone.utc)
            db.query(RefreshToken).filter(
                RefreshToken.user_id == db_token.user_id,
                RefreshToken.revoked_at.is_(None)
            ).update({"revoked_at": now})
            db.commit()
            return None

        # Check expiration
        now = datetime.now(timezone.utc)
        expires_at = db_token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            return None

        # Revoke old token
        db_token.revoked_at = now

        user = cls.get_user_by_id(db, db_token.user_id)
        if not user or not user.is_active:
            db.commit()
            return None

        # Issue new token pair
        new_access_token = create_access_token({"sub": str(user.id), "email": user.email})
        new_plain_refresh = generate_secure_token(48)
        new_hashed = hash_token(new_plain_refresh)
        new_expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        new_db_token = RefreshToken(
            user_id=user.id,
            token_hash=new_hashed,
            expires_at=new_expires_at,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address[:45] if ip_address else None
        )
        db.add(new_db_token)
        db.commit()

        return new_access_token, new_plain_refresh, user

    @staticmethod
    def revoke_refresh_token(db: Session, plain_refresh_token: str) -> None:
        """Revoke a single refresh token."""
        hashed = hash_token(plain_refresh_token)
        db.query(RefreshToken).filter(
            RefreshToken.token_hash == hashed,
            RefreshToken.revoked_at.is_(None)
        ).update({"revoked_at": datetime.now(timezone.utc)})
        db.commit()

    @staticmethod
    def revoke_all_user_tokens(db: Session, user_id: int) -> None:
        """Revoke all active refresh tokens for the user (Logout all devices)."""
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None)
        ).update({"revoked_at": datetime.now(timezone.utc)})
        db.commit()

    @classmethod
    def create_password_reset_token(cls, db: Session, email: str) -> Optional[str]:
        """Generate a one-time password reset token valid for 1 hour."""
        user = cls.get_user_by_email(db, email)
        if not user:
            return None

        plain_token = generate_secure_token(32)
        hashed = hash_token(plain_token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hashed,
            expires_at=expires_at,
            is_used=False
        )
        db.add(reset_record)
        db.commit()
        return plain_token

    @classmethod
    def reset_password(cls, db: Session, token: str, new_password: str) -> bool:
        """Reset password using valid one-time token and revoke all active sessions."""
        hashed = hash_token(token)
        reset_record = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == hashed,
            PasswordResetToken.is_used.is_(False)
        ).first()

        if not reset_record:
            return False

        now = datetime.now(timezone.utc)
        record_exp = reset_record.expires_at
        if record_exp.tzinfo is None:
            record_exp = record_exp.replace(tzinfo=timezone.utc)
        if record_exp < now:
            return False

        user = cls.get_user_by_id(db, reset_record.user_id)
        if not user:
            return False

        user.hashed_password = get_password_hash(new_password)
        reset_record.is_used = True

        # Invalidate all active sessions for security
        cls.revoke_all_user_tokens(db, user.id)

        db.commit()
        return True

    @classmethod
    def change_password(cls, db: Session, user: User, current_password: str, new_password: str) -> bool:
        """Change password for authenticated user."""
        if not user.hashed_password or not verify_password(current_password, user.hashed_password):
            return False

        user.hashed_password = get_password_hash(new_password)
        # Invalidate all other sessions
        cls.revoke_all_user_tokens(db, user.id)
        db.commit()
        return True
