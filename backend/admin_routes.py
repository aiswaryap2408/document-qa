from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel
from backend.db import get_db_collection
from backend.rag_service import get_rag_engine
from rag_modules.chunking import extract_hierarchy, chunk_hierarchy_for_rag
from rag_modules.chat_handler import generate_with_openai, generate_with_gemini
import time
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
            ans = generate_with_openai(system_prompt, context_chunks, [], request.message, model=request.model)
        else:
            ans = generate_with_gemini(system_prompt, context_chunks, [], request.message, model=request.model)

        return {"response": ans, "context_used": [c['heading'] for c in context_chunks]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
