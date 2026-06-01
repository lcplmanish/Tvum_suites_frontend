# Airbnb Sync Setup - Complete Guide

## ✅ What's Already Set Up

- ✅ **Single URL** - All rooms use the same Airbnb iCal link
- ✅ **CORS Fixed** - Backend proxy server handles Airbnb requests
- ✅ **Auto-Sync** - Automatic sync when user logs in (no manual sync button needed)
- ✅ **Backend Server** - `server.js` created and ready to run

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Airbnb iCal URL

1. Go to **Airbnb** → **Your listings**
2. Click your **listing** (any room)
3. Go to **Calendar** tab
4. Click **⋮ (three dots)** in top right
5. Select **Calendar settings**
6. Click **Sync with external calendar**
7. **Copy the full iCal link** (starts with `https://www.airbnb.com/calendar/ical/...`)

**Your URL:**
```
https://www.airbnb.com/calendar/ical/1485186105229796857.ics?t=fb598c948fbf4772810821cd182f9a68&locale=en-IN
```

✅ This is already configured in your `airbnb-config.ts`

---

### Step 2: Update Configuration

**File:** `src/lib/airbnb-config.ts`

Replace `YOUR_LISTING_ID` and `YOUR_TOKEN`:

```typescript
export const AIRBNB_CONFIG = {
  // Paste your Airbnb iCal URL here
  icalUrl: 'https://www.airbnb.com/calendar/ical/1485186105229796857.ics?t=fb598c948fbf4772810821cd182f9a68&locale=en-IN',
  
  // All rooms use the same URL
  listings: [
    { id: '1', name: 'Green', enabled: true },
    { id: '2', name: 'Yellow', enabled: true },
    { id: '3', name: 'Blue', enabled: true },
    { id: '4', name: 'Pink', enabled: true },
  ],
  // ... rest of config
};
```

---

### Step 3: Run Both Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend (in same folder):**
```bash
npm run dev:server
```

**Or run both together:**
```bash
npm run dev:all
```

---

## ✨ How It Works Now

### On App Load:
1. User logs in ✅
2. App automatically syncs Airbnb bookings (silent) ✅
3. Bookings appear in Dashboard ✅
4. Calendar updated with Airbnb events ✅

### No Manual Sync Button:
- ❌ Old way: Click "Sync Airbnb" button manually
- ✅ New way: Automatic when user comes to the app

### CORS Problem Solved:
- ❌ Old way: Browser blocks Airbnb requests (CORS error)
- ✅ New way: Backend server fetches from Airbnb (no CORS issues)

---

## 📋 Configuration Details

### Single URL for All Rooms

```typescript
// All rooms share ONE Airbnb URL
icalUrl: 'https://www.airbnb.com/calendar/ical/[YOUR_ID].ics?t=[YOUR_TOKEN]&locale=en-IN'

listings: [
  { id: '1', name: 'Green', enabled: true },
  { id: '2', name: 'Yellow', enabled: true },
  { id: '3', name: 'Blue', enabled: true },
  { id: '4', name: 'Pink', enabled: true },
]
```

**Why?** 
- Airbnb groups all rooms in one calendar
- Events are labeled with room info
- System extracts room number from event name

---

## 🔧 Backend Proxy (server.js)

### What It Does:
1. Listens on `http://localhost:3001`
2. Receives requests from frontend
3. Fetches from Airbnb (server-side, no CORS)
4. Returns calendar data to frontend

### Endpoint:
```
GET http://localhost:3001/api/airbnb/ical?url=<ICAL_URL>
```

### Example:
```javascript
// Frontend calls:
fetch('http://localhost:3001/api/airbnb/ical?url=' + encodeURIComponent(icalUrl))
```

### Dependencies Added:
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5"
}
```

---

## 🔄 Auto-Sync Details

### When It Happens:
1. App loads (`App.tsx`)
2. User authenticates
3. `useAirbnbSync()` hook triggers
4. `autoSync(true)` runs (silent - no toast notification)
5. Fetches from Airbnb via proxy
6. Updates bookings in Supabase
7. Updates UI automatically

### Code:
```typescript
// In App.tsx
const { autoSync } = useAirbnbSync();

useEffect(() => {
  if (isAuthenticated && !authLoading) {
    autoSync(true); // Silent sync
  }
}, [isAuthenticated, authLoading, autoSync]);
```

---

## 📁 File Changes

### New Files:
- `server.js` - Backend proxy server

### Modified Files:
- `package.json` - Added express, cors, and dev:server script
- `src/lib/airbnb-config.ts` - Single URL configuration
- `src/lib/airbnb-sync.ts` - Uses proxy endpoint
- `src/App.tsx` - Added auto-sync on app load

---

## ✅ Testing

### Test 1: Check Configuration
```typescript
// In browser console:
import { AIRBNB_CONFIG } from '@/lib/airbnb-config';
console.log(AIRBNB_CONFIG.icalUrl);
// Should show your Airbnb URL
```

### Test 2: Check Backend
```bash
# In terminal:
curl http://localhost:3001/health
# Response: {"status":"ok"}
```

### Test 3: Manual Sync (Optional)
```typescript
// In browser console:
const { autoSync } = useAirbnbSync();
await autoSync(false); // Show notifications
// Check console for sync results
```

### Test 4: Verify Bookings
1. Go to Dashboard
2. Should see Airbnb bookings
3. Check Bookings page - events from Airbnb

---

## 🚨 Troubleshooting

### "Backend not running"
**Error:** `Failed to fetch http://localhost:3001/api/airbnb/ical`

**Fix:**
```bash
npm run dev:server
# In new terminal, run:
node server.js
```

### "Failed to fetch from Airbnb"
**Error:** Backend proxy returning error

**Check:**
1. Is iCal URL correct?
2. Does URL have token (`t=...`)?
3. Does Airbnb listing have bookings?

**Test URL:**
```bash
curl "https://www.airbnb.com/calendar/ical/YOUR_ID.ics?t=YOUR_TOKEN&locale=en-IN"
```

### "No bookings showing"
**Check:**
1. Are bookings on your Airbnb calendar?
2. Is auto-sync running? Check browser console
3. Do bookings have check-in/check-out dates?

### "Port 3001 already in use"
**Error:** Another app using port 3001

**Fix:**
```bash
# Change port in server.js line 3:
const PORT = 3002; // or any free port

# Then update frontend:
# In src/lib/airbnb-sync.ts, change:
const proxyUrl = `http://localhost:3002/api/airbnb/ical...`
```

---

## 📊 Your Setup Checklist

- [ ] Get iCal URL from Airbnb
- [ ] Update `airbnb-config.ts` with URL
- [ ] Run `npm install` (for express/cors)
- [ ] Run backend: `npm run dev:server`
- [ ] Run frontend: `npm run dev`
- [ ] Log in to app
- [ ] Check Dashboard for bookings
- [ ] Verify auto-sync in console logs

---

## 🎯 Summary

| Before | After |
|--------|-------|
| Manual "Sync" button | Automatic sync on login |
| CORS errors | Backend proxy handles requests |
| One URL per room | One URL for all rooms |
| No notifications | Silent sync (no popups) |
| Complex setup | Simple URL paste |

**Result:** Seamless Airbnb calendar sync! 🎉

---

**Status:** ✅ READY TO USE

Your app will now:
1. Auto-sync Airbnb bookings when user logs in
2. Show bookings on Dashboard
3. Export calendars with Airbnb events
4. No manual sync needed

**Next:** Just paste your Airbnb iCal URL and run both servers!
