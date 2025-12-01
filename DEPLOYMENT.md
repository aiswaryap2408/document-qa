# Streamlit Cloud Deployment Guide

## What Changed

I've updated your authentication system to work on Streamlit Cloud by:

1. **Removed Flask dependency** - The Flask server can't run on Streamlit Cloud
2. **Built-in authentication** - Login/signup forms are now directly in Streamlit
3. **Environment-based MongoDB** - Uses `MONGODB_URI` from secrets

## Deployment Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Updated auth for Streamlit Cloud deployment"
git push
```

### 2. Deploy on Streamlit Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Click "New app"
3. Select your GitHub repository
4. Set **Main file path** to: `streamlit_app.py`
5. Click "Advanced settings"

### 3. Configure Secrets

In the "Secrets" section, add:

```toml
# MongoDB Connection (Required)
# Option A: MongoDB Atlas (Recommended for production)
MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"

# Option B: MongoDB Cloud Service (like MongoDB Atlas)
# Get this from your MongoDB Atlas dashboard

# API Keys
OPENAI_API_KEY = "sk-..."
GEMINI_API_KEY = "..."

# Optional: Flask secrets (not needed anymore, but won't hurt)
FLASK_SECRET_KEY = "your-secret-key"
JWT_SECRET = "your-jwt-secret"
```

### 4. Set Up MongoDB Atlas (Free Tier)

Since Streamlit Cloud can't connect to your local MongoDB:

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a free cluster (M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Add this to Streamlit secrets as `MONGODB_URI`

### 5. Network Access

In MongoDB Atlas:
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
   - This is safe because authentication is still required

### 6. Deploy!

Click "Deploy" and your app will be live!

## Testing Locally

Your app still works locally! Just make sure:

1. MongoDB is running locally
2. `.env` file has your API keys
3. Run: `streamlit run streamlit_app.py`

You no longer need to run the Flask server (`python -m auth_pages.app`).

## What You Can Remove

These files are no longer needed for deployment:
- `auth_pages/app.py` (Flask server)
- `auth_pages/sign_in.html`
- `auth_pages/sign_up.html`

But keep them if you want to run Flask locally for any reason.

## Troubleshooting

**Issue**: "No module named 'pymongo'"
- **Fix**: Add `pymongo` to `requirements.txt`

**Issue**: "Authentication error"
- **Fix**: Check MongoDB Atlas connection string in secrets

**Issue**: "Can't connect to MongoDB"
- **Fix**: Verify Network Access settings in MongoDB Atlas
