from fastapi import APIRouter, HTTPException, BackgroundTasks
from backend.models import MobileRequest, OTPRequest, UserRegistration, LoginResponse
from backend.db import get_db_collection
from backend.astrology_service import generate_astrology_report
from backend.rag_service import get_rag_engine
from chunking import extract_hierarchy, chunk_hierarchy_for_rag
import time
import os
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/send-otp")
async def send_otp(request: MobileRequest):
    try:
        print(f"DEBUG: Received send-otp request for mobile: {request.mobile}")
        otp_col = get_db_collection("otps")
        
        # 1. Clean up expired records for this mobile
        # This prevents stale records from triggering the "retry" logic (9876) erroneously.
        # Expiration: 5 minutes = 300 seconds
        expiration_time = time.time() - 300
        delete_res = otp_col.delete_many({"mobile": request.mobile, "created_at": {"$lt": expiration_time}})
        if delete_res.deleted_count > 0:
            print(f"DEBUG: Deleted {delete_res.deleted_count} expired OTP record(s) for {request.mobile}")

        # 2. Check if a valid (non-expired) request already exists
        existing = otp_col.find_one({"mobile": request.mobile})
        
        # Determine OTP: 1234 for new, 9876 for retry
        otp_value = "1234" if not existing else "9876"
        
        # Update or create OTP record
        otp_col.update_one(
            {"mobile": request.mobile},
            {
                "$set": {
                    "otp": otp_value,
                    "created_at": time.time(),
                    "is_retry": True if existing else False
                }
            },
            upsert=True
        )
        
        print(f"DEBUG: OTP {otp_value} generated for {request.mobile}")
        return {"message": f"OTP sent to {request.mobile}", "status": "success", "otp": otp_value}
    except Exception as e:
        print(f"ERROR in send_otp: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-otp")
async def verify_otp(request: OTPRequest):
    try:
        print(f"DEBUG: Received verify-otp request for mobile: {request.mobile}, otp: {request.otp}")
        otp_col = get_db_collection("otps")
        otp_record = otp_col.find_one({"mobile": request.mobile})
        
        if not otp_record:
            print(f"WARN: No OTP record found for {request.mobile}")
            raise HTTPException(status_code=400, detail="No OTP request found. Please request a new one.")
        
        # Check Expiration (5 minutes = 300 seconds)
        if time.time() - otp_record["created_at"] > 300:
            print(f"WARN: OTP expired for {request.mobile}")
            otp_col.delete_one({"mobile": request.mobile})
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
        if request.otp != otp_record["otp"]:
            print(f"WARN: Invalid OTP attempt for {request.mobile}. Expected {otp_record['otp']}, got {request.otp}")
            raise HTTPException(status_code=400, detail="Invalid OTP")

        # Success! Delete OTP record
        print(f"DEBUG: OTP verified successfully for {request.mobile}")
        otp_col.delete_one({"mobile": request.mobile})
        
        # Check if user exists in DB
        users_col = get_db_collection("users")
        user = users_col.find_one({"mobile": request.mobile})
        
        if user:
            # Existing user
            user.pop("_id", None) 
            return {
                "access_token": "mock-jwt-token-existing", 
                "token_type": "bearer",
                "is_new_user": False,
                "user_profile": user
            }
        else:
            # New User needs to register
            return {
                "access_token": "mock-jwt-temp-token", 
                "token_type": "bearer",
                "is_new_user": True,
                "user_profile": None
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in verify_otp: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register")
async def register_user(reg: UserRegistration):
    try:
        print(f"DEBUG: Registering user {reg.name} with mobile {reg.mobile}")
        
        # 1. Generate Report
        print("DEBUG: Calling generate_astrology_report...")
        report_text = generate_astrology_report(
            reg.name, reg.gender, reg.dob, reg.tob, reg.pob, reg.mobile, reg.email, reg.chart_style
        )
        print("DEBUG: Report generated successfully.")
        
        # 2. Save Report to File (Optional for RAG later)
        os.makedirs("reports", exist_ok=True)
        with open(f"reports/{reg.mobile}.txt", "w", encoding="utf-8") as f:
            f.write(report_text)
        print(f"DEBUG: Report saved to reports/{reg.mobile}.txt")

        # 3. Save to DB (Metadata only)
        users_col = get_db_collection("users")
        user_doc = {
            "mobile": reg.mobile,
            "name": reg.name,
            "email": reg.email,
            "gender": reg.gender,
            "chart_style": reg.chart_style,
            "dob": reg.dob,
            "tob": reg.tob,
            "pob": reg.pob,
            "processed_doc_id": reg.mobile,
            "status": "processing",
            "created_at": time.time()
        }
        users_col.insert_one(user_doc)
        print("DEBUG: User profile saved to users collection.")

        # 4. Save Report Text to dedicated collection
        reports_col = get_db_collection("reports")
        reports_col.update_one(
            {"mobile": reg.mobile},
            {"$set": {"mobile": reg.mobile, "report_text": report_text, "created_at": time.time()}},
            upsert=True
        )
        print("DEBUG: Astrology report saved to reports collection.")

        # 5. RAG Processing
        try:
            print("DEBUG: Starting RAG indexing...")
            engine, vectorstore = get_rag_engine()
            hierarchy = extract_hierarchy(report_text)
            
            # Use original chunking function (no doc_id parameter)
            chunks = chunk_hierarchy_for_rag(hierarchy)
            
            # Manually inject doc_id and chunk_index to keep chunking logic untouched
            for i, c in enumerate(chunks):
                c["doc_id"] = reg.mobile
                c["chunk_index"] = i
                
            # Generate embeddings
            chunks = engine.embed_chunks(chunks) 
            vectorstore.add_chunks(chunks)
            print(f"DEBUG: Successfully indexed {len(chunks)} chunks for {reg.mobile}")
            
            # 5. Save Document Mapping to DB
            try:
                docs_col = get_db_collection("documents")
                docs_col.insert_one({
                    "doc_id": reg.mobile,
                    "mobile": reg.mobile,
                    "file_path": f"processed_docs/{reg.mobile}.json",
                    "timestamp": time.time(),
                    "type": "astrology_report",
                    "status": "ready"
                })
                print("DEBUG: Document mapping saved to MongoDB.")
                
                # Update User Status to Ready
                users_col.update_one(
                    {"mobile": reg.mobile},
                    {"$set": {"status": "ready"}}
                )
                print("DEBUG: User status updated to 'ready'.")
            except Exception as db_err:
                print(f"ERROR saving document mapping: {db_err}")
                
        except Exception as rag_err:
            print(f"ERROR in RAG processing: {rag_err}")
            # We don't want to fail registration if RAG fails, 
            # but for debugging we should know.
            # Actually, the user might want this to be fatal or not.
            # Let's keep it non-fatal for now to see if the report at least saves.
        
        # Return success
        user_doc.pop("_id", None)
        return {
            "access_token": "mock-jwt-token-new", 
            "token_type": "bearer",
            "user_profile": user_doc
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatMessage(BaseModel):
    message: str
    history: list = []
    mobile: str

@router.post("/chat")
async def chat(request: ChatMessage):
    try:
        if not os.getenv("OPENAI_API_KEY"):
            print("ERROR: OPENAI_API_KEY is missing from environment!")
            raise HTTPException(status_code=500, detail="OpenAI API key not configured on server.")

        print(f"DEBUG: Chat request received for mobile: {request.mobile}")
        engine, vectorstore = get_rag_engine()
        print(f"DEBUG: Vectorstore doc_ids: {vectorstore.document_names}")
        
        selected_docs = [request.mobile]
        print(f"DEBUG: Retrieving chunks for docs: {selected_docs}")
        
        # Query Augmentation: If input is short (< 15 chars), include last bot question if available
        search_query = request.message
        if len(request.message) < 15 and request.history:
            # Find last assistant message
            last_assistant = next((m["content"] for m in reversed(request.history) if m["role"] == "assistant"), "")
            if last_assistant:
                # Clean up the assistant message (remove previous "What's Next?" if present)
                base_context = last_assistant.split("🤔 What's Next?")[0].strip()
                search_query = f"{base_context} {request.message}"
                print(f"DEBUG: Augmenting short query to: {search_query}")
        
        filtered_chunks = engine.retrieve(search_query, top_k=5, doc_ids=selected_docs)
        print(f"DEBUG: Found {len(filtered_chunks)} chunks for query: {search_query}")
        
        clean_chunks = [
            {
                "text": chunk["text"],
                "heading": chunk["heading"],
                "doc_id": chunk["doc_id"]
            }
            for (chunk, score) in filtered_chunks
        ]
        
        if not clean_chunks:
            print("DEBUG: No chunks found. Attempting to reload report from DB/Disk...")
            
            # 1. Try DB first (Normalized source)
            reports_col = get_db_collection("reports")
            report_record = reports_col.find_one({"mobile": request.mobile})
            report_text = report_record.get("report_text") if report_record else None
            
            # 2. Try Disk if DB fails
            if not report_text:
                report_path = f"reports/{request.mobile}.txt"
                if os.path.exists(report_path):
                    with open(report_path, "r", encoding="utf-8") as f:
                        report_text = f.read()
            
            if report_text:
                from backend.rag_service import get_rag_engine as get_rag
                from chunking import extract_hierarchy, chunk_hierarchy_for_rag
                _, vec = get_rag()
                hierarchy = extract_hierarchy(report_text)
                chunks = chunk_hierarchy_for_rag(hierarchy)
                
                # Manually inject doc_id
                for c in chunks:
                    c["doc_id"] = request.mobile
                
                vec.add_chunks(chunks)
                print(f"DEBUG: Reloaded {len(chunks)} chunks for {request.mobile}.")
                
                # Re-retrieve
                filtered_chunks = engine.retrieve(request.message, top_k=5, doc_ids=selected_docs)
                clean_chunks = [{"text": c["text"], "heading": c["heading"], "doc_id": c["doc_id"]} for (c, s) in filtered_chunks]
            else:
                print(f"DEBUG: No report found in DB or Disk for {request.mobile}")

        from chat_handler import generate_with_openai
        
        system_prompt = "You are Astrology Guruji. Answer using only context if possible."
        if os.path.exists("system_prompt.txt"):
            with open("system_prompt.txt", "r", encoding="utf-8") as f:
                system_prompt = f.read()

        print("DEBUG: Calling OpenAI...")
        response = generate_with_openai(
            system_prompt=system_prompt,
            context_chunks=clean_chunks,
            conversation_history=request.history,
            question=request.message
        )
        print("DEBUG: OpenAI response received.")
        
        # Calculate Metrics
        scores = [score for (chunk, score) in filtered_chunks]
        avg_score = sum(scores) / len(scores) if scores else 0
        max_score = max(scores) if scores else 0

        # Save to Chat History
        try:
            chats_col = get_db_collection("chats")
            chats_col.insert_one({
                "mobile": request.mobile,
                "user_message": request.message,
                "bot_response": response,
                "timestamp": time.time(),
                "metrics": {
                    "rag_score": round(max_score * 100, 1),
                    "modelling_score": round(avg_score * 100, 1)
                }
            })
        except Exception as db_err:
            print(f"DEBUG: Failed to save chat to DB: {db_err}")
        
        return {
            "content": response,
            "context": clean_chunks,
            "metrics": {
                "rag_score": round(max_score * 100, 1),
                "modelling_score": round(avg_score * 100, 1)
            }
        }
        
    except Exception as e:
        import traceback
        print(f"ERROR in chat: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class EndChatRequest(BaseModel):
    mobile: str
    history: list

@router.post("/end-chat")
async def end_chat(request: EndChatRequest):
    try:
        from chat_handler import generate_with_openai
        
        history_text = ""
        for msg in request.history:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"
            
        summary_prompt = f"""
        Provide a concise summary of the following astrology consultation. 
        Focus on the main concerns raised by the user and the advice given by the Guru.
        Keep it under 150 words.
        
        CONVERSATION:
        {history_text}
        """
        
        summary = generate_with_openai(
            system_prompt="You are an expert summarizer for spiritual consultations.",
            context_chunks=[],
            conversation_history=[],
            question=summary_prompt
        )
        
        # Save summary to DB
        try:
            chats_col = get_db_collection("summaries")
            chats_col.insert_one({
                "mobile": request.mobile,
                "summary": summary,
                "timestamp": time.time()
            })
        except Exception as db_err:
            print(f"DEBUG: Failed to save summary to DB: {db_err}")
            
        return {"summary": summary}
        
    except Exception as e:
        print(f"ERROR in end-chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


