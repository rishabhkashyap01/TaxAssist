# TaxAssist — AI Income Tax Filing Assistant

An AI-powered Indian Income Tax Return (ITR) filing assistant. Combines a RAG-based Q&A engine (trained on 518 Income Tax Rules + the Income Tax Act 1961) with a guided conversational ITR filing flow supporting ITR-1 through ITR-4 for AY 2025-26.

## Features

- **Conversational ITR Filing** — AI guides you step-by-step through the entire ITR filing process (personal info, income sources, deductions, tax computation, bank details, summary)
- **Multi-Form Support** — ITR-1 (salaried), ITR-2 (capital gains), ITR-3 (business/profession), ITR-4 (presumptive income)
- **RAG-Powered Q&A** — Ask anything about the Income Tax Act 1961 or Rules 1962 and get accurate, source-cited answers
- **Hybrid Retrieval** — Combines metadata-filtered exact rule/section lookup with semantic MMR search
- **Old vs New Regime Comparison** — Computes and compares tax liability under both regimes with a recommendation
- **JWT Authentication** — Secure login/register with bcrypt passwords and httpOnly JWT cookies
- **MongoDB Persistence** — All filings and chat history saved to MongoDB Atlas per user
- **Save & Resume** — Auto-saves progress at every step; resume with full chat history restored
- **Light/Dark Mode** — Theme toggle with system-aware default, persisted in localStorage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + TypeScript |
| Backend | FastAPI (Python) |
| LLM | Groq (Llama 3.3 70B) |
| RAG Framework | LangChain |
| Vector Database | ChromaDB (file-based, committed to git) |
| Embeddings | HuggingFace Inference API (`all-MiniLM-L6-v2`) |
| Database | MongoDB Atlas |
| Authentication | bcrypt + JWT (httpOnly cookies) |
| Data Scraping | BeautifulSoup, Crawl4AI, Playwright |
| Deployment | Vercel (frontend) + Render (backend) |

## Project Structure

```
income_tax_assistent/
│
├── backend/                      # FastAPI backend (deploy to Render)
│   ├── main.py                   # FastAPI app, CORS, RAG startup warmup
│   ├── requirements.txt          # Python dependencies
│   ├── render.yaml               # Render deployment config
│   ├── .env.example              # Environment variable template
│   ├── src/
│   │   ├── auth.py               # bcrypt auth + JWT token functions
│   │   ├── database.py           # MongoDB connection singleton
│   │   ├── filing_engine.py      # LLM-driven state machine (12 filing steps)
│   │   ├── filing_storage.py     # Filing CRUD (MongoDB)
│   │   ├── itr_models.py         # ITR dataclasses (PersonalInfo, SalaryIncome, etc.)
│   │   ├── itr_prompts.py        # Step-specific LLM prompts per ITR form
│   │   ├── rag_engine.py         # RAG chain with hybrid retrieval
│   │   └── tax_engine.py         # Tax computation (slabs, rebate, surcharge, cess)
│   ├── routers/
│   │   ├── auth.py               # POST /api/auth/login, /register, /logout, GET /me
│   │   ├── qa.py                 # GET /api/qa/stream (SSE)
│   │   ├── filing.py             # POST /api/filing/message/stream, /welcome (SSE)
│   │   └── filings.py            # GET/POST/PATCH/DELETE /api/filings
│   ├── middleware/
│   │   └── auth_middleware.py    # JWT cookie → user dict (FastAPI Depends)
│   └── data/
│       └── chroma_db/            # ChromaDB vector store (518 rules + IT Act)
│
├── frontend/                     # Next.js frontend (deploy to Vercel)
│   ├── app/
│   │   ├── layout.tsx            # Root layout with ThemeProvider + anti-flash script
│   │   ├── page.tsx              # Redirects to /filing
│   │   ├── globals.css           # Blue/cyan theme + light & dark mode CSS variables
│   │   ├── icon.svg              # Favicon (₹ on blue-cyan gradient)
│   │   ├── (auth)/login/         # Login + Register page
│   │   └── (app)/
│   │       ├── layout.tsx        # Auth guard + sidebar shell
│   │       ├── qa/page.tsx       # Q&A chat with SSE streaming
│   │       └── filing/
│   │           ├── page.tsx      # Filing list + Start New Filing
│   │           └── [filingId]/   # Active filing chat + step tracker
│   ├── components/
│   │   ├── layout/Sidebar.tsx    # Navigation sidebar with theme toggle
│   │   ├── chat/                 # ChatWindow, ChatMessage, ChatInput
│   │   └── filing/               # FilingCard, StepTracker
│   ├── context/
│   │   └── ThemeContext.tsx      # Theme state + toggleTheme hook
│   ├── hooks/
│   │   └── useSSE.ts             # streamGet (EventSource) + streamPost (fetch)
│   ├── lib/
│   │   ├── types.ts              # TypeScript interfaces + createDefaultFiling()
│   │   ├── api.ts                # Typed fetch wrapper with cookie support
│   │   └── utils.ts              # Step labels, progress helpers
│   ├── middleware.ts             # Route protection (cookie check → redirect /login)
│   └── next.config.ts           # API proxy for local dev (/api/* → FastAPI :8001)
│
├── data/                         # Shared data (chroma_db, raw_markdown, raw_pdf)
└── scrapers/                     # One-time scraping scripts
    ├── incomeTaxActScraper.py
    ├── incomeTaxRuleScraper.py
    └── scrape_all_rules.py
```

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free M0 tier)
- A [HuggingFace](https://huggingface.co/settings/tokens) API token (free, Read access)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/income_tax_assistent.git
cd income_tax_assistent
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Copy and fill in your environment variables:
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
GROQ_API_KEY=gsk_your_key_here
MONGO_URI=<your-mongodb-atlas-connection-string>
MONGO_DB_NAME=income_tax
JWT_SECRET=run_python_-c_"import secrets; print(secrets.token_hex(32))"
ALLOWED_ORIGIN=http://localhost:3002
HF_API_TOKEN=hf_your_token_here
```

Start the backend:
```bash
uvicorn main:app --reload --port 8001
# Runs at http://localhost:8001
# Check: http://localhost:8001/health → {"status":"ok","rag_ready":true}
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev -- --port 3002
# Runs at http://localhost:3002
```

The Next.js dev server automatically proxies `/api/*` → `localhost:8001`, so no CORS issues locally.

### 4. Open the app

Go to `http://localhost:3002`, register an account, and start filing.

---

## Deployment

### Backend → Render

1. Push repo to GitHub
2. Create a new **Web Service** on [Render](https://render.com) — the `backend/render.yaml` is pre-configured
3. Add environment variables in the Render dashboard:
   - `GROQ_API_KEY`
   - `MONGO_URI`
   - `MONGO_DB_NAME` = `income_tax`
   - `JWT_SECRET` — generate with `python -c "import secrets; print(secrets.token_hex(32))"`
   - `ALLOWED_ORIGIN` = your Vercel URL (e.g. `https://taxassist.vercel.app`)
   - `HF_API_TOKEN`

> **Note:** Render free tier sleeps after 15 min of inactivity (~60s cold start). The frontend fires a silent wake-up ping on page load so users never feel the delay.

### Frontend → Vercel

1. Import repo to [Vercel](https://vercel.com), set root directory to `frontend/`
2. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g. `https://taxassist-backend.onrender.com`)
3. After deploy, set `ALLOWED_ORIGIN` in Render to your Vercel URL

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account, sets JWT cookie |
| POST | `/api/auth/login` | Login, sets JWT cookie |
| POST | `/api/auth/logout` | Clears JWT cookie |
| GET | `/api/auth/me` | Returns current user |

### Filings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/filings` | List all user's filings |
| POST | `/api/filings` | Save new filing |
| GET | `/api/filings/{id}` | Load filing + chat history |
| PATCH | `/api/filings/{id}` | Update filing |
| DELETE | `/api/filings/{id}` | Delete filing |

### Streaming (SSE)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qa/stream?q=...` | Stream Q&A answer |
| POST | `/api/filing/message/stream` | Stream filing step response |
| POST | `/api/filing/welcome` | Stream welcome message for new filing |

---

## Environment Variables

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | From [Groq Console](https://console.groq.com/) |
| `MONGO_URI` | Yes | MongoDB Atlas `mongodb+srv://` connection string |
| `MONGO_DB_NAME` | No | Database name (default: `income_tax`) |
| `JWT_SECRET` | Yes | Random 32-byte hex string for signing JWT tokens |
| `ALLOWED_ORIGIN` | Yes | Frontend URL for CORS (e.g. `https://taxassist.vercel.app`) |
| `HF_API_TOKEN` | Yes | HuggingFace Read token for embedding API |

### Frontend
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Production only | Render backend URL |
