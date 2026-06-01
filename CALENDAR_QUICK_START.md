# Calendar System - Quick Start Guide

## 🚀 Getting Started

### 1. Access Calendar Features

**Individual Room Calendars:**
- Navigate to **Rooms** page
- Click **"Calendar Export"** button on any room card
- Choose export option or copy subscription URL

**Calendar Dashboard:**
- Click **"Calendar"** in the sidebar
- View all rooms' synchronization status
- Export combined calendars
- Generate sync reports

### 2. Export Your First Calendar

**Steps:**
1. Go to **Rooms** page
2. Click **"Calendar Export"** on a room
3. In the dialog:
   - Click **"Basic Calendar"** to download .ics file
   - Or click **"Calendar with Alarms"** for reminders
4. Save file to your computer

### 3. Subscribe to Live Updates

**For Google Calendar:**
```
1. Open Google Calendar
2. Click "+" next to "Other calendars"
3. Select "Subscribe to calendar"
4. Copy-paste the subscription URL
5. Click "Subscribe"
```

**For Apple Calendar:**
```
1. Open Calendar app
2. File → New Calendar Subscription
3. Paste subscription URL
4. Click "Subscribe"
5. Choose calendar location
```

**For Outlook:**
```
1. Open Outlook Calendar
2. File → Add Calendar → Subscribe to Calendar
3. Paste the subscription URL
4. Click "Subscribe"
```

### 4. View Synchronization Status

1. Click **"Calendar"** in sidebar
2. Check **"Synchronization Status"** card
3. View **"Room Calendar Status"** for per-room details
4. See booking counts and next dates

### 5. Bulk Export All Rooms

1. Go to **Calendar** page
2. Click **"Export All Rooms Calendar"**
3. Download combined .ics file
4. Use in your calendar application

### 6. Generate Reports

1. Go to **Calendar** page
2. Click **"Export Sync Report"**
3. Download sync metadata
4. Track calendar statistics and export history

---

## 📋 File Formats

### Downloaded Files

| File Name | Format | Purpose |
|-----------|--------|---------|
| `Green-calendar.ics` | iCalendar | Room 1 bookings |
| `Yellow-calendar.ics` | iCalendar | Room 2 bookings |
| `Blue-calendar.ics` | iCalendar | Room 3 bookings |
| `Pink-calendar.ics` | iCalendar | Room 4 bookings |
| `all-rooms-calendar.ics` | iCalendar | All bookings combined |
| `calendar-sync-report.txt` | Text | Sync status & statistics |

---

## ⚙️ Configuration

### Room Mapping

```
Room 1 → Green
Room 2 → Yellow
Room 3 → Blue
Room 4 → Pink
```

### Timezone

- **Timezone**: Asia/Kolkata (IST)
- **UTC Offset**: UTC+5:30
- **All times in IST**

### Alarm Settings

- **Default Reminder**: 24 hours before check-in
- **Format**: Standard iCalendar VALARM

---

## 💡 Tips & Tricks

### Share Calendar URL
- Copy subscription URL from export dialog
- Share with other staff members
- They can subscribe to updates

### Keep Backups
- Export calendars monthly
- Store in cloud backup
- Use for historical records

### Multiple Calendar Apps
- Subscribe to same URL in multiple apps
- Stay synchronized across devices
- All apps get real-time updates

### Integration with Teams
- Export calendar to Google Drive
- Share link with team members
- All see same booking information

---

## ❓ FAQ

**Q: Can I edit events in my calendar app?**
A: Read-only recommended. Use this system for booking source of truth.

**Q: How often do subscriptions update?**
A: Real-time with booking changes (backend dependent).

**Q: Can I combine multiple room calendars?**
A: Yes! Use "Export All Rooms Calendar" for combined view.

**Q: Do alarms work on all apps?**
A: Most modern calendar apps support VALARM. Some web apps may not show.

**Q: Can external users see my calendars?**
A: Only if you share the subscription URL. Share selectively.

**Q: How do I unsubscribe from a calendar?**
A: Use your calendar app's remove/delete calendar option.

**Q: What if my calendar app doesn't support ICS?**
A: Download and import the .ics file manually instead.

**Q: Can I customize alarm times?**
A: Contact your system administrator for custom implementations.

**Q: Are my booking details secure?**
A: All data is within your property management system.

**Q: How do I sync with Airbnb?**
A: Use the "Sync Airbnb" button on the booking calendar.

---

## 🆘 Troubleshooting

### Calendar won't subscribe
- Check URL is correct (copied completely)
- Verify internet connection
- Try different calendar app
- Check app settings allow external calendars

### Events not appearing
- Ensure booking status is "active" or "upcoming"
- Verify room number matches
- Check calendar app timezone settings
- Try re-subscribing to calendar

### .ics file won't open
- Use file extension .ics (not .txt)
- Double-click to open in default calendar app
- Try importing manually in your calendar
- Validate file with online ICS validator

### Missing bookings
- Cancelled bookings don't show
- Check booking dates are correct
- Verify booking status in system
- Export again to refresh

---

## 📞 Support Resources

1. **System Documentation**
   - `CALENDAR_SYSTEM.md` - Comprehensive guide
   - `CALENDAR_IMPLEMENTATION_SUMMARY.md` - Technical overview

2. **In-App Help**
   - Hover over "?" icons for tooltips
   - Click "Help" links in dialogs
   - Check instruction text in modals

3. **Admin Contact**
   - Contact system administrator for:
     - Custom integrations
     - Permission issues
     - Backend API setup

---

## ✅ Checklist

- [ ] Accessed Calendar Export on a room
- [ ] Downloaded a calendar file
- [ ] Imported into my calendar app
- [ ] Subscribed to live updates
- [ ] Viewed Calendar dashboard
- [ ] Generated sync report
- [ ] Tested with multiple calendar apps
- [ ] Shared calendar with team member

---

**Happy calendar syncing! 🎉**

Last updated: May 30, 2026
