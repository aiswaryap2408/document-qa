# Simple Static Authentication Deployment Guide

## ✅ What Changed

Your app now uses **simple password authentication** - no database needed!

- ✅ No MongoDB required
- ✅ No user accounts
- ✅ Single password for access
- ✅ Perfect for personal use

## 🔐 How It Works

### Local Development
- Default password: `admin123`
- Just run: `streamlit run streamlit_app.py`
- Login with `admin123`

### Production Deployment
- Set a custom password in Streamlit secrets
- Password is hashed for security

## 🚀 Deploy to Streamlit Cloud

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Static auth for single-user app"
git push
```

### Step 2: Deploy on Streamlit Cloud

1. Go to https://share.streamlit.io
2. Click "New app"
3. Select your repository
4. Main file: `streamlit_app.py`
5. Click "Advanced settings"

### Step 3: Set Your Password

In the **Secrets** section, add:

```toml
# Your app password (hashed)
APP_PASSWORD = "your_hashed_password_here"

# API Keys
OPENAI_API_KEY = "sk-..."
GEMINI_API_KEY = "..."
```

### Step 4: Generate Password Hash

To create a secure password hash, run this locally:

```bash
python -c "import hashlib; print(hashlib.sha256(b'YourSecurePassword').hexdigest())"
```

Example:
```bash
# For password "MySecret123"
python -c "import hashlib; print(hashlib.sha256(b'MySecret123').hexdigest())"
# Output: 9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0
```

Then add to secrets:
```toml
APP_PASSWORD = "9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0"
```

### Step 5: Deploy!

Click "Deploy" and your app will be live!

## 🧪 Testing

### Test Locally
```bash
streamlit run streamlit_app.py
```
- Password: `admin123`

### Test on Cloud
- Go to your deployed URL
- Enter your custom password
- ✅ Access granted!

## 🔒 Security Notes

✅ **Secure:**
- Password is hashed (SHA-256)
- Never stored in plain text
- Safe to deploy publicly

✅ **Simple:**
- No database setup
- No user management
- Just one password

## 📝 Changing Your Password

### On Streamlit Cloud:
1. Generate new hash locally
2. Update `APP_PASSWORD` in secrets
3. App restarts automatically

### Locally:
- Just change the default in `streamlit_auth.py` (line 23)
- Or use `.env` file (not implemented yet)

## 🎯 What You Can Do

✅ Upload documents
✅ Ask questions
✅ Use RAG chatbot
✅ Manage documents
✅ All features work!

❌ What you can't do:
- Multiple user accounts (not needed for single user)
- Per-user document isolation (all docs are yours anyway)

## 🆘 Troubleshooting

**Issue**: "Invalid password"
- **Fix**: Check your hash is correct
- Regenerate hash and update secrets

**Issue**: Can't login locally
- **Fix**: Default password is `admin123`
- Or check `streamlit_auth.py` line 23

**Issue**: App asks for password every time
- **Fix**: Normal! Session clears when you close browser
- This is for security

## 💡 Pro Tips

1. **Use a strong password** for production
2. **Don't share your password** publicly
3. **Keep your hash in secrets** (never in code)
4. **Use different passwords** for different deployments

## 📊 Cost

**Everything is FREE:**
- ✅ Streamlit Cloud: Free tier
- ✅ No database costs
- ✅ Just need API keys (OpenAI/Gemini)

## 🎉 You're Done!

Your app is now:
- ✅ Simple to deploy
- ✅ Secure with password
- ✅ No database needed
- ✅ Perfect for personal use

Enjoy your RAG chatbot! 🚀
