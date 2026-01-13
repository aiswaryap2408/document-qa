import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
# Attempt to load from parent directory if run from backend/, otherwise current
if os.path.exists(".env"):
    load_dotenv(".env")
elif os.path.exists("../.env"):
    load_dotenv("../.env")

def migrate():
    print("--- Starting Migration: Local -> Cloud ---")

    # 1. Local Connection
    local_uri = "mongodb://localhost:27017/"
    try:
        local_client = MongoClient(local_uri)
        # Check connection
        local_client.admin.command('ping')
        local_db = local_client["auth_db"]
        print("✅ Connected to Local MongoDB")
    except Exception as e:
        print(f"❌ Failed to connect to Local MongoDB: {e}")
        return

    # 2. Cloud Connection
    cloud_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "auth_db")
    
    if not cloud_uri:
        print("❌ Error: MONGODB_URI not found in environment variables.")
        return

    try:
        if "localhost" in cloud_uri or "127.0.0.1" in cloud_uri:
             cloud_client = MongoClient(cloud_uri)
        else:
             cloud_client = MongoClient(cloud_uri, tlsCAFile=certifi.where())
        
        # Check connection
        cloud_client.admin.command('ping')
        cloud_db = cloud_client[db_name]
        print(f"✅ Connected to Cloud MongoDB ({db_name})")
    except Exception as e:
        print(f"❌ Failed to connect to Cloud MongoDB: {e}")
        return

    # 3. Migrate Collections
    collections = local_db.list_collection_names()
    print(f"\nFound {len(collections)} collections to migrate: {collections}")

    for col_name in collections:
        try:
            print(f"\nProcessing '{col_name}'...")
            local_col = local_db[col_name]
            cloud_col = cloud_db[col_name]

            # Fetch all documents
            documents = list(local_col.find())
            if not documents:
                print(f"  - Skipping empty collection.")
                continue

            print(f"  - Found {len(documents)} documents.")
            
            # Insert documents
            # we use ordered=False to continue even if some docs (like _id duplicates) fail
            try:
                result = cloud_col.insert_many(documents, ordered=False)
                print(f"  - ✅ Successfully inserted {len(result.inserted_ids)} documents.")
            except Exception as bulk_err:
                # insert_many raises BulkWriteError if any error occurs
                # We can check how many were inserted
                inserted_count = bulk_err.details['nInserted']
                print(f"  - ⚠️ Partial input or duplicates: Inserted {inserted_count} new documents.")
                
        except Exception as e:
            print(f"  - ❌ Error migrating collection '{col_name}': {e}")

    print("\n--- Migration Completed ---")

if __name__ == "__main__":
    migrate()
