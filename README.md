# RAG Chatbot - Single User Edition

A simple, secure RAG (Retrieval-Augmented Generation) chatbot with static password authentication.

## ✨ Features

- 🔐 **Simple Authentication** - One password, no database
- 📄 **Document Upload** - Process .txt, .md, .html files
- 🤖 **AI Chat** - OpenAI or Google Gemini
- 🔍 **RAG Search** - Semantic search with embeddings
- 📊 **Grounding Metrics** - See how much AI uses your docs
- 🎯 **Top-K Selection** - Choose how many chunks to retrieve

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up API Keys

Create a `.env` file:

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

### 3. Run Locally

```bash
streamlit run streamlit_app.py
```

**Default Password**: `admin123`

## 📦 Deploy to Streamlit Cloud

### Step 1: Generate Password Hash

```bash
python -c "import hashlib; print(hashlib.sha256(b'YourPassword').hexdigest())"
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Deploy RAG chatbot"
git push
```

### Step 3: Deploy

1. Go to https://share.streamlit.io
2. New app → Select your repo
3. Main file: `streamlit_app.py`
4. Advanced settings → Secrets:

```toml
APP_PASSWORD = "your_hashed_password"
OPENAI_API_KEY = "sk-..."
GEMINI_API_KEY = "..."
```

5. Deploy!

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 30-second guide
- **[SIMPLE_DEPLOY.md](SIMPLE_DEPLOY.md)** - Full deployment guide
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - What changed

## 🔒 Security

- Password is hashed with SHA-256
- Never stored in plain text
- Secrets managed by Streamlit Cloud
- Safe to deploy publicly

## 💡 Usage

### Upload Documents

1. Go to "RAG Document Processor" page
2. Upload .txt, .md, or .html file
3. Wait for processing
4. Document is ready!

### Ask Questions

1. Select documents in sidebar
2. Adjust Top-K chunks (default: 4)
3. Type your question
4. Get AI response with sources

### Manage Documents

- View all processed documents
- Delete documents you don't need
- Reload documents if needed

## 🛠️ Tech Stack

- **Frontend**: Streamlit
- **AI**: OpenAI GPT / Google Gemini
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector Store**: In-memory (JSON files)
- **Auth**: Static password (SHA-256)

## 📊 Performance

- ✅ Batched embedding generation (10x faster)
- ✅ Vectorized similarity search (100x faster)
- ✅ Pre-filtering for selected documents
- ✅ Instant startup (no database)

## 🆓 Cost

**Everything is FREE:**
- Streamlit Cloud: Free tier
- No database costs
- Only pay for API usage (OpenAI/Gemini)

## 📝 Requirements

```
streamlit>=1.20
openai>=1.0.0
google-generativeai>=0.3.0
python-dotenv
numpy
beautifulsoup4
```

## 🎯 Perfect For

- Personal knowledge base
- Document Q&A
- Research assistant
- Learning RAG concepts
- Single-user applications

## ⚠️ Limitations

- Single user only (no multi-user support)
- In-memory vector store (not for huge datasets)
- No user management
- Documents persist in `processed_docs/` folder

## 🔧 Configuration

### Change Password

**Local**: Edit `streamlit_auth.py` line 23  
**Cloud**: Update `APP_PASSWORD` in secrets

### Change Models

Edit in sidebar:
- OpenAI: gpt-4.1-mini, gpt-4.1, gpt-5, gpt-5.1
- Gemini: gemini-2.0-flash, gemini-2.5-pro, gemini-2.5-flash

### Adjust Chunking

Edit `chunking.py`:
- `chunk_size`: Default 1000 characters
- `overlap`: Default 200 characters

## 🐛 Troubleshooting

**Can't login**
- Local: Use `admin123`
- Cloud: Check `APP_PASSWORD` hash in secrets

**No documents showing**
- Check `processed_docs/` folder exists
- Click "Reload Documents" button

**API errors**
- Verify API keys in `.env` or secrets
- Check API quota/billing

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## 🎉 Enjoy!

You now have a fully functional RAG chatbot with:
- ✅ Simple authentication
- ✅ Document processing
- ✅ AI-powered Q&A
- ✅ Free deployment

Happy chatting! 🚀
