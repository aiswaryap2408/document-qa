from vectorstore import InMemoryVectorStore

def test_duplicates():
    print("Initializing InMemoryVectorStore...")
    vs = InMemoryVectorStore()
    print(f"Document names: {vs.document_names}")
    
    if len(vs.document_names) != len(set(vs.document_names)):
        print("DUPLICATES FOUND!")
    else:
        print("No duplicates found.")

if __name__ == "__main__":
    test_duplicates()
