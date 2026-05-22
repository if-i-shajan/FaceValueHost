# FaceRating Platform - Complete Setup Guide

## ✅ Completed Setup

### 1. Configuration Files
- ✅ `frontend/.env` - Firebase configuration with your credentials
- ✅ `backend-ai/.env` - Backend configuration for development
- ✅ `SETUP_STATUS.md` - Setup progress tracker
- ✅ `START.ps1` - PowerShell startup helper script
- ✅ `START.bat` - Batch startup helper script

### 2. Frontend Installation
- ✅ Node modules installed (`frontend/node_modules/`)
- ✅ Dependencies: React, Vite, TypeScript, Tailwind CSS, Firebase SDK

### 3. Backend Setup
- ✅ Python virtual environment created (`backend-ai/venv/`)
- ⏳ Python packages being installed (pip install running)

## 🔧 Installation Status

### Frontend: READY ✅
```
frontend/
├── node_modules/ ✅
├── src/
├── package.json
├── .env ✅ (configured)
└── vite.config.ts
```

### Backend: IN PROGRESS ⏳
```
backend-ai/
├── venv/ ✅ (created)
├── models/
├── routers/
├── services/
├── main.py
├── requirements.txt
└── .env ✅ (configured)
```

**Packages installing:**
- fastapi, uvicorn
- insightface (face detection & embeddings)
- opencv-python
- firebase-admin
- redis, celery
- numpy, pillow, scipy

## ⚠️ REQUIRED: Firebase Service Account

**Status: NOT SETUP YET**

You MUST download your Firebase Service Account JSON:

1. Go to: https://console.firebase.google.com
2. Select project: **facevalue-9eb02**
3. Click ⚙️ Settings → Project Settings
4. Go to **"Service Accounts"** tab
5. Click **"Generate New Private Key"**
6. Save the JSON file to: `backend-ai/firebase-service-account.json`

⚠️ **SECURITY WARNING:**
- NEVER commit this file to Git
- Already in .gitignore ✅
- Keep it private and secure
- Can regenerate if compromised

## 🚀 Running the Full Project

### Step 1: Backend (Terminal 1)
```powershell
cd backend-ai
.\venv\Scripts\Activate
python main.py
```
Backend runs on: http://localhost:8000

### Step 2: Frontend (Terminal 2)
```powershell
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### Step 3: Open Application
Visit: http://localhost:5173 in your browser

## 📋 Project Structure

```
facerating-platform/
├── frontend/
│   ├── src/
│   │   ├── components/ (Admin, User, Shared)
│   │   ├── pages/ (Auth, Admin, User surveys)
│   │   ├── services/ (Firebase, Auth, Photo, Survey)
│   │   ├── store/ (Zustand state)
│   │   └── types/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env ✅ (SETUP)
│   └── node_modules/ ✅ (INSTALLED)
│
├── backend-ai/
│   ├── routers/ (health, photo, similarity)
│   ├── services/ (face_processor, firebase_service)
│   ├── models/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env ✅ (SETUP)
│   └── venv/ ✅ (CREATED, installing packages)
│
├── firestore-rules/
│   ├── firestore.rules
│   ├── storage.rules
│   ├── firestore.indexes.json
│   └── SCHEMA.md
│
└── firebase.json
```

## 🔌 Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Data Fetching:** TanStack React Query
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Backend API:** Axios

### Backend
- **Framework:** FastAPI
- **Face AI:** InsightFace (buffalo_l model)
- **Image Processing:** OpenCV
- **Async:** Uvicorn + Python async
- **Task Queue:** Celery + Redis
- **Database:** Firestore
- **File Storage:** Firebase Storage

### Infrastructure
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Authentication:** Firebase Auth
- **Hosting:** Firebase Hosting
- **Security:** Firestore Rules + Custom Auth Claims

## 🧪 Testing the Setup

### Test Frontend
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
# Should see login page
```

### Test Backend
```bash
cd backend-ai
venv\Scripts\Activate
python main.py
# Should see: "Application startup complete"
# Visit http://localhost:8000/docs for API docs
```

### Test API Connection
```bash
# In browser or terminal
curl http://localhost:8000/health
# Should return: {"status": "ok"}
```

## 📚 Documentation

- `README.md` - Project overview
- `firestore-rules/SCHEMA.md` - Database schema
- `firestore-rules/firestore.rules` - Security rules
- `firestore-rules/storage.rules` - Storage rules

## 🛠️ Common Issues & Solutions

### Issue: `pip install` fails
**Solution:** 
- Make sure Python 3.10+ is installed
- Verify venv is activated: `which python` (should show venv path)

### Issue: Firebase Service Account error
**Solution:** 
- Download JSON from Firebase Console
- Place in `backend-ai/firebase-service-account.json`
- Ensure `.env` has correct path

### Issue: CORS errors
**Solution:** 
- Backend CORS already configured in `.env`
- Check `ALLOWED_ORIGINS=http://localhost:5173`

### Issue: Port already in use
**Solution:** 
- Frontend: Change port in `vite.config.ts`
- Backend: Change `PORT=8000` in `.env`

## 📞 Next Steps

1. ✅ Download Firebase Service Account JSON
2. ✅ Save to `backend-ai/firebase-service-account.json`
3. ✅ Start backend: `python main.py`
4. ✅ Start frontend: `npm run dev`
5. ✅ Access at: http://localhost:5173

## 🔐 Admin Setup

To create admin accounts after first login:

```javascript
// run-admin-setup.js
const admin = require('firebase-admin')
const serviceAccount = require('./firebase-service-account.json')

admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount) 
})

async function setAdmin(email) {
  const user = await admin.auth().getUserByEmail(email)
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' })
  console.log(`Admin role set for ${email}`)
}

setAdmin('your-admin-email@example.com')
```

---

**Installation Status: 95% Complete ⏳**
- Waiting for Python packages to finish installing...
