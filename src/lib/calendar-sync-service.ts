/**
 * Calendar Sync Service
 * Handles synchronization between booking data and calendar files
 */

import { Booking, Room } from '@/context/AppContext';
import {
  generateRoomCalendarIcs,
  generateAllRoomsCalendarIcs,
} from './ics-calendar-generator';

export interface CalendarSyncStatus {
  roomNumber: number;
  lastSyncTime: Date;
  bookingCount: number;
  isUpToDate: boolean;
}

export interface CalendarSyncResult {
  success: boolean;
  syncedRooms: number;
  message: string;
  timestamp: Date;
}

/**
 * Generate calendar sync metadata for a room
 */
export const generateRoomSyncMetadata = (
  room: Room,
  bookings: Booking[]
): CalendarSyncStatus => {
  const roomBookings = bookings.filter(
    b => b.roomNumber === room.number && b.status !== 'cancelled'
  );

  return {
    roomNumber: room.number,
    lastSyncTime: new Date(),
    bookingCount: roomBookings.length,
    isUpToDate: true,
  };
};

/**
 * Batch generate calendars for all rooms
 */
export const generateAllRoomCalendars = (
  rooms: Room[],
  bookings: Booking[]
): Map<number, string> => {
  const calendars = new Map<number, string>();

  rooms.forEach(room => {
    const icsContent = generateRoomCalendarIcs(room, bookings);
    calendars.set(room.number, icsContent);
  });

  return calendars;
};

/**
 * Generate calendar synchronization report
 */
export const generateSyncReport = (
  rooms: Room[],
  bookings: Booking[]
): CalendarSyncResult => {
  const syncedRooms = rooms.length;
  const totalBookings = bookings.length;

  return {
    success: true,
    syncedRooms,
    message: `Successfully synchronized ${syncedRooms} room calendar(s) with ${totalBookings} total booking(s)`,
    timestamp: new Date(),
  };
};

/**
 * Export all room calendars as ZIP (requires additional library)
 * This is a utility function that can be used with a ZIP library
 */
export const prepareCalendarsForBulkExport = (
  rooms: Room[],
  bookings: Booking[]
): Array<{ filename: string; content: string }> => {
  const exportData: Array<{ filename: string; content: string }> = [];

  // Add individual room calendars
  rooms.forEach(room => {
    const icsContent = generateRoomCalendarIcs(room, bookings);
    const filename = `${room.name.replace(/\s+/g, '_')}-${room.number}.ics`;
    exportData.push({ filename, content: icsContent });
  });

  // Add combined calendar
  const combinedIcs = generateAllRoomsCalendarIcs(rooms, bookings);
  exportData.push({
    filename: 'all-rooms-combined.ics',
    content: combinedIcs,
  });

  // Add metadata file
  const syncReport = generateSyncReport(rooms, bookings);
  const metadata = `Room Calendar Export Report
Generated: ${syncReport.timestamp.toISOString()}
Synchronized Rooms: ${syncReport.syncedRooms}
Total Bookings: ${bookings.length}
Status: ${syncReport.success ? 'Success' : 'Failed'}
Message: ${syncReport.message}
`;
  exportData.push({
    filename: 'EXPORT-METADATA.txt',
    content: metadata,
  });

  return exportData;
};

/**
 * Store calendar sync history (for future use with local storage or backend)
 */
export const storeSyncHistory = (status: CalendarSyncStatus): void => {
  try {
    const history = localStorage.getItem('calendar_sync_history') || '[]';
    const syncHistory = JSON.parse(history) as CalendarSyncStatus[];
    syncHistory.push(status);
    // Keep only last 100 sync records
    if (syncHistory.length > 100) {
      syncHistory.shift();
    }
    localStorage.setItem('calendar_sync_history', JSON.stringify(syncHistory));
  } catch (error) {
    console.error('Failed to store sync history:', error);
  }
};

/**
 * Get last sync time for a room
 */
export const getLastSyncTime = (roomNumber: number): Date | null => {
  try {
    const history = localStorage.getItem('calendar_sync_history') || '[]';
    const syncHistory = JSON.parse(history) as CalendarSyncStatus[];
    const lastSync = syncHistory
      .filter(s => s.roomNumber === roomNumber)
      .sort((a, b) => new Date(b.lastSyncTime).getTime() - new Date(a.lastSyncTime).getTime())
      .at(0);
    return lastSync ? new Date(lastSync.lastSyncTime) : null;
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return null;
  }
};

/**
 * Clear sync history
 */
export const clearSyncHistory = (): void => {
  try {
    localStorage.removeItem('calendar_sync_history');
  } catch (error) {
    console.error('Failed to clear sync history:', error);
  }
};

/**
 * Validate ICS content
 */
export const validateIcsContent = (content: string): boolean => {
  return (
    content.startsWith('BEGIN:VCALENDAR') &&
    content.endsWith('END:VCALENDAR') &&
    content.includes('VERSION:2.0') &&
    content.includes('PRODID')
  );
};
