# Deploy to Railway - Step-by-Step

## Step 1: Push Code to GitHub (Required for Railway)

### 1a. Initialize Git Repository
```powershell
cd "d:\facerating-platform 1.0"
git init
git add .
git commit -m "Initial commit - ready for Railway deployment"
```

### 1b. Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository called: `facerating-platform`
3. Do NOT add README, .gitignore, or license (you already have these)
4. Click "Create repository"

### 1c. Push to GitHub
Copy the commands from GitHub (they'll look like this):
```powershell
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/facerating-platform.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

## Step 2: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if prompted
5. Select the `facerating-platform` repository
6. Railway will auto-detect the Dockerfile in `backend-ai/`

---

## Step 3: Configure Railway

1. **Project Settings**:
   - Click on "backend-ai" service
   - Go to "Variables" tab
   - Add these variables (already in your `.env`):
     - PORT: 8000
     - ENV: production
     - SUPABASE_URL: https://ntdtfucregeqlrhshdmf.supabase.co
     - SUPABASE_SERVICE_ROLE_KEY: (copy from your `.env`)
     - SUPABASE_STORAGE_BUCKET: photos
     - FIREBASE_STORAGE_BUCKET: facevalue-9eb02.firebasestorage.app

2. **Domain Settings**:
   - Railway assigns a public URL automatically
   - You'll see it like: `https://facerating-backend-prod-xxxxx.railway.app`

3. **Deployments**:
   - Watch the "Deployments" tab
   - Should show "Success" in green

---

## Step 4: Get Your Backend URL

After successful deployment:
- Railway gives you a public URL
- Example: `https://facerating-backend-prod-xxxxx.railway.app`

---

## Step 5: Update Frontend & Redeploy

Update `frontend/.env`:
```env
VITE_AI_API_URL=https://facerating-backend-prod-xxxxx.railway.app
```

Then redeploy:
```powershell
cd frontend
npm run build
firebase deploy --only hosting
```

---

## ✅ Your Complete System

After these steps:

- **Frontend**: https://facevalue-9eb02.web.app (already live)
- **Backend**: https://facerating-backend-prod-xxxxx.railway.app (newly deployed)
- **Database**: Supabase (configured)

**All live and working!** 🎉

---

## Test It

1. Go to https://facevalue-9eb02.web.app
2. Login as admin: hshasan2004@gmail.com / admin123
3. Try uploading a photo
4. Check Railway logs for success: https://railway.app → Your Project → Logs

If you see `{"status":"ok"}` when visiting the health endpoint, everything works!

```powershell
curl https://facerating-backend-prod-xxxxx.railway.app/api/health
```
