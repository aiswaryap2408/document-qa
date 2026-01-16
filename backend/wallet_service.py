import time
from backend.db import get_db_collection
from typing import Optional, List, Dict

class WalletService:
    @staticmethod
    def is_wallet_enabled() -> bool:
        """Check if the wallet system is globally enabled."""
        settings_col = get_db_collection("settings")
        setting = settings_col.find_one({"key": "wallet_system_enabled"})
        # Default to True if not set
        return setting.get("value", True) if setting else True

    @staticmethod
    def toggle_wallet_system(enabled: bool):
        """Enable or disable the wallet system."""
        settings_col = get_db_collection("settings")
        settings_col.update_one(
            {"key": "wallet_system_enabled"},
            {"$set": {"value": enabled, "updated_at": time.time()}},
            upsert=True
        )

    @staticmethod
    def get_wallet(mobile: str) -> Dict:
        """Get or create user wallet."""
        wallets_col = get_db_collection("wallets")
        wallet = wallets_col.find_one({"mobile": mobile}, {"_id": 0})
        if not wallet:
            wallet = {
                "mobile": mobile,
                "balance": 0.0,
                "currency": "INR",
                "updated_at": time.time()
            }
            wallets_col.insert_one(wallet.copy())
            wallet.pop("_id", None)
        return wallet

    @staticmethod
    def credit_money(mobile: str, amount: float, description: str, category: str = "other", source: str = "gateway", gateway_id: Optional[str] = None) -> bool:
        """Credit money to user wallet atomatically."""
        if amount <= 0:
            return False
            
        wallets_col = get_db_collection("wallets")
        transactions_col = get_db_collection("transactions")
        
        # 1. Update Balance
        res = wallets_col.update_one(
            {"mobile": mobile},
            {
                "$inc": {"balance": float(amount)},
                "$set": {"updated_at": time.time()}
            },
            upsert=True
        )
        
        # 2. Record Transaction
        transaction = {
            "mobile": mobile,
            "amount": float(amount),
            "type": "credit",
            "category": category,
            "source": source,
            "status": "success",
            "description": description,
            "gateway_id": gateway_id,
            "timestamp": time.time()
        }
        transactions_col.insert_one(transaction)
        return True

    @staticmethod
    def debit_money(mobile: str, amount: float, description: str, category: str = "other", source: str = "wallet") -> bool:
        """Debit money from user wallet atomatically with balance check (prevents double spending)."""
        if amount <= 0:
            return False
            
        wallets_col = get_db_collection("wallets")
        transactions_col = get_db_collection("transactions")
        
        # Atomically check if balance is sufficient and decrement
        res = wallets_col.update_one(
            {
                "mobile": mobile,
                "balance": {"$gte": float(amount)}
            },
            {
                "$inc": {"balance": -float(amount)},
                "$set": {"updated_at": time.time()}
            }
        )
        
        if res.modified_count == 0:
            # Insufficient balance or user doesn't exist
            # Record failed transaction
            transaction = {
                "mobile": mobile,
                "amount": float(amount),
                "type": "debit",
                "category": category,
                "source": source,
                "status": "failed",
                "description": f"Insufficient funds: {description}",
                "timestamp": time.time()
            }
            transactions_col.insert_one(transaction)
            return False
            
        # Record successful transaction
        transaction = {
            "mobile": mobile,
            "amount": float(amount),
            "type": "debit",
            "category": category,
            "source": source,
            "status": "success",
            "description": description,
            "timestamp": time.time()
        }
        transactions_col.insert_one(transaction)
        return True

    @staticmethod
    def get_history(mobile: str, limit: int = 50) -> List[Dict]:
        """Fetch transaction history."""
        transactions_col = get_db_collection("transactions")
        return list(transactions_col.find({"mobile": mobile}, {"_id": 0}).sort("timestamp", -1).limit(limit))

    @staticmethod
    def handle_refund(mobile: str, amount: float, original_desc: str):
        """Refund money in case of service failure."""
        return WalletService.credit_money(mobile, amount, f"Refund: {original_desc}")
