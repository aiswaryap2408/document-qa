import razorpay
import os
import hmac
import hashlib
import time
from backend.db import get_db_collection
from backend.models import Transaction, WebhookLog

# Initialize Razorpay Client
# ideally fetch these from env, handling missing env gracefully for now
KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_missing")
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "missing_secret")
WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "missing_webhook_secret")

client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))

def create_order(amount: float, currency: str = "INR", notes: dict = None):
    """
    Create a Razorpay order.
    Amount should be in standard currency units (e.g. INR), converted to paise here.
    """
    try:
        amount_paise = int(amount * 100)
        data = {
            "amount": amount_paise,
            "currency": currency,
            "receipt": f"rcpt_{int(time.time())}",
            "notes": notes or {}
        }
        order = client.order.create(data=data)
        return order
    except Exception as e:
        print(f"Error creating Razorpay order: {e}")
        raise e

def get_payment_details(payment_id: str):
    """
    Fetch payment details from Razorpay SDK.
    """
    try:
        return client.payment.fetch(payment_id)
    except Exception as e:
        print(f"Error fetching payment details: {e}")
        return None

def verify_signature(params: dict):
    """
    Verify payment signature from client side success.
    params must contain: razorpay_order_id, razorpay_payment_id, razorpay_signature
    """
    try:
        client.utility.verify_payment_signature(params)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
    except Exception as e:
        print(f"Error verifying signature: {e}")
        return False

def verify_webhook_signature(body: bytes, signature: str):
    """
    Verify webhook signature manually using HMAC SHA256.
    """
    try:
        client.utility.verify_webhook_signature(body.decode('utf-8'), signature, WEBHOOK_SECRET)
        return True
    except Exception as e:
        # Fallback to manual check if SDK fails or for double logging
        print(f"SDK Webhook verification failed/error: {e}")
        return False

async def log_webhook(payload: dict, event_id: str):
    """
    Log raw webhook payload to DB.
    """
    try:
        logs_col = get_db_collection("webhook_logs")
        log_entry = WebhookLog(
            event_id=event_id,
            payload=payload,
            timestamp=time.time()
        )
        logs_col.insert_one(log_entry.model_dump())
    except Exception as e:
        print(f"Error logging webhook: {e}")

async def process_payment_success(payment_entity: dict, order_id: str):
    """
    Process successful payment, update transaction and user wallet.
    """
    transactions_col = get_db_collection("transactions")
    wallets_col = get_db_collection("wallets")
    
    # Check if already processed
    existing = transactions_col.find_one({"razorpay_payment_id": payment_entity.get("id")})
    if existing and existing.get("status") == "success":
        print(f"Payment {payment_entity.get('id')} already processed.")
        return

    # Amount is in paise, convert back
    amount = payment_entity.get("amount", 0) / 100
    mobile = payment_entity.get("notes", {}).get("mobile") # stored in notes during order creation
    
    if not mobile:
        print("Mobile number not found in payment notes, cannot credit wallet.")
        return

    # Update Transaction
    # If we created a pending transaction earlier, update it. Otherwise create new.
    # Logic: Upsert based on order_id
    
    txn_data = {
        "mobile": mobile,
        "amount": amount,
        "type": "credit",
        "category": "recharge",
        "status": "success",
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_entity.get("id"),
        "description": f"Wallet Recharge via Razorpay",
        "timestamp": time.time()
    }
    
    transactions_col.update_one(
        {"razorpay_order_id": order_id},
        {"$set": txn_data},
        upsert=True
    )
    
    # Update Wallet
    wallets_col.update_one(
        {"mobile": mobile},
        {"$inc": {"balance": amount}, "$set": {"updated_at": time.time()}},
        upsert=True
    )
    print(f"Credited {amount} to {mobile} for Order {order_id}")
