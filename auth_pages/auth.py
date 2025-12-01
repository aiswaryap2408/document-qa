import os
import bcrypt
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

# Load MongoDB connection string from environment variable
# Load MongoDB connection string from environment variable, default to local instance
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")

client = MongoClient(MONGODB_URI)
# Use a database named 'auth_db' and collection 'users'
_db = client["auth_db"]
users_collection = _db["users"]
# Ensure email uniqueness
users_collection.create_index("email", unique=True)

def _hash_password(password: str) -> bytes:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

def _check_password(password: str, hashed: bytes) -> bool:
    """Verify a plaintext password against the stored hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed)

def create_user(email: str, password: str) -> dict:
    """Create a new user document in MongoDB.

    Returns the inserted document (without the password hash) on success.
    Raises DuplicateKeyError if the email already exists.
    """
    password_hash = _hash_password(password)
    user_doc = {
        "email": email,
        "password_hash": password_hash,
    }
    try:
        result = users_collection.insert_one(user_doc)
    except DuplicateKeyError:
        raise ValueError("User with this email already exists")
    # Return a safe representation
    return {"_id": str(result.inserted_id), "email": email}

def authenticate_user(email: str, password: str) -> bool:
    """Check credentials for a given email/password pair.

    Returns True if authentication succeeds, False otherwise.
    """
    user = users_collection.find_one({"email": email})
    if not user:
        return False
    return _check_password(password, user["password_hash"])

def get_user(email: str) -> dict | None:
    """Retrieve a user document without the password hash."""
    user = users_collection.find_one({"email": email}, {"password_hash": 0})
    if user:
        user["_id"] = str(user["_id"])
    return user

def add_user_document(email: str, doc_filename: str) -> bool:
    """Add a processed document filename to the user's profile."""
    result = users_collection.update_one(
        {"email": email},
        {"$addToSet": {"documents": doc_filename}}
    )
    return result.modified_count > 0

def get_user_documents(email: str) -> list[str]:
    """Retrieve the list of document filenames associated with a user."""
    user = users_collection.find_one({"email": email}, {"documents": 1})
    if user and "documents" in user:
        return user["documents"]
    return []


