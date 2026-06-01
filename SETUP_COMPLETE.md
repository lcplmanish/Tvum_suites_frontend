# ✅ Airbnb Sync Configuration Complete

## 🎯 What's Done

✅ **Single URL Configuration** - All 4 rooms use ONE Airbnb iCal link
✅ **CORS Problem Solved** - Backend proxy server created (`server.js`)
✅ **Auto-Sync Enabled** - Automatic sync when user logs in (no manual button)
✅ **Backend Dependencies** - `express` and `cors` added to package.json
✅ **Integration Ready** - All code connected and ready to use

---

## 🔧 Files Changed

### New Files Created:
1. **`server.js`** - Backend proxy server
   - Listens on `http://localhost:3001`
   - Fetches from Airbnb (server-side, no CORS)
   - Endpoints: `GET /api/airbnb/ical?url=<URL>`, `GET /health`

### Modified Files:
1. **`package.json`**
   - Added `express` and `cors` dependencies
   - Added `dev:server` script: `node server.js`
   - Added `dev:all` script: `concurrently "npm run dev" "npm run dev:server"`

2. **`src/lib/airbnb-config.ts`**
   - Changed to single URL: `icalUrl` (instead of per-room URLs)
   - All rooms share the same Airbnb calendar feed
   - Simplified config - removed per-listing iCal URLs
   - Updated `getIcalUrl()` function to return single URL

3. **`src/lib/airbnb-sync.ts`**
   - Updated `fetchAirbnbCalendar()` to use backend proxy
   - Changed from direct Airbnb fetch to: `http://localhost:3001/api/airbnb/ical?url=...`
   - Solves CORS policy errors

4. **`src/App.tsx`**
   - Added `useAirbnbSync` hook import
   - Added `useEffect` to trigger `autoSync()` on app load
   - Auto-sync runs silently (no notifications) when user authenticates
   - Removed need for manual sync button

---

## 📋 Configuration Structure

### `airbnb-config.ts` Now:
```typescript
export const AIRBNB_CONFIG = {
  // Single URL for all rooms (from Airbnb Calendar Settings)
  icalUrl: 'https://www.airbnb.com/calendar/ical/YOUR_ID.ics?t=YOUR_TOKEN&locale=en-IN',
  
  // All rooms share the same calendar feed
  listings: [
    { id: '1', name: 'Green', enabled: true },
    { id: '2', name: 'Yellow', enabled: true },
    { id: '3', name: 'Blue', enabled: true },
    { id: '4', name: 'Pink', enabled: true },
  ],
  
  sync: { autoSyncInterval: 0, ... },
  fieldMapping: { ... }
};
```

---

## 🚀 How to Use

### Step 1: Get Your Airbnb URL
1. Airbnb → Your listings → Calendar
2. Click ⋮ → Calendar settings
3. "Sync with external calendar" → Copy link
4. Example: `https://www.airbnb.com/calendar/ical/1485186105229796857.ics?t=fb598c948fbf4772810821cd182f9a68&locale=en-IN`

### Step 2: Update Config
Edit `src/lib/airbnb-config.ts` line 7:
```typescript
icalUrl: 'YOUR_AIRBNB_URL_HERE',
```

### Step 3: Install & Run
```bash
# Install dependencies (one time)
npm install

# Terminal 1: Start backend proxy
npm run dev:server

# Terminal 2: Start frontend
npm run dev

# Or both at once:
npm run dev:all
```

### Step 4: Done! ✅
- Log in to the app
- Auto-sync runs automatically
- Bookings appear in Dashboard
- Calendar updated with Airbnb events

---

## 🔄 How Auto-Sync Works

```
User Logs In
    ↓
App.tsx useEffect triggers
    ↓
autoSync(true) called (silent)
    ↓
Fetches from: http://localhost:3001/api/airbnb/ical?url=...
    ↓
Backend proxy fetches from Airbnb (no CORS issues)
    ↓
Parses iCal events
    ↓
Saves to Supabase bookings table
    ↓
UI updates automatically
    ↓
Dashboard shows Airbnb bookings ✅
```

---

## 🔌 Backend Proxy Details

**File:** `server.js`

**What it does:**
- Receives request from frontend
- Extracts Airbnb URL from query parameter
- Fetches from Airbnb (server-side, no CORS restrictions)
- Returns calendar data as plain text
- Frontend parses and uses data

**Port:** `3001`

**Endpoint:**
```
GET /api/airbnb/ical?url=<URL>
```

**Example request:**
```javascript
fetch('http://localhost:3001/api/airbnb/ical?url=' + 
  encodeURIComponent('https://www.airbnb.com/calendar/ical/...'))
```

---

## 📊 Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Rooms | 4 separate URLs | 1 shared URL |
| Sync | Manual button | Auto on login |
| CORS | ❌ Blocked | ✅ Proxy handled |
| Setup | Complex | Simple (paste URL) |
| Notifications | Always shown | Silent |
| Server | None | Backend proxy |

---

## ✅ Testing

### Check Backend:
```bash
curl http://localhost:3001/health
# Response: {"status":"ok"}
```

### Check Sync:
1. Log in to app
2. Open browser console (F12)
3. Look for: "Fetched X events from Airbnb"
4. Check Dashboard - should show bookings

### Check Calendar:
1. Go to Rooms page
2. Click "Calendar Export" on any room
3. Download `.ics` file
4. Should contain Airbnb events

---

## 🎯 Summary

**Status:** ✅ COMPLETE AND READY

What's configured:
- ✅ Single URL for all rooms
- ✅ CORS problem solved
- ✅ Auto-sync on app load
- ✅ No manual sync button
- ✅ Backend proxy ready

What you need to do:
1. Get iCal URL from Airbnb (1 URL for all rooms)
2. Paste into `src/lib/airbnb-config.ts`
3. Run `npm install` (one time)
4. Start both servers: `npm run dev:all`
5. Log in and it works! 🎉

---

## 📚 Documentation

- **`SETUP_AIRBNB_SYNC.md`** - Complete setup guide
- **`MANUAL_SETUP.md`** - Manual installation steps
- **`AIRBNB_SETUP_FIX.md`** - Troubleshooting guide (old)

---

## 🎁 What You Get

When you complete setup:
- Automatic bookings sync from Airbnb
- Bookings appear in Dashboard on every login
- Calendar exports contain Airbnb events
- All 4 rooms use one calendar
- No configuration needed for each room
- Silent sync - no annoying notifications

**Everything just works!** ✨
