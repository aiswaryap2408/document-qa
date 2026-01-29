from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional
from backend.payment_module.payment_service import create_order, verify_signature, verify_webhook_signature, log_webhook, process_payment_success, KEY_ID, get_payment_details
from backend.models import Transaction
import json
import time

router = APIRouter(prefix="/payment", tags=["Payment"])

class OrderRequest(BaseModel):
    amount: float
    currency: str = "INR"
    mobile: str # To link to user

class VerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/create-order")
async def create_payment_order(request: OrderRequest):
    try:
        # Notes can be used to pass metadata to webhook
        notes = {"mobile": request.mobile}
        order = create_order(request.amount, request.currency, notes)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": KEY_ID
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_payment(request: VerifyRequest):
    """
    Client-side verification. 
    Note: Real trusted verification should happen via Webhook, but this gives immediate feedback.
    """
    data = request.model_dump()
    if verify_signature(data):
        # Immediate credit for better UX (and local dev where webhooks are hard)
        payment_id = data.get("razorpay_payment_id")
        order_id = data.get("razorpay_order_id")
        payment_entity = get_payment_details(payment_id)
        
        if payment_entity:
            # We use an async call if needed, but process_payment_success is async
            import asyncio
            # In a real sync route we'd need to handle this, 
            # but verify_payment is 'async def', so we can await it.
            await process_payment_success(payment_entity, order_id)
            return {"status": "success", "message": "Payment verified and wallet updated"}
        else:
            return {"status": "success", "message": "Payment verified but details fetch failed. Wallet will update via webhook."}
    else:
        raise HTTPException(status_code=400, detail="Signature verification failed")

@router.post("/webhook")
async def payment_webhook(request: Request):
    try:
        body_bytes = await request.body()
        signature = request.headers.get("X-Razorpay-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Signature")

        if not verify_webhook_signature(body_bytes, signature):
            raise HTTPException(status_code=400, detail="Invalid Signature")

        # Parse payload
        payload = await request.json()
        event = payload.get("event")
        event_id = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id") or f"evt_{int(time.time())}"

        # 1. Log Webhook
        await log_webhook(payload, event_id)

        # 2. Process specific events
        if event == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            await process_payment_success(payment_entity, order_id)
        
        return {"status": "ok"}
    except Exception as e:
        print(f"Webhook Error: {e}")
        # Return 200 to Razorpay to avoid retries if it's an internal logical error, 
        # or 500 if we want them to retry. Usually 200 is safer if we logged it.
        return {"status": "error", "detail": str(e)}
