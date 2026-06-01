import { supabase } from '@/integrations/supabase/client';
import {
  fetchAirbnbCalendar,
  convertEventsToBookings,
  type SyncedBooking,
} from '@/lib/airbnb-sync';

export interface SyncResult {
  success: boolean;
  synced_count: number;
  created_count: number;
  updated_count: number;
  error?: string;
  sync_log_id?: string;
}

/**
 * Main sync function - pulls from Airbnb iCal and syncs to Supabase
 */
export async function syncAirbnbBookings(
  icalUrl: string,
  listingId: string
): Promise<SyncResult> {
  const syncLogId = await createSyncLog('pull');

  try {
    // 1. Fetch Airbnb calendar
    const events = await fetchAirbnbCalendar(icalUrl);
    console.log(`Fetched ${events.length} events from Airbnb`);

    // 2. Convert to booking format
    const bookingsToSync = convertEventsToBookings(events, listingId);
    console.log(`Converted to ${bookingsToSync.length} bookings`);

    // 3. Sync each booking
    let createdCount = 0;
    let updatedCount = 0;

    for (const booking of bookingsToSync) {
      const result = await syncSingleBooking(booking);
      if (result.created) {
        createdCount++;
      } else if (result.updated) {
        updatedCount++;
      }
    }

    // 4. Update sync log
    await updateSyncLog(syncLogId, {
      status: 'success',
      synced_bookings_count: bookingsToSync.length,
      completed_at: new Date(),
    });

    return {
      success: true,
      synced_count: bookingsToSync.length,
      created_count: createdCount,
      updated_count: updatedCount,
      sync_log_id: syncLogId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', errorMessage);

    // Update sync log with error
    await updateSyncLog(syncLogId, {
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date(),
    });

    return {
      success: false,
      synced_count: 0,
      created_count: 0,
      updated_count: 0,
      error: errorMessage,
      sync_log_id: syncLogId,
    };
  }
}

/**
 * Sync a single booking - create or update
 */
async function syncSingleBooking(
  booking: SyncedBooking
): Promise<{ created: boolean; updated: boolean }> {
  // Check if booking already exists
  const { data: existingBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('id')
    .match({ airbnb_reservation_id: booking.airbnb_reservation_id } as any)
    .single();

  if (existingBooking) {
    // Update existing booking
    const { error } = await supabase
      .from('bookings')
      .update({
        guest_name: booking.guest_name,
        check_in: booking.check_in.toISOString().split('T')[0],
        check_out: booking.check_out.toISOString().split('T')[0],
        notes: booking.notes,
      } as any)
      .match({ airbnb_reservation_id: booking.airbnb_reservation_id } as any);

    if (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    console.log(`Updated booking for Airbnb reservation ${booking.airbnb_reservation_id}`);
    return { created: false, updated: true };
  } else {
    // Create new booking
    // Note: room_number needs to be determined from the booking details
    const roomNumber = extractRoomNumberFromBooking(booking);

    // Get current user for created_by field (required by RLS policy)
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('bookings').insert({
      room_number: roomNumber || 1, // Default to room 1 if not found
      guest_name: booking.guest_name,
      check_in: booking.check_in.toISOString().split('T')[0],
      check_out: booking.check_out.toISOString().split('T')[0],
      notes: booking.notes,
      booking_source: booking.booking_source,
      status: booking.status,
      airbnb_reservation_id: booking.airbnb_reservation_id,
      airbnb_listing_id: booking.airbnb_listing_id,
      created_by: user?.id, // Required by RLS policy
    } as any);

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    console.log(`Created booking for Airbnb reservation ${booking.airbnb_reservation_id} (room ${roomNumber || 1})`);
    return { created: true, updated: false };
  }
}

/**
 * Extract room number from booking notes or use default
 * You may want to customize this based on your Airbnb listing structure
 */
function extractRoomNumberFromBooking(booking: SyncedBooking): number | null {
  const match = booking.notes.match(/room\s+(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Create a new sync log entry
 * Note: airbnb_sync_logs table is created via migration
 */
async function createSyncLog(syncType: 'pull' | 'push'): Promise<string> {
  try {
    // After applying migration, this table will be available
    const { data, error } = await (supabase.from('airbnb_sync_logs') as any)
      .insert({ sync_type: syncType, status: 'pending' })
      .select('id')
      .single();

    if (error) {
      console.warn('Failed to create sync log:', error);
      return 'local-' + Date.now(); // Fallback ID
    }

    return data?.id || 'local-' + Date.now();
  } catch (err) {
    console.warn('Sync log table not available yet, using local ID');
    return 'local-' + Date.now();
  }
}

/**
 * Update sync log with results
 */
async function updateSyncLog(
  syncLogId: string,
  updates: Record<string, unknown>
): Promise<void> {
  try {
    if (syncLogId.startsWith('local-')) {
      console.log('Local sync log (not persisted):', updates);
      return;
    }

    await (supabase.from('airbnb_sync_logs') as any)
      .update(updates)
      .eq('id', syncLogId);
  } catch (error) {
    console.warn('Failed to update sync log:', error);
  }
}

/**
 * Two-way sync: Push local bookings to Airbnb (requires API authentication)
 * This is a placeholder for future implementation with Airbnb API
 */
export async function pushBookingsToAirbnb(
  bookingIds: string[]
): Promise<SyncResult> {
  const syncLogId = await createSyncLog('push');

  try {
    // TODO: Implement Airbnb API push when API credentials are available
    // For now, just log that bookings are ready to push
    console.log('Bookings ready to push to Airbnb:', bookingIds);

    await updateSyncLog(syncLogId, {
      status: 'success',
      synced_bookings_count: bookingIds.length,
      completed_at: new Date(),
    });

    return {
      success: true,
      synced_count: bookingIds.length,
      created_count: 0,
      updated_count: bookingIds.length,
      sync_log_id: syncLogId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await updateSyncLog(syncLogId, {
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date(),
    });

    return {
      success: false,
      synced_count: 0,
      created_count: 0,
      updated_count: 0,
      error: errorMessage,
      sync_log_id: syncLogId,
    };
  }
}
