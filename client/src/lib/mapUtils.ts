export const SINGAPORE_CENTER: google.maps.LatLngLiteral = {
  lat: 1.3521,
  lng: 103.8198
};

export const CHINATOWN_CENTER: google.maps.LatLngLiteral = {
  lat: 1.2813,
  lng: 103.8448
};

export const SENTOSA_CENTER: google.maps.LatLngLiteral = {
  lat: 1.2494,
  lng: 103.8303
};

export const TRAIL_NEIGHBORHOODS = {
  'chinatown': CHINATOWN_CENTER,
  'sentosa': SENTOSA_CENTER,
} as const;

export const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

export function calculateWalkingTime(distance: number): string {
  const walkingSpeedKmh = 5; // Average walking speed
  const timeInHours = distance / walkingSpeedKmh;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  if (timeInMinutes < 60) {
    return `${timeInMinutes} min`;
  }
  
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function createWaypointMarker(
  map: google.maps.Map,
  waypoint: { id: string; latitude: number; longitude: number; name: string; isCompleted: boolean },
  onClick: (waypoint: any) => void
): google.maps.marker.AdvancedMarkerElement {
  const markerDiv = document.createElement('div');
  markerDiv.className = 'marker-pulse relative group cursor-pointer';
  markerDiv.innerHTML = `
    <div class="w-12 h-12 ${waypoint.isCompleted ? 'bg-accent' : 'bg-primary'} rounded-full flex items-center justify-center border-4 border-white shadow-2xl hover:scale-110 transition-transform">
      <i class="fas ${waypoint.isCompleted ? 'fa-check' : 'fa-landmark'} text-white text-lg"></i>
    </div>
    ${!waypoint.isCompleted ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white animate-pulse"></div>' : ''}
    <div class="absolute top-14 left-1/2 -translate-x-1/2 bg-card px-3 py-1 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <p class="text-xs font-medium">${waypoint.name}</p>
    </div>
  `;

  markerDiv.addEventListener('click', () => onClick(waypoint));

  return new google.maps.marker.AdvancedMarkerElement({
    map,
    position: { lat: waypoint.latitude, lng: waypoint.longitude },
    content: markerDiv,
  });
}
