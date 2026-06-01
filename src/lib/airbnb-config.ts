// Configuration for Airbnb sync settings
// Store your Airbnb iCal URLs and listing IDs here

export const AIRBNB_CONFIG = {
  // Your Airbnb iCal URL - Same URL used for all rooms
  // Get this from: Airbnb → Calendar Settings → Sync with external calendar → Copy link
  icalUrl: 'https://www.airbnb.com/calendar/ical/1485186105229796857.ics?t=fb598c948fbf4772810821cd182f9a68&locale=en-IN',

  // Your Airbnb listings - all use the same iCal URL above
  listings: [
    {
      id: '1',
      name: 'Green',
      enabled: true,
    },
    {
      id: '2',
      name: 'Yellow',
      enabled: true,
    },
    {
      id: '3',
      name: 'Blue',
      enabled: true,
    },
    {
      id: '4',
      name: 'Pink',
      enabled: true,
    },
  ],

  // Sync settings
  sync: {
    // Auto-sync interval in minutes (0 = disabled)
    autoSyncInterval: 0,
    
    // Number of days to look back when syncing
    lookbackDays: 30,
    
    // Number of days to look ahead when syncing
    lookaheadDays: 90,

    // Retry failed syncs
    retryOnFailure: true,
    maxRetries: 3,
  },

  // Field mapping - how to map Airbnb event data to your booking schema
  fieldMapping: {
    // Extract room number from event title/description
    roomNumberPattern: /room\s+(\d+)/i,
    
    // Use event summary as guest name
    useEventSummaryAsGuestName: true,
    
    // Use event description for booking notes
    useEventDescriptionAsNotes: true,
  },
};

/**
 * Get the iCal URL
 */
export function getIcalUrl(): string {
  return AIRBNB_CONFIG.icalUrl;
}

/**
 * Get all enabled listings for auto-sync
 */
export function getEnabledListings() {
  return AIRBNB_CONFIG.listings.filter(l => l.enabled);
}

/**
 * Get all listings (enabled and disabled)
 */
export function getAllListings() {
  return AIRBNB_CONFIG.listings;
}
