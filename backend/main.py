import os
from dotenv import load_dotenv
load_dotenv() # Load environment variables as early as possible

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.auth_routes import router as auth_router
from backend.admin_routes import router as admin_router
from backend.places_routes import router as places_router
from backend.wallet_routes import router as wallet_router

app = FastAPI(
    title="Astrology Bot API",
    description="Backend for Astrology RAG Chatbot",
    version="1.0.0"
)

# CORS Configuration (Enable requests from React frontend)
# cors_origins_str = os.getenv("CORS_ALLOWED_ORIGINS", "")
# if cors_origins_str:
#     origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
# else:
origins = ["http://localhost:5173/"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(places_router)
app.include_router(wallet_router)

@app.get("/")
async def root():
    return {"message": "Astrology Bot API is running!"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("backend.main:app", host="0.0.0.0", port=8088, reload=True)
