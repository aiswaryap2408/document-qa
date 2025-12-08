import os
from dotenv import load_dotenv
import google.generativeai as genai
from openai import OpenAI

load_dotenv()

print("Testing Connectivity...")

# Test OpenAI
openai_key = os.getenv("OPENAI_API_KEY")
if not openai_key:
    print("❌ OPENAI_API_KEY not found in environment.")
else:
    print(f"✅ OPENAI_API_KEY found: {openai_key[:5]}...")
    try:
        client = OpenAI(api_key=openai_key)
        client.models.list()
        print("✅ OpenAI API connection successful.")
    except Exception as e:
        print(f"❌ OpenAI API connection failed: {e}")

# Test Gemini
gemini_key = os.getenv("GEMINI_API_KEY")
if not gemini_key:
    print("❌ GEMINI_API_KEY not found in environment.")
else:
    print(f"✅ GEMINI_API_KEY found: {gemini_key[:5]}...")
    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Hello")
        print("✅ Gemini API connection successful.")
    except Exception as e:
        print(f"❌ Gemini API connection failed: {e}")
