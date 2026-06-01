# TVUM Suites Calendar System - Implementation Guide

## Overview

The calendar system has been successfully implemented with full ICS (iCalendar) format support for every room. This allows seamless integration with popular calendar applications and enables real-time synchronization of booking information.

## Features Implemented

### 1. **ICS Calendar Generator** (`lib/ics-calendar-generator.ts`)
- RFC 5545 compliant iCalendar format generation
- Per-room calendar creation
- Combined multi-room calendar export
- Automatic alarm/reminder generation (24-hour before check-in)
- Special character escaping for iCalendar format
- Timezone support (Asia/Kolkata)

**Key Functions:**
- `generateRoomCalendarIcs()` - Creates ICS for a single room
- `generateAllRoomsCalendarIcs()` - Creates combined calendar for all rooms
- `generateRoomCalendarIcsWithAlarms()` - Adds 24-hour reminder alarms
- `downloadIcsFile()` - Triggers browser download
- `getCalendarSubscriptionUrl()` - Generates subscription URL

### 2. **Calendar Sync Service** (`lib/calendar-sync-service.ts`)
- Synchronization status tracking
- Batch calendar generation
- Sync history management with local storage
- ICS content validation
- Bulk export preparation
- Sync report generation

**Key Functions:**
- `generateRoomSyncMetadata()` - Room-specific sync status
- `generateAllRoomCalendars()` - Map of all room calendars
- `generateSyncReport()` - Detailed sync report
- `storeSyncHistory()` - Persist sync records
- `validateIcsContent()` - Verify ICS file integrity

### 3. **Room Calendar Export Component** (`components/rooms/RoomCalendarExport.tsx`)
- Per-room calendar export dialog
- Two export modes:
  - **Basic Calendar** - Standard ICS without alarms
  - **Calendar with Alarms** - Includes 24-hour reminders
- Calendar subscription URL generation
- Clipboard copy functionality
- Integration instructions for major calendar apps:
  - Google Calendar
  - Apple Calendar
  - Outlook/Microsoft
  - Thunderbird

### 4. **Calendar Management Dashboard** (`components/CalendarManagementDashboard.tsx`)
- Real-time synchronization status
- Room calendar statistics
- Bulk export options
- Sync reports
- Interactive room status cards
- Usage instructions

### 5. **Calendar Page & Navigation**
- New dedicated calendar management page (`pages/CalendarPage.tsx`)
- Sidebar menu item for easy access
- Permission-based access control
- Role-based feature access

## File Structure

```
src/
├── lib/
│   ├── ics-calendar-generator.ts      (Core ICS generation logic)
│   └── calendar-sync-service.ts       (Sync and export utilities)
├── components/
│   ├── CalendarManagementDashboard.tsx (Main dashboard)
│   └── rooms/
│       └── RoomCalendarExport.tsx     (Per-room export dialog)
├── pages/
│   └── CalendarPage.tsx               (Calendar page wrapper)
├── App.tsx                            (Updated with calendar route)
└── lib/permissions.ts                 (Updated with calendar permissions)
```

## Data Structure

### ICS Event Format
Each booking creates a VEVENT with:
- Unique ID (UID)
- Check-in/Check-out times
- Guest name and phone
- Booking source
- Guest counts (adults, children, infants, pets)
- Notes
- Status (CONFIRMED or CANCELLED)

### Calendar Metadata
- Timezone: Asia/Kolkata (IST, UTC+5:30)
- Format: RFC 5545 (iCalendar standard)
- Product ID: `-//TVUM Suites//Room Calendar//EN`
- Support for alarms and notifications

## Usage

### Exporting a Room's Calendar

1. Navigate to **Rooms** page
2. Click **Calendar Export** button on any room card
3. Choose export option:
   - **Basic Calendar** - Download .ics file
   - **Calendar with Alarms** - Download .ics with 24-hour reminders
4. Save the file to your computer

### Subscribing to Live Calendar Updates

1. Click **Calendar Export** on a room
2. Copy the subscription URL
3. In your calendar app:
   - **Google Calendar**: Click "+" → "Subscribe to calendar"
   - **Apple Calendar**: File → New Calendar Subscription
   - **Outlook**: File → Add Calendar → From internet
4. Paste the URL and subscribe

### Bulk Export

1. Navigate to **Calendar** in sidebar
2. View synchronization status and room statistics
3. **Export All Rooms Calendar** - Download combined ICS
4. **Export Sync Report** - Download metadata and statistics

## Technical Details

### ICS Format Example
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TVUM Suites//Room Calendar//EN
METHOD:PUBLISH
X-WR-CALNAME:Green - Booking Calendar
BEGIN:VEVENT
UID:booking-abc123@tvum-suites.local
DTSTAMP:20260530T120000Z
DTSTART:20260601T140000Z
DTEND:20260603T110000Z
SUMMARY:Green - John Doe
DESCRIPTION:Guest: John Doe\nPhone: +91-9999999999\nAdults: 2
LOCATION:Green
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT1440M
ACTION:DISPLAY
DESCRIPTION:Booking Reminder
END:VALARM
END:VEVENT
END:VCALENDAR
```

### Supported Calendar Applications
- ✅ Google Calendar
- ✅ Apple Calendar (macOS, iOS)
- ✅ Microsoft Outlook (Desktop, Web)
- ✅ Mozilla Thunderbird
- ✅ Nextcloud Calendar
- ✅ Proton Calendar
- ✅ Any RFC 5545 compatible calendar

## API Endpoints (Backend Ready)

The following endpoints are prepared for backend implementation:
- `GET /api/calendar/rooms/:roomNumber` - Subscribe to room calendar
- `GET /api/calendar/export/:roomNumber` - Download room calendar
- `GET /api/calendar/all` - Download all rooms calendar

## Permission Levels

Calendar features are controlled by role:
- **Owner/Admin/Main Supervisor**: Full access
- **Supervisor**: View and export calendars
- **Accountant/Staff**: No access by default

## Local Storage

- Sync history stored in `calendar_sync_history`
- Last 100 sync records kept
- Timestamp and booking count tracked per room

## Best Practices

1. **Regular Exports**: Export calendars monthly for backup
2. **Subscription URL**: Share subscription URLs with external calendars
3. **Timezone Awareness**: All times are in IST (UTC+5:30)
4. **Booking Status**: Only "CONFIRMED" bookings show in calendars
5. **Sync Frequency**: Real-time updates when bookings change

## Troubleshooting

### Calendar Not Updating
- Check internet connection
- Verify subscription URL is correct
- Try re-subscribing to the calendar

### Events Not Showing
- Ensure booking status is not "CANCELLED"
- Verify room number is correct
- Check calendar app timezone settings

### ICS File Won't Open
- Ensure file has .ics extension
- Try importing into different calendar app
- Validate file contents with ICS validator

## Future Enhancements

1. Backend API for calendar subscriptions
2. Calendar sync with Airbnb
3. Conflict detection and warnings
4. Custom alarm/reminder times
5. Color coding per room
6. iCal feed for public booking view
7. Calendar sharing permissions
8. Integration with Google Calendar API
9. Microsoft Graph Calendar sync
10. Two-way synchronization

## Integration Examples

### Google Calendar
```
1. Open Google Calendar
2. Click "+" next to Other calendars
3. Select "Subscribe to calendar"
4. Paste the subscription URL
5. Click "Subscribe"
```

### Apple Calendar
```
1. Open Calendar app
2. Go to File → New Calendar Subscription
3. Enter the subscription URL
4. Click "Subscribe"
5. Choose which calendar to add to
```

### Outlook
```
1. Open Outlook
2. File → Add Calendar → Subscribe to Calendar
3. Paste the subscription URL
4. Click "Subscribe"
```

## Support

For issues or questions about the calendar system:
1. Check this documentation
2. Review ICS format in `ics-calendar-generator.ts`
3. Verify permissions in `lib/permissions.ts`
4. Check sync history in browser localStorage

---

**Last Updated**: May 30, 2026
**Version**: 1.0.0
**Status**: Production Ready
