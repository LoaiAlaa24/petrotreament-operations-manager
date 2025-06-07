# Railway Deployment Testing Guide

## 🔍 Step 1: Get Your Railway URL

1. Go to your Railway project dashboard
2. Find your app URL (looks like: `https://your-app-name.railway.app`)
3. Copy this URL for testing

## 🧪 Step 2: Basic Health Checks

### A. Test API Health
```bash
# Replace YOUR_URL with your actual Railway URL
curl https://your-app-name.railway.app/health
```
**Expected response:** `{"status":"healthy","database":"connected"}`

### B. Test API Root
```bash
curl https://your-app-name.railway.app/api
```
**Expected response:** JSON with app info

### C. Test Frontend
Open in browser: `https://your-app-name.railway.app`
**Expected:** React login page should load

## 🔐 Step 3: Test Authentication

### A. Test Login API
```bash
curl -X POST "https://your-app-name.railway.app/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=super_admin&password=super123"
```

**Expected response:** 
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### B. Test Frontend Login
1. Go to `https://your-app-name.railway.app`
2. Try logging in with:
   - **Super Admin:** `super_admin` / `super123`
   - **Regular Admin:** `admin` / `admin123`
3. Should redirect to dashboard

## 📊 Step 4: Test Full Application

### A. Dashboard Access
1. Login successfully
2. Should see:
   - Statistics cards (Total Receptions, Vehicles, etc.)
   - "Add Reception" button
   - Navigation menu

### B. Test Vehicle Reception
1. Click "Add Reception" button
2. Fill out the form:
   - Date: Today's date
   - Company: Select any company
   - Vehicles: Enter a number
   - Water Type: Select any type
   - Quantity: Enter a number
3. Click "Create"
4. Should see success message and new record in table

### C. Test Reports
1. Navigate to "Reports" page
2. Set date range
3. Click "Generate PDF"
4. Should download a PDF report

### D. Test Role Permissions
1. Login as regular admin (`admin` / `admin123`)
2. Verify:
   - Can see all records
   - Can only edit/delete own records
   - Cannot see "Generate Financial PDF" button
3. Login as super admin (`super_admin` / `super123`)
4. Verify:
   - Can edit/delete any record
   - Can see "Generate Financial PDF" button

## 🌐 Step 5: Test Language Switching

1. Click language switcher (EN/AR)
2. Interface should switch to Arabic
3. Water types in table should show in Arabic
4. All text should be properly translated

## 🚨 Step 6: Common Issues & Solutions

### Issue: "502 Bad Gateway"
**Solution:** 
- Check Railway logs for errors
- Verify DATABASE_URL is set
- Check if build completed successfully

### Issue: "CORS Error"
**Solution:**
- Set `CORS_ORIGINS_STR` environment variable to your Railway URL
- No trailing slash: `https://your-app.railway.app`

### Issue: Login doesn't work
**Solution:**
- Check if admin users were created (check Railway logs)
- Verify SECRET_KEY is set
- Try the health endpoint first

### Issue: Frontend not loading
**Solution:**
- Check if static files were built properly
- Verify the catch-all route is working
- Check browser console for errors

## 📝 Step 7: Environment Variables Check

In Railway dashboard, ensure these are set:
```
DATABASE_URL=postgresql://... (auto-set by Railway PostgreSQL)
SECRET_KEY=your-32-character-secret-key
CORS_ORIGINS_STR=https://your-app-name.railway.app
PORT=8000 (auto-set by Railway)
```

## 🎯 Success Criteria

✅ API health check passes  
✅ Frontend loads properly  
✅ Can login with both user types  
✅ Can create vehicle receptions  
✅ Can generate reports  
✅ Role permissions work correctly  
✅ Language switching works  
✅ Database persists data  

## 🔧 Debugging Commands

### View Railway Logs
In Railway dashboard:
1. Go to your service
2. Click "Logs" tab
3. Look for startup messages and errors

### Test Database Connection
```bash
curl https://your-app-name.railway.app/health
```

### Test Specific Endpoints
```bash
# Test vehicle receptions (needs auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app-name.railway.app/api/v1/vehicle-receptions/

# Test API docs
open https://your-app-name.railway.app/docs
```

## 📞 Support

If issues persist:
1. Check Railway logs for specific errors
2. Verify all environment variables are set
3. Test each component individually
4. Check database connection status