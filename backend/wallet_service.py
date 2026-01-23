import time
from backend.db import get_db_collection
from typing import Optional, List, Dict
from fpdf import FPDF

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

    @staticmethod
    def generate_report_pdf(mobile: str, category: str) -> bytes:
        """Generate a simple one-paragraph PDF report based on category."""
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, f"Astrology Insights: {category.capitalize()}", ln=True, align='C')
        pdf.ln(10)
        
        pdf.set_font("helvetica", "", 12)
        
        # Simple paragraph based on category
        content = ""
        if category.lower() == "career":
            content = "Based on your celestial alignments, the coming period shows significant opportunities for growth in your professional life. Your determination and hard work will likely lead to recognition and potentially a new responsibility or position. Focus on networking and staying disciplined."
        elif "relation" in category.lower() or "marriage" in category.lower():
             content = "Your relationship dynamics are entering a phase of harmony and deeper understanding. It is a good time to communicate openly with your partner or loved ones. For those seeking a partner, the stars suggest that patience and being true to yourself will attract the right connection."
        elif category.lower() == "health":
            content = "Your vitality is generally good, but the stars suggest paying more attention to your sleep patterns and daily routine. Incorporating minor physical activity or mindfulness practices will greatly benefit your long-term well-being. Listen to your body's signals."
        else:
            content = f"Your personalized astrology guide for {category} suggests a time of reflection and gradual progress. Align your actions with your inner values to find the best path forward in this area of your life. The universe supports those who seek balance."
            
        pdf.multi_cell(0, 10, content)
        
        pdf.ln(20)
        pdf.set_font("helvetica", "I", 10)
        pdf.cell(0, 10, "Disclaimer: Astrology is for guidance and entertainment purposes.", ln=True, align='C')
        
        # Return bytes directly
        return bytes(pdf.output())
