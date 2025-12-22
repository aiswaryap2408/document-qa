# RAG Chatbot Architecture & Data Flow

This document visualizes the "route" or data flow within the application, explaining how a user's question travels through the system to generate an answer.

## 🗺️ High-Level Architecture Diagram

```mermaid
graph TD
    %% Nodes
    User((👤 User))
    Auth{🔐 Auth?}
    UI[🖥️ Streamlit UI]
    
    subgraph "Backend Processing"
        Chunker[✂️ Text Chunker]
        Embedder[🧠 Embedding Model]
        VectorStore[(📂 Vector Store / JSON)]
    end
    
    subgraph "RAG Engine"
        Receiver[🔍 Retriever]
        Context[📝 Context Window]
        LLM[🤖 LLM (OpenAI/Gemini)]
    end

    %% Flow: Upload
    User -- "1. Upload Doc" --> UI
    UI --> Chunker
    Chunker -- "Text Chunks" --> Embedder
    Embedder -- "Vectors" --> VectorStore

    %% Flow: Chat
    User -- "2. Password" --> Auth
    Auth -- "Verified" --> UI
    User -- "3. Ask Question" --> UI
    UI -- "Question" --> Receiver
    
    Receiver -- "Similarity Search" --> VectorStore
    VectorStore -- "Relevant Chunks" --> Receiver
    
    Receiver -- "Question + Chunks" --> Context
    Context -- "Prompt" --> LLM
    
    LLM -- "Generated Answer" --> UI
    UI -- "Answer + Citations" --> User

    %% Styling
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Auth fill:#ff9,stroke:#333,stroke-width:2px
    style LLM fill:#bbf,stroke:#333,stroke-width:2px
    style VectorStore fill:#bfb,stroke:#333,stroke-width:2px
```

## 📍 Step-by-Step Data "Route"

### Route 1: Document Upload (Preparation)
1.  **User** uploads a file (PDF/TXT/MD).
2.  **Text Chunker** splits the text into small, manageable pieces (chunks).
3.  **Embedding Model** (OpenAI) converts these chunks into numbers (vectors).
4.  **Vector Store** saves these numbers and text in `vectorstore.json`.

### Route 2: Chat Interaction (The "Route" of a Question)
1.  **User** types a question in the **Streamlit UI**.
2.  **Retriever** takes the question and asks the **Vector Store**: *"What documents are mathematically similar to this question?"*
3.  **Vector Store** returns the top 5 most relevant text chunks.
4.  **RAG Engine** combines the **Question** + **Relevant Chunks** into a single prompt.
5.  **LLM** (the Brain) reads the prompt and generates an answer using *only* the provided chunks.
6.  **UI** displays the answer to the **User**.
