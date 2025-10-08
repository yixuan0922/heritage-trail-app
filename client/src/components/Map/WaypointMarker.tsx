import { WaypointData } from '@/types/heritage';

interface WaypointMarkerProps {
  waypoint: WaypointData;
  onClick: (waypoint: WaypointData) => void;
}

export function createWaypointMarkerElement(waypoint: WaypointData, onClick: (waypoint: WaypointData) => void): HTMLDivElement {
  const markerDiv = document.createElement('div');
  markerDiv.className = 'marker-pulse relative group cursor-pointer';
  
  const isCompleted = waypoint.isCompleted;
  const isActive = waypoint.isActive;
  
  markerDiv.innerHTML = `
    <div class="w-12 h-12 ${
      isCompleted ? 'bg-accent' : 'bg-primary'
    } rounded-full flex items-center justify-center border-4 border-white shadow-2xl hover:scale-110 transition-transform">
      <i class="fas ${
        isCompleted ? 'fa-check' : 'fa-landmark'
      } text-white text-lg"></i>
    </div>
    ${!isCompleted ? `
      <div class="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white animate-pulse"></div>
    ` : ''}
    <div class="absolute top-14 left-1/2 -translate-x-1/2 bg-card px-3 py-1 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <p class="text-xs font-medium text-foreground">${waypoint.name}</p>
    </div>
  `;

  markerDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(waypoint);
  });

  markerDiv.addEventListener('mouseenter', () => {
    markerDiv.style.zIndex = '1000';
  });

  markerDiv.addEventListener('mouseleave', () => {
    markerDiv.style.zIndex = 'auto';
  });

  return markerDiv;
}

export default function WaypointMarker({ waypoint, onClick }: WaypointMarkerProps) {
  // This component is primarily used for creating DOM elements for Google Maps
  // The actual rendering is handled by createWaypointMarkerElement function
  return null;
}
