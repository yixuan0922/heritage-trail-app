import { WaypointData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { calculateDistance, formatDistance, calculateWalkingTime } from '@/lib/mapUtils';

interface BottomNavCardProps {
  nextWaypoint: WaypointData | null;
  userLocation?: { lat: number; lng: number };
  onNavigate: () => void;
  onShowInfo: () => void;
  onShare: () => void;
}

export default function BottomNavCard({ 
  nextWaypoint, 
  userLocation, 
  onNavigate, 
  onShowInfo, 
  onShare 
}: BottomNavCardProps) {
  if (!nextWaypoint) return null;

  const distanceInfo = userLocation ? {
    distance: formatDistance(calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      nextWaypoint.latitude, 
      nextWaypoint.longitude
    )),
    walkingTime: calculateWalkingTime(calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      nextWaypoint.latitude, 
      nextWaypoint.longitude
    ))
  } : { distance: '0.5 km', walkingTime: '7 min walk' };

  return (
    <div 
      className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] max-w-md"
      data-testid="bottom-nav-card"
    >
      <div className="bg-card border border-border rounded-2xl p-3 md:p-4 float-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-route text-white text-base md:text-lg"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-semibold">Next Waypoint</p>
              <p className="text-xs text-muted-foreground truncate">{nextWaypoint.name}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className="text-base md:text-lg font-bold text-primary">{distanceInfo.distance}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{distanceInfo.walkingTime}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
          <Button 
            onClick={onNavigate}
            size="sm"
            className="text-xs md:text-sm h-9 md:h-10"
            data-testid="button-navigate-bottom"
          >
            <i className="fas fa-directions mr-1 text-xs md:text-sm"></i>
            <span className="hidden xs:inline">Navigate</span>
            <span className="xs:hidden">Go</span>
          </Button>
          <Button 
            onClick={onShowInfo}
            variant="secondary" 
            size="sm"
            className="text-xs md:text-sm h-9 md:h-10"
            data-testid="button-info-bottom"
          >
            <i className="fas fa-info-circle mr-1 text-xs md:text-sm"></i>
            <span>Info</span>
          </Button>
          <Button 
            onClick={onShare}
            variant="secondary" 
            size="sm"
            className="text-xs md:text-sm h-9 md:h-10"
            data-testid="button-share-bottom"
          >
            <i className="fas fa-share-alt mr-1 text-xs md:text-sm"></i>
            <span>Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
