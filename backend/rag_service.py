from rag_modules.vectorstore import InMemoryVectorStore
from rag_modules.rag_engine import RAGEngine
import os

# Initialize global instances
_vectorstore = None
_engine = None

def get_rag_engine():
    global _vectorstore, _engine
    if _vectorstore is None:
        _vectorstore = InMemoryVectorStore()
        # In a real app, you might want to load existing chunks from disk/DB here
        _engine = RAGEngine(_vectorstore)
    return _engine, _vectorstore
