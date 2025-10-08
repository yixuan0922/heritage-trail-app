import { useEffect, useRef, useState } from 'react';
import { WaypointData } from '@/types/heritage';
import { createWaypointMarker, MAP_STYLES, CHINATOWN_CENTER } from '@/lib/mapUtils';

interface InteractiveMapProps {
  waypoints: WaypointData[];
  onWaypointClick: (waypoint: WaypointData) => void;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

export default function InteractiveMap({ 
  waypoints, 
  onWaypointClick, 
  center = CHINATOWN_CENTER, 
  zoom = 16 
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [markerLibLoaded, setMarkerLibLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'your-api-key'}`;
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: MAP_STYLES,
      mapId: 'heritage-map',
      disableDefaultUI: true,
      gestureHandling: 'greedy',
    });

    // Load marker library after map is initialized
    google.maps.importLibrary("marker").then(() => {
      setMarkerLibLoaded(true);
    });
  }, [isLoaded, center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerLibLoaded || !waypoints.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    // Create new markers
    waypoints.forEach(waypoint => {
      const marker = createWaypointMarker(
        mapInstanceRef.current!,
        waypoint,
        onWaypointClick
      );
      markersRef.current.push(marker);
    });
  }, [waypoints, onWaypointClick, markerLibLoaded]);

  // Update map center when center prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    
    mapInstanceRef.current.panTo(center);
  }, [center]);

  const centerToLocation = () => {
    if (!mapInstanceRef.current) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        mapInstanceRef.current?.setCenter(userLocation);
      },
      () => {
        // Fallback to trail center
        mapInstanceRef.current?.setCenter(center);
      }
    );
  };

  const zoomIn = () => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 16;
    mapInstanceRef.current.setZoom(currentZoom + 1);
  };

  const zoomOut = () => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 16;
    mapInstanceRef.current.setZoom(currentZoom - 1);
  };

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={mapRef} 
        className="absolute inset-0 w-full h-full"
        data-testid="interactive-map"
      />
      
      {/* Map Controls */}
      <button 
        onClick={centerToLocation}
        className="absolute bottom-40 md:bottom-32 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-card border border-border rounded-full flex items-center justify-center float-shadow hover:bg-muted transition-colors z-20 active:scale-95"
        data-testid="button-center-location"
      >
        <i className="fas fa-crosshairs text-foreground text-lg md:text-xl"></i>
      </button>
      
      <div className="absolute bottom-[168px] md:bottom-48 right-4 md:right-6 bg-card border border-border rounded-lg overflow-hidden float-shadow z-20">
        <button 
          onClick={zoomIn}
          className="w-12 h-11 md:w-14 md:h-12 flex items-center justify-center hover:bg-muted active:bg-muted transition-colors border-b border-border"
          data-testid="button-zoom-in"
        >
          <i className="fas fa-plus text-foreground text-base md:text-lg"></i>
        </button>
        <button 
          onClick={zoomOut}
          className="w-12 h-11 md:w-14 md:h-12 flex items-center justify-center hover:bg-muted active:bg-muted transition-colors"
          data-testid="button-zoom-out"
        >
          <i className="fas fa-minus text-foreground text-base md:text-lg"></i>
        </button>
      </div>
    </>
  );
}
