from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.dashboard import DashboardSummaryResponse
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummaryResponse, status_code=status.HTTP_200_OK)
def get_dashboard(db: Session = Depends(get_db)):
    return dashboard_service.get_dashboard_summary(db)
