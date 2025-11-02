import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useParams } from 'wouter';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Loader2, CheckCircle2, XCircle, MapPin, Trophy, Lightbulb, Lock, Navigation, Users } from 'lucide-react';
import InteractiveMap from '../components/Map/InteractiveMap';
import UserProfileMenu from '../components/Navigation/UserProfileMenu';
import WaypointPopup from '../components/Waypoint/WaypointPopup';
import type { Campaign, Route, RouteMarker, Question, CampaignProgress, Waypoint, User } from '@shared/schema';
import type { WaypointData } from '@/types/heritage';

// Calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface MarkerWithWaypoint extends RouteMarker {
  waypoint: Waypoint;
  route?: Route;
  isUnlocked: boolean;
  isCompleted: boolean;
  distance: number;
}

export default function GamePlayMap() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Enable location tracking with campaign ID
  useLocationTracking(campaignId);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerWithWaypoint | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedMarkerIds, setCompletedMarkerIds] = useState<Set<string>>(new Set());
  const [isTestLocationMode, setIsTestLocationMode] = useState(false);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [showWaypointInfo, setShowWaypointInfo] = useState(false);

  const PROXIMITY_RADIUS = 20; // 20 meters

  // Get user location
  useEffect(() => {
    // If in test location mode and manual location is set, use that instead
    if (isTestLocationMode && manualLocation) {
      setUserLocation(manualLocation);
      return;
    }

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!isTestLocationMode) {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Singapore center
          if (!isTestLocationMode) {
            setUserLocation({ lat: 1.3521, lng: 103.8198 });
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      if (!isTestLocationMode) {
        setUserLocation({ lat: 1.3521, lng: 103.8198 });
      }
    }
  }, [isTestLocationMode, manualLocation]);

  const { data: campaign } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      return response.json();
    },
  });

  const { data: routes } = useQuery<Route[]>({
    queryKey: ['routes', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/routes`);
      if (!response.ok) throw new Error('Failed to fetch routes');
      return response.json();
    },
    enabled: !!campaignId,
  });

  const { data: progress, refetch: refetchProgress } = useQuery<CampaignProgress>({
    queryKey: ['campaign-progress', user?.id, campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/campaigns/${campaignId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
    enabled: !!user?.id && !!campaignId,
  });

  // Load completed markers from database when progress is fetched
  useEffect(() => {
    if (progress?.completedMarkerIds) {
      const markerIds = Array.isArray(progress.completedMarkerIds)
        ? progress.completedMarkerIds
        : [];
      setCompletedMarkerIds(new Set(markerIds));
    }
  }, [progress?.completedMarkerIds]);

  // Fetch online users in this campaign (only for admins)
  const { data: onlineUsersInCampaign } = useQuery<User[]>({
    queryKey: ['campaign-users', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/users`);
      if (!response.ok) throw new Error('Failed to fetch campaign users');
      return response.json();
    },
    enabled: isAdmin && !!campaignId,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Fetch all markers for all routes
  const { data: allMarkers } = useQuery<MarkerWithWaypoint[]>({
    queryKey: ['all-markers', routes, completedMarkerIds.size],
    queryFn: async () => {
      if (!routes || !userLocation) return [];

      const allMarkersData: MarkerWithWaypoint[] = [];

      for (const route of routes.sort((a, b) => a.orderIndex - b.orderIndex)) {
        const markersResponse = await fetch(`/api/routes/${route.id}/markers`);
        const markers = await markersResponse.json();

        for (const marker of markers) {
          const waypointResponse = await fetch(`/api/waypoints/${marker.waypointId}`);
          const waypoint = await waypointResponse.json();

          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            waypoint.latitude,
            waypoint.longitude
          );

          // Check if this is the next marker in sequence
          const isCompleted = completedMarkerIds.has(marker.id);
          const previousMarkers = markers
            .filter((m: any) => m.orderIndex < marker.orderIndex)
            .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

          // A marker is only unlockable if:
          // 1. All previous markers are completed
          // 2. User is within proximity radius
          const allPreviousCompleted = previousMarkers.every((m: any) =>
            completedMarkerIds.has(m.id)
          );
          const isNextInSequence = allPreviousCompleted;
          const withinRange = distance <= PROXIMITY_RADIUS;

          allMarkersData.push({
            ...marker,
            waypoint,
            route,
            isUnlocked: isNextInSequence && withinRange,
            isCompleted,
            distance,
          });
        }
      }

      return allMarkersData.sort((a, b) => a.orderIndex - b.orderIndex);
    },
    enabled: !!routes && !!userLocation,
    refetchInterval: 5000, // Update every 5 seconds to check proximity
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['questions', selectedMarker?.id],
    queryFn: async () => {
      if (!selectedMarker?.id) return [];
      const response = await fetch(`/api/markers/${selectedMarker.id}/questions`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: !!selectedMarker?.id,
  });

  // Fetch questions count for all markers to determine button text
  const { data: markersWithQuestions } = useQuery<Record<string, number>>({
    queryKey: ['markers-questions-count', campaignId],
    queryFn: async () => {
      if (!allMarkers) return {};
      const counts: Record<string, number> = {};
      await Promise.all(
        allMarkers.map(async (marker) => {
          const response = await fetch(`/api/markers/${marker.id}/questions`);
          if (response.ok) {
            const questions = await response.json();
            counts[marker.id] = questions.length;
          }
        })
      );
      return counts;
    },
    enabled: !!allMarkers && allMarkers.length > 0,
  });

  const currentQuestion = questions?.[currentQuestionIndex];

  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      const response = await fetch('/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          questionId: currentQuestion?.id,
          campaignProgressId: progress?.id,
          userAnswer: answer,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit answer');
      return response.json();
    },
    onSuccess: (data) => {
      setIsCorrect(data.isCorrect);
      setShowResult(true);
      refetchProgress();
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (updates: Partial<CampaignProgress>) => {
      const response = await fetch(`/api/campaign-progress/${progress?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return response.json();
    },
    onSuccess: () => {
      refetchProgress();
    },
  });

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    submitAnswerMutation.mutate(userAnswer);
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setShowResult(false);

    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered for this marker
      setShowHint(true);
    }
  };

  const handleCompleteMarker = () => {
    if (selectedMarker) {
      const newCompletedMarkerIds = [...completedMarkerIds, selectedMarker.id];
      setCompletedMarkerIds(new Set(newCompletedMarkerIds));
      setSelectedMarker(null);
      setCurrentQuestionIndex(0);
      setShowHint(false);

      // Update progress with both marker index and completed marker IDs
      const newMarkerIndex = (progress?.currentMarkerIndex || 0) + 1;
      updateProgressMutation.mutate({
        currentMarkerIndex: newMarkerIndex,
        completedMarkerIds: newCompletedMarkerIds,
      });
    }
  };

  const handleMarkerClick = (marker: MarkerWithWaypoint) => {
    if (!marker.isUnlocked) {
      return; // Don't open if locked
    }
    setSelectedMarker(marker);
    setShowWaypointInfo(true); // Show waypoint information first
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setShowHint(false);
    setUserAnswer('');
  };

  const handleStartQuestions = () => {
    setShowWaypointInfo(false); // Close waypoint info, questions dialog will open
  };

  const handleViewHintFromPopup = () => {
    setShowWaypointInfo(false); // Close waypoint info
    setShowHint(true); // Open hint dialog
  };

  // Convert MarkerWithWaypoint to WaypointData format for the popup
  const convertToWaypointData = (marker: MarkerWithWaypoint | null): WaypointData | null => {
    if (!marker) return null;
    return {
      id: marker.waypoint.id,
      name: marker.waypoint.name,
      description: marker.waypoint.description,
      latitude: marker.waypoint.latitude,
      longitude: marker.waypoint.longitude,
      category: marker.waypoint.category,
      heroImage: marker.waypoint.heroImage || undefined,
      historicalImage: marker.waypoint.historicalImage || undefined,
      modernImage: marker.waypoint.modernImage || undefined,
      nlbResources: marker.waypoint.nlbResources as any || [],
      audioClip: marker.waypoint.audioClip || undefined,
      orderIndex: marker.waypoint.orderIndex,
      isActive: marker.waypoint.isActive,
      isCompleted: marker.isCompleted,
    };
  };

  const handleGenerateQRCode = async () => {
    if (!progress?.id) return;

    try {
      const response = await fetch(`/api/campaign-progress/${progress.id}/qrcode`);
      if (!response.ok) throw new Error('Failed to generate QR code');
      const data = await response.json();
      setQRCodeData(data.qrCode);
      setVerificationCode(data.verificationCode);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Prepare waypoints for map display
  const mapWaypoints = allMarkers?.map((marker) => ({
    id: marker.waypoint.id,
    name: marker.waypoint.name,
    description: marker.waypoint.description,
    latitude: marker.waypoint.latitude,
    longitude: marker.waypoint.longitude,
    category: marker.waypoint.category,
    orderIndex: marker.orderIndex,
    heroImage: marker.waypoint.heroImage,
    historicalImage: marker.waypoint.historicalImage,
    modernImage: marker.waypoint.modernImage,
    nlbResources: marker.waypoint.nlbResources,
    audioClip: marker.waypoint.audioClip,
    isActive: marker.waypoint.isActive,
    isCompleted: marker.isCompleted,
    // Custom fields for game mode
    isLocked: !marker.isUnlocked,
    distance: marker.distance,
  })) || [];

  const completedCount = completedMarkerIds.size;
  const totalMarkers = allMarkers?.length || 0;
  const progressPercentage = totalMarkers > 0 ? (completedCount / totalMarkers) * 100 : 0;

  if (!campaign || !allMarkers || !userLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b p-4 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>{progress?.totalScore || 0} points</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{completedCount} of {totalMarkers} markers</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant={isTestLocationMode ? "default" : "outline"}
              onClick={() => {
                const newMode = !isTestLocationMode;
                console.log('Test mode toggled:', newMode);
                setIsTestLocationMode(newMode);
                if (isTestLocationMode) {
                  // Exiting test mode, clear manual location
                  console.log('Clearing manual location');
                  setManualLocation(null);
                }
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isTestLocationMode ? 'Test Mode: ON' : 'Set Test Location'}
            </Button>
            <Button variant="outline" onClick={() => setLocation('/game-mode')}>
              Exit Game
            </Button>
            <UserProfileMenu />
          </div>
        </div>
        <div className="container mx-auto mt-2">
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Test Location Mode Alert */}
      {isTestLocationMode && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 max-w-lg px-4">
          <Alert className="bg-blue-500/90 text-white border-blue-600 shadow-xl">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <div className="font-bold text-base mb-2">🎯 Test Mode Active</div>
              <div className="text-sm">
                <strong>Single-tap/click</strong> anywhere on the map to set your test location.
                {!manualLocation && (
                  <div className="mt-2 animate-pulse">
                    👆 Tap the map now to begin testing!
                  </div>
                )}
                {manualLocation && (
                  <div className="mt-2 p-2 bg-white/20 rounded">
                    <div className="font-mono text-xs">
                      📍 Test Location: {manualLocation.lat.toFixed(6)}, {manualLocation.lng.toFixed(6)}
                    </div>
                    <div className="text-xs mt-1">
                      Tap anywhere else to change location
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        {/* Test Mode Overlay - Visual indicator that map is clickable */}
        {isTestLocationMode && !manualLocation && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-6xl mb-4 animate-bounce">📍</div>
              <div className="text-white text-xl font-bold bg-blue-500/90 px-6 py-3 rounded-lg shadow-lg">
                Tap Anywhere on Map
              </div>
            </div>
          </div>
        )}

        <InteractiveMap
          waypoints={mapWaypoints as any}
          onWaypointClick={(waypoint: any) => {
            const marker = allMarkers.find(m => m.waypoint.id === waypoint.id);
            if (marker) {
              handleMarkerClick(marker);
            }
          }}
          center={userLocation}
          zoom={16}
          userLocation={userLocation}
          onMapClick={isTestLocationMode ? (location) => {
            console.log('GamePlayMap: Setting test location:', location);
            setManualLocation(location);
            setUserLocation(location);
          } : undefined}
        />

        {/* Floating Legend */}
        <Card className="absolute top-4 right-4 z-10">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Unlocked (within 20m)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Locked (too far)</span>
            </div>
          </CardContent>
        </Card>

        {/* Online Users Card (Admin Only) */}
        {isAdmin && onlineUsersInCampaign && onlineUsersInCampaign.length > 0 && (
          <Card className="absolute top-4 left-4 z-10 max-w-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Online Users ({onlineUsersInCampaign.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {onlineUsersInCampaign.map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium">{onlineUser.username}</span>
                  </div>
                  {onlineUser.currentLatitude && onlineUser.currentLongitude && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps?q=${onlineUser.currentLatitude},${onlineUser.currentLongitude}`,
                          '_blank'
                        );
                      }}
                    >
                      <MapPin className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Nearest Marker Card */}
        {allMarkers.length > 0 && (
          <Card className="absolute bottom-4 left-4 right-4 z-10 max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-sm">Next Destination</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const nextMarker = allMarkers.find(m => !completedMarkerIds.has(m.id));
                if (!nextMarker) {
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <p className="text-lg text-green-600 font-bold">🎉 Campaign Completed!</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 mb-2">
                          Congratulations! You've completed all markers and earned <strong>{progress?.totalScore || 0} points</strong>!
                        </p>
                        {!progress?.pointsCollected && (
                          <Button
                            onClick={handleGenerateQRCode}
                            className="w-full mt-2"
                            variant="default"
                          >
                            Show QR Code to Collect Points
                          </Button>
                        )}
                        {progress?.pointsCollected && (
                          <div className="flex items-center gap-2 text-sm text-green-700 mt-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Points collected on {new Date(progress.collectedAt!).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Check why marker is locked
                const withinRange = nextMarker.distance <= PROXIMITY_RADIUS;
                const previousMarkers = allMarkers.filter(
                  m => m.orderIndex < nextMarker.orderIndex && m.routeId === nextMarker.routeId
                );
                const allPreviousCompleted = previousMarkers.every(m => completedMarkerIds.has(m.id));

                // Get the hint from the previous marker, or use starting hint for first marker
                const previousMarker = previousMarkers.length > 0
                  ? previousMarkers[previousMarkers.length - 1]
                  : null;

                // For the first marker (orderIndex 0), use the route's starting hint
                // For subsequent markers, use the hint from the previous completed marker
                const hint = nextMarker.orderIndex === 0
                  ? nextMarker.route?.startingHint
                  : (previousMarker?.hintToNext || null);

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {nextMarker.isUnlocked ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : hint ? (
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Lock className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="font-medium">{hint ? 'Follow the clue' : nextMarker.waypoint.name}</span>
                      </div>
                      <Badge variant={nextMarker.isUnlocked ? 'default' : 'secondary'}>
                        {Math.round(nextMarker.distance)}m away
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      {hint ? `"${hint}"` : nextMarker.waypoint.description}
                    </p>
                    {nextMarker.isUnlocked ? (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // Always show waypoint info first
                          handleMarkerClick(nextMarker);
                        }}
                      >
                        View Location Info
                      </Button>
                    ) : (
                      <Alert>
                        <Navigation className="h-4 w-4" />
                        <AlertDescription>
                          {!allPreviousCompleted ? (
                            <>Complete previous markers first to unlock this location</>
                          ) : !withinRange ? (
                            <>Get within 20m of this location to unlock questions</>
                          ) : (
                            <>This marker is currently locked</>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Waypoint Information Popup */}
      <WaypointPopup
        waypoint={convertToWaypointData(selectedMarker)}
        isOpen={showWaypointInfo}
        gameMode={true}
        hasQuestions={(markersWithQuestions?.[selectedMarker?.id || ''] || 0) > 0}
        hintText={selectedMarker?.hintToNext}
        onContinueToQuestions={handleStartQuestions}
        onViewHint={handleViewHintFromPopup}
        onClose={() => {
          setShowWaypointInfo(false);
          setSelectedMarker(null);
        }}
        onNavigate={(waypoint) => {
          // Open Google Maps for navigation
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${waypoint.latitude},${waypoint.longitude}`,
            '_blank'
          );
        }}
        onSharePhoto={() => {
          // Not used in game mode
        }}
      />

      {/* Question Dialog */}
      <Dialog open={!!selectedMarker && !showWaypointInfo && !showHint && (questions?.length || 0) > 0} onOpenChange={() => setSelectedMarker(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {selectedMarker?.waypoint.name}
              </div>
            </DialogTitle>
            <DialogDescription>
              Question {currentQuestionIndex + 1} of {questions?.length || 0}
            </DialogDescription>
          </DialogHeader>

          {currentQuestion && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-lg font-medium">{currentQuestion.questionText}</p>
                <Badge>{currentQuestion.points} points</Badge>
              </div>

              {showResult ? (
                <Alert variant={isCorrect ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <AlertDescription>
                      {isCorrect
                        ? `Correct! You earned ${currentQuestion.points} points.`
                        : `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`}
                    </AlertDescription>
                  </div>
                </Alert>
              ) : (
                <>
                  {currentQuestion.questionType === 'multiple_choice' && (
                    <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                      {(currentQuestion.options as string[])?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.questionType === 'true_false' && (
                    <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="true" />
                        <Label htmlFor="true" className="cursor-pointer">True</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="false" />
                        <Label htmlFor="false" className="cursor-pointer">False</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {currentQuestion.questionType === 'text_input' && (
                    <Input
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer..."
                    />
                  )}
                </>
              )}

              <div className="flex gap-2">
                {showResult ? (
                  <Button onClick={handleNextQuestion} className="w-full">
                    {currentQuestionIndex < (questions?.length || 0) - 1 ? 'Next Question' : 'View Hint'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitAnswer}
                    className="w-full"
                    disabled={!userAnswer.trim() || submitAnswerMutation.isPending}
                  >
                    {submitAnswerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hint Dialog */}
      <Dialog open={showHint} onOpenChange={() => setShowHint(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Hint to Next Location
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-lg">{selectedMarker?.hintToNext}</p>
            <Button onClick={handleCompleteMarker} className="w-full">
              Continue Adventure
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Collect Your Points
            </DialogTitle>
            <DialogDescription>
              Show this QR code to an admin to collect your {progress?.totalScore || 0} points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCodeData ? (
              <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg">
                {/* Verification Code Display */}
                {verificationCode && (
                  <div className="w-full text-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                    <p className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-1">
                      Verification Code
                    </p>
                    <p className="text-4xl font-bold text-white tracking-widest font-mono">
                      {verificationCode}
                    </p>
                    <p className="text-xs text-white/80 mt-2">
                      Show this code to admin or scan QR below
                    </p>
                  </div>
                )}

                <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {campaign?.name}
                  </p>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {progress?.totalScore || 0} points
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <Button onClick={() => setShowQRCode(false)} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
