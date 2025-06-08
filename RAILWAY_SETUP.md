# Railway Setup Guide - Fix Database Issues

## 🚨 Current Issue: Database Not Connected

The error means your Railway project doesn't have a PostgreSQL database properly configured.

## ✅ Step-by-Step Fix:

### 1. Add PostgreSQL Database to Railway

1. **Go to your Railway project dashboard**
2. **Click "New" button** 
3. **Select "Database" → "PostgreSQL"**
4. **Railway will automatically:**
   - Create a PostgreSQL instance
   - Set the `DATABASE_URL` environment variable
   - Connect it to your app

### 2. Verify Environment Variables

In your Railway project dashboard, check **Variables** tab:

**Should see these automatically set:**
```
DATABASE_URL=postgresql://postgres:password@host:port/database
PORT=8000 (or similar)
```

**You need to manually add:**
```
SECRET_KEY=your-32-character-secure-key-here
CORS_ORIGINS_STR=https://your-app-name.railway.app
```

### 3. Generate a Secure SECRET_KEY

```bash
# Run this command to generate a secure key:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and add it as `SECRET_KEY` in Railway variables.

### 4. Set CORS_ORIGINS_STR

In Railway variables, add:
```
CORS_ORIGINS_STR=https://your-app-name.railway.app
```
(Replace `your-app-name` with your actual Railway app URL)

### 5. Redeploy

After adding the database and environment variables:
1. Railway should automatically redeploy
2. Or manually trigger redeploy from Railway dashboard

## 🔍 How to Check if It's Working:

### A. Check Railway Logs
1. Go to your Railway project
2. Click on your service 
3. Go to "Logs" tab
4. Look for: `🔗 Connecting to database: postgresql://...`

### B. Test Health Endpoint
```bash
curl https://your-app-name.railway.app/health
```
**Should return:** `{"status":"healthy","database":"connected"}`

### C. Test in Browser
Go to: `https://your-app-name.railway.app`
Should show the login page without errors.

## 🚨 Common Issues:

### Issue: "No DATABASE_URL found"
**Solution:** Add PostgreSQL database in Railway dashboard

### Issue: "postgres:// not supported"
**Solution:** Fixed in latest code - converts to postgresql:// automatically

### Issue: "Connection timeout"
**Solution:** Railway PostgreSQL might be starting up - wait 2-3 minutes

### Issue: "CORS errors in browser"
**Solution:** Set `CORS_ORIGINS_STR` to your exact Railway app URL

## 📋 Final Checklist:

- [ ] PostgreSQL database added to Railway project
- [ ] `DATABASE_URL` automatically set by Railway
- [ ] `SECRET_KEY` manually added (32+ characters)
- [ ] `CORS_ORIGINS_STR` set to your Railway app URL
- [ ] App successfully redeployed
- [ ] Health endpoint returns "connected"
- [ ] Frontend loads without errors

## 🆘 If Still Not Working:

1. **Check Railway logs** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Try manually redeploying** from Railway dashboard
4. **Check that PostgreSQL service is running** in Railway

The most common issue is forgetting to add the PostgreSQL database to the Railway project!