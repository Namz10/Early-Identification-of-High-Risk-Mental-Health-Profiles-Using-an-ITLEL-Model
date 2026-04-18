from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserCreate, UserLogin, Token, UserAuthResponse
from ..deps import get_password_hash, verify_password, create_access_token, get_current_user
from ..config import settings
from ..limiter import limiter
import os

router = APIRouter(prefix="/auth", tags=["auth"])

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Registration successful",
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name
    }

@router.post("/login", response_model=Token)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
def login(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", samesite="strict", httponly=True)
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserAuthResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
