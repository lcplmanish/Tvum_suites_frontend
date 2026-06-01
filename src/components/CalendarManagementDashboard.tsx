import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Download,
  Calendar,
  Zap,
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  generateAllRoomCalendars,
  generateSyncReport,
  prepareCalendarsForBulkExport,
} from '@/lib/calendar-sync-service';
import {
  generateAllRoomsCalendarIcs,
  downloadIcsFile,
} from '@/lib/ics-calendar-generator';
import { toast } from 'sonner';

const CalendarManagementDashboard: React.FC = () => {
  const { rooms, bookings } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const syncReport = useMemo(() => {
    return generateSyncReport(rooms, bookings);
  }, [rooms, bookings]);

  const roomCalendarStats = useMemo(() => {
    return rooms.map(room => {
      const roomBookings = bookings.filter(
        b => b.roomNumber === room.number && b.status !== 'cancelled'
      );
      return {
        roomNumber: room.number,
        roomName: room.name,
        bookingCount: roomBookings.length,
        nextBookingDate: roomBookings.length > 0
          ? new Date(roomBookings[0].checkIn).toLocaleDateString('en-IN')
          : 'No bookings',
      };
    });
  }, [rooms, bookings]);

  const handleExportAllRooms = async () => {
    setIsExporting(true);
    try {
      const icsContent = generateAllRoomsCalendarIcs(rooms, bookings);
      downloadIcsFile(icsContent, 'all-rooms-calendar.ics');
      toast.success('Combined calendar exported successfully');
    } catch (error) {
      console.error('Failed to export calendar:', error);
      toast.error('Failed to export calendar');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReport = () => {
    try {
      const reportContent = `
=== TVUM Suites - Calendar Sync Report ===
Generated: ${new Date().toISOString()}
Status: ${syncReport.success ? 'Success' : 'Failed'}
Message: ${syncReport.message}

Total Synchronized Rooms: ${syncReport.syncedRooms}
Total Bookings: ${bookings.length}

--- Room Details ---
${roomCalendarStats
  .map(
    stat => `
${stat.roomName} (Room ${stat.roomNumber})
  Active Bookings: ${stat.bookingCount}
  Next Booking: ${stat.nextBookingDate}
`
  )
  .join('')}

--- Calendar Information ---
Timezone: Asia/Kolkata
Format: RFC 5545 (ICS)
Update Frequency: Real-time with booking changes
`.trim();

      const element = document.createElement('a');
      const file = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = 'calendar-sync-report.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Calendar Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage and export room calendars in ICS format for integration with calendar applications
        </p>
      </div>

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Synchronization Status
          </CardTitle>
          <CardDescription>Real-time calendar synchronization overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Rooms</div>
              <div className="text-2xl font-bold text-foreground">{syncReport.syncedRooms}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Active Bookings</div>
              <div className="text-2xl font-bold text-foreground">{bookings.length}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Last Sync</div>
              <div className="text-2xl font-bold text-foreground">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Bulk Export Options
          </CardTitle>
          <CardDescription>Export calendars for all rooms at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleExportAllRooms}
              disabled={isExporting}
              className="gap-2"
              size="lg"
            >
              <Calendar className="w-5 h-5" />
              Export All Rooms Calendar
            </Button>
            <Button
              onClick={handleExportReport}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <FileText className="w-5 h-5" />
              Export Sync Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Room Calendar Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Room Calendar Status
          </CardTitle>
          <CardDescription>Individual room booking status and calendar information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomCalendarStats.map(stat => (
              <div key={stat.roomNumber} className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{stat.roomName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Room {stat.roomNumber}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Bookings</span>
                    <span className="font-medium text-foreground">{stat.bookingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Booking</span>
                    <span className="font-medium text-foreground">{stat.nextBookingDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Calendar Exports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-foreground mb-1">ICS Format</h4>
            <p className="text-muted-foreground">
              All calendars are exported in RFC 5545 standard format (.ics files) for compatibility with most calendar applications.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Calendar Subscription</h4>
            <p className="text-muted-foreground">
              You can subscribe to individual room calendars in your calendar application for live, real-time updates of bookings and changes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Timezone</h4>
            <p className="text-muted-foreground">
              All times are stored in Asia/Kolkata timezone (IST, UTC+5:30).
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Supported Applications</h4>
            <p className="text-muted-foreground">
              Google Calendar, Apple Calendar, Microsoft Outlook, Mozilla Thunderbird, and any application supporting the iCalendar standard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarManagementDashboard;
