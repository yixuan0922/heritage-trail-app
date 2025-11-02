import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LOCATION_UPDATE_INTERVAL = 30000; // Update every 30 seconds

export function useLocationTracking(campaignId?: string) {
  const { user } = useAuth();
  const intervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Only track location for regular users (not admins) who are logged in
    if (!user || user.role === 'admin') {
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    const updateLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      // Send location update to server, including current campaign if available
      fetch(`/api/users/${user.id}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude, campaignId }),
      }).catch((error) => {
        console.error('Failed to update location:', error);
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Error getting location:', error.message);
    };

    // Get initial location
    navigator.geolocation.getCurrentPosition(updateLocation, handleError);

    // Watch for location changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // Accept cached position up to 10 seconds old
      }
    );

    // Also set up interval for regular updates (fallback)
    intervalRef.current = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(updateLocation, handleError);
    }, LOCATION_UPDATE_INTERVAL);

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, campaignId]);
}
