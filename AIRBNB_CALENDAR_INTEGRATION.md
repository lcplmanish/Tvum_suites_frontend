# Airbnb Calendar Integration Guide

## Overview

Your application now has:
1. **ICS Calendar System** - Per-room calendar generation in RFC 5545 format
2. **Airbnb Sync System** - Existing sync from Airbnb iCal URLs
3. **Integration Point** - Bidirectional sync between Airbnb and local calendars

## Architecture

### Current Flow

```
Airbnb iCal URLs → Sync Service → Bookings Database
                                        ↓
                              ICS Calendar Files
                              (for external apps)
```

### Complete Integration

```
Airbnb iCal URLs → Sync Service → Bookings Database
                                        ↓
                              Generate ICS Files
                                        ↓
                    Room Calendars + Combined Calendar
```

## Implementation Steps

### 1. Update Airbnb Sync Configuration

**File: `src/lib/airbnb-config.ts`**

Ensure your Airbnb listings are configured with their iCal URLs:

```typescript
export const AIRBNB_LISTINGS = [
  {
    id: 'tvum_room_1',
    name: 'Green',
    icalUrl: 'https://www.airbnb.com/calendar/ical/...green.ics',
    enabled: true,
  },
  {
    id: 'tvum_room_2',
    name: 'Yellow',
    icalUrl: 'https://www.airbnb.com/calendar/ical/...yellow.ics',
    enabled: true,
  },
  // ... add URLs for all rooms
];
```

### 2. Sync Flow Implementation

**For automatic sync on app load:**

```typescript
// In BookingPage.tsx or CalendarPage.tsx
const { useAutoSync } = useAirbnbSync();

// Silent auto-sync on page load
useAutoSync(true, false);  // enabled=true, no notifications
```

**For manual sync with user feedback:**

```typescript
// In AirbnbSyncDialog.tsx
const { pullFromAirbnb } = useAirbnbSync();

const handleSync = async () => {
  for (const listing of enabledListings) {
    await pullFromAirbnb(listing.icalUrl, listing.id);
  }
};
```

### 3. Calendar Generation After Sync

After Airbnb bookings are synced, automatically generate ICS files:

```typescript
import { generateRoomCalendarIcs, generateAllRoomsCalendarIcs } from '@/lib/ics-calendar-generator';
import { validateIcsContent } from '@/lib/calendar-sync-service';

// In sync completion handler
const onSyncComplete = (synced: number) => {
  const bookings = useApp().bookings;
  const rooms = useApp().rooms;
  
  // Generate room calendars
  rooms.forEach(room => {
    const icsContent = generateRoomCalendarIcs(room, bookings);
    if (validateIcsContent(icsContent)) {
      console.log(`✓ Calendar for ${room.name} generated`);
    }
  });
  
  // Generate combined calendar
  const combinedIcs = generateAllRoomsCalendarIcs(rooms, bookings);
  if (validateIcsContent(combinedIcs)) {
    console.log('✓ Combined calendar generated');
  }
};
```

## Features

### Feature 1: Automatic Sync on App Start
- ✅ Silent mode - no user interruption
- ✅ Pulls latest Airbnb bookings
- ✅ Updates local database
- ✅ Regenerates calendars

### Feature 2: Manual Sync with Dialog
- ✅ User-initiated sync
- ✅ Feedback and error messages
- ✅ Shows sync statistics
- ✅ Sync status tracking

### Feature 3: Calendar Export
- ✅ Individual room calendars
- ✅ Combined multi-room calendar
- ✅ Subscription URLs
- ✅ Download ICS files

### Feature 4: Real-time Updates
- ✅ Bookings update → Calendars regenerate
- ✅ Calendar management dashboard
- ✅ Sync history tracking
- ✅ Status indicators

## Sync Workflow

### Step 1: Parse Airbnb iCal

```
Airbnb iCal URL
    ↓
parseICalString() - Extracts VEVENT blocks
    ↓
Creates AirbnbEvent objects
```

### Step 2: Create/Update Bookings

```
AirbnbEvent objects
    ↓
Map to Booking objects
    ↓
Create or update in database
    ↓
Emit update notifications
```

### Step 3: Generate Calendars

```
Updated Bookings
    ↓
generateRoomCalendarIcs()
    ↓
RFC 5545 compliant ICS files
    ↓
Available for download/subscription
```

## Configuration

### Airbnb Listing IDs

Match your room numbers with Airbnb listing IDs:

```typescript
const ROOM_TO_LISTING = {
  1: 'tvum_room_1',      // Green
  2: 'tvum_room_2',      // Yellow
  3: 'tvum_room_3',      // Blue
  4: 'tvum_room_4',      // Pink
};
```

### Sync Schedule

**Current:** On-demand + Auto on page load

**Recommended:** Add periodic sync

```typescript
// Auto-sync every 15 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    await autoSync(true); // silent mode
  }, 15 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

## Data Flow

### Incoming (Airbnb → Your App)

```
Airbnb Bookings
    ↓
iCal format
    ↓
Parse & validate
    ↓
Create/update in Supabase
    ↓
Update React state
    ↓
Regenerate calendars
```

### Outgoing (Your App → External Calendars)

```
Bookings in database
    ↓
Generate ICS files
    ↓
User downloads or subscribes
    ↓
In their calendar app (Google, Apple, etc.)
```

## Error Handling

### Sync Errors

```typescript
const { error } = await pullFromAirbnb(icalUrl, listingId);

if (error) {
  // Log to monitoring service
  console.error('Sync failed:', error);
  
  // Notify user
  toast.error(`Sync failed: ${error}`);
  
  // Fallback: keep existing bookings
}
```

### Calendar Generation Errors

```typescript
try {
  const icsContent = generateRoomCalendarIcs(room, bookings);
  
  if (!validateIcsContent(icsContent)) {
    throw new Error('Invalid ICS content generated');
  }
} catch (error) {
  console.error('Calendar generation failed:', error);
  // Keep previous version
}
```

## Testing the Integration

### Test Checklist

1. **Airbnb Sync**
   - [ ] Configure Airbnb iCal URLs in `airbnb-config.ts`
   - [ ] Verify URLs are accessible
   - [ ] Check sync pulls bookings correctly

2. **Calendar Generation**
   - [ ] After sync, calendars are generated
   - [ ] Room-specific calendars have correct bookings
   - [ ] Combined calendar includes all rooms

3. **Calendar Export**
   - [ ] Download ICS files
   - [ ] Import into Google Calendar
   - [ ] Import into Apple Calendar
   - [ ] Verify all events appear

4. **Subscription URLs**
   - [ ] Copy subscription URLs
   - [ ] Subscribe in calendar apps
   - [ ] Verify real-time updates

## Troubleshooting

### Issue: "No bookings synced"
- **Check:** Airbnb iCal URLs are correct
- **Check:** URLs are publicly accessible
- **Check:** Airbnb account has calendar enabled

### Issue: "Calendar file empty"
- **Check:** Bookings exist in database
- **Check:** Booking status is not 'cancelled'
- **Check:** Room numbers match

### Issue: "Subscription not updating"
- **Check:** Backend API is serving ICS files
- **Check:** Calendar app supports auto-refresh
- **Check:** Sync is running (check logs)

## API Endpoints (Backend Ready)

```
GET  /api/airbnb/sync          - Trigger manual sync
POST /api/airbnb/sync          - Sync with settings
GET  /api/calendar/rooms/:id   - Subscribe to room calendar
GET  /api/calendar/export/:id  - Download room calendar
GET  /api/calendar/all         - Download all rooms calendar
```

## Advanced Features

### Feature: Conflict Detection
```typescript
// Check for overlapping bookings
const hasConflict = bookings.some(b1 => 
  bookings.some(b2 => 
    b1.id !== b2.id &&
    b1.roomNumber === b2.roomNumber &&
    isOverlapping(b1, b2)
  )
);
```

### Feature: Sync History
```typescript
// Track all syncs
const syncHistory = localStorage.getItem('airbnb_sync_history');
// Shows: timestamp, synced count, errors
```

### Feature: Rate Limiting
```typescript
// Prevent too many syncs
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutes
```

## Future Enhancements

1. **Bidirectional Sync**
   - Push local bookings to Airbnb
   - Handle conflicts automatically

2. **Advanced Scheduling**
   - Hourly sync for real-time updates
   - Custom sync intervals per room

3. **Smart Notifications**
   - Alert on new Airbnb bookings
   - Notify of sync failures
   - Daily summary reports

4. **Analytics**
   - Track sync success rate
   - Monitor booking patterns
   - Generate reports

5. **Integration with Other Platforms**
   - Booking.com sync
   - Vrbo/HomeAway sync
   - Channel manager integration

## Code References

**ICS Calendar Generator:** `src/lib/ics-calendar-generator.ts`
**Airbnb Sync Service:** `src/lib/airbnb-sync-service.ts`
**Airbnb Config:** `src/lib/airbnb-config.ts`
**Airbnb Sync Hook:** `src/hooks/use-airbnb-sync.ts`
**Calendar Sync Service:** `src/lib/calendar-sync-service.ts`

## Support

For issues or questions:
1. Check Airbnb configuration
2. Verify sync logs in browser console
3. Check React state in DevTools
4. Review error logs in Supabase
5. Test ICS file validity with online validator

---

**Last Updated:** May 30, 2026
**Status:** Integration Ready
**Version:** 1.0.0
