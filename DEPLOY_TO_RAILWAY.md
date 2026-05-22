# Deploy Backend to Railway.app (Free)

## Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Sign up with GitHub"
3. Authorize Railway to access your repositories
4. You're in!

## Step 2: Create New Project

1. Click "New Project" 
2. Select "Deploy from GitHub repo"
3. Search for your repository (facerating-platform or similar)
4. Click to authorize Railway access to that repo

## Step 3: Configure Deployment

Railway should auto-detect the Dockerfile in `backend-ai/`

**If it doesn't:**
- Go to Project Settings
- Set Root Directory: `backend-ai`
- Dockerfile: `Dockerfile` (should be auto-detected)

## Step 4: Set Environment Variables

In Railway dashboard:
1. Click on your deployed service
2. Go to "Variables" tab
3. Add these variables:
```
ENVIRONMENT=production
SUPABASE_URL=https://ntdtfucregeqlrhshdmf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-key-from-.env>
```

## Step 5: Deploy

1. Go back to "Deployments" tab
2. Railway automatically deploys when you push to GitHub
3. Check deployment status (should show "Success")
4. Copy the public URL

## Step 6: Get Your Backend URL

In Railway dashboard:
- Your service should show a public URL like: `https://facerating-backend-prod-xxxxx.railway.app`

## Step 7: Update Frontend

Update `frontend/.env`:
```env
VITE_AI_API_URL=https://facerating-backend-prod-xxxxx.railway.app
```

## Step 8: Redeploy Frontend

```powershell
cd frontend
npm run build
firebase deploy --only hosting
```

Done! ✅

---

## Verify It Works

Test the health endpoint:
```powershell
curl https://facerating-backend-prod-xxxxx.railway.app/api/health
```

Should return: `{"status":"ok"}`

---

## Railway Free Tier Limits

- ✅ Up to 5 projects
- ✅ $5 free credit/month (enough for small deployments)
- ✅ Auto-scales with traffic
- ✅ 24/7 uptime

## Live System

When complete:
- **Frontend**: https://facevalue-9eb02.web.app ← Already live
- **Backend**: https://facerating-backend-prod-xxxxx.railway.app ← Just deployed
- **Database**: Supabase ← Already configured

All on one platform stack! 🎉
