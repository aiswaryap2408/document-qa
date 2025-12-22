import os
from pymongo import MongoClient

# -------------------------------------------------------------------
# MongoDB Connection
# -------------------------------------------------------------------
# We keep @st.cache_resource for now if used in Streamlit, 
# but for pure backend we might want a singleton pattern.
# To support BOTH, we can check if running in Streamlit or just return standard client.
# For this migration step, we'll keep it compatible with Streamlit caching.

# Global client to reuse connection
_client = None

def get_db_collection(collection_name="users"):
    global _client
    # Use environment variable or default local
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    if _client is None:
        _client = MongoClient(uri)
    
    db = _client["auth_db"]
    return db[collection_name]
