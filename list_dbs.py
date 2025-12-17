
from pymongo import MongoClient
import os

def list_all_dbs():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    print(f"Connecting to: {uri}")
    client = MongoClient(uri)
    
    try:
        dbs = client.list_database_names()
        print("\nDatabases found:")
        for db_name in dbs:
            print(f" - {db_name}")
            db = client[db_name]
            cols = db.list_collection_names()
            for col in cols:
                count = db[col].count_documents({})
                print(f"   |-- {col} ({count} documents)")
    except Exception as e:
        print(f"Error listing databases: {e}")

if __name__ == "__main__":
    list_all_dbs()
