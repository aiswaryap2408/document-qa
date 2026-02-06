
import json
import os
from rag_modules.chat_handler import get_openai_client
from pydantic import BaseModel, Field, ValidationError

def load_maya_prompt():
    prompt_path = "maya_system_prompt.txt"
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    return "" 

def check_with_maya(question: str, history: list, user_details: dict = None) -> dict:
    """
    Analyzes the question using Maya's logic.
    Returns dict from JSON: {"response_message": str, "pass_to_guruji": bool, ...}
    """
    SYSTEM_PROMPT = load_maya_prompt() # Reload prompt on every request
    print(f"DEBUG: LOADED PROMPT LENGTH: {len(SYSTEM_PROMPT)}")
    try:
        client = get_openai_client()
        
        # Prepare valid messages for OpenAI
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Inject User Context if available
        if user_details:
            user_context = (
                f"Current User Details:\n"
                f"Name: {user_details.get('name', 'Unknown')}\n"
                f"Date of Birth: {user_details.get('dob', 'Unknown')}\n"
                f"Time of Birth: {user_details.get('tob', 'Unknown')}\n"
                f"Place of Birth: {user_details.get('pob', 'Unknown')}\n"
                f"Gender: {user_details.get('gender', 'Unknown')}\n"
                f"Chart Style: {user_details.get('chart_style', 'Unknown')}\n"
                f"Note: The user is already registered with these details. Do NOT ask for them again."
            )
            messages.append({"role": "system", "content": user_context})

        # Add last 2 turns of history for context
        recent_history = history[-3:] if history else []
        for msg in recent_history:
             messages.append({"role": msg["role"], "content": msg["content"]})
             
        messages.append({"role": "user", "content": question})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        print(f"MAYA RAW RESPONSE: {content}")
        
        try:
            result = json.loads(content)
            # Ensure pass_to_guruji defaults to True if missing
            if "pass_to_guruji" not in result:
                result["pass_to_guruji"] = True
        except json.JSONDecodeError as e:
            print(f"MAYA JSON ERROR: {e}. Fallback to default.")
            result = {
                "response_message": "",
                "pass_to_guruji": True
            }

        print(f"MAYA FINAL JSON: {result}")
        return result

    except Exception as e:
        print(f"MAYA ERROR: {e}")
        import traceback
        print(f"MAYA TRACEBACK: {traceback.format_exc()}")
        # Fail safe
        return {
            "response_message": "",
            "pass_to_guruji": True
        }
