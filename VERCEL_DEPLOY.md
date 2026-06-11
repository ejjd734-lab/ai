# 🚀 Deploy to Vercel — Step by Step

## What's in this ZIP

```
vercel-deploy/
├── vercel.json              ← Vercel build config (auto-detected)
├── .env.example             ← Environment variable template
├── VERCEL_DEPLOY.md         ← This guide
└── frontend/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/      ← All UI components
        ├── lib/             ← API client, types, helpers
        └── styles/          ← theme.css
```

---

## STEP 1 — Push to GitHub

```bash
# Unzip this file, go into the folder, init git
git init
git add .
git commit -m "Initial commit"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## STEP 2 — Deploy on Vercel

1. Go to https://vercel.com → Sign in / Sign up
2. Click **"Add New Project"**
3. Click **"Import"** next to your GitHub repo
4. Set these build settings:

| Setting           | Value                              |
|-------------------|------------------------------------|
| Framework Preset  | **Vite**                           |
| Root Directory    | `.` (repo root)                    |
| Build Command     | `cd frontend && npm install && npm run build` |
| Output Directory  | `frontend/dist`                    |

> ✅ vercel.json already sets all of this — Vercel may auto-detect it.

---

## STEP 3 — Add Environment Variable

In Vercel → **Settings → Environment Variables**, add:

| Name                | Value                          |
|---------------------|--------------------------------|
| `VITE_API_BASE_URL` | `https://your-backend-url.com` |

Then click **Redeploy**.

---

## STEP 4 — Update Backend CORS

Add your Vercel URL to your backend's allowed origins:

```
ALLOWED_ORIGINS=https://your-project.vercel.app
```

---

## API Endpoints Used by Frontend

| Endpoint                    | Purpose                    |
|-----------------------------|----------------------------|
| POST /api/calculate         | Carbon footprint result    |
| POST /api/insights          | AI recommendations         |
| POST /api/entries           | Save to history            |
| GET  /api/entries/:deviceId | Load history               |

---

## Troubleshooting

| Problem                     | Fix                                              |
|-----------------------------|--------------------------------------------------|
| Blank page on refresh       | vercel.json rewrites rule handles this ✅        |
| CORS error in browser       | Add Vercel URL to backend ALLOWED_ORIGINS        |
| VITE_API_BASE_URL undefined | Set in Vercel Dashboard → Redeploy               |
| Build fails                 | Run `cd frontend && npm run build` locally first |
