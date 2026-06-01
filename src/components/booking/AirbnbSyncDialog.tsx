import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAirbnbSync } from '@/hooks/use-airbnb-sync';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface AirbnbSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AirbnbSyncDialog: React.FC<AirbnbSyncDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [icalUrl, setIcalUrl] = useState('');
  const [listingId, setListingId] = useState('');
  const { loading, error, result, pullFromAirbnb } = useAirbnbSync();

  const handleSync = async () => {
    await pullFromAirbnb(icalUrl, listingId);
  };

  const handleClose = () => {
    if (!loading) {
      setIcalUrl('');
      setListingId('');
      onOpenChange(false);
    }
  };

  // Test URL for development
  const TEST_ICAL_URL = 'https://www.airbnb.com/calendar/ical/[YOUR_CALENDAR_ID].ics';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Airbnb Bookings</DialogTitle>
          <DialogDescription>
            Pull bookings from your Airbnb iCal calendar feed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <p className="text-blue-900 dark:text-blue-200">
              <strong>How to get your iCal URL:</strong>
            </p>
            <ol className="text-blue-800 dark:text-blue-300 list-decimal list-inside space-y-1 mt-2">
              <li>Go to your Airbnb Listing Settings</li>
              <li>Click "Calendar" or "Availability"</li>
              <li>Look for "Calendar Link" or "iCal URL"</li>
              <li>Copy the .ics URL and paste below</li>
            </ol>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="ical-url">iCal URL</Label>
              <Input
                id="ical-url"
                placeholder={TEST_ICAL_URL}
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste your Airbnb iCal calendar URL here
              </p>
            </div>

            <div>
              <Label htmlFor="listing-id">Listing ID</Label>
              <Input
                id="listing-id"
                placeholder="e.g., 12345678"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Airbnb listing ID (found in listing URL)
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">Sync Error</p>
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result?.success && (
            <div className="flex gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-200">Sync Complete</p>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Synced {result.synced_count} bookings
                  ({result.created_count} new, {result.updated_count} updated)
                </p>
              </div>
            </div>
          )}

          {/* Test URL Button */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>For testing:</strong> Replace [YOUR_CALENDAR_ID] with your actual Airbnb calendar ID
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setIcalUrl(TEST_ICAL_URL)}
            >
              Use Test URL Format
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={loading || !icalUrl || !listingId}
            className="gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {loading ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
