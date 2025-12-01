# Quick Deployment Checklist

## ✅ What I Fixed

- ✅ Removed Flask server dependency
- ✅ Built authentication directly into Streamlit
- ✅ Updated requirements.txt for cloud deployment
- ✅ Made MongoDB connection use environment variables

## 🚀 Deploy to Streamlit Cloud

### Step 1: MongoDB Atlas Setup (5 minutes)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account → Create free cluster (M0)
3. Database Access → Add user (username + password)
4. Network Access → Add IP → "Allow from anywhere"
5. Clusters → Connect → "Connect your application"
6. Copy connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/...`)

### Step 2: Streamlit Cloud Deploy
1. Go to https://share.streamlit.io
2. New app → Select your repo
3. Main file: `streamlit_app.py`
4. Advanced settings → Secrets:

```toml
MONGODB_URI = "mongodb+srv://YOUR_CONNECTION_STRING"
OPENAI_API_KEY = "sk-..."
GEMINI_API_KEY = "..."
```

5. Click Deploy!

## 🧪 Test Locally

You can still test locally without the Flask server:

```bash
# Make sure MongoDB is running locally
streamlit run streamlit_app.py
```

The login form will appear directly in Streamlit!

## 📝 Notes

- **No Flask server needed** - Authentication is now in Streamlit
- **Works offline** - Uses local MongoDB if `MONGODB_URI` not set
- **Secure** - Passwords are hashed with bcrypt
- **User documents** - Each user only sees their uploaded documents
