from fastapi import APIRouter
from ..services.aggregator import aggregate_macro

router = APIRouter()

@router.get("/macro")
async def get_macro():
    return aggregate_macro()
