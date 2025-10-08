import { useState } from 'react';
import { TrailData, WaypointData, UserProgressData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateDistance, formatDistance, calculateWalkingTime } from '@/lib/mapUtils';
import TrailProgress from './TrailProgress';

interface DestinationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  trails: TrailData[];
  activeTrail: TrailData | null;
  waypoints: WaypointData[];
  userProgress: UserProgressData | null;
  userLocation?: { lat: number; lng: number };
  onTrailSelect: (trail: TrailData) => void;
  onWaypointClick: (waypoint: WaypointData) => void;
  onStartTour: () => void;
}

export default function DestinationsSidebar({
  isOpen,
  onClose,
  trails,
  activeTrail,
  waypoints,
  userProgress,
  userLocation,
  onTrailSelect,
  onWaypointClick,
  onStartTour,
}: DestinationsSidebarProps) {
  const [selectedTrailId, setSelectedTrailId] = useState(activeTrail?.id || trails[0]?.id);

  const handleTrailSelect = (trail: TrailData) => {
    setSelectedTrailId(trail.id);
    onTrailSelect(trail);
  };

  const getWaypointStatus = (waypoint: WaypointData) => {
    if (!userProgress) return 'locked';
    
    const completedWaypoints = userProgress.completedWaypoints || [];
    if (completedWaypoints.includes(waypoint.id)) return 'completed';
    
    if (userProgress.currentWaypointId === waypoint.id) return 'active';
    
    // Check if waypoint is unlocked based on order
    const previousWaypoint = waypoints.find(w => w.orderIndex === waypoint.orderIndex - 1);
    if (!previousWaypoint || completedWaypoints.includes(previousWaypoint.id)) {
      return 'available';
    }
    
    return 'locked';
  };

  const getDistanceToWaypoint = (waypoint: WaypointData) => {
    if (!userLocation) return null;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      waypoint.latitude,
      waypoint.longitude
    );
    
    return {
      distance: formatDistance(distance),
      walkingTime: calculateWalkingTime(distance),
    };
  };

  return (
    <aside 
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } absolute top-16 left-0 bottom-0 w-80 bg-card border-r border-border float-shadow z-30 transition-transform duration-300 lg:translate-x-0`}
      data-testid="destinations-sidebar"
    >
      <div className="h-full flex flex-col">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Active Trails</h2>
            <Badge variant="secondary">{trails.length} Available</Badge>
          </div>
          
          {/* Trail Selection Tabs */}
          <div className="flex space-x-2">
            {trails.map((trail) => (
              <button
                key={trail.id}
                onClick={() => handleTrailSelect(trail)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTrailId === trail.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                data-testid={`button-trail-${trail.neighborhood.toLowerCase()}`}
              >
                {trail.neighborhood}
              </button>
            ))}
          </div>
        </div>
        
        {/* Trail Progress */}
        {activeTrail && userProgress && (
          <TrailProgress 
            trail={activeTrail}
            userProgress={userProgress}
            waypoints={waypoints}
          />
        )}
        
        {/* Destinations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {waypoints.map((waypoint) => {
            const status = getWaypointStatus(waypoint);
            const distanceInfo = getDistanceToWaypoint(waypoint);
            
            return (
              <div
                key={waypoint.id}
                onClick={() => onWaypointClick(waypoint)}
                className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                  status === 'active' ? 'bg-primary/5' : ''
                }`}
                data-testid={`waypoint-card-${waypoint.id}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={waypoint.heroImage || `https://images.unsplash.com/photo-1591946614720-90a587da4a36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
                      alt={waypoint.name} 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-card flex items-center justify-center ${
                      status === 'completed' ? 'bg-accent' :
                      status === 'active' ? 'bg-secondary animate-pulse' :
                      status === 'available' ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <i className={`text-white text-xs ${
                        status === 'completed' ? 'fas fa-check' :
                        status === 'active' ? 'fas fa-route' :
                        status === 'available' ? 'fas fa-landmark' : 'fas fa-lock'
                      }`}></i>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 truncate">{waypoint.name}</h3>
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      <span className="font-mono">{waypoint.latitude.toFixed(4)}° N, {waypoint.longitude.toFixed(4)}° E</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${
                        status === 'completed' ? 'text-accent' :
                        status === 'active' ? 'text-primary' :
                        status === 'available' ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        <i className={`mr-1 ${
                          status === 'completed' ? 'fas fa-check-circle' :
                          status === 'active' ? 'fas fa-route' :
                          status === 'available' ? 'fas fa-map-marker-alt' : 'fas fa-lock'
                        }`}></i>
                        {status === 'completed' ? 'Completed' :
                         status === 'active' ? 'Navigate' :
                         status === 'available' ? 'Available' : 'Locked'}
                      </span>
                      {distanceInfo && (
                        <span className="text-xs text-muted-foreground">{distanceInfo.distance} away</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <Button 
            onClick={onStartTour}
            className="w-full"
            data-testid="button-start-guided-tour"
          >
            <i className="fas fa-route mr-2"></i>
            Start Guided Tour
          </Button>
        </div>
      </div>
    </aside>
  );
}
