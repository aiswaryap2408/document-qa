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

class ReportRequest(BaseModel):
    mobile: str
    category: str

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


@router.post("/generate-report")
async def generate_report(request: ReportRequest):
    """Generate a PDF report after deducting coins."""
    try:
        # 1. Determine price based on category
        pricing = {
            "career": 49,
            "relationship": 49,
            "marriage": 49,
            "health": 49
        }
        
        amount = pricing.get(request.category.lower(), 49) # Default to 49
        
        # 2. Attempt to debit
        debit_res = WalletService.debit_money(
            request.mobile, 
            amount, 
            description=f"Detailed Report: {request.category}", 
            category="report"
        )
        
        if not debit_res["success"]:
            return {"status": "insufficient_funds", "required_amount": amount}
            
        # 3. Generate PDF
        pdf_bytes = WalletService.generate_report_pdf(
            request.mobile, 
            request.category, 
            transaction_id=debit_res["transaction_id"],
            transaction_db_id=debit_res["transaction_db_id"]
        )
        
        # 4. Return as Response
        from fastapi import Response
        return Response(
            content=pdf_bytes, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{request.category}.pdf"}
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle-system")
async def toggle_system(enabled: bool):
    """Admin endpoint to enable/disable wallet module."""
    try:
        WalletService.toggle_wallet_system(enabled)
        return {"status": "success", "enabled": enabled}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{mobile}")
async def get_user_reports(mobile: str):
    """Fetch all reports for a specific user."""
    try:
        reports_col = WalletService.get_db_collection("reports") # This won't work, get_db_collection is from backend.db
        from backend.db import get_db_collection
        reports_col = get_db_collection("reports")
        reports = list(reports_col.find({"mobile": mobile}, {"_id": 0}).sort("timestamp", -1))
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/{report_id}")
async def get_report_pdf(report_id: str):
    """Re-generate or fetch PDF by report ID."""
    try:
        from backend.db import get_db_collection
        reports_col = get_db_collection("reports")
        report = reports_col.find_one({"report_id": report_id}, {"_id": 0})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # We can either store PDF bytes or re-generate. 
        # Since WalletService.generate_report_pdf takes mobile/category and generates fresh content,
        # but we want the SAME content, let's add a method to WalletService to generate from existing content.
        
        pdf_bytes = WalletService.generate_pdf_from_content(report['mobile'], report['category'], report['content'], report['user_name'])
        
        from fastapi import Response
        return Response(
            content=pdf_bytes, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{report['category']}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
