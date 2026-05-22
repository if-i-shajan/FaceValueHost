# Deploy to Google Cloud Run

## Prerequisites

### 1. Install Google Cloud SDK
Download from: https://cloud.google.com/sdk/docs/install

### 2. Authenticate with Google Cloud
```powershell
gcloud auth login
```
This will open your browser. Log in with the same Google account that created your Firebase project.

### 3. Set Your Project
```powershell
gcloud config set project facevalue-9eb02
```

## Deployment Steps

### Step 1: Navigate to Backend
```powershell
cd backend-ai
```

### Step 2: Deploy to Cloud Run
```powershell
gcloud run deploy facerating-backend --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --memory 512Mi `
  --timeout 3600 `
  --set-env-vars "ENVIRONMENT=production"
```

**Note**: 
- `--allow-unauthenticated` allows the frontend to call it without authentication
- `--memory 512Mi` is sufficient for face processing
- First deployment takes 5-10 minutes (builds Docker image)

### Step 3: Get Your Service URL

After deployment completes, you'll see output like:
```
Service [facerating-backend] revision [facerating-backend-001] has been deployed
and is serving 100 percent of traffic.
Service URL: https://facerating-backend-xxxxx.a.run.app
```

**Copy the Service URL** - you'll need it next.

### Step 4: Update Frontend Configuration

Go to `frontend/.env` and update:
```env
VITE_AI_API_URL=https://facerating-backend-xxxxx.a.run.app
```
(Replace `xxxxx` with your actual service URL)

### Step 5: Rebuild and Redeploy Frontend

```powershell
cd ../frontend
npm run build
firebase deploy --only hosting
```

## Verify Deployment

### Check Health Endpoint
```powershell
curl https://facerating-backend-xxxxx.a.run.app/api/health
```

You should see: `{"status":"ok"}`

### Test Photo Upload
```powershell
# Replace URL with your service URL
curl -X POST https://facerating-backend-xxxxx.a.run.app/api/upload-photo `
  -H "Content-Type: application/json" `
  -d '{"test": "data"}'
```

## View Logs

```powershell
gcloud run logs read facerating-backend --limit 50
```

## Troubleshooting

### Build Fails
- **Issue**: Docker build fails with "libGL1 not found"
- **Solution**: The Dockerfile already includes required libraries, but if needed, rebuild:
  ```powershell
  gcloud run deploy facerating-backend --source . --platform managed --region us-central1 --allow-unauthenticated --no-gen2
  ```

### Service Returns 500 Error
```powershell
gcloud run logs read facerating-backend --limit 50
```
Check the logs above for the actual error message.

### CORS Issues
The backend is configured for CORS but if you get "No 'Access-Control-Allow-Origin'" errors, your frontend URL might not be in the allowed origins.

### Timeout Issues
Face detection can take time. The `--timeout 3600` gives 1 hour max. You can increase if needed.

## Auto Scaling

Cloud Run automatically scales from 0 to N instances based on traffic:
- **Scales down**: After 15 minutes with no traffic (saves money)
- **Scales up**: Automatically when requests come in
- **Cost**: ~$0.15 per 1M requests + compute time

## Monitoring

View your Cloud Run services:
https://console.cloud.google.com/run

You can:
- See traffic metrics
- View error rates
- Check CPU/memory usage
- Update environment variables
- Manage traffic splits
- View deployment history

## Next: Full System Test

After deployment:

1. **Frontend**: https://facevalue-9eb02.web.app (already deployed)
2. **Backend API**: https://facerating-backend-xxxxx.a.run.app (just deployed)
3. **Database**: Firestore (already deployed)

**Test Flow**:
1. Go to https://facevalue-9eb02.web.app
2. Login as admin (hshasan2004@gmail.com / admin123)
3. Try uploading a photo
4. Check Supabase dashboard to verify data is stored

## Rollback If Needed

If you need to go back to the previous version:
```powershell
gcloud run deploy facerating-backend --image gcr.io/facevalue-9eb02/facerating-backend:prev
```

Or via Cloud Console:
- Go to Cloud Run → facerating-backend → Revisions
- Click on the previous revision
- Click "Promote to Latest"
