from fastapi import APIRouter
from ..services.aggregator import aggregate_adani

router = APIRouter()

@router.get("/adani")
async def get_adani():
    return aggregate_adani()
