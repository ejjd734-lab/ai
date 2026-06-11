# Quick Start Guide - Website Running & Ready for Vercel

## ✅ Currently Running

Your website is now running locally:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

Both are fully connected and functional! Try calculating your carbon footprint and saving entries to test.

---

## 📋 Files Updated for Vercel Deployment

1. **`vercel.json`** - Build configuration for Vercel
2. **`frontend/.env.example`** - Environment variable template
3. **`frontend/src/lib/api.ts`** - Updated to support environment variables for API base URL
4. **`VERCEL_DEPLOY.md`** - Complete deployment guide

---

## 🚀 Deploy to Vercel (3 Steps)

### Step 1: Deploy Backend First

Choose one option:

**Option A: Google Cloud Run** (easiest, free tier)
```bash
# From DEPLOY.md, follow "Option 3 — Deploy to Google Cloud Run"
# Result: Get a URL like https://carbon-platform-xxxx.a.run.app
```

**Option B: Render** (also free)
```bash
# From DEPLOY.md, follow "Option 4 — Deploy to Render"
# Result: Get a URL like https://carbon-platform.onrender.com
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: Leave blank (monorepo)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
5. Add Environment Variables (before deploy):
   ```
   VITE_API_BASE_URL = <your-backend-url>
   ```
   Example: `https://carbon-platform-xxxx.a.run.app`

6. Click **Deploy**

### Step 4: Update Backend CORS

Update your backend to allow requests from Vercel:

**For Cloud Run:**
```bash
gcloud run services update carbon-platform \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://your-vercel-app.vercel.app"
```

**For Render:**
Go to Render dashboard → Environment → Add/Update:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

---

## 📚 Documentation

- **Full deployment options**: [DEPLOY.md](./DEPLOY.md)
- **Vercel-specific guide**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
- **Backend setup**: `backend/` with FastAPI
- **Frontend setup**: `frontend/` with React + Vite

---

## 🐛 Troubleshooting

**Frontend won't connect to API?**
- Check `VITE_API_BASE_URL` is set in Vercel
- Verify backend's `ALLOWED_ORIGINS` includes your Vercel URL
- Check browser console for CORS errors

**Build fails on Vercel?**
- Ensure `vercel.json` is correct
- Check that `frontend/dist` exists after local build: `cd frontend && npm run build`
- Verify all dependencies are listed in `package.json`

**API returns 422 errors?**
- Check input values are valid (household_size ≥ 1, etc.)
- See API docs at http://localhost:8000/docs

---

## 📝 Next Steps

1. ✅ Website is running locally
2. ⬜ Deploy backend to Cloud Run or Render
3. ⬜ Connect GitHub to Vercel
4. ⬜ Set environment variables in Vercel
5. ⬜ Deploy frontend to Vercel
6. ⬜ Update backend CORS settings

Enjoy your Carbon Footprint Platform! 🌍
