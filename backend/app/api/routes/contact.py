from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api/contact", tags=["Contact"])

@router.get("")
def get_contact_info():
    return {
        "name": settings.CONTACT_NAME,
        "email": settings.CONTACT_EMAIL
    }
