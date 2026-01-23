import time
from backend.db import get_db_collection
from typing import Optional, List, Dict
from fpdf import FPDF
import os
from rag_modules.chat_handler import generate_with_openai, generate_with_gemini

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
        """Generate a personalized PDF report using an LLM."""
        try:
            # 1. Fetch User Profile
            users_col = get_db_collection("users")
            user = users_col.find_one({"mobile": mobile}, {"_id": 0})
            if not user:
                user = {"name": "User", "dob": "N/A", "tob": "N/A", "pob": "N/A", "gender": "N/A"}

            # 2. Load Report Prompt
            prompt_path = os.path.join(os.getcwd(), "guruji_detailed_report_prompt.txt")
            if os.path.exists(prompt_path):
                with open(prompt_path, "r", encoding="utf-8") as f:
                    system_prompt = f.read()
            else:
                system_prompt = "Generate a short astrology report for {name} about {category}."

            # 3. Format Prompt
            formatted_prompt = system_prompt.format(
                name=user.get("name", "User"),
                dob=user.get("dob", "N/A"),
                tob=user.get("tob", "N/A"),
                pob=user.get("pob", "N/A"),
                gender=user.get("gender", "N/A"),
                category=category
            )

            # 4. Generate Content with LLM
            # We'll use GPT-4o-mini as default for reports for high quality
            try:
                content, usage = generate_with_openai(
                    system_prompt=formatted_prompt,
                    context_chunks=[],
                    chat_history=[],
                    user_query=f"Generate my detailed {category} report.",
                    model="gpt-4o-mini"
                )
            except Exception as e:
                print(f"LLM Generation failed, falling back to Gemini: {e}")
                content, usage = generate_with_gemini(
                    system_prompt=formatted_prompt,
                    context_chunks=[],
                    chat_history=[],
                    user_query=f"Generate my detailed {category} report.",
                    model="gemini-1.5-flash"
                )

            # 5. Create PDF
            pdf = FPDF()
            pdf.add_page()
            
            # Header
            pdf.set_font("helvetica", "B", 18)
            pdf.set_text_color(44, 62, 80) # Dark blue/gray
            pdf.cell(0, 15, f"Personalized Astrology Report", ln=True, align='C')
            
            pdf.set_font("helvetica", "B", 14)
            pdf.cell(0, 10, f"Focus: {category.capitalize()}", ln=True, align='C')
            pdf.ln(10)
            
            # User Info
            pdf.set_font("helvetica", "B", 10)
            pdf.set_text_color(127, 140, 141) # Gray
            pdf.cell(0, 5, f"Prepared for: {user.get('name', 'User')} | {mobile}", ln=True, align='L')
            pdf.ln(5)
            
            # Line separator
            pdf.set_draw_color(230, 230, 230)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(10)
            
            # Main Content
            pdf.set_font("helvetica", "", 12)
            pdf.set_text_color(0, 0, 0)
            pdf.multi_cell(0, 8, content.strip())
            
            # Footer
            pdf.ln(20)
            pdf.set_font("helvetica", "I", 10)
            pdf.set_text_color(149, 165, 166)
            pdf.multi_cell(0, 5, "Disclaimer: Astrology is an interpretative art based on celestial patterns. This report is for guidance and entertainment purposes only.", align='C')
            
            # Return bytes
            return bytes(pdf.output())

        except Exception as e:
            print(f"Error in generate_report_pdf: {e}")
            import traceback
            traceback.print_exc()
            # Absolute fallback
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("helvetica", "B", 16)
            pdf.cell(0, 10, "Astrology Report", ln=True, align='C')
            pdf.ln(10)
            pdf.set_font("helvetica", "", 12)
            pdf.multi_cell(0, 10, f"Your report for {category} is currently being prepared. Please contact support if this message persists.")
            return bytes(pdf.output())
