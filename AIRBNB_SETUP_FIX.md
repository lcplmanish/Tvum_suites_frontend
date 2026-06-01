# Fixing Airbnb Sync: CORS & Configuration Issues

## Problems Found

1. ❌ **All listings disabled** - Need to enable them
2. ❌ **All listings point to same URL** - Need individual URLs for each room
3. ❌ **CORS error** - Airbnb blocks direct browser access
4. ❌ **No listings configured** - Auto-sync can't run

## Solution: 3-Step Fix

### Step 1: Get Your Airbnb iCal URLs

**For Each Room (Green, Yellow, Blue, Pink):**

1. Go to **Airbnb** → Your listings
2. Select a listing (e.g., Green room)
3. Click **Calendar** tab
4. Click **⋮ (three dots)** → **Calendar settings**
5. Click **Sync with external calendar**
6. Copy the **iCal calendar link** (full URL with token)

Example format:
```
https://www.airbnb.com/calendar/ical/[LISTING_ID].ics?t=[TOKEN]&locale=en-IN
```

**Important:**
- Each room has a DIFFERENT listing ID
- The token (`t=...`) is unique per room
- Keep the full URL with token

### Step 2: Add URLs to Configuration

**File:** `src/lib/airbnb-config.ts`

Replace `YOUR_*_ROOM_ID` and `YOUR_TOKEN` with your actual URLs:

```typescript
listings: [
  {
    id: '1',
    name: 'Green',
    icalUrl: 'https://www.airbnb.com/calendar/ical/1485186105229796857.ics?t=fb598c948fbf4772810821cd182f9a68&locale=en-IN',
    enabled: true,
  },
  {
    id: '2',
    name: 'Yellow',
    icalUrl: 'https://www.airbnb.com/calendar/ical/YELLOW_LISTING_ID.ics?t=YELLOW_TOKEN&locale=en-IN',
    enabled: true,
  },
  // ... add remaining rooms
],
```

### Step 3: Fix CORS Issue

**Problem:** Airbnb's servers block direct requests from your browser (CORS policy)

**Solutions:**

#### Solution A: Use a CORS Proxy (Quick Fix)

Add to your sync service when fetching:

```typescript
// In src/lib/airbnb-sync-service.ts
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const response = await fetch(proxyUrl + icalUrl);
```

**Pros:**
- No backend needed
- Quick implementation

**Cons:**
- Third-party service
- Rate limited
- Security considerations

#### Solution B: Backend Proxy (Recommended)

Create a backend endpoint that fetches iCal:

```typescript
// Backend endpoint
GET /api/airbnb/ical/:listingId

// Fetches from Airbnb server-side
// Returns iCal data to frontend (no CORS issues)
```

**Pros:**
- More secure
- No rate limits
- Full control

**Cons:**
- Requires backend setup

#### Solution C: Disable CORS (Development Only)

Use browser extension to bypass CORS:

**Chrome:**
- Install "Allow CORS: Access-Control-Allow-Origin" extension
- Enable for testing

**Firefox:**
- Install "CORS Everywhere"
- Enable for testing

## Implementation

### Quick Fix (Using CORS Proxy)

**File:** `src/lib/airbnb-sync-service.ts`

Update the fetch function:

```typescript
export async function fetchIcal(icalUrl: string): Promise<string> {
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
  
  try {
    const response = await fetch(proxyUrl + icalUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch iCal:', error);
    throw error;
  }
}
```

### Best Fix (Backend Proxy)

**Backend Setup:**

Create endpoint in your backend (Node.js example):

```javascript
app.get('/api/airbnb/ical/:listingId', async (req, res) => {
  const { listingId } = req.params;
  
  // Get URL from config
  const listing = AIRBNB_LISTINGS.find(l => l.id === listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  
  // Fetch from Airbnb (server-side, no CORS)
  const response = await fetch(listing.icalUrl);
  const icalData = await response.text();
  
  // Return to frontend
  res.type('text/calendar');
  res.send(icalData);
});
```

**Frontend Update:**

```typescript
// In src/lib/airbnb-sync-service.ts
export async function fetchIcal(icalUrl: string): Promise<string> {
  // Instead of fetching Airbnb directly, call your backend
  const response = await fetch('/api/airbnb/ical/...');
  return await response.text();
}
```

## Verification

### Test 1: Check Configuration

```javascript
// In browser console:
import { getEnabledListings } from '@/lib/airbnb-config';
console.log(getEnabledListings());

// Should show 4 listings with your URLs
```

### Test 2: Manual Sync

1. Go to **Booking Page**
2. Click **Sync Airbnb** button
3. Watch for success or error message

### Test 3: Check Bookings

1. After sync, go to **Dashboard**
2. Should see Airbnb bookings listed
3. Check rooms have correct bookings

### Test 4: Export Calendar

1. Go to **Rooms** page
2. Click **Calendar Export** on a room
3. Download `.ics` file
4. Open in text editor
5. Should contain Airbnb events

## Troubleshooting

### "No Airbnb listings configured for auto-sync"

**Cause:** All listings have `enabled: false`

**Fix:**
```typescript
listings: [
  {
    id: '1',
    name: 'Green',
    icalUrl: '...',
    enabled: true,  // ← Change to true
  },
  // ...
],
```

### "Access to fetch at ... has been blocked by CORS policy"

**Cause:** Airbnb blocks direct browser requests

**Fix Options:**
1. Use CORS proxy (quick)
2. Set up backend proxy (best)
3. Use browser extension (dev only)

### "Failed to fetch" / "SyntaxError: Unexpected token"

**Cause:** Response is not valid iCal format

**Check:**
1. Is the URL correct?
2. Does URL have token?
3. Is proxy returning data?

### No bookings after sync

**Cause:** iCal URL might be wrong or empty

**Fix:**
1. Test URL in browser directly
2. Check if Airbnb listing has any bookings
3. Verify calendar is enabled in Airbnb

## Testing Your URLs

### Option 1: Test in Browser

Copy a URL and paste in browser address bar:
```
https://www.airbnb.com/calendar/ical/123456789.ics?t=token&locale=en-IN
```

If it works:
- File downloads or shows iCal content
- ✅ URL is valid

If it doesn't:
- 404 error or blank page
- ❌ URL needs fixing

### Option 2: Test in Console

```javascript
const url = 'https://www.airbnb.com/calendar/ical/YOUR_ID.ics?t=TOKEN';

// With CORS proxy (quick test)
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
fetch(proxyUrl + url)
  .then(r => r.text())
  .then(text => console.log(text.substring(0, 200)))
  .catch(e => console.error(e));
```

## Your Action Items

- [ ] Get iCal URLs for all 4 rooms from Airbnb
- [ ] Update `src/lib/airbnb-config.ts` with your URLs
- [ ] Choose CORS solution (proxy, backend, or extension)
- [ ] Implement CORS fix
- [ ] Test sync on Booking page
- [ ] Verify bookings in Dashboard
- [ ] Export and import calendar to test

## Status

**Current:** Configuration ready but needs URLs and CORS fix
**After URLs:** Auto-sync should work (with CORS solution)
**Full Working:** When CORS is handled + URLs added

---

## Quick Reference

### Get iCal URL from Airbnb:
1. Go listing → Calendar → Settings
2. Click "Sync with external calendar"
3. Copy the link

### Enable Sync:
1. Paste URLs in `airbnb-config.ts`
2. Set `enabled: true`
3. Fix CORS issue
4. Reload app

### See Results:
1. Dashboard shows bookings
2. Calendar page shows sync status
3. Export calendar works

---

**Last Updated:** May 30, 2026
**Status:** Configuration complete, awaiting URLs + CORS fix
