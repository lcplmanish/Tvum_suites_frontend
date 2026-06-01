/**
 * ICS Calendar Generator Service
 * Generates RFC 5545 compliant ICS (iCalendar) format files for room bookings
 */

import { Booking, Room } from '@/context/AppContext';
import { format } from 'date-fns';

interface IcsEvent {
  uid: string;
  dtstamp: string;
  dtstart: string;
  dtend: string;
  summary: string;
  description: string;
  location: string;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

/**
 * Convert date to ICS format (YYYYMMDDTHHMMSSZ)
 */
const formatDateToIcs = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Parse time string (HH:MM) and create a date with specified date
 */
const createDateTimeWithTime = (date: Date, timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

/**
 * Escape special characters in ICS format
 */
const escapeIcsString = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
};

/**
 * Generate a unique UID for ICS event
 */
const generateUid = (booking: Booking): string => {
  return `booking-${booking.id}@tvum-suites.local`;
};

/**
 * Create ICS event from booking
 */
const createBookingEvent = (booking: Booking, room: Room): IcsEvent => {
  const checkInDateTime = createDateTimeWithTime(booking.checkIn, booking.checkInTime);
  const checkOutDateTime = createDateTimeWithTime(booking.checkOut, booking.checkOutTime);

  const dtstart = formatDateToIcs(checkInDateTime);
  const dtend = formatDateToIcs(checkOutDateTime);
  const dtstamp = formatDateToIcs(new Date());

  const description = `
Guest: ${escapeIcsString(booking.guestName)}
Phone: ${booking.phone || 'N/A'}
Adults: ${booking.adults} | Children: ${booking.children} | Infants: ${booking.infants}
Booking Source: ${booking.bookingSource}
Notes: ${escapeIcsString(booking.notes || 'No additional notes')}
  `.trim();

  return {
    uid: generateUid(booking),
    dtstamp,
    dtstart,
    dtend,
    summary: `${room.name} - ${booking.guestName}`,
    description: escapeIcsString(description),
    location: escapeIcsString(room.name),
    status: booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
  };
};

/**
 * Generate ICS calendar with all events
 */
const generateIcsContent = (
  events: IcsEvent[],
  calendarTitle: string,
  calendarDescription: string
): string => {
  const now = new Date();
  const dtstamp = formatDateToIcs(now);

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TVUM Suites//Room Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeIcsString(calendarTitle)}
X-WR-CALDESC:${escapeIcsString(calendarDescription)}
X-WR-TIMEZONE:Asia/Kolkata
TZID:Asia/Kolkata
DTSTAMP:${dtstamp}
`;

  // Add events
  events.forEach(event => {
    icsContent += `BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${event.dtstamp}
DTSTART:${event.dtstart}
DTEND:${event.dtend}
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:${event.status}
SEQUENCE:0
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  return icsContent;
};

/**
 * Generate room-specific calendar ICS file
 * @param room - Room object
 * @param bookings - All bookings (will be filtered by room)
 * @returns ICS file content as string
 */
export const generateRoomCalendarIcs = (room: Room, bookings: Booking[]): string => {
  // Filter bookings for this room
  const roomBookings = bookings.filter(
    b => b.roomNumber === room.number && b.status !== 'cancelled'
  );

  // Create events from bookings
  const events = roomBookings.map(booking => createBookingEvent(booking, room));

  const calendarTitle = `${room.name} - Booking Calendar`;
  const calendarDescription = `Booking calendar for ${room.name} at TVUM Suites`;

  return generateIcsContent(events, calendarTitle, calendarDescription);
};

/**
 * Generate a combined calendar ICS file for all rooms
 * @param rooms - Array of all rooms
 * @param bookings - All bookings
 * @returns ICS file content as string
 */
export const generateAllRoomsCalendarIcs = (rooms: Room[], bookings: Booking[]): string => {
  const events: IcsEvent[] = [];

  // Create events for all bookings across all rooms
  bookings
    .filter(b => b.status !== 'cancelled')
    .forEach(booking => {
      const room = rooms.find(r => r.number === booking.roomNumber);
      if (room) {
        events.push(createBookingEvent(booking, room));
      }
    });

  const calendarTitle = 'TVUM Suites - All Rooms Calendar';
  const calendarDescription = 'Combined booking calendar for all rooms at TVUM Suites';

  return generateIcsContent(events, calendarTitle, calendarDescription);
};

/**
 * Download ICS file to user's computer
 * @param content - ICS file content
 * @param filename - Name of the file to download
 */
export const downloadIcsFile = (content: string, filename: string): void => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

/**
 * Get shareable calendar URL (for external calendar subscriptions)
 * This would typically be implemented on the backend to serve the ICS file
 * @param roomNumber - Room number for the calendar
 * @param apiBaseUrl - Base URL of the API
 * @returns Calendar subscription URL
 */
export const getCalendarSubscriptionUrl = (
  roomNumber: number,
  apiBaseUrl: string = window.location.origin
): string => {
  return `${apiBaseUrl}/api/calendar/rooms/${roomNumber}`;
};

/**
 * Generate iCal ALARM component for reminders
 */
const generateAlarmComponent = (minutesBefore: number): string => {
  return `BEGIN:VALARM
TRIGGER:-PT${minutesBefore}M
ACTION:DISPLAY
DESCRIPTION:Booking Reminder
END:VALARM`;
};

/**
 * Generate enhanced ICS with alarms
 */
export const generateRoomCalendarIcsWithAlarms = (
  room: Room,
  bookings: Booking[],
  alarmMinutes: number = 1440 // 24 hours before
): string => {
  const roomBookings = bookings.filter(
    b => b.roomNumber === room.number && b.status !== 'cancelled'
  );

  const now = new Date();
  const dtstamp = formatDateToIcs(now);
  const calendarTitle = `${room.name} - Booking Calendar`;
  const calendarDescription = `Booking calendar for ${room.name} at TVUM Suites`;

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TVUM Suites//Room Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeIcsString(calendarTitle)}
X-WR-CALDESC:${escapeIcsString(calendarDescription)}
X-WR-TIMEZONE:Asia/Kolkata
DTSTAMP:${dtstamp}
`;

  // Add events with alarms
  roomBookings.forEach(booking => {
    const event = createBookingEvent(booking, room);
    const alarm = generateAlarmComponent(alarmMinutes);

    icsContent += `BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${event.dtstamp}
DTSTART:${event.dtstart}
DTEND:${event.dtend}
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:${event.status}
SEQUENCE:0
${alarm}
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  return icsContent;
};
