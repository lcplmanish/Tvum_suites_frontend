# Airbnb Sync - Deployment Guide

## 🆕 New Features in This Version
- **Airbnb iCal Proxy**: Server-side proxy to fetch Airbnb calendars (solves CORS issues)
- **Calendar Sync Service**: Automatic sync between Airbnb and Supabase
- **Real-time Updates**: WebSocket support for live updates
- **Booking Integration**: Auto-create bookings from Airbnb listings

## 📋 Pre-Deployment Steps

### 1. Verify Git Repository is Ready
```bash
# On your local machine
git status
git add .
git commit -m "Airbnb sync integration update"
git push origin main
```

### 2. Update Contabo Environment Variables
SSH into your Contabo server and update `.env`:
```bash
ssh root@tvumsuites.in
cd /var/www/tvum-suites-frontend

# Edit .env and verify these settings:
nano .env
```

**Required Environment Variables:**
```
# Production Settings
PRODUCTION_DOMAIN=tvumsuites.in
NODE_ENV=production
PORT=3001

# Supabase (your existing keys)
VITE_SUPABASE_URL=https://api.tvumsuites.in
VITE_SUPABASE_ANON_KEY=<your-key>
SUPABASE_URL=https://api.tvumsuites.in
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

## 🚀 Deployment Options

### Option A: Automated Deployment (Recommended)
Upload and run the deployment script:

```bash
# Copy script to Contabo
scp DEPLOY_UPDATE.sh root@tvumsuites.in:/var/www/tvum-suites-frontend/

# SSH into Contabo
ssh root@tvumsuites.in

# Run deployment
cd /var/www/tvum-suites-frontend
chmod +x DEPLOY_UPDATE.sh
./DEPLOY_UPDATE.sh
```

**What this does:**
- ✅ Creates automatic backup
- ✅ Pulls latest code from Git
- ✅ Installs new dependencies
- ✅ Builds frontend
- ✅ Restarts services gracefully
- ✅ Verifies deployment success
- ✅ Provides rollback command if needed

### Option B: Manual Deployment
If you prefer to deploy manually:

```bash
# SSH into Contabo
ssh root@tvumsuites.in

# Navigate to project
cd /var/www/tvum-suites-frontend

# Backup current version
cp -r . ../tvum-suites-backup-$(date +%Y%m%d-%H%M%S)

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build frontend
npm run build

# Restart backend service
pm2 restart tvum-server

# Reload Nginx (zero downtime)
systemctl reload nginx

# Verify
pm2 status
pm2 logs tvum-server
```

## ✅ Post-Deployment Verification

### 1. Check Services Status
```bash
pm2 status
```
Expected output: Both `tvum-server` and frontend should show `online`

### 2. Test Backend API
```bash
# Health check
curl https://tvumsuites.in/health

# Airbnb proxy endpoint (requires valid Airbnb iCal URL)
curl https://tvumsuites.in/api/airbnb/ical?url=<your-ical-url>

# Calendar endpoint
curl https://tvumsuites.in/api/calendar/rooms/101
```

### 3. Test Frontend
Open in browser:
- `https://tvumsuites.in` - Main app
- Check browser console for errors
- Test Airbnb sync functionality

### 4. Monitor Logs
```bash
# Backend logs
pm2 logs tvum-server

# Nginx logs (errors)
tail -f /var/log/nginx/error.log

# Full status
pm2 monit
```

## 🔧 Airbnb Sync Configuration

### 1. Get Airbnb iCal URLs
- Log into your Airbnb Host Center
- Go to **Calendar** → **Sync with external calendar**
- Get the iCal feed URL for each listing

### 2. Configure in Supabase
Add Airbnb listings to the database:
```sql
INSERT INTO listings (
  airbnb_id,
  ical_url,
  room_number,
  sync_enabled,
  last_synced
) VALUES (
  'your-listing-id',
  'https://calendar.airbnb.com/ical/...',
  '101',
  true,
  NULL
);
```

### 3. Test Sync (if enabled in code)
```bash
# From Contabo server
curl -X POST https://tvumsuites.in/api/airbnb/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{"listing_id": "your-listing-id"}'
```

## 🆘 Troubleshooting

### Issue: Airbnb proxy not working
**Error:** `CORS error` or `Failed to fetch from Airbnb`

**Solution:**
1. Verify Airbnb iCal URL is valid
2. Check server logs: `pm2 logs tvum-server`
3. Ensure firewall allows outbound HTTPS (port 443)
4. Test manually: `curl "https://calendar.airbnb.com/ical/..."`

### Issue: Services won't start after update
**Error:** PM2 shows `errored` status

**Solution:**
```bash
# Rollback to backup
rm -rf /var/www/tvum-suites-frontend
mv /var/www/tvum-suites-backup-XXXXXXXX /var/www/tvum-suites-frontend

# Reinstall and restart
cd /var/www/tvum-suites-frontend
npm install
pm2 restart tvum-server
```

### Issue: CORS errors on frontend
**Error:** Browser blocks requests to `/api/` endpoints

**Solution:**
1. Verify `PRODUCTION_DOMAIN=tvumsuites.in` in `.env`
2. Restart backend: `pm2 restart tvum-server`
3. Clear browser cache: `Ctrl+Shift+Delete`

### Issue: High memory usage
**Solution:**
```bash
# Monitor in real-time
pm2 monit

# If backend crashes, increase Node heap:
pm2 delete tvum-server
pm2 start server.js --name "tvum-server" --max-memory-restart 500M
```

## 📊 Performance Monitoring

### Real-time Dashboard
```bash
pm2 monit
```

### Check disk space (important for backups)
```bash
df -h
```

### View recent errors
```bash
pm2 logs tvum-server --err
```

### CPU & Memory usage
```bash
pm2 info tvum-server
```

## 📅 Scheduled Tasks

### Auto-sync Airbnb calendars (Optional)
Create a cron job to sync Airbnb periodically:

```bash
crontab -e

# Add this line to sync every 30 minutes:
*/30 * * * * curl -s https://tvumsuites.in/api/airbnb/sync > /dev/null
```

## 🔄 Rollback Procedure

If deployment causes issues:

```bash
# Option 1: Quick rollback (if backup exists)
rm -rf /var/www/tvum-suites-frontend
mv /var/www/tvum-suites-backup-XXXXXXXX /var/www/tvum-suites-frontend
cd /var/www/tvum-suites-frontend
npm install
pm2 restart tvum-server
systemctl reload nginx

# Option 2: Git rollback (if git history exists)
cd /var/www/tvum-suites-frontend
git log --oneline  # Find previous commit
git reset --hard <commit-hash>
npm install
pm2 restart tvum-server
```

## ✨ Next Steps

1. **Deploy using DEPLOY_UPDATE.sh script** (easiest)
2. **Verify all endpoints are working**
3. **Test Airbnb sync on a test listing**
4. **Monitor logs for 24 hours**
5. **Set up automated backups** (if not already done)

---
**Questions?** Check logs with `pm2 logs tvum-server` or email your hosting provider.
