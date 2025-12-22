import os
from dotenv import load_dotenv
load_dotenv() # Load environment variables as early as possible

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.auth_routes import router as auth_router

app = FastAPI(
    title="Astrology Bot API",
    description="Backend for Astrology RAG Chatbot",
    version="1.0.0"
)

# CORS Configuration (Enable requests from React frontend)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Astrology Bot API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8088, reload=True)
