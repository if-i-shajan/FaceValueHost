# 🚀 Quick Start Guide

## Access the System

**URL**: https://facevalue-9eb02.web.app

### Admin Login
- **Email**: hshasan2004@gmail.com
- **Password**: admin123

---

## 📸 Upload Photos Workflow

### Step 1: Go to Photo Manager
1. Click **"Photo Manager"** in left sidebar
2. Select a **Survey** from dropdown (e.g., "aaa")

### Step 2: Upload Photos
- **Drag & drop** photos onto the upload area
- **Or** click "Choose File" to select individually
- Supported: JPG, PNG, WEBP

### Step 3: Auto-Processing
- Photos automatically upload
- Face detection runs automatically
- Status shows: Processing → Approved/Rejected
- Green ✓ = Face detected (1 face = auto-approved)
- Red ✗ = No face or multiple faces

### Step 4: Manage
- **Hover over photo** to see Delete/Approve buttons
- **Delete**: Remove photo from system
- **Approve**: Override rejection (if needed)
- **Stats**: See total Approved/Processing/Rejected count

---

## 👥 Person & Slot Management

### Auto-Creation
When you upload photos:
1. First 3 photos → Person P001
2. Next 3 photos → Person P002
3. And so on... ✅ Auto-creates persons!

### Configure Slots
- **Slots per person**: Select 1, 3, 5, 7, or 10
- Default: 3 slots per person
- Change before uploading

### Add Person Manually
- Click **"Add Person"** button
- New person created (P005, P006, etc.)
- Ready for uploads

---

## 📊 Dashboard Features

- **Dashboard**: Overall platform stats
- **Surveys**: Create/edit survey settings
- **Participants**: Manage participant list
- **Photo Manager**: Upload and manage photos ⭐
- **Results**: View completed surveys
- **Reports**: Generate research reports
- **Settings**: Configure preferences

---

## 🎯 Face Detection Rules

✅ **Approved**: Exactly 1 face detected with:
- Confidence > 50%
- Resolution > 200x200px
- Not blurry (Laplacian variance > 100)

❌ **Rejected**: 
- No face detected
- Multiple faces detected
- Low quality (blurry/low resolution)
- Low confidence

---

## 🔍 Tips & Tricks

### Bulk Upload
- Drag multiple photos at once
- System auto-creates persons and fills slots
- Perfect for adding 10+ photos quickly

### Quality Check
- Photos must have clear, single face
- Front-facing works best
- Avoid: Group photos, blurry, too small
- Resolution: Minimum 200x200 pixels

### Approval Workflow
1. Upload photos
2. Review auto-approved list
3. Override rejections if needed
4. Delete unwanted photos
5. Continue adding more

### Best Practices
- Use clear, well-lit photos
- Ensure face fills ~50% of image
- Use multiple angles/expressions per person
- 3-10 photos per person recommended
- Check approval count regularly

---

## 🛠️ Troubleshooting

### Photos Not Showing
- Refresh page (Ctrl+F5)
- Check browser console (F12)
- Ensure backend is running (localhost:8000)

### Upload Fails
- Check file format (JPG/PNG/WEBP only)
- File size < 10MB
- Stable internet connection

### Face Not Detected
- Face must be clear and distinct
- Minimum 200x200 pixels
- No glasses or masks partially covering face
- Try different angle/lighting

### Count Shows Wrong Number
- Refresh page to sync Firestore
- Check pending photos (may still processing)
- Delete duplicates if needed

---

## 📞 Support

For issues, check:
1. **Browser Console** (F12) - Check for errors
2. **Backend Health**: http://localhost:8000/api/health
3. **Documentation**: DEPLOYMENT_STATUS.md

---

## ⚡ Keyboard Shortcuts

- `Ctrl+F5` - Hard refresh (clear cache)
- `F12` - Developer tools (debug)
- `Tab` - Navigate dropdowns
- `Enter` - Select survey/option

---

## 🎓 Example Workflow

1. **Login** with admin credentials
2. **Select Survey** "aaa" from dropdown
3. **Prepare 6 photos** of clear faces
4. **Drag photos** onto upload area
5. **Wait 10 seconds** for processing
6. **See results**: 2 persons created (P001, P002) with photos
7. **Approve/Delete** as needed
8. **Repeat** to add more persons

**That's it!** Your photo research data is ready to analyze.

---

*Last Updated: May 20, 2026*
