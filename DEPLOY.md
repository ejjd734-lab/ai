# Carbon Footprint Awareness Platform
## Setup, Run & Deploy Guide

---

## What Was Improved

| Area | Change |
|------|--------|
| `theme.css` | Smooth transitions on buttons/inputs, GPU-composited bar chart animation (`transform:scaleX`), shimmer skeleton loader, hover lift on save card, improved focus rings |
| `ResultBreakdown.tsx` | Uses `--bar-pct` CSS custom property for GPU-composited bar animation; wrapped in `memo()` |
| `InsightsPanel.tsx` | Wrapped in `memo()` — skips re-render unless insights change |
| `HistoryPanel.tsx` | Wrapped in `memo()` — skips re-render unless entries change |
| `ResultSkeleton.tsx` | **New file** — shimmer placeholder shown while API is in flight |
| `App.tsx` | Shows skeleton during loading; clears stale results so skeleton appears cleanly on recalculate |
| `vite.config.ts` | `target: "es2020"`, `cssMinify: true`, vendor chunk split (React cached separately) |
| `backend/app/main.py` | `_CachedStaticFiles` adds `Cache-Control: public, max-age=31536000, immutable` to Vite-hashed assets |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| Python | 3.12+ | https://python.org |
| Docker | 24+ | https://docs.docker.com/get-docker/ |

---

## Option 1 — Local Development (No Docker)

### 1. Clone / unzip the project
```bash
cd carbon-platform
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Open .env and fill in values:
#   GEMINI_API_KEY=your_key_here   (optional — falls back to rule-based insights)
#   ALLOWED_ORIGINS=http://localhost:5173
#   STORAGE_BACKEND=memory          (use 'firestore' for persistence)
```

### 3. Start the backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend is now running at **http://localhost:8000**
API docs at **http://localhost:8000/docs**

### 4. Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend is now running at **http://localhost:5173**
(Vite proxies `/api/*` → `http://localhost:8000` automatically)

### 5. Open your browser
Navigate to **http://localhost:5173**

---

## Option 2 — Docker (Single Container, Production-like)

This mirrors exactly what runs in production: one container serving the API
and the built React SPA together.

### Build
```bash
docker build -t carbon-platform .
```

### Run
```bash
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key_here \
  -e ALLOWED_ORIGINS=http://localhost:8080 \
  -e STORAGE_BACKEND=memory \
  carbon-platform
```
Open **http://localhost:8080**

### Run with Firestore (persistent history)
```bash
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key_here \
  -e ALLOWED_ORIGINS=http://localhost:8080 \
  -e STORAGE_BACKEND=firestore \
  -e GOOGLE_CLOUD_PROJECT=your-gcp-project-id \
  -v ~/.config/gcloud:/home/appuser/.config/gcloud:ro \
  carbon-platform
```

---

## Option 3 — Deploy to Google Cloud Run (Free Tier Available)

### Prerequisites
```bash
# Install gcloud CLI: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

### Build and push
```bash
# Build for Cloud Run's architecture
docker build --platform linux/amd64 -t carbon-platform .

# Push to Google Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
docker tag carbon-platform us-central1-docker.pkg.dev/YOUR_PROJECT_ID/carbon/carbon-platform:latest
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/carbon/carbon-platform:latest
```

### Deploy
```bash
gcloud run deploy carbon-platform \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/carbon/carbon-platform:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "STORAGE_BACKEND=memory" \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"
```

Cloud Run gives you a public URL like:
`https://carbon-platform-xxxx-uc.a.run.app`

Set `ALLOWED_ORIGINS` to that URL for CORS:
```bash
gcloud run services update carbon-platform \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://carbon-platform-xxxx-uc.a.run.app"
```

---

## Option 4 — Deploy to Render (Easiest Free Option)

1. Push your code to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your repo
4. Settings:
   - **Environment**: Docker
   - **Port**: 8080
5. Add environment variables in the Render dashboard:
   - `GEMINI_API_KEY` = your key
   - `ALLOWED_ORIGINS` = `https://your-app.onrender.com`
   - `STORAGE_BACKEND` = `memory`
6. Click **Deploy**

Free tier spins down after 15 min of inactivity (cold start ~30s).

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No | — | Google Gemini API key. Without it, insights fall back to rule-based engine |
| `ALLOWED_ORIGINS` | Yes in prod | `http://localhost:5173` | Comma-separated CORS origins |
| `STORAGE_BACKEND` | No | `memory` | `memory` (in-process, resets on restart) or `firestore` |
| `GOOGLE_CLOUD_PROJECT` | Only if Firestore | — | GCP project ID for Firestore |
| `PORT` | No | `8080` | Port uvicorn listens on (Cloud Run sets this automatically) |

---

## Running Tests

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

### Frontend
```bash
cd frontend
npm install
npm test                    # single run
npm run test:coverage       # with coverage report
npm run test:watch          # watch mode during development
```

---

## Production Checklist

- [ ] Set `GEMINI_API_KEY` as a secret (not plain env var)
- [ ] Set `ALLOWED_ORIGINS` to your actual domain
- [ ] Use `STORAGE_BACKEND=firestore` for persistent history (memory resets on every deploy)
- [ ] Enable HTTPS (Cloud Run / Render handle this automatically)
- [ ] Set up Firestore in your GCP project if using Firestore backend
- [ ] Add a custom domain via your hosting provider

---

## Troubleshooting

**`npm run dev` fails with ENOENT**
→ Run `npm install` first in the `frontend/` directory.

**Backend returns 422 on calculate**
→ Check your input values are within bounds (e.g. household_size ≥ 1).

**Insights always show "Smart rules" instead of AI**
→ `GEMINI_API_KEY` is missing or invalid. The app works fine without it.

**Docker build fails on Apple Silicon (M1/M2/M3)**
→ Add `--platform linux/amd64` to `docker build` for Cloud Run deployments.
   For local use, omit `--platform` and Docker will build natively.

**History doesn't persist between restarts**
→ Switch to `STORAGE_BACKEND=firestore` and configure a GCP project.
