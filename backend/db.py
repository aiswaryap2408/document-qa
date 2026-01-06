import os
from pymongo import MongoClient
import certifi

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
        # Cosmos DB (and many cloud Mongo providers) requires SSL with valid certs
        # certifi.where() provides a robust set of CA credentials
        if "localhost" in uri or "127.0.0.1" in uri:
            _client = MongoClient(uri)
        else:
            _client = MongoClient(uri, tlsCAFile=certifi.where())
    
    db_name = os.getenv("MONGODB_DB_NAME", "auth_db")
    db = _client[db_name]
    return db[collection_name]
