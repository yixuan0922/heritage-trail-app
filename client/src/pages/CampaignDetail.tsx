import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useParams } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Loader2, MapPin, Users, Trophy, ArrowLeft, Play } from 'lucide-react';
import UserProfileMenu from '../components/Navigation/UserProfileMenu';
import type { Campaign, User, CampaignProgress } from '@shared/schema';

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      setLocation('/game-mode');
    }
  }, [loading, isAdmin, setLocation]);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render until we know the user is an admin
  if (!isAdmin) {
    return null;
  }

  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      return response.json();
    },
  });

  const { data: onlineUsers } = useQuery<User[]>({
    queryKey: ['campaign-users', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/users`);
      if (!response.ok) throw new Error('Failed to fetch campaign users');
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch all user progress for this campaign
  const { data: allProgress } = useQuery<CampaignProgress[]>({
    queryKey: ['campaign-progress-all', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/progress`);
      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty array
        if (response.status === 404) return [];
        throw new Error('Failed to fetch campaign progress');
      }
      return response.json();
    },
  });

  if (campaignLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
          <Button onClick={() => setLocation('/admin/campaigns')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation('/admin/campaigns')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2">{campaign.name}</h1>
              <p className="text-muted-foreground">{campaign.description}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              onClick={() => setLocation(`/game-mode/play/${campaignId}`)}
            >
              <Play className="h-4 w-4 mr-2" />
              Play Campaign
            </Button>
            <UserProfileMenu />
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Online Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{onlineUsers?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently playing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allProgress?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg capitalize">
                {campaign.difficulty}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                ~{campaign.estimatedDuration} min
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Online Users Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Currently Online ({onlineUsers?.length || 0})
            </CardTitle>
            <CardDescription>
              Users who are currently playing this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onlineUsers && onlineUsers.length > 0 ? (
              <div className="space-y-3">
                {onlineUsers.map((onlineUser) => {
                  const userProgress = allProgress?.find(p => p.userId === onlineUser.id);
                  return (
                    <div
                      key={onlineUser.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <div className="font-medium text-lg">{onlineUser.username}</div>
                          {onlineUser.email && (
                            <div className="text-sm text-muted-foreground">{onlineUser.email}</div>
                          )}
                          {userProgress && (
                            <div className="flex items-center gap-2 mt-1">
                              <Trophy className="h-3 w-3 text-yellow-600" />
                              <span className="text-sm font-medium">{userProgress.totalScore} points</span>
                              {userProgress.isCompleted && (
                                <Badge variant="success" className="ml-2">Completed</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {onlineUser.currentLatitude && onlineUser.currentLongitude && (
                          <>
                            <div className="text-right">
                              <div className="text-sm font-mono text-muted-foreground">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                {onlineUser.currentLatitude.toFixed(6)}, {onlineUser.currentLongitude.toFixed(6)}
                              </div>
                              {onlineUser.lastLocationUpdate && (
                                <div className="text-xs text-muted-foreground">
                                  Updated: {new Date(onlineUser.lastLocationUpdate).toLocaleTimeString()}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(
                                  `https://www.google.com/maps?q=${onlineUser.currentLatitude},${onlineUser.currentLongitude}`,
                                  '_blank'
                                );
                              }}
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users are currently playing this campaign</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Players Progress */}
        {allProgress && allProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Players Progress</CardTitle>
              <CardDescription>
                Complete history of all players who have attempted this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allProgress.map((progress) => {
                  const completionPercentage = progress.isCompleted ? 100 : 0; // You can calculate this based on completed routes
                  const isOnline = onlineUsers?.some(u => u.id === progress.userId);

                  return (
                    <div
                      key={progress.id}
                      className="p-4 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {isOnline && (
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                          <div>
                            <div className="font-medium">User ID: {progress.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              Started: {new Date(progress.startedAt).toLocaleDateString()} at {new Date(progress.startedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-lg">{progress.totalScore} pts</div>
                            {progress.isCompleted && (
                              <Badge variant="default">Completed</Badge>
                            )}
                            {!progress.isCompleted && isOnline && (
                              <Badge variant="secondary">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {progress.isCompleted && (
                        <div className="mt-2">
                          <Progress value={100} className="h-2" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
