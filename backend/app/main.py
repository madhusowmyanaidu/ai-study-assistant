import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, get_db, Base
from app import models, schemas, auth
from app.services import pdf_processor, gemini_service

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Study Assistant API", version="1.0.0")

# Setup uploads directory
UPLOADS_DIR = r"C:\Users\madhu\.gemini\antigravity\scratch\ai-study-assistant\backend\uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production in real deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Background Task for PDF Processing ---
def process_document_task(db_session_factory, doc_id: int, file_path: str):
    db = db_session_factory()
    try:
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if not doc:
            print(f"Background task error: Document {doc_id} not found in database.")
            return

        # 1. Extract text
        pages_data = pdf_processor.extract_text_from_pdf(file_path)
        
        # 2. Chunk text
        chunks = pdf_processor.chunk_text(pages_data)
        
        # 3. Vector DB index
        gemini_service.add_document_to_vector_db(doc_id, chunks)
        
        # 4. Complete
        doc.upload_status = "completed"
        db.commit()
        print(f"Background task: Document {doc_id} processed successfully.")
    except Exception as e:
        print(f"Background task failed for document {doc_id}: {e}")
        try:
            doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
            if doc:
                doc.upload_status = "failed"
                db.commit()
        except Exception as db_err:
            print(f"Failed to update document status to failed: {db_err}")
    finally:
        db.close()

# --- Auth Routes ---
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_pwd = auth.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        password_hash=hashed_pwd,
        name=user_in.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# PUT endpoint to update Profile / Settings
@app.put("/api/users/me", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if changing email and if it's already taken
    if user_update.email != current_user.email:
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_update.email
        
    current_user.name = user_update.name
    if user_update.password:
        current_user.password_hash = auth.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

# --- Dashboard Statistics ---
@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 1. Total PDFs
    total_pdfs = db.query(models.Document).filter(models.Document.user_id == current_user.id).count()
    
    # 2. Total Questions
    total_questions = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).count()
    
    # 3. Total Quizzes
    total_quizzes = db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id).count()
    
    # 4. Assemble Recent Activity
    activities = []
    
    # Recent PDFs (Uploads)
    recent_docs = db.query(models.Document)\
        .filter(models.Document.user_id == current_user.id)\
        .order_by(models.Document.upload_date.desc())\
        .limit(5).all()
        
    for doc in recent_docs:
        activities.append(schemas.ActivityLog(
            id=doc.id,
            type="upload",
            description=f"Uploaded document: {doc.filename}",
            timestamp=doc.upload_date
        ))
        
    # Recent Chat History
    recent_chats = db.query(models.ChatHistory)\
        .filter(models.ChatHistory.user_id == current_user.id)\
        .order_by(models.ChatHistory.timestamp.desc())\
        .limit(5).all()
        
    for chat in recent_chats:
        activities.append(schemas.ActivityLog(
            id=chat.id,
            type="chat",
            description=f"Asked: '{chat.question[:40]}...'",
            timestamp=chat.timestamp
        ))
        
    # Recent Quizzes
    recent_quizzes = db.query(models.Quiz)\
        .filter(models.Quiz.user_id == current_user.id)\
        .order_by(models.Quiz.created_at.desc())\
        .limit(5).all()
        
    for quiz in recent_quizzes:
        score_info = f" (Scored {quiz.score}%)" if quiz.score is not None else " (Not attempted)"
        activities.append(schemas.ActivityLog(
            id=quiz.id,
            type="quiz",
            description=f"Generated quiz: {quiz.title}{score_info}",
            timestamp=quiz.created_at
        ))
        
    # Recent Summaries
    recent_sums = db.query(models.Summary)\
        .filter(models.Summary.user_id == current_user.id)\
        .order_by(models.Summary.created_at.desc())\
        .limit(5).all()
        
    for s in recent_sums:
        doc_name = "document"
        doc = db.query(models.Document).filter(models.Document.id == s.document_id).first()
        if doc:
            doc_name = doc.filename
        activities.append(schemas.ActivityLog(
            id=s.id,
            type="summary",
            description=f"Generated summary for {doc_name}",
            timestamp=s.created_at
        ))
        
    # Sort activities by timestamp descending and take top 10
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    recent_activities = activities[:10]
    
    return schemas.DashboardStats(
        total_pdfs=total_pdfs,
        total_questions=total_questions,
        total_quizzes=total_quizzes,
        recent_activities=recent_activities
    )

# --- PDF Document Routes ---
@app.post("/api/documents/upload", response_model=schemas.DocumentResponse)
def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
        
    # Generate unique file path
    timestamp_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp_prefix}_{file.filename}"
    file_path = os.path.join(UPLOADS_DIR, safe_filename)
    
    # Save the file locally
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {e}"
        )
        
    # Save document database record
    new_doc = models.Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        upload_status="processing"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Trigger background text extraction & ChromaDB embedding
    background_tasks.add_task(process_document_task, SessionLocal, new_doc.id, file_path)
    
    return new_doc

@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def list_documents(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Document).filter(models.Document.user_id == current_user.id).all()

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove from local file system
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Error removing file {doc.file_path}: {e}")
            
    # Remove from Vector DB
    gemini_service.delete_document_from_vector_db(doc.id)
    
    # Remove from main DB (cascades chats, summaries, and quizzes)
    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted successfully"}

# --- Summaries Routes ---
@app.get("/api/documents/{doc_id}/summary", response_model=schemas.SummaryResponse)
def get_document_summary(
    doc_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.upload_status != "completed":
        raise HTTPException(status_code=400, detail=f"Document is not ready. Status: {doc.upload_status}")
        
    # Check if a summary already exists in database
    existing_summary = db.query(models.Summary).filter(
        models.Summary.document_id == doc_id,
        models.Summary.user_id == current_user.id
    ).first()
    
    if existing_summary:
        return existing_summary
        
    # Generate new summary using Gemini
    summary_text = gemini_service.generate_pdf_summary(doc.id)
    
    new_summary = models.Summary(
        user_id=current_user.id,
        document_id=doc_id,
        summary=summary_text
    )
    db.add(new_summary)
    db.commit()
    db.refresh(new_summary)
    return new_summary

@app.get("/api/summaries", response_model=List[schemas.SummaryResponse])
def list_summaries(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Summary).filter(models.Summary.user_id == current_user.id).all()

# --- RAG Chat Routes ---
@app.post("/api/chat", response_model=schemas.ChatHistoryResponse)
def ask_question(
    query_in: schemas.ChatQuery,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = None
    if query_in.document_id:
        doc = db.query(models.Document).filter(
            models.Document.id == query_in.document_id,
            models.Document.user_id == current_user.id
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Selected study document not found")
            
    # Load recent chat history context for Gemini (limit to last 5 messages)
    history_db = db.query(models.ChatHistory)\
        .filter(
            models.ChatHistory.user_id == current_user.id,
            models.ChatHistory.document_id == query_in.document_id
        )\
        .order_by(models.ChatHistory.timestamp.asc())\
        .limit(5).all()
        
    chat_history = []
    for h in history_db:
        chat_history.append({"role": "user", "content": h.question})
        chat_history.append({"role": "assistant", "content": h.answer})
        
    # Get answer
    answer = gemini_service.get_rag_answer(
        document_id=doc.id if doc else None,
        query=query_in.question,
        chat_history=chat_history
    )
    
    # Record chat log
    new_chat = models.ChatHistory(
        user_id=current_user.id,
        document_id=doc.id if doc else None,
        question=query_in.question,
        answer=answer
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

@app.get("/api/chat/history", response_model=List[schemas.ChatHistoryResponse])
def get_chat_history(
    document_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id)
    if document_id:
        query = query.filter(models.ChatHistory.document_id == document_id)
    return query.order_by(models.ChatHistory.timestamp.asc()).all()

# --- Quiz Routes ---
@app.post("/api/quizzes/generate", response_model=schemas.QuizResponse)
def generate_quiz(
    quiz_in: schemas.QuizCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == quiz_in.document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.upload_status != "completed":
        raise HTTPException(status_code=400, detail="Document must be fully processed to generate a quiz.")
        
    try:
        questions = gemini_service.generate_quiz_questions(doc.id, num_questions=quiz_in.num_questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    new_quiz = models.Quiz(
        user_id=current_user.id,
        document_id=doc.id,
        title=quiz_in.title,
        quiz_data=questions
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    return new_quiz

@app.get("/api/quizzes", response_model=List[schemas.QuizResponse])
def list_quizzes(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id).all()

@app.post("/api/quizzes/{quiz_id}/submit", response_model=schemas.QuizResponse)
def submit_quiz_score(
    quiz_id: int,
    submission: schemas.QuizSubmit,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.user_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    quiz.score = submission.score
    db.commit()
    db.refresh(quiz)
    return quiz
