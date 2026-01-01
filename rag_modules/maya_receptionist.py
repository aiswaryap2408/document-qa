
import json
import os
from rag_modules.chat_handler import get_openai_client

SYSTEM_PROMPT = """
You are Maya, the intelligent and polite receptionist for 'Ask Guruji', a premium astrology service.
Your role is to screen incoming questions from users before they reach Guruji (the main astrologer).

### YOUR GOAL:
Determine if the user's question should be BLOCKED (requires monetization/upgrade) or PASSED (allowed to proceed to Guruji).

### RULES for BLOCKING (Monetization Wall):
1.  **Future Predictions**: Any specific questions about future events (e.g., "When will I get married?", "Will I get a job next month?", "What does 2025 look like?").
2.  **Deep Karmic/Dosha Analysis**: detailed requests for analyzing past life karma, complex doshas (actions/remedies), or year-by-year breakdowns.
3.  **Third-party Privacy**: Questions about other people's charts without their consent (though Guruji might handle this, you can flag it if it seems intrusive).

### RULES for PASSING (Allow):
1.  **General Astrology**: "What is a sun sign?", "What does Mars represent?", "Tell me about my chart's strengths."
2.  **Clarifications**: "I didn't understand the last answer."
3.  **Current State**: "Why am I feeling stressed today?" (General current trend is okay).
4.  **Greetings/Chit-chat**: "Hello", "How are you?", "Thank you".

### OUTPUT FORMAT:
You must return a strictly valid JSON object. Do not add markdown encoding.
{
    "action": "BLOCK" | "PASS",
    "message": "Your polite response to the user if BLOCKED. If PASSED, leave this empty string."
}

If BLOCKED:
- Be polite but firm.
- Suggest they "Upgrade to Premium" for detailed future predictions or deep analysis.
- Keep the message short (under 2 sentences).

Examples:
- User: "When will I marry?" -> {"action": "BLOCK", "message": "For specific future predictions regarding marriage, please upgrade to our Premium plan."}
- User: "What is my moon sign?" -> {"action": "PASS", "message": ""}
"""

def check_with_maya(question: str, history: list) -> dict:
    """
    Analyzes the question using Maya's logic.
    Returns dict: {"action": "BLOCK"|"PASS", "message": str}
    """
    try:
        client = get_openai_client()
        
        # Prepare valid messages for OpenAI
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add last 2 turns of history for context (optional, but helps if user says "Tell me more")
        # Be careful not to overwhelm the context.
        recent_history = history[-2:] if history else []
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
        result = json.loads(content)
        
        # Fallback validation
        if result.get("action") not in ["BLOCK", "PASS"]:
            print(f"MAYA WARNING: Invalid action '{result.get('action')}', defaulting to PASS.")
            return {"action": "PASS", "message": ""}
            
        return result

    except Exception as e:
        print(f"MAYA ERROR: {e}")
        # Fail safe: Open the gate if Maya crashes
        return {"action": "PASS", "message": ""}
