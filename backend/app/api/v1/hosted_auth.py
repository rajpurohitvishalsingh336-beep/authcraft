import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_client_ip, get_client_user_agent
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_numeric_otp,
    generate_secure_token,
    get_password_hash,
    hash_otp,
    hash_token,
    verify_password,
)
from app.models.application_user import ApplicationUser
from app.models.project import AllowedRedirectUri, Project
from app.models.project_config import ProjectConfiguration
from app.models.token import VerificationToken
from app.models.user_session import UserSession
from app.schemas.application_user import (
    User2StepResendRequest,
    User2StepVerifyRequest,
    UserAuthSuccessResponse,
    UserForgotPasswordRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResetPasswordRequest,
    UserResponse,
    UserSendOTPRequest,
    UserVerifyEmailRequest,
    UserVerifyOTPRequest,
)
from app.schemas.developer import OTPSendResponse
from app.services.audit_service import AuditService
from app.services.email_service import EmailService

router = APIRouter()


def validate_redirect_uri(db: Session, project_id: str, redirect_uri: Optional[str]) -> Optional[str]:
    """Validate redirect URI strictly against project's allowed_redirect_uris list."""
    if not redirect_uri:
        return None
    redirect_uri_clean = redirect_uri.strip()
    match = (
        db.query(AllowedRedirectUri)
        .filter(
            AllowedRedirectUri.project_id == project_id,
            AllowedRedirectUri.redirect_uri == redirect_uri_clean,
        )
        .first()
    )
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The specified redirect_uri is not authorized for this project.",
        )
    return redirect_uri_clean


def get_current_app_user(
    project_id: str,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    authcraft_user_session: Optional[str] = Cookie(None),
) -> ApplicationUser:
    """Dependency to retrieve and authenticate an application user within a specific project."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
    elif authcraft_user_session:
        token = authcraft_user_session

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or authentication required.",
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
        )

    if payload.get("type") != "app_user" or payload.get("project_id") != project_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session token is not valid for this project.",
        )

    user_id = payload.get("sub")
    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.id == user_id, ApplicationUser.project_id == project_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or disabled.",
        )

    return user


# 1. Public Project Config Resolver (Used by hosted login / register pages)
@router.get("/public/projects/{slug}/config")
def get_public_project_config(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint for hosted authentication UI to load published configuration.
    Validates project active status and publishing status.
    """
    project = db.query(Project).filter(Project.slug == slug.strip().lower()).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    if project.status != "active":
        return {
            "status": "disabled",
            "project_name": project.name,
            "message": "This application project is currently disabled by its administrator.",
        }

    if not project.is_published:
        return {
            "status": "unpublished",
            "project_name": project.name,
            "message": "This project's authentication experience has not been published yet.",
        }

    # Fetch latest published configuration
    config = (
        db.query(ProjectConfiguration)
        .filter(
            ProjectConfiguration.project_id == project.id,
            ProjectConfiguration.is_published == True,
        )
        .order_by(ProjectConfiguration.version.desc())
        .first()
    )

    if not config:
        # Fallback to latest draft if published flag on project was true
        config = (
            db.query(ProjectConfiguration)
            .filter(ProjectConfiguration.project_id == project.id)
            .order_by(ProjectConfiguration.created_at.desc())
            .first()
        )

    raw_tokens = getattr(config, "layout_tokens", None)
    parsed_tokens = raw_tokens
    if isinstance(raw_tokens, str):
        try:
            parsed_tokens = json.loads(raw_tokens)
        except Exception:
            parsed_tokens = raw_tokens

    return {
        "status": "ready",
        "project_id": project.id,
        "project_name": project.name,
        "project_slug": project.slug,
        "allow_registration": project.allow_registration,
        "require_email_verification": project.require_email_verification,
        "password_min_length": project.password_min_length,
        "brand_name": config.brand_name,
        "page_title": config.page_title,
        "logo_url": config.logo_url,
        "primary_color": config.primary_color,
        "secondary_color": config.secondary_color,
        "background_color": config.background_color,
        "card_background_color": config.card_background_color,
        "text_color": config.text_color,
        "theme_mode": config.theme_mode,
        "layout_id": getattr(config, "layout_id", "minimal-clean-01"),
        "layout_tokens": parsed_tokens,
        "template_name": config.template_name,
        "layout_style": config.layout_style,
        "form_width": config.form_width,
        "form_alignment": config.form_alignment,
        "button_style": config.button_style,
        "input_style": config.input_style,
        "font_family": config.font_family,
        "border_radius": config.border_radius,
        "welcome_message": config.welcome_message,
        "login_text": config.login_text,
        "register_text": config.register_text,
        "email_label": config.email_label,
        "password_label": config.password_label,
        "footer_text": config.footer_text,
        "show_password_toggle": config.show_password_toggle,
        "show_forgot_password": config.show_forgot_password,
        "show_registration": config.show_registration,
        "allow_otp_login": getattr(project, "allow_otp_login", True),
        "require_2step_verification": getattr(project, "require_2step_verification", False) or getattr(config, "require_2step_verification", False),
    }


# 2. End-User Registration
@router.post("/projects/{project_id}/auth/register", response_model=UserAuthSuccessResponse)
def register_application_user(
    project_id: str,
    req: UserRegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Register an end-user strictly scoped to project_id."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or project.status != "active":
        raise HTTPException(status_code=400, detail="Project not found or disabled.")

    if not project.allow_registration:
        raise HTTPException(status_code=403, detail="Registration is disabled for this application.")

    if len(req.password) < project.password_min_length:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {project.password_min_length} characters long.",
        )

    # Validate redirect URI if provided
    validated_redirect = validate_redirect_uri(db, project.id, req.redirect_uri)

    email_clean = req.email.strip().lower()

    # Strict project-level isolation: check duplicate within THIS project only
    existing = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.project_id == project.id, ApplicationUser.email == email_clean)
        .first()
    )
    if existing:
        AuditService.record_event(
            db=db,
            project_id=project.id,
            event_type="register",
            status="failure",
            email_attempted=email_clean,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
            failure_reason="Email already registered in this project",
        )
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists for this project.",
        )

    user = ApplicationUser(
        project_id=project.id,
        email=email_clean,
        password_hash=get_password_hash(req.password),
        display_name=req.display_name.strip() if req.display_name else None,
        is_verified=not project.require_email_verification,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit event
    AuditService.record_event(
        db=db,
        project_id=project.id,
        event_type="register",
        status="success",
        email_attempted=email_clean,
        user_id=user.id,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )

    # Email verification flow if required
    if project.require_email_verification:
        raw_token = generate_secure_token(32)
        token_rec = VerificationToken(
            token_type="app_user_email_verify",
            target_id=user.id,
            project_id=project.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES),
        )
        db.add(token_rec)
        db.commit()

        EmailService.send_verification_email(
            to_email=user.email,
            token=raw_token,
            project_name=project.name,
            is_developer=False,
        )

    # Issue session
    token = create_access_token(
        subject=user.id,
        token_type="app_user",
        expires_delta=timedelta(minutes=project.session_duration_minutes),
        extra_claims={"project_id": project.id, "email": user.email},
    )

    session_rec = UserSession(
        project_id=project.id,
        user_id=user.id,
        session_token_hash=hash_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=project.session_duration_minutes),
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )
    db.add(session_rec)
    db.commit()

    # Set cookie
    response.set_cookie(
        key="authcraft_user_session",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=project.session_duration_minutes * 60,
        path="/",
    )

    return UserAuthSuccessResponse(
        message="Registration successful.",
        user=UserResponse.model_validate(user),
        session_token=token,
        redirect_uri=validated_redirect,
    )


# 3. End-User Login
@router.post("/projects/{project_id}/auth/login", response_model=UserAuthSuccessResponse)
def login_application_user(
    project_id: str,
    req: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Authenticate an end user for a specific project with optional Email 2-Step Verification."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or project.status != "active":
        raise HTTPException(status_code=400, detail="Project not found or disabled.")

    validated_redirect = validate_redirect_uri(db, project.id, req.redirect_uri)
    email_clean = req.email.strip().lower()

    # Lookup user strictly isolated by project_id
    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.project_id == project.id, ApplicationUser.email == email_clean)
        .first()
    )

    if not user or not verify_password(req.password, user.password_hash):
        AuditService.record_event(
            db=db,
            project_id=project.id,
            event_type="login_failed",
            status="failure",
            email_attempted=email_clean,
            user_id=user.id if user else None,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
            failure_reason="Invalid credentials",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    if project.require_email_verification and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address must be verified before signing in.",
        )

    # Check if Email 2-Step Verification is required or requested
    needs_2step = (
        req.require_2step is True
        or (
            req.require_2step is None
            and (
                getattr(project, "require_2step_verification", False) is True
                or getattr(user, "is_2step_enabled", False) is True
            )
        )
    )

    if needs_2step and not req.two_step_code:
        # Generate 6-digit numeric OTP for 2-step verification
        otp_code = generate_numeric_otp(settings.OTP_LENGTH)
        now = datetime.now(timezone.utc)
        token_rec = VerificationToken(
            token_type="app_user_2step_login",
            target_id=user.id,
            project_id=project.id,
            token_hash=hash_otp(user.id, otp_code),
            expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        )
        db.add(token_rec)
        db.commit()

        # Dispatch 2-step verification email
        EmailService.send_2step_verification_email(
            to_email=user.email,
            otp_code=otp_code,
            project_name=project.name,
            is_developer=False,
        )

        # Issue short-lived 5-minute temporary token for Step 2
        temp_token = create_access_token(
            subject=user.id,
            token_type="app_user_2step_pending",
            expires_delta=timedelta(minutes=5),
            extra_claims={
                "project_id": project.id,
                "email": user.email,
                "role": "app_user_2step_pending",
            },
        )

        return UserAuthSuccessResponse(
            message="Step 2 of 2: A 6-digit verification code has been sent to your email. Enter the code to continue.",
            two_step_required=True,
            temp_token=temp_token,
            email=user.email,
            dev_otp=otp_code if settings.DEV_EMAIL_MODE else None,
            redirect_uri=validated_redirect,
        )

    # If two_step_code was provided directly with password:
    if req.two_step_code:
        otp_hash = hash_otp(user.id, req.two_step_code.strip())
        now = datetime.now(timezone.utc)
        two_step_rec = (
            db.query(VerificationToken)
            .filter(
                VerificationToken.token_type == "app_user_2step_login",
                VerificationToken.target_id == user.id,
                VerificationToken.project_id == project.id,
                VerificationToken.token_hash == otp_hash,
                VerificationToken.is_used == False,
                VerificationToken.expires_at > now,
            )
            .first()
        )
        if not two_step_rec:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired 2-step verification code.",
            )
        two_step_rec.is_used = True
        db.commit()

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)

    # Issue session
    token = create_access_token(
        subject=user.id,
        token_type="app_user",
        expires_delta=timedelta(minutes=project.session_duration_minutes),
        extra_claims={"project_id": project.id, "email": user.email},
    )

    session_rec = UserSession(
        project_id=project.id,
        user_id=user.id,
        session_token_hash=hash_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=project.session_duration_minutes),
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )
    db.add(session_rec)

    # Audit event
    AuditService.record_event(
        db=db,
        project_id=project.id,
        event_type="login_success",
        status="success",
        email_attempted=email_clean,
        user_id=user.id,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )

    db.commit()
    db.refresh(user)

    response.set_cookie(
        key="authcraft_user_session",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=project.session_duration_minutes * 60,
        path="/",
    )

    return UserAuthSuccessResponse(
        message="Sign in successful.",
        user=UserResponse.model_validate(user),
        session_token=token,
        redirect_uri=validated_redirect,
    )


@router.post("/projects/{project_id}/auth/login/2step/verify", response_model=UserAuthSuccessResponse)
def verify_application_user_2step(
    project_id: str,
    req: User2StepVerifyRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Verify the 6-digit Email 2-Step Verification code for an application user and finalize login."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or project.status != "active":
        raise HTTPException(status_code=400, detail="Project not found or disabled.")

    payload = decode_access_token(req.temp_token)
    if (
        not payload
        or payload.get("type") != "app_user_2step_pending"
        or payload.get("project_id") != project_id
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired 2-step verification session. Please sign in again.",
        )

    user_id = payload.get("sub")
    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.id == user_id, ApplicationUser.project_id == project_id)
        .first()
    )
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
        )

    validated_redirect = validate_redirect_uri(db, project.id, req.redirect_uri)

    otp_hash = hash_otp(user.id, req.otp.strip())
    now = datetime.now(timezone.utc)
    token_rec = (
        db.query(VerificationToken)
        .filter(
            VerificationToken.token_type == "app_user_2step_login",
            VerificationToken.target_id == user.id,
            VerificationToken.project_id == project.id,
            VerificationToken.token_hash == otp_hash,
            VerificationToken.is_used == False,
            VerificationToken.expires_at > now,
        )
        .first()
    )
    if not token_rec:
        AuditService.record_event(
            db=db,
            project_id=project.id,
            event_type="login_2step_failed",
            status="failure",
            email_attempted=user.email,
            user_id=user.id,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
            failure_reason="Invalid or expired 2-step verification code",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired 6-digit verification code.",
        )

    # Mark code consumed
    token_rec.is_used = True

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)

    # Issue session
    token = create_access_token(
        subject=user.id,
        token_type="app_user",
        expires_delta=timedelta(minutes=project.session_duration_minutes),
        extra_claims={"project_id": project.id, "email": user.email},
    )

    session_rec = UserSession(
        project_id=project.id,
        user_id=user.id,
        session_token_hash=hash_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=project.session_duration_minutes),
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )
    db.add(session_rec)

    # Audit event
    AuditService.record_event(
        db=db,
        project_id=project.id,
        event_type="login_2step_success",
        status="success",
        email_attempted=user.email,
        user_id=user.id,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )

    db.commit()
    db.refresh(user)

    response.set_cookie(
        key="authcraft_user_session",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=project.session_duration_minutes * 60,
        path="/",
    )

    return UserAuthSuccessResponse(
        message="2-Step Verification complete. Sign in successful.",
        user=UserResponse.model_validate(user),
        session_token=token,
        redirect_uri=validated_redirect,
    )


@router.post("/projects/{project_id}/auth/login/2step/resend")
def resend_application_user_2step(
    project_id: str,
    req: User2StepResendRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Resend a fresh 6-digit Email 2-Step Verification code to the user."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or project.status != "active":
        raise HTTPException(status_code=400, detail="Project not found or disabled.")

    payload = decode_access_token(req.temp_token)
    if (
        not payload
        or payload.get("type") != "app_user_2step_pending"
        or payload.get("project_id") != project_id
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please sign in again.",
        )

    user_id = payload.get("sub")
    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.id == user_id, ApplicationUser.project_id == project_id)
        .first()
    )
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
        )

    # Invalidate previous unused 2step tokens for this user
    db.query(VerificationToken).filter(
        VerificationToken.token_type == "app_user_2step_login",
        VerificationToken.target_id == user.id,
        VerificationToken.project_id == project.id,
        VerificationToken.is_used == False,
    ).update({"is_used": True})

    # Generate new 6-digit OTP
    otp_code = generate_numeric_otp(settings.OTP_LENGTH)
    now = datetime.now(timezone.utc)
    token_rec = VerificationToken(
        token_type="app_user_2step_login",
        target_id=user.id,
        project_id=project.id,
        token_hash=hash_otp(user.id, otp_code),
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(token_rec)
    db.commit()

    # Dispatch email
    EmailService.send_2step_verification_email(
        to_email=user.email,
        otp_code=otp_code,
        project_name=project.name,
        is_developer=False,
    )

    return {
        "message": "A new 6-digit verification code has been dispatched to your email address.",
        "dev_otp": otp_code if settings.DEV_EMAIL_MODE else None,
    }


# 4. End-User Current Profile
@router.get("/projects/{project_id}/auth/me", response_model=UserResponse)
def get_current_user_profile(
    project_id: str,
    user: ApplicationUser = Depends(get_current_app_user),
):
    """Retrieve profile of authenticated application user."""
    return user


# 5. End-User Logout
@router.post("/projects/{project_id}/auth/logout")
def logout_application_user(
    project_id: str,
    response: Response,
    request: Request,
    user: ApplicationUser = Depends(get_current_app_user),
    db: Session = Depends(get_db),
):
    """Revoke user session and clear cookie."""
    AuditService.record_event(
        db=db,
        project_id=project_id,
        event_type="logout",
        status="success",
        email_attempted=user.email,
        user_id=user.id,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )
    response.delete_cookie(key="authcraft_user_session", path="/")
    return {"message": "Logged out successfully."}


# 6. Forgot Password (End User)
@router.post("/projects/{project_id}/auth/forgot-password")
def forgot_password_user(
    project_id: str,
    req: UserForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    email_clean = req.email.strip().lower()
    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.project_id == project.id, ApplicationUser.email == email_clean)
        .first()
    )

    if user and user.is_active:
        raw_token = generate_secure_token(32)
        token_rec = VerificationToken(
            token_type="app_user_password_reset",
            target_id=user.id,
            project_id=project.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
        )
        db.add(token_rec)
        db.commit()

        AuditService.record_event(
            db=db,
            project_id=project.id,
            event_type="password_reset_request",
            status="success",
            email_attempted=email_clean,
            user_id=user.id,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
        )

        EmailService.send_password_reset_email(
            to_email=user.email,
            token=raw_token,
            project_name=project.name,
            is_developer=False,
        )

    return {
        "message": "If an account with that email exists, password reset instructions have been sent."
    }


# 7. Reset Password (End User)
@router.post("/projects/{project_id}/auth/reset-password")
def reset_password_user(
    project_id: str,
    req: UserResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    token_hashed = hash_token(req.token.strip())
    now = datetime.now(timezone.utc)

    token_rec = (
        db.query(VerificationToken)
        .filter(
            VerificationToken.token_hash == token_hashed,
            VerificationToken.token_type == "app_user_password_reset",
            VerificationToken.project_id == project.id,
            VerificationToken.is_used == False,
        )
        .first()
    )

    if not token_rec or token_rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.id == token_rec.target_id, ApplicationUser.project_id == project.id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.password_hash = get_password_hash(req.new_password)
    token_rec.is_used = True

    # Invalidate all user sessions
    db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_revoked": True})

    AuditService.record_event(
        db=db,
        project_id=project.id,
        event_type="password_reset_complete",
        status="success",
        email_attempted=user.email,
        user_id=user.id,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )

    db.commit()

    return {"message": "Password successfully reset. You can now log in with your new password."}


# 8. Verify Email (End User)
@router.post("/projects/{project_id}/auth/verify-email")
def verify_email_user(
    project_id: str,
    req: UserVerifyEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    token_hashed = hash_token(req.token.strip())
    now = datetime.now(timezone.utc)

    token_rec = (
        db.query(VerificationToken)
        .filter(
            VerificationToken.token_hash == token_hashed,
            VerificationToken.token_type == "app_user_email_verify",
            VerificationToken.project_id == project.id,
            VerificationToken.is_used == False,
        )
        .first()
    )

    if not token_rec or token_rec.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email verification token.",
        )

    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.id == token_rec.target_id, ApplicationUser.project_id == project.id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.is_verified = True
    token_rec.is_used = True

    AuditService.record_event(
        db=db,
        project_id=project.id,
        event_type="email_verified",
        status="success",
        email_attempted=user.email,
        user_id=user.id,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )

    db.commit()

    return {"message": "Email address successfully verified. You may now log in."}


@router.post("/projects/{project_id}/auth/otp/send", response_model=OTPSendResponse)
def send_hosted_user_otp(
    project_id: str,
    req: UserSendOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Generate and dispatch a 6-digit numeric OTP to an end user's email for passwordless login.
    """
    project = (
        db.query(Project)
        .filter((Project.id == project_id) | (Project.slug == project_id))
        .first()
    )
    if not project or project.status != "active":
        raise HTTPException(status_code=404, detail="Project not found or inactive.")

    if hasattr(project, "allow_otp_login") and not project.allow_otp_login:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP / Passwordless login is disabled for this project.",
        )

    email_clean = req.email.strip().lower()
    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.project_id == project.id, ApplicationUser.email == email_clean)
        .first()
    )

    if not user:
        if not project.allow_registration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New user registration is disabled for this project.",
            )
        # Seamless passwordless account creation
        user = ApplicationUser(
            project_id=project.id,
            email=email_clean,
            password_hash=get_password_hash(generate_secure_token(24)),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    # Invalidate older unused OTPs for this user in this project
    db.query(VerificationToken).filter(
        VerificationToken.token_type == "app_user_otp_login",
        VerificationToken.target_id == user.id,
        VerificationToken.project_id == project.id,
        VerificationToken.is_used == False,
    ).update({"is_used": True})

    otp_code = generate_numeric_otp(settings.OTP_LENGTH)
    token_rec = VerificationToken(
        token_type="app_user_otp_login",
        target_id=user.id,
        project_id=project.id,
        token_hash=hash_otp(user.id, otp_code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(token_rec)
    db.commit()

    # Dispatch email
    EmailService.send_otp_email(
        to_email=user.email,
        otp_code=otp_code,
        project_name=project.name,
        is_developer=False,
    )

    return OTPSendResponse(
        message="One-time password (OTP) sent successfully.",
        email=user.email,
        expires_in_minutes=settings.OTP_EXPIRE_MINUTES,
        dev_otp=otp_code if settings.DEV_EMAIL_MODE else None,
    )


@router.post("/projects/{project_id}/auth/otp/verify", response_model=UserAuthSuccessResponse)
def verify_hosted_user_otp(
    project_id: str,
    req: UserVerifyOTPRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Verify 6-digit OTP code, authenticate application user, and issue user session.
    """
    project = (
        db.query(Project)
        .filter((Project.id == project_id) | (Project.slug == project_id))
        .first()
    )
    if not project or project.status != "active":
        raise HTTPException(status_code=404, detail="Project not found or inactive.")

    email_clean = req.email.strip().lower()
    user = (
        db.query(ApplicationUser)
        .filter(ApplicationUser.project_id == project.id, ApplicationUser.email == email_clean)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or verification code.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact support.",
        )

    otp_hash = hash_otp(user.id, req.otp.strip())
    now = datetime.now(timezone.utc)
    token_rec = (
        db.query(VerificationToken)
        .filter(
            VerificationToken.token_type == "app_user_otp_login",
            VerificationToken.target_id == user.id,
            VerificationToken.project_id == project.id,
            VerificationToken.token_hash == otp_hash,
            VerificationToken.is_used == False,
            VerificationToken.expires_at > now,
        )
        .first()
    )

    if not token_rec:
        AuditService.record_event(
            db=db,
            project_id=project.id,
            event_type="otp_login_failed",
            status="failure",
            email_attempted=user.email,
            user_id=user.id,
            ip_address=get_client_ip(request),
            user_agent=get_client_user_agent(request),
            failure_reason="Invalid or expired OTP",
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code. Please request a new one.",
        )

    # Consume OTP
    token_rec.is_used = True
    user.is_verified = True
    user.last_login_at = now

    # Issue session
    session_token = generate_secure_token(48)
    expires_at = now + timedelta(minutes=project.session_duration_minutes)
    user_session = UserSession(
        user_id=user.id,
        project_id=project.id,
        session_token_hash=hash_token(session_token),
        expires_at=expires_at,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )
    db.add(user_session)

    # Log audit event
    AuditService.record_event(
        db=db,
        project_id=project.id,
        event_type="login_success_otp",
        status="success",
        email_attempted=user.email,
        user_id=user.id,
        ip_address=get_client_ip(request),
        user_agent=get_client_user_agent(request),
    )

    db.commit()

    # Set secure cookie
    response.set_cookie(
        key="authcraft_user_session",
        value=session_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=project.session_duration_minutes * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )

    validated_redirect = validate_redirect_uri(db, project.id, req.redirect_uri)

    return UserAuthSuccessResponse(
        message="Authentication successful via OTP.",
        user=UserResponse.model_validate(user),
        session_token=session_token,
        redirect_uri=validated_redirect,
    )
