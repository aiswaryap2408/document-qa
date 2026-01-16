from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel
from backend.db import get_db_collection
from backend.rag_service import get_rag_engine
from rag_modules.chunking import extract_hierarchy, chunk_hierarchy_for_rag
from rag_modules.chat_handler import generate_with_openai, generate_with_gemini
import time
import datetime
import os
import json

router = APIRouter(prefix="/admin", tags=["Admin"])

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class SystemPromptRequest(BaseModel):
    prompt: str

class TestChatRequest(BaseModel):
    message: str
    doc_id: str = None # Optional filter
    model: str = "gpt-4o-mini"

# Mock Admin Auth Logic
@router.post("/login")
async def admin_login(request: AdminLoginRequest):
    # For development, use hardcoded credentials
    if request.username == "admin" and request.password == "admin123":
        return {
            "access_token": "mock-admin-token",
            "token_type": "bearer",
            "status": "success"
        }
    raise HTTPException(status_code=401, detail="Invalid admin credentials")

@router.get("/users")
async def get_all_users():
    try:
        users_col = get_db_collection("users")
        users = list(users_col.find({}, {"_id": 0}))
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_dashboard_stats(range: str = "7D"):
    try:
        users_col = get_db_collection("users")
        chats_col = get_db_collection("chats")
        transactions_col = get_db_collection("transactions")
        
        # 1. User Meta
        # 2. Define Time Windows
        range_seconds = {
            "24H": 86400,
            "7D": 86400 * 7,
            "30D": 86400 * 30,
            "1M": 86400 * 30,
            "LM": 86400 * 30,
            "ALL": 0
        }
        
        now_ts = time.time()
        now_dt = datetime.datetime.fromtimestamp(now_ts)
        
        def compute_metrics(start, end=None):
            query = {"timestamp": {"$gte": start}}
            if end: query["timestamp"]["$lt"] = end
            
            active = chats_col.count_documents(query)
            convos = chats_col.count_documents(query)
            
            wallet_q = {
                "$or": [
                    {"category": "recharge"},
                    {"type": "credit", "category": {"$exists": False}}
                ],
                "status": "success",
                "timestamp": {"$gte": start}
            }
            if end: wallet_q["timestamp"]["$lt"] = end
            
            wallet_res = list(transactions_col.aggregate([
                {"$match": wallet_q},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]))
            wallet = wallet_res[0]["total"] if wallet_res else 0
            
            users_q = {"created_at": {"$gte": start}}
            if end: users_q["created_at"]["$lt"] = end
            new_users = users_col.count_documents(users_q)
            
            def get_dakshina_by_source(source_val, s, e):
                q = {
                    "$or": [
                        {"category": "dakshina", "source": source_val},
                        {"type": "debit", "category": {"$exists": False}, "source": source_val} if source_val == "wallet" else None
                    ],
                    "status": "success",
                    "timestamp": {"$gte": s}
                }
                # Clean up None if gateway
                if not q["$or"][-1]: q["$or"].pop()
                if e: q["timestamp"]["$lt"] = e
                
                res = list(transactions_col.aggregate([
                    {"$match": q},
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
                ]))
                return res[0]["total"] if res else 0

            dakshina_w = get_dakshina_by_source("wallet", start, end)
            dakshina_g = get_dakshina_by_source("gateway", start, end)
            dakshina = dakshina_w + dakshina_g

            # AI Usage (Tokens)
            # 1. From Chats
            chat_usage_res = list(chats_col.aggregate([
                {"$match": query},
                {"$group": {
                    "_id": None, 
                    "tokens": {"$sum": "$usage.total_tokens"},
                    "maya_tokens": {"$sum": "$maya_usage.total_tokens"}
                }}
            ]))
            chat_tokens = (chat_usage_res[0]["tokens"] or 0) + (chat_usage_res[0]["maya_tokens"] or 0) if chat_usage_res else 0
            
            # 2. From Summaries
            summaries_col = get_db_collection("summaries")
            summary_usage_res = list(summaries_col.aggregate([
                {"$match": query},
                {"$group": {"_id": None, "tokens": {"$sum": "$usage.total_tokens"}}}
            ]))
            summary_tokens = summary_usage_res[0]["tokens"] if summary_usage_res else 0
            
            total_tokens = chat_tokens + summary_tokens

            return {
                "active": active, 
                "convos": convos, 
                "wallet": wallet, 
                "new_users": new_users, 
                "dakshina": dakshina, 
                "dakshina_w": dakshina_w, 
                "dakshina_g": dakshina_g,
                "tokens": total_tokens
            }

        def calculate_pct(cur, prev):
            if prev <= 0: return 100 if cur > 0 else 0
            return round(((cur - prev) / prev) * 100, 1)

        if range == "Last Month":
            first_of_current = now_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            lm_end_dt = first_of_current
            last_month_point = first_of_current - datetime.timedelta(days=1)
            lm_start_dt = last_month_point.replace(day=1)
            
            prev_lm_point = lm_start_dt - datetime.timedelta(days=1)
            prev_lm_start_dt = prev_lm_point.replace(day=1)
            
            current_stats = compute_metrics(lm_start_dt.timestamp(), lm_end_dt.timestamp())
            previous_stats = compute_metrics(prev_lm_start_dt.timestamp(), lm_start_dt.timestamp())
            
            trends = {
                "users": calculate_pct(current_stats["new_users"], previous_stats["new_users"]),
                "sessions": calculate_pct(current_stats["active"], previous_stats["active"]),
                "conversations": calculate_pct(current_stats["convos"], previous_stats["convos"]),
                "wallet": calculate_pct(current_stats["wallet"], previous_stats["wallet"])
            }
            active_today = chats_col.count_documents({"timestamp": {"$gte": now_ts - 86400}})
            total_convos = current_stats["convos"]
            wallet_volume = current_stats["wallet"]
            total_dakshina = current_stats["dakshina"]
            total_dakshina_w = current_stats["dakshina_w"]
            total_dakshina_g = current_stats["dakshina_g"]
            # Search duration for RAG (keep it same as the range)
            rag_range_start = lm_start_dt.timestamp()
            rag_range_end = lm_end_dt.timestamp()
        elif range == "ALL":
            trends = {"users": 0, "sessions": 0, "conversations": 0, "wallet": 0}
            active_today = chats_col.count_documents({"timestamp": {"$gte": now_ts - 86400}})
            total_convos = chats_col.count_documents({})
            
            dakshina_match = {
                "$or": [
                    {"category": "recharge"},
                    {"type": "credit", "category": {"$exists": False}}
                ],
                "status": "success"
            }
            dakshina_res = list(transactions_col.aggregate([
                {"$match": dakshina_match},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]))
            wallet_volume = dakshina_res[0]["total"] if dakshina_res else 0
            
            # Dakshina is debit
            dakshina_w_match = {
                "$or": [
                    {"category": "dakshina", "source": "wallet"},
                    {"type": "debit", "category": {"$exists": False}} # Legacy is wallet
                ],
                "status": "success"
            }
            dakshina_w_res = list(transactions_col.aggregate([{"$match": dakshina_w_match}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]))
            total_dakshina_w = dakshina_w_res[0]["total"] if dakshina_w_res else 0

            dakshina_g_match = {"category": "dakshina", "source": "gateway", "status": "success"}
            dakshina_g_res = list(transactions_col.aggregate([{"$match": dakshina_g_match}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]))
            total_dakshina_g = dakshina_g_res[0]["total"] if dakshina_g_res else 0
            
            total_dakshina = total_dakshina_w + total_dakshina_g

            # Total Tokens ALL
            total_tokens_period = 0
            try:
                c_tokens = list(chats_col.aggregate([{"$group": {"_id": None, "t": {"$sum": "$usage.total_tokens"}, "mt": {"$sum": "$maya_usage.total_tokens"}}}]))
                s_tokens = list(get_db_collection("summaries").aggregate([{"$group": {"_id": None, "t": {"$sum": "$usage.total_tokens"}}}]))
                total_tokens_period = (c_tokens[0]["t"] or 0) + (c_tokens[0]["mt"] or 0) if c_tokens else 0
                total_tokens_period += (s_tokens[0]["t"] or 0) if s_tokens else 0
            except: pass

            rag_range_start = 0
            rag_range_end = None
        else:
            seconds = range_seconds.get(range, 86400 * 7)
            current_stats = compute_metrics(now_ts - seconds)
            previous_stats = compute_metrics(now_ts - (2 * seconds), now_ts - seconds)
            
            trends = {
                "users": calculate_pct(current_stats["new_users"], previous_stats["new_users"]),
                "sessions": calculate_pct(current_stats["active"], previous_stats["active"]),
                "conversations": calculate_pct(current_stats["convos"], previous_stats["convos"]),
                "wallet": calculate_pct(current_stats["wallet"], previous_stats["wallet"])
            }
            active_today = current_stats["active"]
            total_convos = chats_col.count_documents({"timestamp": {"$gte": now_ts - seconds}})
            wallet_volume = current_stats["wallet"]
            total_dakshina = current_stats["dakshina"]
            total_dakshina_w = current_stats["dakshina_w"]
            total_dakshina_g = current_stats["dakshina_g"]
            total_tokens_period = current_stats["tokens"]
            rag_range_start = now_ts - seconds
            rag_range_end = None

        # 4. Neural Quality (RAG Score)
        rag_match = {"metrics.rag_score": {"$exists": True}, "timestamp": {"$gte": rag_range_start}}
        if rag_range_end:
            rag_match["timestamp"]["$lt"] = rag_range_end
        
        rag_res = list(chats_col.aggregate([
            {"$match": rag_match},
            {"$group": {"_id": None, "avg_score": {"$avg": "$metrics.rag_score"}}}
        ]))
        avg_rag_score = round(rag_res[0]["avg_score"], 1) if rag_res else 90.0
        
        # 5. Current Vault Balance
        wallets_col = get_db_collection("wallets")
        balance_res = list(wallets_col.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$balance"}}}
        ]))
        current_vault_balance = balance_res[0]["total"] if balance_res else 0

        return {
            "totalUsers": users_col.count_documents({}),
            "activeToday": active_today,
            "totalConversations": total_convos,
            "averageRAGScore": avg_rag_score,
            "walletVolume": wallet_volume,
            "totalDakshina": total_dakshina,
            "dakshinaWallet": total_dakshina_w,
            "dakshinaGateway": total_dakshina_g,
            "totalTokens": total_tokens_period,
            "aiCost": round(total_tokens_period * 0.0001, 2), # Mock cost: $0.10 per 1M tokens approx
            "currentBalance": current_vault_balance,
            "activeSubscriptions": users_col.count_documents({}) // 15,
            "trends": trends
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-details/{mobile}")
async def get_user_details(mobile: str):
    try:
        # 1. Profile
        users_col = get_db_collection("users")
        user = users_col.find_one({"mobile": mobile}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # 2. Chats
        chats_col = get_db_collection("chats")
        chats = list(chats_col.find({"mobile": mobile}, {"_id": 0}).sort("timestamp", -1))
        
        # 3. Summaries
        summaries_col = get_db_collection("summaries")
        summaries = list(summaries_col.find({"mobile": mobile}, {"_id": 0}).sort("timestamp", -1))

        # 4. Wallet & Transactions (Seed with mock if empty for demo)
        wallets_col = get_db_collection("wallets")
        transactions_col = get_db_collection("transactions")
        
        wallet = wallets_col.find_one({"mobile": mobile}, {"_id": 0})
        if not wallet:
            wallet = {"mobile": mobile, "balance": 500.0, "currency": "INR", "updated_at": time.time()}
            wallets_col.insert_one(wallet.copy())
            wallet.pop("_id", None) # Double check _id is gone if we used insert_one directly

        transactions = list(transactions_col.find({"mobile": mobile}, {"_id": 0}).sort("timestamp", -1))
        if not transactions:
            transactions = [
                {"mobile": mobile, "amount": 100.0, "type": "credit", "status": "success", "description": "Welcome Bonus", "timestamp": time.time() - 86400},
                {"mobile": mobile, "amount": 50.0, "type": "debit", "status": "success", "description": "Chat Consultation", "timestamp": time.time() - 3600}
            ]
            transactions_col.insert_many(transactions)
            for t in transactions: t.pop("_id", None)
        
        return {
            "profile": user,
            "chats": chats,
            "summaries": summaries,
            "wallet": wallet,
            "transactions": transactions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system-prompt")
async def get_system_prompt():
    try:
        if os.path.exists("system_prompt.txt"):
            with open("system_prompt.txt", "r", encoding="utf-8") as f:
                return {"prompt": f.read()}
        return {"prompt": "You are Astrology Guruji. Answer using only context if possible."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/system-prompt")
async def update_system_prompt(request: SystemPromptRequest):
    try:
        with open("system_prompt.txt", "w", encoding="utf-8") as f:
            f.write(request.prompt)
        return {"message": "System prompt updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/maya-prompt")
async def get_maya_prompt():
    try:
        if os.path.exists("maya_system_prompt.txt"):
            with open("maya_system_prompt.txt", "r", encoding="utf-8") as f:
                return {"prompt": f.read()}
        return {"prompt": "Default Maya Prompt (File not found)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/maya-prompt")
async def update_maya_prompt(request: SystemPromptRequest):
    try:
        with open("maya_system_prompt.txt", "w", encoding="utf-8") as f:
            f.write(request.prompt)
        return {"message": "Maya prompt updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- RAG TESTER ENDPOINTS ---

TEST_DOC_DIR = os.path.join("backend", "test_docs")

@router.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    try:
        os.makedirs(TEST_DOC_DIR, exist_ok=True)
        file_path = os.path.join(TEST_DOC_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        return {"filename": file.filename, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-process")
async def test_process(filename: str = Form(...)):
    try:
        file_path = os.path.join(TEST_DOC_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
            
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Chunking
        records = extract_hierarchy(content)
        chunks = chunk_hierarchy_for_rag(records)

        # Embedding & Indexing
        engine, vectorstore = get_rag_engine()
        chunks_with_emb = engine.embed_chunks(chunks)
        
        # Use filename as doc_id for testing
        doc_id = f"test_{filename}_{int(time.time())}"
        vectorstore.add_document(doc_id, filename, chunks_with_emb)

        return {"status": "success", "doc_id": doc_id, "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-chat")
async def test_chat(request: TestChatRequest):
    try:
        engine, vectorstore = get_rag_engine()
        
        # 1. Retrieve
        results = engine.retrieve(request.message, top_k=5, doc_ids=[request.doc_id] if request.doc_id else None)
        context_chunks = [r[0] for r in results]

        # 2. Get System Prompt
        system_prompt = "You are Astrology Guruji. Answer using only context."
        if os.path.exists("system_prompt.txt"):
            with open("system_prompt.txt", "r", encoding="utf-8") as f:
                system_prompt = f.read()

        # 3. Generate
        if "gpt" in request.model:
            ans, usage = generate_with_openai(system_prompt, context_chunks, [], request.message, model=request.model)
        else:
            ans, usage = generate_with_gemini(system_prompt, context_chunks, [], request.message, model=request.model)

        return {"response": ans, "context_used": [c['heading'] for c in context_chunks]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
