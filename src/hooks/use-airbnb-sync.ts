import { useState, useEffect, useCallback } from 'react';
import { syncAirbnbBookings, pushBookingsToAirbnb, type SyncResult } from '@/lib/airbnb-sync-service';
import { getEnabledListings, AIRBNB_CONFIG } from '@/lib/airbnb-config';
import { toast } from 'sonner';

export interface UseSyncState {
  loading: boolean;
  error: string | null;
  result: SyncResult | null;
  lastSyncTime: Date | null;
}

export function useAirbnbSync() {
  const [state, setState] = useState<UseSyncState>({
    loading: false,
    error: null,
    result: null,
    lastSyncTime: null,
  });

  /**
   * Pull bookings from Airbnb iCal
   */
  const pullFromAirbnb = async (icalUrl: string, listingId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, result: null }));

    try {
      if (!icalUrl || !listingId) {
        throw new Error('iCal URL and Listing ID are required');
      }

      const result = await syncAirbnbBookings(icalUrl, listingId);

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: null, 
        result,
        lastSyncTime: new Date(),
      }));

      if (result.success) {
        toast.success(
          `Synced ${result.synced_count} bookings (${result.created_count} new, ${result.updated_count} updated)`
        );
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage, 
        result: null,
        lastSyncTime: new Date(),
      }));
      toast.error(errorMessage);
      return {
        success: false,
        synced_count: 0,
        created_count: 0,
        updated_count: 0,
        error: errorMessage,
      };
    }
  };

  /**
   * Auto-sync all enabled listings (silent mode - no toasts)
   */
  const autoSync = useCallback(async (silent = true) => {
    const enabledListings = getEnabledListings();
    
    if (!enabledListings || enabledListings.length === 0) {
      console.log('No Airbnb listings configured for auto-sync');
      return { success: false, message: 'No listings configured' };
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      let totalSynced = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let hasErrors = false;

      // Use the shared iCal URL from config
      const icalUrl = AIRBNB_CONFIG.icalUrl;
      
      if (!icalUrl || icalUrl.includes('YOUR_')) {
        throw new Error('Airbnb iCal URL not configured properly');
      }

      for (const listing of enabledListings) {
        try {
          // All listings use the same iCal URL
          const result = await syncAirbnbBookings(icalUrl, listing.id);
          
          if (result.success) {
            totalSynced += result.synced_count;
            totalCreated += result.created_count;
            totalUpdated += result.updated_count;
          } else {
            hasErrors = true;
            console.warn(`Sync failed for ${listing.name}:`, result.error);
          }
        } catch (error) {
          hasErrors = true;
          console.warn(`Sync error for ${listing.name}:`, error);
        }
      }

      setState(prev => ({ 
        ...prev, 
        loading: false,
        lastSyncTime: new Date(),
      }));

      if (!silent) {
        if (totalSynced > 0) {
          toast.success(
            `Auto-synced ${totalSynced} bookings (${totalCreated} new, ${totalUpdated} updated)`
          );
        }
        if (hasErrors) {
          toast.warning('Some listings failed to sync');
        }
      }

      return { 
        success: !hasErrors, 
        synced: totalSynced,
        created: totalCreated,
        updated: totalUpdated,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-sync failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage,
        lastSyncTime: new Date(),
      }));

      if (!silent) {
        toast.error(errorMessage);
      }

      return { success: false, message: errorMessage };
    }
  }, []);

  /**
   * Hook to trigger auto-sync on component mount (only once)
   */
  const useAutoSync = (enabled = true, showNotifications = false) => {
    useEffect(() => {
      let isMounted = true;
      
      if (enabled && isMounted) {
        autoSync(!showNotifications);
      }
      
      return () => {
        isMounted = false;
      };
    }, [enabled, showNotifications, autoSync]);
  };

  /**
   * Push bookings to Airbnb
   */
  const pushToAirbnb = async (bookingIds: string[]) => {
    setState(prev => ({ ...prev, loading: true, error: null, result: null }));

    try {
      if (!bookingIds || bookingIds.length === 0) {
        throw new Error('Please select bookings to push');
      }

      const result = await pushBookingsToAirbnb(bookingIds);

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: null, 
        result,
        lastSyncTime: new Date(),
      }));

      if (result.success) {
        toast.success(
          `Marked ${result.synced_count} bookings for push to Airbnb`
        );
      } else {
        toast.error(`Push failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Push failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage, 
        result: null,
        lastSyncTime: new Date(),
      }));
      toast.error(errorMessage);
      return {
        success: false,
        synced_count: 0,
        created_count: 0,
        updated_count: 0,
        error: errorMessage,
      };
    }
  };

  return {
    ...state,
    pullFromAirbnb,
    pushToAirbnb,
    autoSync,
    useAutoSync,
  };
}
