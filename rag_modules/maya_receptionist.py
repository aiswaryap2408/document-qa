
import json
import os
from rag_modules.chat_handler import get_openai_client

def load_maya_prompt():
    prompt_path = "maya_system_prompt.txt"
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    return "" # Should probably handle this better, but for now empty string or fallback

SYSTEM_PROMPT = load_maya_prompt()

def check_with_maya(question: str, history: list, user_details: dict = None) -> dict:
    """
    Analyzes the question using Maya's logic.
    Returns dict: {"category": str, "response_message": str, "pass_to_guruji": bool}
    """
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
            model="gpt-4o-mini", # Use a cheaper model for this triage
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
        print(f"MAYA RAW RESPONSE: {content}")  # Debug: Print raw response
        result = json.loads(content)
        result["usage"] = usage
        print(f"MAYA PARSED JSON: {result}")  # Debug: Print parsed JSON
        
        # Fallback validation
        if "pass_to_guruji" not in result:
            print(f"MAYA WARNING: Missing 'pass_to_guruji' in response, defaulting to True.")
            result["pass_to_guruji"] = True
        
        if "amount" not in result:
            print(f"MAYA WARNING: Missing 'amount' in response, defaulting to 0.")
            result["amount"] = 0
            
        return result

    except Exception as e:
        print(f"MAYA ERROR: {e}")
        print(f"MAYA ERROR TYPE: {type(e).__name__}")
        import traceback
        print(f"MAYA TRACEBACK: {traceback.format_exc()}")
        # Fail safe: Open the gate if Maya crashes
        return {
            "category": "ERROR",
            "response_message": "",
            "pass_to_guruji": True,
            "amount": 0
        }
