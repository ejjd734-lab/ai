# Deploy to Vercel

This guide covers deploying the Carbon Footprint Platform to Vercel.

## Important Note

Vercel is ideal for hosting **static frontends**. The backend (FastAPI) must be deployed separately to:
- **Google Cloud Run** (free tier available)
- **Render** (free tier available)  
- **Heroku**, **Railway**, or any other platform supporting Python/FastAPI

## Frontend-Only Deployment (Recommended)

### Step 1: Deploy the Backend First

Follow the main [DEPLOY.md](./DEPLOY.md) guide to deploy the backend to Cloud Run or Render.
Note the deployed backend URL (e.g., `https://carbon-platform-xxx.a.run.app`).

### Step 2: Connect GitHub to Vercel

1. Push your code to GitHub (if not already done):
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. Go to [vercel.com](https://vercel.com) and sign up / log in
3. Click **"New Project"**
4. Select your GitHub repository
5. Configure build settings:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables

Before deploying, add environment variables in Vercel:

1. In the Vercel project settings, go to **Settings → Environment Variables**
2. Add:
   ```
   VITE_API_BASE_URL = https://your-backend-api.com
   ```
   Replace `https://your-backend-api.com` with your actual backend URL

3. Click **Deploy**

### Step 4: Update Backend CORS

Ensure your backend's `ALLOWED_ORIGINS` includes your Vercel URL:

```bash
# For Cloud Run:
gcloud run services update carbon-platform \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://your-vercel-url.vercel.app"

# For Render:
Update the environment variable in your Render dashboard
```

---

## Monorepo Deployment (Both Frontend + Backend on Vercel)

**Not recommended** — Vercel's serverless functions don't easily support FastAPI's ASGI pattern.

If you still want to try:

1. Configure `vercel.json` to build both frontend and backend
2. Create API routes in `api/` directory (requires rewriting FastAPI as Vercel functions)
3. Much more complex than deploying backend separately

**Recommended**: Keep backend on Cloud Run / Render and frontend on Vercel.

---

## Troubleshooting

**"API calls fail with CORS error"**
→ Ensure backend's `ALLOWED_ORIGINS` includes your Vercel URL

**"Blank page / 404 on refresh"**
→ Vercel requires a rewrite rule for SPA routing. Check [vercel.json](./vercel.json) includes:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**"VITE_API_BASE_URL not defined"**
→ Check environment variables are set in Vercel dashboard
→ Redeploy after changing environment variables

---

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Backend `ALLOWED_ORIGINS` updated with Vercel URL
- [ ] Environment variables set in Vercel dashboard
- [ ] Test API calls from Vercel frontend work
- [ ] HTTPS enabled (Vercel handles automatically)
- [ ] Custom domain configured (optional)
