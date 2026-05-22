# FaceRater Research Platform

A production-ready, full-stack AI-powered face rating platform for academic research, perception analysis, and psychological experiments.

---

## Architecture

```
facerating-platform/
├── frontend/          # React + Vite + TypeScript + Tailwind
├── backend-ai/        # Python FastAPI + InsightFace + OpenCV
├── firestore-rules/   # Firestore & Storage security rules + schema
└── firebase.json      # Firebase project config
```

---

## Quick Start

### 1. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore** (production mode)
4. Enable **Storage**
5. Enable **Hosting**

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your Firebase config values in .env
npm install
npm run dev
```

### 3. AI Backend Setup

```bash
cd backend-ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in Firebase service account path and bucket name
python main.py
```

### 4. Deploy Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules,storage
```

### 5. Deploy Frontend

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

## Setting Up Admin Accounts

Admin accounts require Firebase Custom Claims. Use the Firebase Admin SDK:

```javascript
// run-admin-setup.js (Node.js script)
const admin = require('firebase-admin')
const serviceAccount = require('./firebase-service-account.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

async function setAdmin(email) {
  const user = await admin.auth().getUserByEmail(email)
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' })
  console.log(`Admin role set for ${email}`)
}

setAdmin('admin@yourorg.com')
```

Run: `node run-admin-setup.js`

---

## AI Backend Configuration

The FastAPI backend uses **InsightFace** (buffalo_l model) for:
- Face detection
- Face alignment
- 512-dim embedding extraction
- Duplicate detection via cosine similarity

**First run** will auto-download the buffalo_l model (~300MB).

Fallback to OpenCV Haar cascade if InsightFace unavailable.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/process-photo` | Process uploaded photo |
| POST | `/api/reprocess-photo` | Re-run AI on existing photo |
| POST | `/api/find-similar` | Find similar faces |
| POST | `/api/detect-duplicates` | Scan for duplicate faces |

---

## Platform Features

### User Panel
- Registration with demographics (name, email, age, gender, country)
- Dashboard with active/completed surveys
- Step-by-step survey flow: Rules → Consent → Rating
- Resume support (session persists across refreshes/logouts)
- Anti-cheat: viewing timer, fast-rating detection, break system
- 1–10 rating scale with keyboard shortcuts

### Admin Panel
- Collapsible sidebar navigation
- Dashboard with charts (participation trend, gender breakdown, rating distribution)
- Survey CRUD with full settings control
- Photo Manager: per-person slot grid, drag-drop upload, bulk upload
- AI processing pipeline: auto-detect, crop, align, validate
- Participants table with quality scores and suspicious flags
- Results: per-image average rating charts
- Reports: CSV export with full statistics
- Settings: photo ID format configuration

---

## Security

- Firebase Custom Claims for role-based access
- Firestore Security Rules (no admin data leaked to users)
- Storage Rules (users can only read approved photos)
- Server-side role validation on AI backend
- Rate limiting via Firebase App Check (optional)
- Anti-cheat: response time monitoring, identical rating detection

---

## Performance

- Lazy-loaded route chunks (Vite code splitting)
- Compressed WEBP images (512×512 processed, 128×128 thumbnails)
- Zustand for minimal re-renders
- TanStack Query for caching & stale data management
- Firestore pagination for large datasets
- CDN delivery via Firebase Hosting

---

## Mobile Responsiveness

All pages fully responsive. Rating interface optimized for mobile touch with:
- Large tap targets for rating buttons
- Swipe-friendly layout
- Portrait-optimized image display

---

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_AI_API_URL=https://your-ai-backend.com
```

### AI Backend (`backend-ai/.env`)
```
PORT=8000
ENV=production
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
ALLOWED_ORIGINS=https://your-frontend.web.app
```

---

## Production Deployment

### AI Backend (Cloud Run / Railway / Render)

```bash
# Dockerfile included - deploy to any container platform
docker build -t facerating-ai .
docker run -p 8000:8000 --env-file .env facerating-ai
```

### Recommended Stack
- Frontend: Firebase Hosting (CDN, free tier generous)
- AI Backend: Google Cloud Run (auto-scaling, pay-per-request)
- Database: Firestore (serverless, scales automatically)
- Storage: Firebase Storage (CDN-backed)
- Queue: Redis + Celery for async AI processing at scale

---

## Support

For academic/research use. Contributions welcome via GitHub.
