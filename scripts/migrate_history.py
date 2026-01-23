import os
import time
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "astrology_guruji")

def migrate_history():
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    chats_col = db["chats"]
    conv_history_col = db["conversation_history"]
    
    legacy_chats = list(chats_col.find())
    print(f"Found {len(legacy_chats)} legacy chat documents.")
    
    migrated_count = 0
    duplicate_count = 0
    
    for lc in legacy_chats:
        mobile = lc.get("mobile")
        session_id = lc.get("session_id")
        timestamp = lc.get("timestamp", time.time())
        user_message = lc.get("user_message")
        bot_response = lc.get("bot_response")
        
        # Check if user message already exists
        user_msg_exists = conv_history_col.find_one({
            "mobile": mobile,
            "role": "user",
            "message": user_message,
            "timestamp": timestamp
        })
        
        if not user_msg_exists and user_message:
            conv_history_col.insert_one({
                "mobile": mobile,
                "session_id": session_id,
                "role": "user",
                "message": user_message,
                "timestamp": timestamp - 0.001 # Slightly earlier
            })
            migrated_count += 1
        else:
            duplicate_count += 1
            
        # Check if bot response already exists
        bot_msg_exists = conv_history_col.find_one({
            "mobile": mobile,
            "role": "guruji", # Treat legacy bot as guruji for now or 'bot'
            "message": bot_response,
            "timestamp": timestamp
        })
        
        if not bot_msg_exists and bot_response:
            conv_history_col.insert_one({
                "mobile": mobile,
                "session_id": session_id,
                "role": "guruji",
                "message": bot_response,
                "timestamp": timestamp
            })
            migrated_count += 1
        else:
            duplicate_count += 1
            
    print(f"Migration complete. {migrated_count} messages migrated. {duplicate_count} duplicates skipped.")

if __name__ == "__main__":
    migrate_history()
