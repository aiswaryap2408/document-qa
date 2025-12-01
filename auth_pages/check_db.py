from pymongo import MongoClient
import os

# Connect to MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client["auth_db"]
users_collection = db["users"]

def list_users():
    print(f"Connected to database: {db.name}")
    print(f"Collection: {users_collection.name}")
    
    count = users_collection.count_documents({})
    print(f"Total users found: {count}")
    print("-" * 30)
    
    users = users_collection.find()
    for user in users:
        print(f"ID: {user['_id']}")
        print(f"Email: {user['email']}")
        print(f"Password Hash: {user['password_hash']}")
        print("-" * 30)

if __name__ == "__main__":
    list_users()
