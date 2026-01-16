from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from backend.wallet_service import WalletService
from pydantic import BaseModel

router = APIRouter(prefix="/wallet", tags=["Wallet"])

class RechargeRequest(BaseModel):
    mobile: str
    amount: float
    gateway_id: str = "mock_gw_123"

class DebitRequest(BaseModel):
    mobile: str
    amount: float
    description: str

@router.get("/status")
async def get_system_status():
    """Check if wallet system is enabled."""
    return {"enabled": WalletService.is_wallet_enabled()}

@router.get("/balance/{mobile}")
async def get_balance(mobile: str):
    """Get user wallet balance."""
    try:
        wallet = WalletService.get_wallet(mobile)
        return wallet
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{mobile}")
async def get_history(mobile: str):
    """Get user transaction history."""
    try:
        history = WalletService.get_history(mobile)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recharge")
async def recharge(request: RechargeRequest):
    """Mock recharge endpoint."""
    try:
        success = WalletService.credit_money(
            request.mobile, 
            request.amount, 
            description="Recharge via Gateway", 
            category="recharge",
            source="gateway",
            gateway_id=request.gateway_id
        )
        if success:
            return {"status": "success", "message": f"Credited {request.amount}"}
        raise HTTPException(status_code=400, detail="Recharge failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle-system")
async def toggle_system(enabled: bool):
    """Admin endpoint to enable/disable wallet module."""
    try:
        WalletService.toggle_wallet_system(enabled)
        return {"status": "success", "enabled": enabled}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
