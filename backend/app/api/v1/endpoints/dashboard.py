"""Admin dashboard read endpoint. One call returns the entire snapshot."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.schemas.dashboard import DashboardOverview
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get(
    "/overview",
    response_model=DashboardOverview,
    dependencies=[Depends(require_permission("dashboard.view"))],
)
def admin_dashboard_overview(
    period: str = Query(default="30d", pattern="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
):
    return DashboardService(db).overview(period=period)
