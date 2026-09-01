from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.api.deps import get_current_active_user, check_rate_limit
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    MessageResponse
)
from app.services.auth_service import AuthService
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "kharchyapani_refresh_token"

def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set HttpOnly, Secure, SameSite refresh token cookie."""
    max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    is_prod = settings.APP_ENV.lower() == "production"
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=max_age,
        expires=max_age,
        path="/",
        httponly=True,
        secure=is_prod,  # True in production HTTPS, False in local HTTP dev
        samesite="lax"
    )

def clear_refresh_cookie(response: Response) -> None:
    """Clear refresh token cookie."""
    is_prod = settings.APP_ENV.lower() == "production"
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=is_prod,
        samesite="lax"
    )

# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    check_rate_limit(request, limit=5, window_seconds=60)
    try:
        user = AuthService.register_user(db, user_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    refresh_token = AuthService.issue_refresh_token(db, user.id, user_agent=user_agent, ip_address=client_ip)

    set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    check_rate_limit(request, limit=10, window_seconds=60)
    user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    refresh_token = AuthService.issue_refresh_token(db, user.id, user_agent=user_agent, ip_address=client_ip)

    set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

# ---------------------------------------------------------------------------
# Google OAuth Sign-In
# ---------------------------------------------------------------------------
@router.post("/google", response_model=TokenResponse)
async def google_auth(
    auth_in: GoogleAuthRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    try:
        user = await AuthService.authenticate_google(db, auth_in.credential)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    refresh_token = AuthService.issue_refresh_token(db, user.id, user_agent=user_agent, ip_address=client_ip)

    set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

# ---------------------------------------------------------------------------
# Refresh Token Rotation
# ---------------------------------------------------------------------------
@router.post("/refresh")
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    kharchyapani_refresh_token: Optional[str] = Cookie(None)
):
    # Retrieve refresh token from cookie or custom header
    token = kharchyapani_refresh_token or request.headers.get("X-Refresh-Token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing."
        )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    result = AuthService.rotate_refresh_token(db, token, user_agent=user_agent, ip_address=client_ip)

    if not result:
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked refresh token."
        )

    new_access_token, new_refresh_token, user = result
    set_refresh_cookie(response, new_refresh_token)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

# ---------------------------------------------------------------------------
# Logout (Current Session)
# ---------------------------------------------------------------------------
@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    kharchyapani_refresh_token: Optional[str] = Cookie(None)
):
    token = kharchyapani_refresh_token or request.headers.get("X-Refresh-Token")
    if token:
        AuthService.revoke_refresh_token(db, token)

    clear_refresh_cookie(response)
    return MessageResponse(message="Successfully logged out.")

# ---------------------------------------------------------------------------
# Logout All Devices
# ---------------------------------------------------------------------------
@router.post("/logout-all", response_model=MessageResponse)
def logout_all_devices(
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    AuthService.revoke_all_user_tokens(db, current_user.id)
    clear_refresh_cookie(response)
    return MessageResponse(message="Successfully logged out from all devices.")

# ---------------------------------------------------------------------------
# Password Management
# ---------------------------------------------------------------------------
@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    check_rate_limit(request, limit=3, window_seconds=60)
    token = AuthService.create_password_reset_token(db, data.email)
    # Always return standard success message to prevent user enumeration
    # Return reset_token for dev/testing ease
    return MessageResponse(
        message="If an account exists with this email, password reset instructions have been generated.",
        reset_token=token if settings.APP_ENV.lower() != "production" else None
    )

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    data: ResetPasswordRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    success = AuthService.reset_password(db, data.token, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or previously used reset token."
        )
    clear_refresh_cookie(response)
    return MessageResponse(message="Password has been successfully reset. Please log in with your new password.")

@router.post("/change-password", response_model=MessageResponse)
def change_password(
    data: ChangePasswordRequest,
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    success = AuthService.change_password(db, current_user, data.current_password, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )
    clear_refresh_cookie(response)
    return MessageResponse(message="Password changed successfully. Please log in again with your new credentials.")

# ---------------------------------------------------------------------------
# Current User Profile
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    return UserResponse.model_validate(current_user)
