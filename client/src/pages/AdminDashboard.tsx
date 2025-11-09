import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Loader2, Plus, Edit, Trash2, MapPin, List, Users, QrCode } from 'lucide-react';
import UserProfileMenu from '../components/Navigation/UserProfileMenu';
import type { Campaign, User, Trail } from '@shared/schema';

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    estimatedDuration: 60,
    isActive: true,
    heroImage: '',
  });

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  // Fetch trails
  const { data: trails, isLoading: trailsLoading } = useQuery<Trail[]>({
    queryKey: ['trails'],
    queryFn: async () => {
      const response = await fetch('/api/trails');
      if (!response.ok) throw new Error('Failed to fetch trails');
      return response.json();
    },
  });

  // Fetch user locations with real-time updates
  const { data: onlineUsers, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['user-locations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users/locations');
      if (!response.ok) throw new Error('Failed to fetch user locations');
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, createdBy: user?.id }),
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setEditingCampaign(null);
      resetForm();
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      difficulty: 'medium',
      estimatedDuration: 60,
      isActive: true,
      heroImage: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: editingCampaign.id, data: formData });
    } else {
      createCampaignMutation.mutate(formData);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      difficulty: campaign.difficulty as 'easy' | 'medium' | 'hard',
      estimatedDuration: campaign.estimatedDuration || 60,
      isActive: campaign.isActive,
      heroImage: campaign.heroImage || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaignMutation.mutate(id);
    }
  };

  const toggleActive = (campaign: Campaign) => {
    updateCampaignMutation.mutate({
      id: campaign.id,
      data: { isActive: !campaign.isActive },
    });
  };

  if (isLoading) {
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
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage campaigns, routes, and challenges</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => setLocation('/admin/qr-scanner')}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Scanner
            </Button>
            <Button variant="outline" onClick={() => setLocation('/game-mode')}>
              Back to Game Mode
            </Button>
            <UserProfileMenu />
          </div>
        </div>

        {/* Online Users Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Users ({onlineUsers?.length || 0})
            </CardTitle>
            <CardDescription>
              Users who have shared their location in the last 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onlineUsers && onlineUsers.length > 0 ? (
              <div className="space-y-2">
                {onlineUsers.map((onlineUser) => {
                  const userCampaign = campaigns?.find(c => c.id === onlineUser.currentCampaignId);
                  return (
                    <div
                      key={onlineUser.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <div className="font-medium">{onlineUser.username}</div>
                          {onlineUser.email && (
                            <div className="text-sm text-muted-foreground">{onlineUser.email}</div>
                          )}
                          {userCampaign && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {userCampaign.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground font-mono">
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {onlineUser.currentLatitude?.toFixed(6)}, {onlineUser.currentLongitude?.toFixed(6)}
                        </div>
                        {onlineUser.lastLocationUpdate && (
                          <div className="text-xs text-muted-foreground">
                            Updated: {new Date(onlineUser.lastLocationUpdate).toLocaleTimeString()}
                          </div>
                        )}
                        <div className="flex gap-2">
                          {userCampaign && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/game-mode/play/${userCampaign.id}`)}
                            >
                              View in Campaign
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (onlineUser.currentLatitude && onlineUser.currentLongitude) {
                                window.open(
                                  `https://www.google.com/maps?q=${onlineUser.currentLatitude},${onlineUser.currentLongitude}`,
                                  '_blank'
                                );
                              }
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            View on Map
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No users are currently online or sharing their location
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Campaign Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="mb-6" onClick={() => { setEditingCampaign(null); resetForm(); }}>
              <Plus className="h-5 w-5 mr-2" />
              Create New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
              <DialogDescription>
                {editingCampaign
                  ? 'Update the campaign details below.'
                  : 'Fill in the details to create a new campaign.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                        setFormData({ ...formData, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })
                      }
                      min={1}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroImage">Hero Image URL (optional)</Label>
                  <Input
                    id="heroImage"
                    value={formData.heroImage}
                    onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active (visible to users)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingCampaign(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}>
                  {(createCampaignMutation.isPending || updateCampaignMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCampaign ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Campaigns Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Game Mode Campaigns</h2>
          <div className="space-y-4">
            {campaigns?.map((campaign) => (
            <Card
              key={campaign.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setLocation(`/admin/campaigns/${campaign.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{campaign.name}</CardTitle>
                      <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                        {campaign.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{campaign.difficulty}</Badge>
                    </div>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/admin/campaigns/${campaign.id}/routes`)}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Manage Routes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(campaign)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(campaign)}
                    >
                      <Switch checked={campaign.isActive} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(campaign.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <div>Duration: {campaign.estimatedDuration} min</div>
                  <div>Created: {new Date(campaign.createdAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
            {!campaigns || campaigns.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground">
                No campaigns yet. Create your first campaign to get started!
              </Card>
            )}
          </div>
        </div>

        {/* Trails & Waypoints Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Heritage Trails & Waypoints</h2>
          <div className="space-y-4">
            {trails?.map((trail) => (
              <Card
                key={trail.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setLocation(`/admin/trails/${trail.id}/waypoints`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle>{trail.name}</CardTitle>
                        <Badge variant="outline">{trail.difficulty}</Badge>
                        <Badge variant="secondary">
                          {trail.totalWaypoints} waypoints
                        </Badge>
                      </div>
                      <CardDescription>{trail.description}</CardDescription>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/admin/trails/${trail.id}/waypoints`)}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Manage Waypoints
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div>Neighborhood: {trail.neighborhood}</div>
                    <div>Duration: {trail.estimatedDuration} min</div>
                    <div>Created: {new Date(trail.createdAt).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!trails || trails.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground">
                No trails yet. Trails need to be added via the API or database.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
