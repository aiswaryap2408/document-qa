from backend.db import get_db_collection

def get_setting(key: str, default=None):
    col = get_db_collection("system_settings")
    doc = col.find_one({"_id": key})
    return doc["value"] if doc else default

def set_setting(key: str, value):
    col = get_db_collection("system_settings")
    col.update_one(
        {"_id": key},
        {"$set": {"value": value}},
        upsert=True
    )