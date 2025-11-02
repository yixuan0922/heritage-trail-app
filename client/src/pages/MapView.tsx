import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { TrailData, WaypointData, UserProgressData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import InteractiveMap from '@/components/Map/InteractiveMap';
import DestinationsSidebar from '@/components/Sidebar/DestinationsSidebar';
import WaypointPopup from '@/components/Waypoint/WaypointPopup';
import FloatingControls from '@/components/Navigation/FloatingControls';
import BottomNavCard from '@/components/Navigation/BottomNavCard';
import UserProfileMenu from '@/components/Navigation/UserProfileMenu';
import { TRAIL_NEIGHBORHOODS } from '@/lib/mapUtils';

export default function MapView() {
  const { isAdmin } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect admins to dashboard only from root path
  useEffect(() => {
    if (isAdmin && location === '/') {
      setLocation('/admin/campaigns');
    }
  }, [isAdmin, location, setLocation]);

  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [selectedWaypoint, setSelectedWaypoint] = useState<WaypointData | null>(null);
  const [activeTrailId, setActiveTrailId] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [mockUserId] = useState('user_123'); // In a real app, this would come from auth

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Open sidebar by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Fallback to Singapore center
        setUserLocation({ lat: 1.3521, lng: 103.8198 });
      }
    );
  }, []);

  // Fetch trails
  const { data: trails = [] } = useQuery<TrailData[]>({
    queryKey: ['/api/trails'],
  });

  // Set initial active trail
  useEffect(() => {
    if (trails.length > 0 && !activeTrailId) {
      setActiveTrailId(trails[0].id);
    }
  }, [trails, activeTrailId]);

  // Fetch waypoints for active trail
  const { data: waypoints = [] } = useQuery<WaypointData[]>({
    queryKey: ['/api/trails', activeTrailId, 'waypoints'],
    enabled: !!activeTrailId,
  });

  // Fetch user progress for active trail
  const { data: userProgress } = useQuery<UserProgressData>({
    queryKey: ['/api/users', mockUserId, 'progress', activeTrailId],
    enabled: !!activeTrailId,
  });

  // Create user progress mutation
  const createProgressMutation = useMutation({
    mutationFn: async (trailId: string) => {
      return await apiRequest('POST', '/api/user-progress', {
        userId: mockUserId,
        trailId,
        currentWaypointId: waypoints[0]?.id,
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', mockUserId, 'progress', activeTrailId] });
      toast({
        title: "Trail Started!",
        description: "Your heritage journey begins now.",
      });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ progressId, completedWaypoints, currentWaypointId }: {
      progressId: string;
      completedWaypoints: string[];
      currentWaypointId?: string;
    }) => {
      return await apiRequest('PUT', `/api/user-progress/${progressId}`, {
        completedWaypoints,
        currentWaypointId,
        completedAt: completedWaypoints.length === waypoints.length ? new Date().toISOString() : null,
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', mockUserId, 'progress', activeTrailId] });
    },
  });

  const activeTrail = trails.find(t => t.id === activeTrailId) || null;
  const mapCenter = activeTrail ? TRAIL_NEIGHBORHOODS[activeTrail.neighborhood.toLowerCase() as keyof typeof TRAIL_NEIGHBORHOODS] : undefined;

  // Add completion status to waypoints
  const enrichedWaypoints: WaypointData[] = waypoints.map(waypoint => ({
    ...waypoint,
    isCompleted: userProgress?.completedWaypoints?.includes(waypoint.id) || false,
  }));

  const currentWaypoint = enrichedWaypoints.find(w => w.id === userProgress?.currentWaypointId);
  const nextWaypoint = enrichedWaypoints.find(w => !w.isCompleted) || null;

  const handleTrailSelect = (trail: TrailData) => {
    setActiveTrailId(trail.id);
    setSidebarOpen(false); // Close sidebar on mobile when trail is selected
  };

  const handleWaypointClick = (waypoint: WaypointData) => {
    setSelectedWaypoint(waypoint);
  };

  const handleStartTour = () => {
    if (!activeTrailId) return;
    
    if (!userProgress) {
      createProgressMutation.mutate(activeTrailId);
    } else {
      toast({
        title: "Tour In Progress",
        description: "Continue your heritage exploration!",
      });
    }
  };

  const handleWaypointComplete = (waypoint: WaypointData) => {
    if (!userProgress || waypoint.isCompleted) return;

    const completedWaypoints = [...(userProgress.completedWaypoints || []), waypoint.id];
    const nextWaypointIndex = waypoints.findIndex(w => w.id === waypoint.id) + 1;
    const nextWaypoint = waypoints[nextWaypointIndex];

    updateProgressMutation.mutate({
      progressId: userProgress.id,
      completedWaypoints,
      currentWaypointId: nextWaypoint?.id,
    });

    toast({
      title: "Waypoint Completed!",
      description: `You've visited ${waypoint.name}`,
    });
  };

  const handleNavigateToWaypoint = (waypoint: WaypointData) => {
    if ('geolocation' in navigator) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${waypoint.latitude},${waypoint.longitude}&travelmode=walking`;
      window.open(googleMapsUrl, '_blank');
    }
    handleWaypointComplete(waypoint);
  };

  const handleSharePhoto = (waypoint: WaypointData) => {
    toast({
      title: "Photo Sharing",
      description: "Share your heritage memories!",
    });
  };

  return (
    <div className="map-container" data-testid="map-view">
      {/* Top Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border float-shadow">
        <div className="px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 p-0 flex-shrink-0"
              data-testid="button-toggle-sidebar"
            >
              <i className="fas fa-bars text-foreground text-lg"></i>
            </Button>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-serif font-bold text-foreground truncate">Heritage Trails</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Discover Singapore's Stories</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0">
            {/* Game Mode Button */}
            <Button
              variant="default"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setLocation('/game-mode')}
            >
              <i className="fas fa-gamepad mr-2"></i>
              Game Mode
            </Button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-muted rounded-lg px-3 py-2 max-w-xs">
              <i className="fas fa-search text-muted-foreground text-sm"></i>
              <input
                type="text"
                placeholder="Search destinations..."
                className="bg-transparent border-none outline-none ml-2 text-sm w-48"
                data-testid="input-search"
              />
            </div>

            {/* User Profile */}
            <UserProfileMenu />
          </div>
        </div>
      </nav>

      {/* Interactive Map */}
      <InteractiveMap
        waypoints={enrichedWaypoints}
        onWaypointClick={handleWaypointClick}
        center={mapCenter}
        zoom={16}
      />

      {/* Left Sidebar */}
      <DestinationsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        trails={trails}
        activeTrail={activeTrail}
        waypoints={enrichedWaypoints}
        userProgress={userProgress || null}
        userLocation={userLocation}
        onTrailSelect={handleTrailSelect}
        onWaypointClick={handleWaypointClick}
        onStartTour={handleStartTour}
      />

      {/* Waypoint Detail Popup */}
      <WaypointPopup
        waypoint={selectedWaypoint}
        isOpen={!!selectedWaypoint}
        onClose={() => setSelectedWaypoint(null)}
        onNavigate={handleNavigateToWaypoint}
        onSharePhoto={handleSharePhoto}
      />

      {/* Floating Controls */}
      <FloatingControls
        activeTrail={activeTrail}
        userProgress={userProgress || null}
        currentWaypoint={currentWaypoint || null}
        totalWaypoints={waypoints.length}
      />

      {/* Bottom Navigation Card */}
      <BottomNavCard
        nextWaypoint={nextWaypoint}
        userLocation={userLocation}
        onNavigate={() => nextWaypoint && handleNavigateToWaypoint(nextWaypoint)}
        onShowInfo={() => nextWaypoint && setSelectedWaypoint(nextWaypoint)}
        onShare={() => nextWaypoint && handleSharePhoto(nextWaypoint)}
      />

      {/* Sidebar backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-backdrop"
        />
      )}
    </div>
  );
}
