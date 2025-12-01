# 🎯 Quick Start - Static Auth

## Local Testing (Right Now!)

```bash
streamlit run streamlit_app.py
```

**Password**: `admin123`

## Deploy to Cloud (5 minutes)

### 1. Generate Your Password Hash

```bash
python -c "import hashlib; print(hashlib.sha256(b'YourPassword').hexdigest())"
```

### 2. Push to GitHub

```bash
git add .
git commit -m "Deploy with static auth"
git push
```

### 3. Deploy on Streamlit

1. Go to https://share.streamlit.io
2. New app → Select repo → `streamlit_app.py`
3. Advanced → Secrets:

```toml
APP_PASSWORD = "your_hash_here"
OPENAI_API_KEY = "sk-..."
GEMINI_API_KEY = "..."
```

4. Deploy!

## That's It! ✅

- No database needed
- No MongoDB setup
- Just one password
- Free forever

---

**Default local password**: `admin123`  
**Hash**: `240be518faaa2cd61c80c08c8fa822809f74c720a9`
