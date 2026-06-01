import React, { useState } from 'react';
import { Download, Calendar, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useApp, Room } from '@/context/AppContext';
import {
  generateRoomCalendarIcs,
  generateRoomCalendarIcsWithAlarms,
  downloadIcsFile,
  getCalendarSubscriptionUrl,
} from '@/lib/ics-calendar-generator';
import { toast } from 'sonner';

interface RoomCalendarExportProps {
  room: Room;
}

const RoomCalendarExport: React.FC<RoomCalendarExportProps> = ({ room }) => {
  const { bookings } = useApp();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExportBasic = () => {
    try {
      const icsContent = generateRoomCalendarIcs(room, bookings);
      const filename = `${room.name.replace(/\s+/g, '_')}-calendar.ics`;
      downloadIcsFile(icsContent, filename);
      toast.success(`Calendar exported for ${room.name}`);
    } catch (error) {
      console.error('Failed to export calendar:', error);
      toast.error('Failed to export calendar');
    }
  };

  const handleExportWithAlarms = () => {
    try {
      const icsContent = generateRoomCalendarIcsWithAlarms(room, bookings, 1440); // 24 hours
      const filename = `${room.name.replace(/\s+/g, '_')}-calendar-with-alarms.ics`;
      downloadIcsFile(icsContent, filename);
      toast.success(`Calendar with alarms exported for ${room.name}`);
    } catch (error) {
      console.error('Failed to export calendar:', error);
      toast.error('Failed to export calendar');
    }
  };

  const handleCopySubscriptionUrl = () => {
    try {
      const url = getCalendarSubscriptionUrl(room.number);
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Subscription URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  const subscriptionUrl = getCalendarSubscriptionUrl(room.number);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="w-4 h-4" />
          Calendar Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {room.name} - Calendar Export
          </DialogTitle>
          <DialogDescription>
            Export booking calendar as ICS format for use with calendar applications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Download Calendar</h3>
            
            <Button
              onClick={handleExportBasic}
              className="w-full gap-2 justify-start"
              variant="secondary"
            >
              <Download className="w-4 h-4" />
              <span className="flex-1 text-left">
                <div className="text-sm font-medium">Basic Calendar</div>
                <div className="text-xs text-muted-foreground">Standard ICS format with all bookings</div>
              </span>
            </Button>

            <Button
              onClick={handleExportWithAlarms}
              className="w-full gap-2 justify-start"
              variant="secondary"
            >
              <Download className="w-4 h-4" />
              <span className="flex-1 text-left">
                <div className="text-sm font-medium">Calendar with Alarms</div>
                <div className="text-xs text-muted-foreground">Includes 24-hour booking reminders</div>
              </span>
            </Button>
          </div>

          {/* Subscription URL */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Calendar Subscription</h3>
            <p className="text-xs text-muted-foreground">
              Use this URL to subscribe to live calendar updates in your calendar application:
            </p>
            
            <div className="flex items-center gap-2 bg-secondary p-2 rounded text-xs font-mono break-all">
              <span className="flex-1">{subscriptionUrl}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySubscriptionUrl}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Copy this URL and add it to your calendar application to receive live updates of bookings.
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">How to use</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• <strong>Google Calendar:</strong> Use "+" button → "Subscribe to calendar" and paste the URL</li>
              <li>• <strong>Apple Calendar:</strong> File → New Calendar Subscription and paste the URL</li>
              <li>• <strong>Outlook/Microsoft:</strong> File → Add Calendar → From internet and paste the URL</li>
              <li>• <strong>Desktop:</strong> Download the ICS file and import into your calendar app</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomCalendarExport;
