export interface AirbnbEvent {
  summary: string;
  dtstart: Date;
  dtend: Date;
  description: string;
  uid: string;
  lastModified: Date;
}

export interface SyncedBooking {
  airbnb_reservation_id: string;
  airbnb_listing_id: string;
  guest_name: string;
  check_in: Date;
  check_out: Date;
  booking_source: string;
  status: string;
  notes: string;
}

/**
 * Parse iCal format string to extract events
 * Handles basic iCal parsing without external dependencies
 */
export function parseICalString(icalString: string): AirbnbEvent[] {
  const events: AirbnbEvent[] = [];
  
  // Split by VEVENT blocks
  const eventMatches = icalString.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  
  eventMatches.forEach((eventBlock) => {
    try {
      const event = parseICalEvent(eventBlock);
      if (event) {
        events.push(event);
      }
    } catch (error) {
      console.warn('Failed to parse iCal event:', error);
    }
  });
  
  return events;
}

/**
 * Parse a single VEVENT block
 */
function parseICalEvent(eventBlock: string): AirbnbEvent | null {
  // Extract properties using regex
  const getProperty = (prop: string): string => {
    const regex = new RegExp(`^${prop}(?:;[^:]*)?:(.*)$`, 'm');
    const match = eventBlock.match(regex);
    return match ? match[1].trim() : '';
  };

  const summary = getProperty('SUMMARY');
  const uid = getProperty('UID');
  const description = getProperty('DESCRIPTION');
  const dtstart = parseICalDate(getProperty('DTSTART'));
  const dtend = parseICalDate(getProperty('DTEND'));
  const lastModified = parseICalDate(getProperty('LAST-MODIFIED'));

  if (!dtstart || !dtend || !uid) {
    return null;
  }

  return {
    summary,
    dtstart,
    dtend,
    description,
    uid,
    lastModified: lastModified || new Date(),
  };
}

/**
 * Convert iCal date format to JavaScript Date
 * Handles both DATE (YYYYMMDD) and DATETIME (YYYYMMDDTHHmmss) formats
 */
function parseICalDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Remove timezone suffix if present (e.g., "20260530T120000Z")
  dateString = dateString.replace('Z', '');

  if (dateString.length === 8) {
    // DATE format: YYYYMMDD
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));
    return new Date(year, month, day);
  } else if (dateString.length === 15) {
    // DATETIME format: YYYYMMDDTHHmmss
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));
    const hours = parseInt(dateString.substring(9, 11));
    const minutes = parseInt(dateString.substring(11, 13));
    const seconds = parseInt(dateString.substring(13, 15));
    return new Date(year, month, day, hours, minutes, seconds);
  }

  return null;
}

/**
 * Fetch and parse Airbnb iCal feed
 */
export async function fetchAirbnbCalendar(icalUrl: string): Promise<AirbnbEvent[]> {
  try {
    // Use backend proxy to avoid CORS issues
    const proxyUrl = `http://localhost:3001/api/airbnb/ical?url=${encodeURIComponent(icalUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.statusText}`);
    }

    const icalString = await response.text();
    return parseICalString(icalString);
  } catch (error) {
    console.error('Error fetching Airbnb calendar:', error);
    throw error;
  }
}

/**
 * Extract room number from event summary
 * Assumes format like "Room 1 - Reservation" or similar
 */
export function extractRoomNumberFromSummary(summary: string): number | null {
  const match = summary.match(/room\s+(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Extract Airbnb reservation ID from event UID or description
 */
export function extractReservationId(uid: string, description: string): string {
  // Try to extract from UID (often contains the reservation ID)
  const uidMatch = uid.match(/(\d+)@/);
  if (uidMatch) {
    return uidMatch[1];
  }

  // Fallback: use UID as is (should be unique)
  return uid;
}

/**
 * Convert iCal events to booking records
 */
export function convertEventsToBookings(
  events: AirbnbEvent[],
  listingId: string
): SyncedBooking[] {
  return events
    .filter((event) => event.summary && event.dtstart && event.dtend)
    .map((event) => ({
      airbnb_reservation_id: extractReservationId(event.uid, event.description),
      airbnb_listing_id: listingId,
      guest_name: event.summary.replace(/\s*-.*$/, '').trim(), // Remove trailing description
      check_in: event.dtstart,
      check_out: event.dtend,
      booking_source: 'Airbnb',
      status: 'upcoming',
      notes: event.description || '',
    }));
}
