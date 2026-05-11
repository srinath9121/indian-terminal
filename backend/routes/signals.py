from fastapi import APIRouter
from ..services.aggregator import aggregate_signals
from ..services.backtester import get_signal_history

router = APIRouter()

@router.get("/signals")
async def get_signals():
    return aggregate_signals()

@router.get("/signals/history")
async def get_history():
    return get_signal_history()
