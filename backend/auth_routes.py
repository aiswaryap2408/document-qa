from fastapi import APIRouter, HTTPException, BackgroundTasks
from backend.models import MobileRequest, OTPRequest, UserRegistration, LoginResponse
from backend.db import get_db_collection
from backend.astrology_service import generate_astrology_report, send_sms_otp
from backend.wallet_service import WalletService
from backend.rag_service import get_rag_engine
from rag_modules.chunking import extract_hierarchy, chunk_hierarchy_for_rag
import time
import os
import random
import re
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

class FeedbackRequest(BaseModel):
    mobile: str
    session_id: Optional[str] = None
    rating: int
    feedback: str

@router.post("/send-otp")
async def send_otp(request: MobileRequest):
    try:
        print(f"DEBUG: Received send-otp request for mobile: {request.mobile}")
        otp_col = get_db_collection("otps")

        # 1. Clean up expired records for this mobile
        expiration_time = time.time() - 300
        delete_res = otp_col.delete_many({"mobile": request.mobile, "created_at": {"$lt": expiration_time}})
        if delete_res.deleted_count > 0:
            print(f"DEBUG: Deleted {delete_res.deleted_count} expired OTP record(s) for {request.mobile}")

        # 2. Check if a valid (non-expired) request already exists
        existing_record = otp_col.find_one({"mobile": request.mobile})
        
        # 3. Generate Random OTP
        otp_value = str(random.randint(1000, 9999))
        
        # 4. Send via SMS API
        print(f"DEBUG: Sending SMS OTP via threadpool...")
        from starlette.concurrency import run_in_threadpool
        sms_sent = await run_in_threadpool(send_sms_otp, request.mobile, otp_value)
        # sms_sent = True # Mocking success
        
        # Update or create OTP record
        otp_col.update_one(
            {"mobile": request.mobile},
            {
                "$set": {
                    "otp": otp_value,
                    "created_at": time.time(),
                    "sms_sent": sms_sent,
                    "is_retry": True if existing_record else False
                }
            },
            upsert=True
        )
        print(f"DEBUG: STATIC OTP {otp_value} set for {request.mobile}")
        
        return {"message": f"OTP sent to {request.mobile} (Static: 1234)", "status": "success"}
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

async def process_user_registration_background(reg: UserRegistration):
    """
    Background task to handle heavy processing after registration.
    This runs asynchronously while the user goes through onboarding.
    """
    try:
        print(f"DEBUG: [BACKGROUND] Starting processing for {reg.mobile}")
        
        # 1. Generate Report
        print("DEBUG: [BACKGROUND] Calling generate_astrology_report...")
        report_text = generate_astrology_report(
            reg.name, reg.gender, reg.dob, reg.tob, reg.pob, reg.mobile, reg.email, reg.chart_style, reg.txt_place_search, reg.longdeg, reg.longmin, reg.longdir, reg.latdeg, reg.latmin, reg.latdir, reg.timezone
        )
        print(f"DEBUG: [BACKGROUND] Report generated. Length: {len(report_text) if report_text else 0}")
        
        if not report_text:
            print("WARNING: [BACKGROUND] Report text is empty! Context will be missing.")
            report_text = f"Astrology report for {reg.name}. Data was not available at generation time."
        
        print("DEBUG: [BACKGROUND] Report text processed.")
        # 2. Save Report to File
        os.makedirs("reports", exist_ok=True)
        with open(f"reports/{reg.mobile}.txt", "w", encoding="utf-8") as f:
            f.write(report_text)
        print(f"DEBUG: [BACKGROUND] Report saved to reports/{reg.mobile}.txt")

        # 3. Save Report Text to dedicated collection
        reports_col = get_db_collection("reports")
        reports_col.update_one(
            {"mobile": reg.mobile},
            {"$set": {"mobile": reg.mobile, "report_text": report_text, "created_at": time.time()}},
            upsert=True
        )
        print("DEBUG: [BACKGROUND] Astrology report saved to reports collection.")

        # 4. RAG Processing
        print("DEBUG: [BACKGROUND] Starting RAG indexing...")
        engine, vectorstore = get_rag_engine()
        hierarchy = extract_hierarchy(report_text)
        
        # Use original chunking function (no doc_id parameter)
        chunks = chunk_hierarchy_for_rag(hierarchy)
        
        # Manually inject doc_id and chunk_index
        for i, c in enumerate(chunks):
            c["doc_id"] = reg.mobile
            c["chunk_index"] = i
            
        # Generate embeddings
        chunks = engine.embed_chunks(chunks) 
        vectorstore.add_chunks(chunks)
        print(f"DEBUG: [BACKGROUND] Successfully indexed {len(chunks)} chunks for {reg.mobile}")
        
        # 5. Save Document Mapping to DB
        docs_col = get_db_collection("documents")
        docs_col.insert_one({
            "doc_id": reg.mobile,
            "mobile": reg.mobile,
            "file_path": f"processed_docs/{reg.mobile}.json",
            "timestamp": time.time(),
            "type": "astrology_report",
            "status": "ready"
        })
        print("DEBUG: [BACKGROUND] Document mapping saved to MongoDB.")
        
        # 6. Update User Status to Ready
        users_col = get_db_collection("users")
        users_col.update_one(
            {"mobile": reg.mobile},
            {"$set": {"status": "ready"}}
        )
        print(f"DEBUG: [BACKGROUND] User {reg.mobile} status updated to 'ready'.")
        
    except Exception as e:
        print(f"ERROR: [BACKGROUND] Processing failed for {reg.mobile}: {e}")
        import traceback
        traceback.print_exc()
        
        # Update user status to failed
        try:
            users_col = get_db_collection("users")
            users_col.update_one(
                {"mobile": reg.mobile},
                {"$set": {"status": "failed", "error": str(e)}}
            )
        except Exception as db_err:
            print(f"ERROR: [BACKGROUND] Failed to update user status: {db_err}")

@router.post("/register")
async def register_user(reg: UserRegistration, background_tasks: BackgroundTasks):
    try:
        print(f"DEBUG: Registering user {reg.name} with mobile {reg.mobile}")
        
        # 1. Save User to DB immediately with "processing" status
        users_col = get_db_collection("users")
        
        # Check if user already exists
        existing_user = users_col.find_one({"mobile": reg.mobile})
        if existing_user:
            print(f"DEBUG: User {reg.mobile} already exists, updating...")
            users_col.update_one(
                {"mobile": reg.mobile},
                {"$set": {
                    "name": reg.name,
                    "email": reg.email,
                    "gender": reg.gender,
                    "chart_style": reg.chart_style,
                    "dob": reg.dob,
                    "tob": reg.tob,
                    "pob": reg.pob,
                    "country": reg.country,
                    "state": reg.state,
                    "region_dist": reg.region_dist,
                    "txt_place_search": reg.txt_place_search,
                    "longdeg": reg.longdeg,
                    "longmin": reg.longmin,
                    "longdir": reg.longdir,
                    "latdeg": reg.latdeg,
                    "latmin": reg.latmin,
                    "latdir": reg.latdir,
                    "timezone": reg.timezone,
                    "timezone_name": reg.timezone_name,
                    "latitude_google": reg.latitude_google,
                    "longitude_google": reg.longitude_google,
                    "correction": reg.correction,
                    "status": "processing",
                    "updated_at": time.time()
                }}
            )
        else:
            user_doc = {
                "mobile": reg.mobile,
                "name": reg.name,
                "email": reg.email,
                "gender": reg.gender,
                "chart_style": reg.chart_style,
                "dob": reg.dob,
                "tob": reg.tob,
                "pob": reg.pob,
                "country": reg.country,
                "state": reg.state,
                "region_dist": reg.region_dist,
                "txt_place_search": reg.txt_place_search,
                "longdeg": reg.longdeg,
                "longmin": reg.longmin,
                "longdir": reg.longdir,
                "latdeg": reg.latdeg,
                "latmin": reg.latmin,
                "latdir": reg.latdir,
                "timezone": reg.timezone,
                "timezone_name": reg.timezone_name,
                "latitude_google": reg.latitude_google,
                "longitude_google": reg.longitude_google,
                "correction": reg.correction,
                "processed_doc_id": reg.mobile,
                "status": "processing",
                "wallet_balance": 100,
                "created_at": time.time()
            }
            users_col.insert_one(user_doc)
        
        print("DEBUG: User profile saved to users collection with status 'processing'.")
        
        # 2. Queue background processing
        background_tasks.add_task(process_user_registration_background, reg)
        print("DEBUG: Background processing task queued.")
        
        # 3. Return immediately (user goes to onboarding)
        user_response = {
            "mobile": reg.mobile,
            "name": reg.name,
            "email": reg.email,
            "gender": reg.gender,
            "chart_style": reg.chart_style,
            "dob": reg.dob,
            "tob": reg.tob,
            "pob": reg.pob,
            "status": "processing"
        }
        
        return {
            "access_token": "mock-jwt-token-new", 
            "token_type": "bearer",
            "user_profile": user_response
        }

    except Exception as e:
        print(f"ERROR in register_user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-status/{mobile}")
async def get_user_status(mobile: str):
    """
    Check the status of user registration processing.
    Returns: {"status": "processing" | "ready" | "failed", "user_profile": {...}}
    """
    try:
        users_col = get_db_collection("users")
        user = users_col.find_one({"mobile": mobile})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.pop("_id", None)
        
        return {
            "status": user.get("status", "unknown"),
            "user_profile": user,
            "wallet_balance": user.get("wallet_balance", 0),
            "error": user.get("error", None)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_user_status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatMessage(BaseModel):
    message: str
    history: list = []
    mobile: str
    session_id: Optional[str] = None

@router.post("/chat")
async def chat(request: ChatMessage):
    try:
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=500, detail="OpenAI API key not configured on server.")

        print(f"DEBUG: Chat request received for mobile: {request.mobile}")

        # ----------------------------------------------------
        # 1. Fetch User Details
        # ----------------------------------------------------
        users_col = get_db_collection("users")
        user = users_col.find_one({"mobile": request.mobile})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # ----------------------------------------------------
        # 2. Maya Classification & Gatekeeping
        # ----------------------------------------------------
        t_start = time.time()
        from rag_modules.maya_receptionist import check_with_maya
        maya_res = check_with_maya(request.message, request.history, user_details=user)
        print(f"DEBUG: Maya took {time.time() - t_start:.2f}s")
        category = maya_res.get("category", "PROCEED")
        pass_to_guruji = maya_res.get("pass_to_guruji", True)
        maya_message = maya_res.get("response_message", "")
        
        cost = maya_res.get("amount", 0) 
        wallet_enabled = WalletService.is_wallet_enabled()
        wallet = WalletService.get_wallet(request.mobile)
        current_balance = wallet.get("balance", 0)
        
        # If pass_to_guruji is False, Maya handles it directly
        if not pass_to_guruji:
            # Store conversation history
            try:
                conv_col = get_db_collection("conversation_history")
                # Store user message
                conv_col.insert_one({
                    "mobile": request.mobile,
                    "session_id": request.session_id,
                    "role": "user",
                    "message": request.message,
                    "timestamp": time.time()
                })
                # Store Maya's response
                conv_col.insert_one({
                    "mobile": request.mobile,
                    "session_id": request.session_id,
                    "role": "maya",
                    "message": maya_message,
                    "category": category,
                    "timestamp": time.time()
                })
            except Exception as e:
                print(f"Error storing Maya conversation: {e}")
            
            return {
                "answer": maya_message if maya_message else "I'm sorry, I cannot process this request. Please ask an astrology question.",
                "amount": 0,
                "flag": category,
                "assistant": "maya",
                "wallet_balance": current_balance,
                "maya_json": maya_res  # Include Maya's raw JSON response
            }

        # Wallet check for passed queries (if any cost and wallet system is enabled)
        if wallet_enabled and cost > 0:
            success = WalletService.debit_money(request.mobile, cost, f"AI Chat: {category}")
            if not success:
                return {
                    "answer": "You have insufficient coins for this detailed analysis. Please top up your wallet. 🙏",
                    "amount": 0,
                    "flag": "INSUFFICIENT_FUNDS",
                    "assistant": "maya",
                    "wallet_balance": current_balance,
                    "maya_json": maya_res
                }
            current_balance -= cost

        # ----------------------------------------------------
        # 3. Guruji RAG Logic
        # ----------------------------------------------------
        t_rag_start = time.time()
        engine, vectorstore = get_rag_engine()
        selected_docs = [request.mobile]
        
        print(f"DEBUG: Vectorstore has {len(vectorstore.document_names)} docs. Searching for: {selected_docs}")
        
        # Query Augmentation: Take last 3 messages for context
        search_query = request.message
        if request.history:
            last_3 = request.history[-3:]
            user_context = []
            assistant_context = []
            for m in last_3:
                role = m.get("role")
                content = m.get("content", "")
                if not content: continue
                # Remove follow-up suggestions
                clean_content = content.split("🤔")[0]
                # Remove HTML tags
                clean_content = re.sub(r'<[^>]*>', '', clean_content)
                # Remove common prefixes
                clean_content = clean_content.replace("Guruji:", "").replace("Maya:", "").replace("Guruji</b>:", "").replace("Maya</b>:", "").strip()
                
                if role == "user":
                    user_context.append(clean_content)
                else:
                    # For assistant, only take first 50 words to avoid drowning out the query
                    short_content = " ".join(clean_content.split()[:50])
                    assistant_context.append(short_content)
            
            if user_context or assistant_context:
                # Prioritize user context
                search_query = " ".join(user_context + assistant_context[-1:]) + " " + request.message
                print(f"DEBUG: Augmented query (refined): {search_query}")
        
        filtered_chunks = engine.retrieve(search_query, top_k=5, doc_ids=selected_docs)
        print(f"DEBUG: Initial retrieval found {len(filtered_chunks)} chunks in {time.time() - t_rag_start:.2f}s")
        
        # Reload if empty
        if not filtered_chunks:
            print(f"DEBUG: No chunks found in memory for {request.mobile}. Attempting DB reload...")
            reports_col = get_db_collection("reports")
            report_record = reports_col.find_one({"mobile": request.mobile})
            report_text = report_record.get("report_text") if report_record else None
            if report_text:
                from rag_modules.chunking import extract_hierarchy, chunk_hierarchy_for_rag
                hierarchy = extract_hierarchy(report_text)
                chunks = chunk_hierarchy_for_rag(hierarchy)
                for c in chunks: c["doc_id"] = request.mobile
                chunks = engine.embed_chunks(chunks)
                vectorstore.add_chunks(chunks)
                filtered_chunks = engine.retrieve(search_query, top_k=5, doc_ids=selected_docs)
                print(f"DEBUG: Reloaded and found {len(filtered_chunks)} chunks.")

        clean_chunks = [{"text": c["text"], "heading": c["heading"], "doc_id": c["doc_id"]} for (c, s) in filtered_chunks]
        
        # Calculate Metrics
        scores = [score for (chunk, score) in filtered_chunks]
        max_score = max(scores) if scores else 0
        avg_score = sum(scores) / len(scores) if scores else 0
        print(f"DEBUG: Max Score: {max_score:.4f}, Avg Score: {avg_score:.4f}")

        # Generate OpenAI Response
        from rag_modules.chat_handler import generate_with_openai
        system_prompt = "You are Astrology Guruji. Answer using only HTML tags (<b>, <ul>, <li>, <table>) for formatting. DO NOT use markdown stars (**). Answer using only context if possible. Speak with wisdom and compassion."
        if os.path.exists("system_prompt.txt"):
            with open("system_prompt.txt", "r", encoding="utf-8") as f:
                system_prompt = f.read()

        t_gen_start = time.time()
        response = generate_with_openai(
            system_prompt=system_prompt,
            context_chunks=clean_chunks,
            conversation_history=request.history,
            question=request.message,
            json_mode=True
        )
        print(f"DEBUG: Guruji generation took {time.time() - t_gen_start:.2f}s")
        
        # ----------------------------------------------------
        # 3. Handle Guruji Response (Structured JSON Parsing)
        # ----------------------------------------------------
        import json
        guruji_json = None
        
        try:
            # Clean possible markdown code fences
            clean_response = response.strip()
            if clean_response.startswith("```"):
                # Use regex to extract content within backticks
                match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', clean_response, re.DOTALL)
                if match:
                    clean_response = match.group(1)
                else:
                    # Fallback: remove fences manually
                    clean_response = re.sub(r'^```(json)?\s*', '', clean_response)
                    clean_response = re.sub(r'\s*```$', '', clean_response)

            # Try to parse response as JSON
            temp_json = json.loads(clean_response)
            # Ensure it has the expected keys
            if any(k in temp_json for k in ["para1", "para2", "para3", "follow_up", "followup"]):
                guruji_json = temp_json
                
                # Construct formatted HTML answer from paragraphs
                parts = []
                for k in ["para1", "para2", "para3"]:
                    if temp_json.get(k):
                        parts.append(temp_json[k])
                
                formatted_body = "<br><br>".join(parts)
                follow_up = temp_json.get("follow_up") or temp_json.get("followup") or "🤔 What's Next?"
                
                final_answer = f"{formatted_body}<br><br>{follow_up}"
            else:
                # Valid JSON but not our format - extract all string values
                text_parts = []
                for val in temp_json.values():
                    if isinstance(val, str):
                        text_parts.append(val)
                if text_parts:
                    final_answer = "<br><br>".join(text_parts)
                else:
                    final_answer = response.strip().replace("\n\n", "<br>").replace("\n", " ")
        except:
            # Not JSON, use raw response
            final_answer = response.strip().replace("\n\n", "<br>").replace("\n", " ")

        # ----------------------------------------------------
        # 4. Save to History
        # ----------------------------------------------------
        # Save to Chat History (legacy format)
        try:
            chats_col = get_db_collection("chats")
            chats_col.insert_one({
                "mobile": request.mobile,
                "user_message": request.message,
                "bot_response": final_answer,
                "timestamp": time.time(),
                "assistant": "guruji",
                "cost": cost,
                "metrics": {
                    "rag_score": round(max_score * 100, 1),
                    "modelling_score": round(avg_score * 100, 1)
                }
            })
        except: pass
        
        # Save to Conversation History (new format with roles)
        try:
            conv_col = get_db_collection("conversation_history")
            # Store user message
            conv_col.insert_one({
                "mobile": request.mobile,
                "session_id": request.session_id,
                "role": "user",
                "message": request.message,
                "timestamp": time.time()
            })
            # Store Guruji's response (store raw string to preserve format)
            conv_col.insert_one({
                "mobile": request.mobile,
                "session_id": request.session_id,
                "role": "guruji",
                "message": response, # Raw string (could be JSON)
                "cost": cost,
                "category": category,
                "metrics": {
                    "rag_score": round(max_score * 100, 1),
                    "modelling_score": round(avg_score * 100, 1)
                },
                "timestamp": time.time()
            })
        except Exception as e:
            print(f"Error storing Guruji conversation: {e}")

        return {
            "answer": final_answer,
            "amount": cost,
            "flag": category,
            "assistant": "guruji",
            "wallet_balance": current_balance,
            "context": clean_chunks,
            "metrics": {
                "rag_score": round(max_score * 100, 1),
                "modelling_score": round(avg_score * 100, 1)
            },
            "maya_json": maya_res,
            "guruji_json": guruji_json
        }
        
    except Exception as e:
        import traceback
        print(f"ERROR in chat: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class EndChatRequest(BaseModel):
    mobile: str
    history: list
    session_id: Optional[str] = None

@router.post("/end-chat")
async def end_chat(request: EndChatRequest):
    try:
        from rag_modules.chat_handler import generate_with_openai
        
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
            chats_col.update_one(
                {"session_id": request.session_id},
                {
                    "$set": {
                        "mobile": request.mobile,
                        "session_id": request.session_id,
                        "summary": summary,
                        "timestamp": time.time()
                    }
                },
                upsert=True
            )
            print(f"DEBUG: Saved summary for session {request.session_id}")
        except Exception as db_err:
            print(f"DEBUG: Failed to save summary to DB: {db_err}")
            
        return {"summary": summary}
        
    except Exception as e:
        print(f"ERROR in end-chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{mobile}")
async def get_history(mobile: str):
    """
    Retrieve conversation history for a user, grouped by session.
    """
    try:
        conv_col = get_db_collection("conversation_history")
        # Find all messages for this mobile, sorted by timestamp
        cursor = conv_col.find({"mobile": mobile}).sort("timestamp", 1)
        
        sessions = {} # session_id -> {topic, timestamp, messages: []}
        
        for doc in cursor:
            role = doc.get("role")
            sid = doc.get("session_id") or "legacy"
            
            msg_obj = {
                "role": "user" if role == "user" else "assistant",
                "content": doc.get("message"),
                "timestamp": doc.get("timestamp")
            }
            
            # Add assistant specific fields
            if role == "maya":
                msg_obj["assistant"] = "maya"
                msg_obj["category"] = doc.get("category")
            elif role == "guruji":
                msg_obj["assistant"] = "guruji"
                msg_obj["metrics"] = doc.get("metrics")
                msg_obj["cost"] = doc.get("cost")
            
            if sid not in sessions:
                # Initialize new session group
                sessions[sid] = {
                    "session_id": sid,
                    "topic": "Consultation",
                    "timestamp": doc.get("timestamp"),
                    "messages": []
                }
            
            # Use first user message as topic if still default
            if role == "user" and sessions[sid]["topic"] == "Consultation":
                topic_text = doc.get("message", "")[:50]
                if len(doc.get("message", "")) > 50: topic_text += "..."
                sessions[sid]["topic"] = topic_text

            sessions[sid]["messages"].append(msg_obj)
            
        # Convert to list and sort by session's latest message or start time
        history_list = list(sessions.values())
        history_list.sort(key=lambda x: x["timestamp"], reverse=True)
            
        return {"sessions": history_list}
        
    except Exception as e:
        print(f"ERROR in get_history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    try:
        feedback_col = get_db_collection("feedback")
        feedback_col.insert_one({
            "mobile": request.mobile,
            "session_id": request.session_id,
            "rating": request.rating,
            "feedback": request.feedback,
            "timestamp": time.time()
        })
        return {"status": "success", "message": "Feedback submitted successfully"}
    except Exception as e:
        print(f"ERROR in submit_feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


