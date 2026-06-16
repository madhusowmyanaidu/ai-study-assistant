# AI Study Assistant (StudySphere)

A modern, AI-powered study platform where students can upload PDF study notes, interact with an AI assistant through RAG (Retrieval-Augmented Generation), generate summaries, and test their knowledge with customized AI-generated interactive quizzes.

---

## Technical Stack
- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, Python, PyPDF
- **Database**: SQLite (Default / Development) / PostgreSQL (Production)
- **Vector Database**: ChromaDB
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`, `models/text-embedding-004`)
- **Authentication**: JWT, bcrypt password hashing

---

## Project Structure
```
ai-study-assistant/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── gemini_service.py   # Embedding, QA, summary, and quiz generation
│   │   │   └── pdf_processor.py    # PyPDF parser and character-based text chunker
│   │   ├── auth.py                 # JWT token creation and current user dependencies
│   │   ├── database.py             # SQLAlchemy configuration with SQLite fallback
│   │   ├── main.py                 # FastAPI routing (auth, uploads, RAG, quizzes)
│   │   ├── models.py               # Database schemas (Users, Documents, Chats, Summaries, Quizzes)
│   │   └── schemas.py              # Pydantic models for validation and serialization
│   ├── uploads/                    # Local storage directory for uploaded PDFs
│   ├── study_assistant_chroma/     # Persistent ChromaDB vector databases
│   ├── .env                        # Configuration file (ignored by Git)
│   └── requirements.txt            # Python backend dependencies
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── dashboard/          # Protected study dashboard routes
    │   │   │   ├── chat/           # RAG-powered chatbot interface
    │   │   │   ├── profile/        # User accounts details & statistics
    │   │   │   ├── quiz/           # Practice quiz wizard
    │   │   │   ├── settings/       # API server configurations
    │   │   │   ├── summaries/      # Automated summary guide reader
    │   │   │   ├── upload/         # Drag & Drop PDF uploader & list
    │   │   │   └── layout.tsx      # Sidebar navigation & JWT session checks
    │   │   ├── login/              # Sign In screen
    │   │   ├── register/           # Create account screen
    │   │   ├── globals.css         # Global typography & dark themes variables
    │   │   ├── layout.tsx          # Root Next.js template
    │   │   └── page.tsx            # SaaS landing page
    │   └── lib/
    │       └── api.ts              # Native fetch client wrapper with token injection
    ├── package.json                # Frontend package configurations
    └── tsconfig.json               # TypeScript setup configurations
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and NPM

### 1. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file from the template:
   ```bash
   copy .env.example .env   # On Windows
   cp .env.example .env     # On macOS/Linux
   ```
5. Edit the `.env` file and insert your **Google Gemini API Key**:
   ```env
   DATABASE_URL=sqlite:///./study_assistant.db
   SECRET_KEY=b2c55b6823908f97a5a8fde64c1809079de65b68c78c3c78
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API docs will be active at `http://localhost:8000/docs`.

### 2. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000`.

---

## API Documentation

### Authentication Endpoints
- **POST** `/api/auth/register` - Registers a new user.
  - Body: `{ "email": "str", "password": "str", "name": "str" }`
- **POST** `/api/auth/login` - Authenticates and returns a JWT access token.
  - Body: `{ "email": "str", "password": "str" }`
- **GET** `/api/auth/me` - Retrieves current logged-in user profile details.
  - Header: `Authorization: Bearer <JWT_TOKEN>`

### Document Endpoints
- **POST** `/api/documents/upload` - Uploads a PDF file. Initiates background parsing & vector indexing.
  - Multipart Form: `file: <PDF_FILE>`
- **GET** `/api/documents` - Lists all uploaded documents for the user.
- **DELETE** `/api/documents/{doc_id}` - Deletes a PDF file, its ChromaDB vector index, and all related database entries (chats, summaries, quizzes).

### Study RAG Chat Endpoints
- **POST** `/api/chat` - Submits a prompt. Performs semantic retrieval from ChromaDB, cites pages, and generates an answer using Gemini.
  - Body: `{ "document_id": int | null, "question": "str" }`
- **GET** `/api/chat/history` - Fetches conversation logs for a selected PDF or general chat.

### Summaries Endpoints
- **GET** `/api/documents/{doc_id}/summary` - Retrieves or generates a structured Markdown summary of the PDF. Saved in `summaries` table for caching.
- **GET** `/api/summaries` - Lists all summaries generated by the user.

### Quiz Endpoints
- **POST** `/api/quizzes/generate` - Generates a multiple-choice practice quiz with complete answer explanations.
  - Body: `{ "document_id": int, "title": "str", "num_questions": int }`
- **POST** `/api/quizzes/{quiz_id}/submit` - Saves the score achieved on the quiz.
  - Body: `{ "score": int }`
- **GET** `/api/quizzes` - Lists all generated quizzes and their scores.

---

## Production Deployment Instructions

### Backend Deployment (e.g. Render, Heroku, AWS ECS)
1. **Database**: Provision a PostgreSQL database (e.g. AWS RDS or Supabase) and update the `DATABASE_URL` environment variable. FastAPI will automatically compile schema models to PostgreSQL.
2. **Persistent Directory**: ChromaDB and PDF storage require file systems. Ensure you mount a persistent volume (e.g., `/app/uploads` and `/app/study_assistant_chroma`) or use cloud storage like AWS S3 for PDF files and a hosted Vector DB (like Pinecone or Chroma Cloud) for production.
3. **Run Command**:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT
   ```

### Frontend Deployment (e.g. Vercel, Netlify)
1. Next.js App is fully optimized for **Vercel** out-of-the-box.
2. Link the frontend git repository.
3. Configure the environment variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL.
4. Trigger the build. Vercel compiles dynamic routes and deploys globally.
