from fastapi import APIRouter
from ..services.aggregator import aggregate_market

router = APIRouter()

@router.get("/market")
async def get_market():
    return aggregate_market()
