from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def setup_indexes():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "astrology_db")
    client = MongoClient(mongo_uri)
    db = client[db_name]

    collections_to_index = ["users", "otps", "reports", "summaries"]
    
    print(f"Connecting to DB: {db_name}")

    for coll_name in collections_to_index:
        coll = db[coll_name]
        print(f"Applying Unique Index on 'mobile' for '{coll_name}'...")
        try:
            # Create a unique index on mobile
            coll.create_index("mobile", unique=True)
            print(f"  - SUCCESS: Unique index applied to {coll_name}")
        except Exception as e:
            print(f"  - ERROR applying index to {coll_name}: {e}")

    # For chats, we need an index on mobile, but NOT unique (since one user has many chats)
    print("Applying Index on 'mobile' for 'chats'...")
    try:
        db["chats"].create_index("mobile")
        print("  - SUCCESS: Index applied to chats")
    except Exception as e:
        print(f"  - ERROR applying index to chats: {e}")

    print("\nDatabase setup complete! 🚀")

if __name__ == "__main__":
    setup_indexes()
