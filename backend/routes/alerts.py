from fastapi import APIRouter
from ..services.aggregator import aggregate_alerts

router = APIRouter()

@router.get("/alerts")
async def get_alerts():
    return aggregate_alerts()
