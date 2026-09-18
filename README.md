# PharmaQMS - AI-Powered Customer Complaint Management System

An AI-powered Customer Complaint Management System for pharmaceutical API & FDF
(Active Pharmaceutical Ingredient / Finished Dose Form) manufacturers, built to
the assignment's mandatory stack and workflow.

Upload or paste a customer complaint (email, letter, PDF report) and an AI agent
pipeline extracts structured fields, checks completeness, screens for duplicates,
classifies risk, suggests root causes and CAPA actions, and summarizes the
complaint - all while you review and edit the populated form before saving.

---

## 1. Tech stack (as mandated)

| Layer            | Technology                                                             |
|-------------------|-------------------------------------------------------------------------|
| Frontend          | React 18 + Redux Toolkit (via Vite)                                    |
| Backend           | Python + FastAPI                                                        |
| AI orchestration  | LangGraph (StateGraph agent pipeline, with conditional routing)        |
| LLMs              | Groq - `gemma2-9b-it` (fast tasks) + `llama-3.3-70b-versatile` (reasoning) |
| Database          | PostgreSQL (works with MySQL too - just change `DATABASE_URL`)         |
| Font              | Google Inter                                                             |

This codebase was produced with an AI pair-programmer end to end, then
**actually executed and tested** (backend pipeline smoke-tested with a real
FastAPI TestClient against all four sample documents; frontend built
successfully with `vite build`) to make sure it runs, per the assignment's
"zero human-written code" allowance.

---

## 2. Project layout

```
pharma-complaint-system/
├── backend/
│   ├── app/
│   │   ├── main.py                 FastAPI app entrypoint
│   │   ├── config.py                Settings (env-driven)
│   │   ├── database.py              SQLAlchemy engine/session
│   │   ├── models.py                Complaint & ChatMessage ORM models
│   │   ├── schemas.py               Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── complaints.py        CRUD REST endpoints
│   │   │   └── ai_assistant.py      /extract and /chat endpoints
│   │   ├── agents/
│   │   │   ├── graph.py             LangGraph pipeline (the core AI workflow)
│   │   │   ├── groq_client.py       Groq API wrapper (+ offline mock fallback)
│   │   │   ├── prompts.py           All system prompts, one per AI task
│   │   │   └── utils.py             Safe JSON parsing for LLM output
│   │   └── services/
│   │       ├── document_parser.py   PDF / DOCX / TXT / EML text extraction
│   │       ├── extraction_service.py  Wires the graph into the API layer
│   │       └── chat_service.py      Chat assistant service
│   ├── sample_documents/            4 realistic demo complaints (pdf/docx/txt/eml)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/              ComplaintForm, AIAssistantPanel, ChatBox, etc.
│   │   ├── store/                   Redux Toolkit slices + store
│   │   ├── api/                     Axios API client
│   │   └── styles/global.css        Design tokens (Inter font, matches reference UI)
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml                One-command local stack (Postgres+API+UI)
└── README.md
```

---

## 3. How the reference UI & workflow are implemented

The reference screenshot's two-panel layout is reproduced as-is:

- **Left panel - "Log Customer Complaint"**: the 4-section form (Origin &
  Customer Details, Product & Batch Identification, Complaint Details, Initial
  Assessment & Priority), a "Pending Triage" status badge, and Reset/Save
  actions.
- **Right panel - "AI Complaint Intake Assistant"**: drag-and-drop upload,
  paste-text option, supported-format notice, a live extraction progress bar,
  AI insight cards (completeness, risk, duplicates, root cause, CAPA,
  summary), and a chat box to ask the assistant questions.

Workflow: upload/paste a document -> LangGraph pipeline runs -> form
auto-populates with editable, AI-filled fields -> QA officer reviews/edits ->
Save Complaint -> record persisted to Postgres and visible in the "All
Complaints" tab.

---

## 4. The AI agent pipeline (LangGraph)

`backend/app/agents/graph.py` defines a `StateGraph` with these nodes:

```
extract_fields -> completeness_check -> duplicate_check -> risk_classify
                                                               |
                                               (conditional branch)
                                    Major/Critical            Minor
                                    root_cause                  |
                                         |                       |
                                   capa_recommend                |
                                         '---------+-------------'
                                                summarize
                                                    |
                                            compose_message -> END
```

The conditional edge after `risk_classify` means the more expensive
reasoning-heavy calls (root cause + CAPA, run on `llama-3.3-70b-versatile`)
only fire for Major/Critical complaints - mirroring how a real QA triage
process prioritises investigative effort, and keeping Minor-complaint
turnaround fast and cheap (`gemma2-9b-it`).

---

## 5. Bonus AI features implemented

All of the suggested bonus features are implemented as nodes in the pipeline:

- **Complaint Completeness Checker** - scores 0-100% and lists missing
  required fields (`node_completeness_check`).
- **Duplicate Complaint Detection** - compares the new complaint against
  recent complaints in the DB via an LLM similarity judgment
  (`node_duplicate_check`); surfaced in the UI as a warning card.
- **AI Risk Classification** - Critical / Major / Minor per ICH Q9-style
  reasoning, with a rationale (`node_risk_classify`).
- **Root Cause Recommendation** - 3-5 plausible manufacturing-stage
  hypotheses (`node_root_cause`).
- **CAPA Recommendation** - concrete corrective/preventive actions
  (`node_capa_recommend`).
- **Complaint Summary** - a 2-3 sentence QA-dashboard-ready summary
  (`node_summarize`).
- **Conversational assistant** - a chat box answering questions about the
  complaint, extracted fields, or general pharma QA practice, using the
  `llama-3.3-70b-versatile` model.

---

## 6. Running it locally

### Option A - Docker Compose (simplest)

```bash
cp backend/.env.example backend/.env      # optionally add your real GROQ_API_KEY
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs (Swagger): http://localhost:8000/docs

### Option B - Run each service manually

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set DATABASE_URL to your Postgres/MySQL instance and GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```
Open http://localhost:5173.

### Getting a Groq API key
Create a free key at https://console.groq.com. Paste it into `backend/.env` as
`GROQ_API_KEY=...`. **The app works even without a key** - it falls back to a
deterministic offline mock so the full pipeline, UI, and demo flow can be
exercised without any credentials (useful for grading/demoing offline). Real
intelligence in extraction/classification/RCA/CAPA quality comes from Groq
once a key is set.

---

## 7. Demo documents

`backend/sample_documents/` contains 4 realistic, synthetic complaint
documents you can upload straight into the UI to see the full pipeline run:

| File | Format | Scenario |
|---|---|---|
| `complaint_foreign_particle.txt` | TXT | Foreign particulate matter, customer portal |
| `complaint_packaging_defect.eml` | EML | Blister seal defect / moisture ingress, email |
| `complaint_injectable_particulate.docx` | DOCX | Particulate in sterile injectable (Critical) |
| `complaint_discoloration_report.pdf` | PDF | Tablet discoloration, regulatory referral |

Document parsing uses `pypdf` / `python-docx` / Python's `email` module -
simple text extraction as permitted by the assignment (production-grade
OCR is explicitly not required).

---

## 8. Database

The demo auto-creates tables on startup (`Base.metadata.create_all`) for
convenience. For a production setup, replace this with Alembic migrations.
Switching between Postgres and MySQL is a one-line change to `DATABASE_URL`
in `.env` (see the two example URLs in `backend/.env.example`) - the
SQLAlchemy models are written to be portable across both.

---

## 9. Notes & honest limitations

- Duplicate detection uses an LLM judgment call over recent complaints rather
  than a vector database - sufficient for the assignment's scope; a real
  production system would add embeddings + a vector index for scale.
- Document parsing is intentionally simple (no OCR for scanned images), per
  the assignment's explicit allowance.
- The offline mock LLM fallback is a convenience for credential-free grading/
  demoing; it is not a substitute for the real Groq-powered reasoning.
