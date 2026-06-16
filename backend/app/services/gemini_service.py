import os
import json
import google.generativeai as genai
import chromadb
from typing import List, Dict, Any, Optional

# Load env variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY is not set. AI features will not function.")

# Initialize ChromaDB persistent client
CHROMA_PATH = r"C:\Users\madhu\.gemini\antigravity\scratch\ai-study-assistant\backend\study_assistant_chroma"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Get or create the main study assistant collection
# We use a custom embedding function wrapper or generate embeddings manually
collection = chroma_client.get_or_create_collection(name="study_assistant_docs")

def get_gemini_embeddings(texts: List[str], is_query: bool = False) -> List[List[float]]:
    """
    Generates embeddings for a list of texts using the Gemini API.
    """
    if not GEMINI_API_KEY:
        print("WARNING: Missing GEMINI_API_KEY. Returning dummy embeddings.")
        return [[0.0] * 768 for _ in texts]
        
    try:
        task_type = "retrieval_query" if is_query else "retrieval_document"
        response = genai.embed_content(
            model="models/text-embedding-004",
            contents=texts,
            task_type=task_type
        )
        return response['embedding']
    except Exception as e:
        print(f"Error generating embeddings via Gemini: {e}")
        return [[0.0] * 768 for _ in texts]

def add_document_to_vector_db(document_id: int, chunks: List[Dict[str, Any]]):
    """
    Embeds document chunks and adds them to ChromaDB.
    """
    if not chunks:
        return
        
    texts = [chunk["text"] for chunk in chunks]
    embeddings = get_gemini_embeddings(texts, is_query=False)
    
    ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "page": chunk["page"]} for chunk in chunks]
    
    collection.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas
    )

def query_similar_chunks(document_id: int, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Queries ChromaDB for chunks matching the query.
    """
    query_embeddings = get_gemini_embeddings([query], is_query=True)
    
    results = collection.query(
        query_embeddings=query_embeddings,
        n_results=top_k,
        where={"document_id": document_id}
    )
    
    matched_chunks = []
    if results and results["documents"] and len(results["documents"]) > 0:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results["metadatas"] else []
        for idx, doc in enumerate(docs):
            page = metas[idx]["page"] if idx < len(metas) else 0
            matched_chunks.append({
                "text": doc,
                "page": page
            })
            
    return matched_chunks

def delete_document_from_vector_db(document_id: int):
    """
    Deletes all chunks associated with a document.
    """
    try:
        collection.delete(where={"document_id": document_id})
    except Exception as e:
        print(f"Error deleting document {document_id} from vector store: {e}")

def get_rag_answer(document_id: Optional[int], query: str, chat_history: List[Dict[str, str]] = None) -> str:
    """
    Retrieves relevant text from ChromaDB and runs a RAG generation with Gemini.
    """
    if not GEMINI_API_KEY:
        return "Gemini API key is missing. Please set the GEMINI_API_KEY in the backend configuration."
        
    context = ""
    if document_id:
        chunks = query_similar_chunks(document_id, query, top_k=5)
        context_parts = []
        for c in chunks:
            context_parts.append(f"[Page {c['page']}]: {c['text']}")
        context = "\n\n".join(context_parts)
        
    # Format chat history
    history_str = ""
    if chat_history:
        for turn in chat_history:
            role = "User" if turn["role"] == "user" else "Assistant"
            history_str += f"{role}: {turn['content']}\n"
            
    # System instructions
    system_instruction = (
        "You are an expert study assistant helping a student understand their study materials.\n"
        "If a document context is provided, prioritize answering based on that context. Include page citations (e.g., [Page X]) where relevant.\n"
        "If the answer cannot be found in the context, answer using your general knowledge, but clearly state that the information is not explicitly from the document.\n"
        "Explain concepts clearly, use bullet points, bold key terms, and keep it engaging for a student."
    )
    
    prompt = f"{system_instruction}\n\n"
    if context:
        prompt += f"--- STUDY DOCUMENT CONTEXT ---\n{context}\n-----------------------------\n\n"
        
    if history_str:
        prompt += f"--- CONVERSATION HISTORY ---\n{history_str}\n"
        
    prompt += f"User: {query}\nAssistant:"
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error in RAG generation: {e}")
        return f"Sorry, I encountered an error answering your question: {e}"

def generate_pdf_summary(document_id: int) -> str:
    """
    Generates a comprehensive summary of a document based on its chunks.
    """
    if not GEMINI_API_KEY:
        return "Gemini API key is missing. Cannot generate summary."
        
    # Fetch first 10 chunks to avoid token limits for summary
    try:
        results = collection.get(
            where={"document_id": document_id},
            limit=15
        )
        if not results or not results["documents"]:
            return "No document text found to summarize."
            
        text = "\n\n".join(results["documents"])
    except Exception as e:
        print(f"Error fetching document for summary: {e}")
        return f"Error retrieving document text: {e}"
        
    prompt = (
        "Provide a comprehensive, structured study summary of the following text.\n"
        "Structure the summary with:\n"
        "1. **Core Subject & Overview**\n"
        "2. **Key Concepts and Definitions** (in a list, bolding key terms)\n"
        "3. **Main Takeaways / Core Themes**\n"
        "4. **A Brief Study Challenge / Question** to test understanding.\n\n"
        f"Text:\n{text[:25000]}"  # Cap text to keep within safe token limits for fast response
    )
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating summary: {e}")
        return f"Error generating summary: {e}"

def generate_quiz_questions(document_id: int, num_questions: int = 5) -> List[Dict[str, Any]]:
    """
    Generates a structured list of multiple choice questions based on document text.
    Returns JSON array matching List[schemas.QuizQuestion].
    """
    if not GEMINI_API_KEY:
        raise ValueError("Missing GEMINI_API_KEY.")
        
    # Fetch some chunks
    results = collection.get(
        where={"document_id": document_id},
        limit=10
    )
    if not results or not results["documents"]:
        raise ValueError("No text found for this document to generate a quiz.")
        
    text = "\n\n".join(results["documents"])
    
    prompt = (
        f"Create a multiple choice quiz with exactly {num_questions} questions based on the following text.\n"
        "You MUST return the output strictly as a JSON array of objects. Do not wrap it in markdown code blocks like ```json ... ```. Just return raw JSON.\n"
        "Each object must have the following keys:\n"
        "- 'question': the question text\n"
        "- 'options': an array of exactly 4 strings representing options\n"
        "- 'answer': the correct option string (it MUST exactly match one of the items in the options array)\n"
        "- 'explanation': a brief explanation of why that option is correct\n\n"
        f"Text:\n{text[:20000]}"
    )
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        # Request JSON output
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        questions = json.loads(response.text)
        # Validate structure roughly
        if isinstance(questions, list):
            return questions
        elif isinstance(questions, dict) and "questions" in questions:
            return questions["questions"]
        else:
            raise ValueError("Returned format is not a list")
    except Exception as e:
        print(f"Error generating quiz questions: {e}")
        # Return fallback quiz questions if Gemini fails or JSON is malformed
        return [
            {
                "question": "What is the primary topic of the uploaded document?",
                "options": ["Unable to determine", "Detailed study material", "RAG-based education", "General science"],
                "answer": "Detailed study material",
                "explanation": "This is a fallback question because the AI generator encountered a processing issue."
            }
        ]
