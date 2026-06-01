# 🔴 Errors Explained & How to Fix

## What's Happening

Your console shows: **"Failed to fetch"** errors

**Why?** Three issues:

1. ❌ **Backend server NOT running** - Frontend tries to call `http://localhost:3001/` but nothing's listening
2. ❌ **Airbnb URL is placeholder** - Still says `YOUR_LISTING_ID` and `YOUR_TOKEN`  
3. ❌ **npm packages not installed** - `express` and `cors` might be missing

---

## ✅ Fix in 3 Steps

### Step 1: Install Dependencies
```bash
cd c:\Users\C2\Downloads\management\Tvum_suites_frontend
npm install
```

This installs `express` and `cors` packages.

### Step 2: Get Your Airbnb URL

**Go to your Airbnb listing:**
1. Log in to Airbnb
2. Your listings
3. Click any listing (Green, Yellow, Blue, or Pink - doesn't matter)
4. Click **Calendar** tab
5. Click **⋮** (three dots) top right
6. Click **Calendar settings**
7. Look for **"Sync with external calendar"**
8. Click that section to expand
9. **Copy the full iCal URL**

Should look like:
```
https://www.airbnb.com/calendar/ical/1485186105229796857.ics?t=fb598c948fbf4772810821cd182f9a68&locale=en-IN
```

**Copy the ENTIRE URL with the `t=...` token**

### Step 3: Update Configuration

**File:** `src/lib/airbnb-config.ts`

**Find line 8** (has YOUR_LISTING_ID):
```typescript
icalUrl: 'https://www.airbnb.com/calendar/ical/YOUR_LISTING_ID.ics?t=YOUR_TOKEN&locale=en-IN',
```

**Replace with your actual URL:**
```typescript
icalUrl: 'https://www.airbnb.com/calendar/ical/1485186105229796857.ics?t=fb598c948fbf4772810821cd182f9a68&locale=en-IN',
```

---

## 🚀 Run Both Servers

### Terminal 1: Backend Proxy
```bash
npm run dev:server
```

You should see:
```
Airbnb proxy running on http://localhost:3001
Endpoint: http://localhost:3001/api/airbnb/ical?url=<ICAL_URL>
```

### Terminal 2: Frontend
```bash
npm run dev
```

You should see:
```
VITE v5.4.19  ready in ... ms
➜  Local:   http://localhost:5173/
```

---

## ✅ Verify It Works

1. Open browser: `http://localhost:5173`
2. Log in
3. Open console (F12)
4. Look for: **"Fetched X events from Airbnb"** ← If you see this, it worked! ✅
5. Go to **Dashboard** - should see bookings

---

## 🔧 Troubleshooting

### "Failed to fetch" error in console
**Cause:** Backend not running

**Fix:**
```bash
npm run dev:server
```

### "Airbnb returned 404" or "Cannot fetch"
**Cause:** Wrong URL

**Fix:**
- Double-check Airbnb URL is complete (includes `t=...` token)
- URL should start with: `https://www.airbnb.com/calendar/ical/`

### "npm: command not found"
**Cause:** Node.js not installed

**Fix:**
- Install Node.js from https://nodejs.org
- Restart terminal
- Run `npm install` again

### Still getting errors?
**Check:**
1. Both terminals show "running" messages
2. URL is pasted correctly (no copy mistakes)
3. Browser is at `http://localhost:5173` (not localhost:3000)
4. Check both servers are actually running (not just terminal windows)

---

## 📊 How It Should Look

**Terminal 1 (Backend):**
```
Airbnb proxy running on http://localhost:3001
Endpoint: http://localhost:3001/api/airbnb/ical?url=<ICAL_URL>
```

**Terminal 2 (Frontend):**
```
VITE v5.4.19  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

**Browser Console:**
```
Fetched 5 events from Airbnb ✅
Converted to 5 bookings
Sync successful
```

**Dashboard:**
Shows your Airbnb bookings ✅

---

## 💡 Remember

- **Airbnb URL** - Get from Airbnb Calendar Settings (copy the full link with token)
- **Backend Server** - Must be running on port 3001
- **Frontend** - Must be running on port 5173
- **Both** - Both need to be running at the same time

**That's it!** Once you paste the URL and run both servers, auto-sync works automatically! 🎉
