# 3-Layer RAG Architecture

This document defines the system architecture using a standard 3-layer model, separating concerns into Presentation, Application Logic, and Data/Intelligence.

## 🏗️ Architecture Diagram

```mermaid
graph TD
    subgraph "Layer 1: Presentation (Frontend)"
        UI[🖥️ Streamlit Interface]
        AuthUI[🔐 Login Form]
        ChatUI[💬 Chat Window]
        DocUI[📂 Document Manager]
    end

    subgraph "Layer 2: Application (Business Logic)"
        Orchestrator[⚙️ App Orchestrator]
        RAG[🧠 RAG Engine]
        Chunker[✂️ Text Processor]
        AuthLogic[🛡️ Auth Handler]
    end

    subgraph "Layer 3: Data & Intelligence (Infrastructure)"
        Vectors[(🔢 Vector Store)]
        Docs[(📄 File System)]
        Models[☁️ AI Models (OpenAI/Gemini)]
    end

    %% Connections
    UI <--> Orchestrator
    AuthUI --> AuthLogic
    DocUI --> Chunker
    
    Orchestrator <--> RAG
    RAG <--> Models
    RAG <--> Vectors
    Chunker --> Vectors
    Chunker --> Docs
    
    %% Styling
    style UI fill:#e1f5fe,stroke:#01579b
    style Orchestrator fill:#fff3e0,stroke:#e65100
    style Vectors fill:#e8f5e9,stroke:#1b5e20
```

## 📐 Detailed Layer Breakdown

### Layer 1: Presentation (Frontend)
**Responsibility**: Interaction with the human user.
- **Technology**: Streamlit (Python-based Web UI).
- **Components**:
    - **Login Form**: Accepts password input.
    - **Chat Window**: Displays the conversation history and typing indicators.
    - **Settings Sidebar**: Controls for model selection, top-k sliders, and document management.
- **Key Files**: `streamlit_app.py`, `auth_pages/sign_up.html` (legacy/reference).

### Layer 2: Application (Business Logic)
**Responsibility**: Processing data, making decisions, and connecting layers.
- **Technology**: Python code running locally or on the server.
- **Components**:
    - **RAG Engine**: Coordinates the retrieval of chunks and the generation of answers.
    - **Text Processor (Chunker)**: Reads uploaded files and breaks them into semantic chunks.
    - **Auth Handler**: Hashes passwords and verifies credentials.
- **Key Files**: `rag_engine.py`, `chunking.py`, `streamlit_auth.py`, `chat_handler.py`.

### Layer 3: Data & Intelligence (Infrastructure)
**Responsibility**: Storing data and providing "intelligence".
- **Technology**: Local File System + External APIs.
- **Components**:
    - **Vector Store**: A JSON file (`vectorstore.json`) holding the mathematical embeddings of your documents.
    - **File System**: The `processed_docs/` folder storing the original text.
    - **AI Models**: The external "Brain" (OpenAI or Google Gemini) accessed via API.
- **Key Files**: `vectorstore.json`, `processed_docs/`, `.env` (API Keys).

## 🔄 Interaction Flow
1. **User** interacts with **Layer 1** (buttons/text).
2. **Layer 1** sends commands to **Layer 2** (e.g., "Process this file", "Answer this question").
3. **Layer 2** queries **Layer 3** for data or intelligence (e.g., "Get me the top 5 chunks", "Generate an answer").
4. **Layer 3** returns raw data to **Layer 2**.
5. **Layer 2** processes/formats it and sends it back to **Layer 1** for display.
