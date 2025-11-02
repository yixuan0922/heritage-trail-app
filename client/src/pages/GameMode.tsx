import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Loader2, MapPin, Clock, Trophy, Play, QrCode } from 'lucide-react';
import UserProfileMenu from '../components/Navigation/UserProfileMenu';
import type { Campaign, CampaignProgress } from '@shared/schema';

export default function GameMode() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<CampaignProgress | null>(null);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ['campaigns', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns/active');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  const { data: userProgress, isLoading: loadingProgress } = useQuery<CampaignProgress[]>({
    queryKey: ['campaign-progress', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/campaign-progress`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCampaignProgress = (campaignId: string) => {
    return userProgress?.find((p) => p.campaignId === campaignId);
  };

  const handleStartCampaign = async (campaignId: string) => {
    // Check if already started
    const progress = getCampaignProgress(campaignId);
    if (progress) {
      setLocation(`/game-mode/play/${campaignId}`);
      return;
    }

    // Start new campaign
    try {
      const response = await fetch('/api/campaign-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          campaignId,
        }),
      });

      if (!response.ok) throw new Error('Failed to start campaign');

      setLocation(`/game-mode/play/${campaignId}`);
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert('Failed to start campaign. Please try again.');
    }
  };

  const handleShowQRCode = async (campaign: Campaign, progress: CampaignProgress) => {
    setSelectedCampaign(campaign);
    setSelectedProgress(progress);

    try {
      const response = await fetch(`/api/campaign-progress/${progress.id}/qrcode`);
      if (!response.ok) throw new Error('Failed to generate QR code');
      const data = await response.json();
      setQRCodeData(data.qrCode);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  };

  if (loadingCampaigns || loadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Game Mode</h1>
            <p className="text-muted-foreground">
              Choose a campaign and start your adventure
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {isAdmin && (
              <Button onClick={() => setLocation('/admin/campaigns')}>
                Admin Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={() => setLocation('/')}>
              Back to Map
            </Button>
            <UserProfileMenu />
          </div>
        </div>

        {/* User Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {userProgress?.filter((p) => p.isCompleted).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-500">
                  {userProgress?.filter((p) => !p.isCompleted).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {userProgress?.reduce((sum, p) => sum + p.totalScore, 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns?.map((campaign) => {
            const progress = getCampaignProgress(campaign.id);
            const isInProgress = progress && !progress.isCompleted;
            const isCompleted = progress?.isCompleted;

            return (
              <Card
                key={campaign.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {campaign.heroImage && (
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                    <img
                      src={campaign.heroImage}
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                    {isCompleted && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500">
                          <Trophy className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    )}
                    {isInProgress && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-yellow-500">In Progress</Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <Badge className={getDifficultyColor(campaign.difficulty)}>
                      {campaign.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {campaign.estimatedDuration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Multiple locations
                    </div>
                  </div>

                  {progress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{progress.totalScore} points</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{
                            width: `${isCompleted ? 100 : progress.currentMarkerIndex * 10}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {isCompleted ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => progress && handleShowQRCode(campaign, progress)}
                        variant="default"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Show QR Code
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => handleStartCampaign(campaign.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play Again
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleStartCampaign(campaign.id)}
                      variant="default"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isInProgress ? 'Continue' : 'Start Campaign'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!campaigns || campaigns.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              No active campaigns available at the moment
            </div>
            {isAdmin && (
              <Button onClick={() => setLocation('/admin/campaigns')}>
                Create Campaign
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Collect Your Points
            </DialogTitle>
            <DialogDescription>
              Show this QR code to an admin to collect your {selectedProgress?.totalScore || 0} points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCodeData ? (
              <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg">
                <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedCampaign?.name}
                  </p>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {selectedProgress?.totalScore || 0} points
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
