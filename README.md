# ResearchOS — MTech Thesis Tracker

A full-stack Django + React JS application for managing every phase of your MTech thesis research.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.x + Django REST Framework |
| Frontend | React JS (JavaScript, no TypeScript) |
| Database | SQLite (file-based, zero config) |
| Charts | Recharts |
| Styling | Custom CSS variables (dark theme) |


---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

### 1. Backend Setup

```bash
cd researchos/backend

# Install Python dependencies
pip install django djangorestframework django-cors-headers

# Apply database migrations
python manage.py migrate

# (Optional) Create admin superuser
python manage.py createsuperuser

# Start Django server
python manage.py runserver
# Runs on: http://localhost:8000
```

### 2. Frontend Setup

```bash
cd researchos/frontend

# Install Node packages
npm install

# Start React dev server
npm start
# Runs on: http://localhost:3000
```

### 3. Open the App

Navigate to **http://localhost:3000** in your browser.

---

## Features by Phase

### Dashboard
- Overview of all 8 phases with progress rings
- Stats: papers reviewed, problems defined, hypotheses, log entries
- Overall thesis progress bar
- Quick navigation to any phase

### Phase 1 — Domain Selection
- Set research topic, sub-domain, supervisor, keywords
- Write motivation and free-form notes
- Saved domain displayed as confirmation

### Phase 2 — Literature Review
- Full paper records: title, authors, year, journal, DOI
- Fields: abstract, key findings, research gaps, methodology, personal notes
- Tag system + relevance rating (High / Medium / Low)
- Search by title, author, or tag
- Filter by relevance
- Gap tracking indicator

### Phase 3 — Problem Definition
- Classify problems: Unsolved / Partially Solved / Open / Solved
- Link problems to source papers
- Record existing work and your proposed approach
- Difficulty rating
- Filter by status
- Hypothesis count per problem

### Phase 4 — Hypothesis Workshop
- Full hypothesis records with:
  - Statement, rationale, testing method, expected outcome
  - **Reflection**: weaknesses, assumptions, self-critique
  - **Ranking scores**: Novelty, Feasibility, Impact, Testability (1–10)
  - **Evolution**: refined hypothesis after critique
- **Elo Rating System**: head-to-head matchups update Elo ratings (K=32)
- Hypotheses sorted by Elo rating (highest = strongest)
- Select primary hypothesis for thesis
- Detail view modal

### Phase 4b — Feasibility Analysis
- Score sliders: Data Availability, Compute, Time, Expertise
- Overall verdict: FEASIBLE / BORDERLINE / AT RISK
- Timeline plan editor
- Risk & mitigation notes
- Resources documentation

### Phase 5 — Thesis Proposal
- 10 structured sections (Title to References)
- Accordion expand/collapse per section
- Word count per section
- Auto-save (2-second debounce)
- Overall completion progress bar

### Phase 6 — Research Log
- Daily entries: achieved, remaining, blockers, notes
- Hours worked per day
- Bar chart: hours worked over last 14 days
- Visual blocker indicator (red border)
- Filter by research phase
- Stats: total entries, total hours, blocker days

### Phase 7 — Thesis Writer
- Full chapter-by-chapter editor
- 9 chapters: Abstract → Appendix
- Per-chapter word count vs. target
- Progress bar per chapter
- Auto-save (1.5-second debounce)
- Status bar: words, characters, lines
- Focus mode writing interface

---

## API Endpoints

All endpoints are nested under `/api/projects/<project_id>/`:

| Resource | Endpoint |
|---|---|
| Projects | `/api/projects/` |
| Domain | `/api/projects/{id}/domain/current/` |
| Papers | `/api/projects/{id}/papers/` |
| Problems | `/api/projects/{id}/problems/` |
| Hypotheses | `/api/projects/{id}/hypotheses/` |
| Elo Update | `/api/projects/{id}/hypotheses/update_elo/` |
| Feasibility | `/api/projects/{id}/feasibility/current/` |
| Proposal | `/api/projects/{id}/proposal/current/` |
| Logs | `/api/projects/{id}/logs/` |
| Thesis | `/api/projects/{id}/thesis/` |
| Dashboard | `/api/projects/{id}/dashboard/` |

---

## Data Storage

All data is stored in `backend/db.sqlite3` — a local SQLite file. No cloud account needed.

To back up your research: copy `db.sqlite3` to a safe location.

---

## Django Admin

Access at **http://localhost:8000/admin/** (after creating a superuser).

Lets you view and manage all data directly in a table interface.
