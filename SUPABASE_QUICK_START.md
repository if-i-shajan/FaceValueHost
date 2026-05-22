# Supabase Quick Start Guide

Complete step-by-step guide to set up Supabase and get your FaceRating platform running with database storage.

## 📋 Prerequisites

- [ ] Supabase account (free tier is fine)
- [ ] Project workspace open in VS Code
- [ ] Backend & frontend .env files ready

---

## 🚀 Step 1: Create Supabase Project

### 1.1 Go to Supabase
- Visit: https://supabase.com
- Click **"Start Your Project"** (or login if you have account)
- Sign up with GitHub or email

### 1.2 Create New Project
- Click **"New project"**
- **Project name**: `facerating-platform`
- **Database password**: Create a strong password (save it!)
- **Region**: Select closest to your users (e.g., us-west for US)
- Click **"Create new project"**

⏳ Wait 2-3 minutes for project initialization...

### 1.3 Verify Project Created
- You should see the Supabase dashboard
- URL in address bar: `https://app.supabase.com/projects/your-project-id`
- Dashboard has tabs: SQL, Database, API, etc.

---

## 🔑 Step 2: Get Your Credentials

### 2.1 Get API Credentials
1. Go to **Settings** (bottom left) → **API**
2. You'll see:
   - **Project URL** - Copy this
   - **Anon Key** - Copy this (public, safe to share)
   - **Service Role Key** - Copy this (KEEP SECRET!)

### 2.2 Fill Backend `.env`

Edit `backend-ai/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (the long key)
SUPABASE_STORAGE_BUCKET=photos
```

To find your project ID:
- Go to Settings → API
- Project URL is: `https://[YOUR-PROJECT-ID].supabase.co`

### 2.3 Fill Frontend `.env.local`

Edit `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (the Anon Key)
VITE_API_URL=http://localhost:8000
```

---

## 📦 Step 3: Create Database Schema

### 3.1 Go to SQL Editor
1. Open Supabase dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query** or **New SQL Snippet**

### 3.2 Execute SQL Migration
1. Open [database-migration.sql](database-migration.sql) file in your project
2. Copy all the SQL code
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (or Ctrl+Enter)

⏳ Wait for execution to complete (~10 seconds)

✅ You should see: "Success. No rows returned"

### 3.3 Verify Tables Created
1. Click **Table Editor** (left sidebar)
2. You should see these tables:
   - `users`
   - `surveys`
   - `persons`
   - `photos`
   - `participants`
   - `ratings`
   - `attention_checks`
   - `attention_check_results`

---

## 📸 Step 4: Create Storage Bucket

### 4.1 Go to Storage
1. Click **Storage** (left sidebar)
2. Click **Create a new bucket**

### 4.2 Configure Bucket
- **Bucket name**: `photos`
- **Public bucket**: Toggle **ON** ✅
- Click **Create bucket**

### 4.3 Set Bucket Permissions
1. Click on the `photos` bucket
2. Go to **Policies** tab
3. Click **New policy**
4. Choose **For public buckets**
5. Select all permissions (SELECT, INSERT, UPDATE, DELETE)
6. Click **Review**
7. Click **Save policy**

---

## 🐍 Step 5: Install Backend Dependencies

### 5.1 Activate Virtual Environment

**Windows (PowerShell):**
```powershell
cd backend-ai
.\venv\Scripts\Activate
```

**Windows (Command Prompt):**
```cmd
cd backend-ai
venv\Scripts\activate.bat
```

**Mac/Linux:**
```bash
cd backend-ai
source venv/bin/activate
```

### 5.2 Install Required Packages
```bash
pip install supabase python-multipart
```

### 5.3 Verify Installation
```python
python -c "import supabase; print('✅ Supabase SDK installed')"
```

---

## 🧪 Step 6: Test Database Connection

### 6.1 Create Test Script

Create `backend-ai/test_supabase_connection.py`:

```python
"""Test Supabase database connection"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"Connecting to: {supabase_url}")

try:
    # Create Supabase client
    client = create_client(supabase_url, supabase_key)
    
    # Test connection
    response = client.table("users").select("count", count="exact").execute()
    
    print("✅ Supabase connection successful!")
    print(f"   Users table: {response.count} records")
    
    # List all tables
    print("\n✅ Database tables:")
    tables = [
        "users", "surveys", "persons", "photos", 
        "participants", "ratings", "attention_checks"
    ]
    for table in tables:
        try:
            resp = client.table(table).select("count", count="exact").execute()
            print(f"   ✅ {table}: {resp.count} records")
        except Exception as e:
            print(f"   ❌ {table}: {str(e)}")
    
except Exception as e:
    print(f"❌ Connection failed: {str(e)}")
    print("\nTroubleshooting:")
    print("1. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    print("2. Make sure your Supabase project is created")
    print("3. Verify environment variables are set correctly")
```

### 6.2 Run Test
```bash
python test_supabase_connection.py
```

✅ Expected output:
```
✅ Supabase connection successful!
   Users table: 0 records
✅ Database tables:
   ✅ users: 0 records
   ✅ surveys: 0 records
   ... etc
```

---

## 🚀 Step 7: Start the Project

### 7.1 Terminal 1 - Start Backend

```powershell
cd backend-ai
.\venv\Scripts\Activate
python main.py
```

Wait for output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 7.2 Terminal 2 - Start Frontend

```bash
cd frontend
npm run dev
```

Wait for output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 7.3 Open Application

- Go to: http://localhost:5173
- You should see the login page
- Try creating an account

---

## ✅ Step 8: Verify Data Storage

### 8.1 Take an Action in App
1. Register a new user
2. Check Supabase dashboard

### 8.2 Check Data in Supabase
1. Go to Supabase dashboard
2. Click **Table Editor**
3. Click **users** table
4. You should see your new user record! ✅

### 8.3 Check Other Tables
- Create a survey → check `surveys` table
- Upload photos → check `photos` table
- Submit ratings → check `ratings` table

---

## 🐛 Troubleshooting

### Issue: "Supabase connection failed"

**Solution 1: Check credentials**
```bash
# In backend-ai folder
cat .env | grep SUPABASE
```

Verify values match Supabase Settings → API

**Solution 2: Verify Project URL**
- URL should be: `https://[project-id].supabase.co`
- Not: `https://app.supabase.com/...`

**Solution 3: Check Service Role Key**
- Must use **Service Role Key**, not Anon Key
- Anon Key won't have write permissions for setup

### Issue: "Table does not exist" error

**Solution:**
1. Go to Supabase SQL Editor
2. Re-run [database-migration.sql](database-migration.sql)
3. Wait for execution to complete

### Issue: "Permission denied" on photo upload

**Solution 1: Check storage bucket permissions**
1. Go to Storage → photos bucket
2. Click Policies tab
3. Ensure public read/write policies exist

**Solution 2: Check RLS policies**
1. Go to SQL Editor
2. Run: `SELECT * FROM pg_policies;`
3. Verify RLS policies are created

### Issue: Photos uploading but not showing

**Solution:**
1. Check `photos` table in Supabase
2. Verify `status` is `'approved'`, not `'pending'`
3. Check `processed_url` and `thumbnail_url` are not null

---

## 📊 Monitoring Your Database

### Check Database Size
1. Go to Supabase dashboard
2. Click **Reports** → **Usage**
3. See storage, requests, etc.

### View Database Activity
1. Click **Database** (left sidebar)
2. Check **Backups** tab
3. Monitor **Query performance**

### Export Data
1. Go to **SQL Editor**
2. Run: `SELECT * FROM ratings;`
3. Click **Download as CSV**

---

## 🔐 Security Checklist

- [ ] Service Role Key is in `.env` (not in `.env.example`)
- [ ] `.env` is in `.gitignore` (never commit!)
- [ ] Anon Key only in frontend `.env.local`
- [ ] RLS policies are enabled on all tables
- [ ] Storage bucket has proper access policies
- [ ] Database backups are enabled

---

## 📚 Next Steps

1. ✅ Database created
2. ✅ Connection tested
3. ✅ Project running
4. ⏭️ Create test survey
5. ⏭️ Upload test photos
6. ⏭️ Submit test ratings
7. ⏭️ View analytics and reports

---

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase Python SDK](https://github.com/supabase-community/supabase-py)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## ❓ Need Help?

1. Check Supabase **Logs** tab for errors
2. Look at browser console (F12) for frontend errors
3. Check terminal for backend errors (scroll up)
4. Join [Supabase Discord](https://discord.supabase.com)
5. Open GitHub issue if needed

---

**You're all set! 🎉**

Your FaceRating platform now has:
- ✅ Secure database (PostgreSQL + Supabase)
- ✅ Cloud storage for images
- ✅ User authentication
- ✅ Data backup & management
- ✅ Built-in security (RLS policies)
