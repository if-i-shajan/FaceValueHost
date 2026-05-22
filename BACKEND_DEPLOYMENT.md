# Backend Deployment Guide

The backend is already configured with a Dockerfile for cloud deployment. Choose one of these options:

## Option 1: Google Cloud Run (Recommended - Integrated with Firebase)

### Prerequisites
- Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Authenticate: `gcloud auth login`
- Set project: `gcloud config set project facevalue-9eb02`

### Deploy
```bash
cd backend-ai
gcloud run deploy photo-upload-service --source . --platform managed --region us-central1 --allow-unauthenticated --memory 512Mi
```

### Update Frontend
After deployment, you'll get a service URL like `https://photo-upload-service-xxxxx.a.run.app`

Update `frontend/.env`:
```
VITE_AI_API_URL=https://photo-upload-service-xxxxx.a.run.app
```

Then rebuild and redeploy:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

## Option 2: Railway.app (Simple - No Setup Required)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your GitHub repo
4. Railway auto-detects Dockerfile and deploys
5. Get the public URL from Railway dashboard

Update frontend with the Railway URL and redeploy.

---

## Option 3: Render (Free Tier Available)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Settings:
   - Build Command: (Leave empty - uses Dockerfile)
   - Start Command: `python -m uvicorn main_simple:app --host 0.0.0.0 --port 8000`
5. Deploy

---

## Option 4: Heroku (Legacy but Still Works)

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. `heroku login`
3. `heroku create photo-upload-service`
4. `git push heroku main`

---

## Current Status

✅ **Frontend**: Deployed to Firebase Hosting  
✅ **Firestore**: Deployed with rules and indexes  
⏳ **Backend**: Ready to deploy (localhost:8000 running locally)

### Running Backend Locally (Current)
```bash
cd backend-ai
python main_simple.py
```

Runs on: http://localhost:8000
- Health check: http://localhost:8000/api/health
- Upload: POST http://localhost:8000/api/upload-photo
- Process: POST http://localhost:8000/api/process-photo

### Features
- ✅ Real MediaPipe face detection
- ✅ Photo storage on backend filesystem
- ✅ Auto-approval (1 face = approved)
- ✅ CORS enabled for cross-origin requests
- ✅ Health check endpoint
- ✅ Blur detection & resolution validation

### After Deploying Backend

1. Get the production backend URL
2. Update `frontend/.env` with new API URL
3. Rebuild frontend: `npm run build`
4. Redeploy frontend: `firebase deploy --only hosting`

That's it! Your entire system will be production-ready.
