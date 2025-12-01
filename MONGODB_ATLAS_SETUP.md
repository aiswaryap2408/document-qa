# MongoDB Atlas Setup Guide (Free Tier)

## Why MongoDB Atlas?

For **Streamlit Cloud deployment**, you MUST use MongoDB Atlas (or another cloud MongoDB service) because:
- Streamlit Cloud can't connect to your local MongoDB
- The free M0 tier gives you 512 MB storage (plenty for most apps)
- It's free forever, no credit card required

## Step-by-Step Setup (5 minutes)

### 1. Create Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub (fastest) or email
3. Choose **"Free Shared"** tier (M0)

### 2. Create Your First Cluster

1. After signup, click **"Build a Database"**
2. Choose **"M0 FREE"** tier
   - ✅ 512 MB storage
   - ✅ Shared RAM
   - ✅ No credit card needed
3. Select a cloud provider:
   - **AWS** (recommended - most regions)
   - Region: Choose closest to you (e.g., Mumbai for India)
4. Cluster Name: Leave as `Cluster0` or rename to `rag-chatbot`
5. Click **"Create"**

⏱️ Wait 1-3 minutes for cluster creation

### 3. Create Database User

1. Click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication Method: **"Password"**
4. Username: `raguser` (or any name)
5. Password: Click **"Autogenerate Secure Password"** → **Copy it!**
   - Save this password somewhere safe
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 4. Allow Network Access

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0`
   - ✅ Safe because you still need username/password
4. Click **"Confirm"**

### 5. Get Connection String

1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Python**, Version: **3.12 or later**
5. Copy the connection string:

```
mongodb+srv://raguser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. **Replace `<password>`** with the password you saved in Step 3

Example final string:
```
mongodb+srv://raguser:MySecurePass123@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority
```

### 6. Add to Streamlit Secrets

When deploying to Streamlit Cloud:

1. Go to your app settings
2. Secrets section
3. Add:

```toml
MONGODB_URI = "mongodb+srv://raguser:YourPassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
OPENAI_API_KEY = "sk-..."
GEMINI_API_KEY = "..."
```

### 7. Test Locally (Optional)

Create a `.env` file in your project:

```env
MONGODB_URI=mongodb+srv://raguser:YourPassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

Then run:
```bash
streamlit run streamlit_app.py
```

## Free Tier Limits

| Resource | M0 Free Tier |
|----------|--------------|
| Storage | 512 MB |
| RAM | Shared |
| Connections | 500 concurrent |
| Backups | Not included |
| Uptime | 99.9% SLA |

**Is 512 MB enough?**
- ✅ User accounts: ~1 KB each = **500,000 users**
- ✅ Document metadata: ~5 KB each = **100,000 documents**
- ✅ For most apps, you'll use **< 50 MB**

## Troubleshooting

### "Authentication failed"
- Check your password (no `<` `>` brackets)
- Verify username matches

### "Connection timeout"
- Check Network Access allows `0.0.0.0/0`
- Wait 2-3 minutes after adding IP

### "Database not found"
- Normal! Database is created automatically on first write
- Just run your app and sign up a user

## Security Best Practices

✅ **Do:**
- Use strong passwords
- Keep connection string in `.env` (local) and Secrets (cloud)
- Add `.env` to `.gitignore`

❌ **Don't:**
- Commit connection strings to GitHub
- Share your password publicly
- Use weak passwords

## Cost

**M0 Tier: FREE FOREVER**
- No credit card required
- No automatic upgrades
- Perfect for learning and small projects

If you outgrow 512 MB (unlikely), you can upgrade to:
- M2: $9/month (2 GB)
- M5: $25/month (5 GB)

## Next Steps

1. ✅ Create MongoDB Atlas account
2. ✅ Get connection string
3. ✅ Add to Streamlit secrets
4. ✅ Deploy your app!

Your app will now work on Streamlit Cloud! 🎉
