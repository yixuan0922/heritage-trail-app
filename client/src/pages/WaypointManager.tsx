import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Loader2, Plus, Edit, Trash2, ArrowLeft, MapPin, Image as ImageIcon } from 'lucide-react';
import type { Trail, Waypoint } from '@shared/schema';

export default function WaypointManager() {
  const { trailId } = useParams<{ trailId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [waypointToDelete, setWaypointToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    orderIndex: 0,
    category: 'historical',
    heroImage: '',
    historicalImage: '',
    modernImage: '',
    audioClip: '',
    nlbResources: [] as any[],
  });

  // Fetch trail details
  const { data: trail, isLoading: trailLoading } = useQuery<Trail>({
    queryKey: ['trail', trailId],
    queryFn: async () => {
      const response = await fetch(`/api/trails/${trailId}`);
      if (!response.ok) throw new Error('Failed to fetch trail');
      return response.json();
    },
    enabled: !!trailId,
  });

  // Fetch waypoints
  const { data: waypoints, isLoading: waypointsLoading } = useQuery<Waypoint[]>({
    queryKey: ['waypoints', trailId],
    queryFn: async () => {
      const response = await fetch(`/api/trails/${trailId}/waypoints`);
      if (!response.ok) throw new Error('Failed to fetch waypoints');
      return response.json();
    },
    enabled: !!trailId,
  });

  // Create waypoint mutation
  const createWaypointMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/waypoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, trailId }),
      });
      if (!response.ok) throw new Error('Failed to create waypoint');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waypoints', trailId] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update waypoint mutation
  const updateWaypointMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Waypoint> }) => {
      const response = await fetch(`/api/waypoints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update waypoint');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waypoints', trailId] });
      setIsDialogOpen(false);
      setEditingWaypoint(null);
      resetForm();
    },
  });

  // Delete waypoint mutation
  const deleteWaypointMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/waypoints/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete waypoint');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waypoints', trailId] });
      setDeleteDialogOpen(false);
      setWaypointToDelete(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      latitude: 0,
      longitude: 0,
      orderIndex: 0,
      category: 'historical',
      heroImage: '',
      historicalImage: '',
      modernImage: '',
      audioClip: '',
      nlbResources: [],
    });
  };

  const handleOpenDialog = (waypoint?: Waypoint) => {
    if (waypoint) {
      setEditingWaypoint(waypoint);
      setFormData({
        name: waypoint.name,
        description: waypoint.description,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        orderIndex: waypoint.orderIndex,
        category: waypoint.category,
        heroImage: waypoint.heroImage || '',
        historicalImage: waypoint.historicalImage || '',
        modernImage: waypoint.modernImage || '',
        audioClip: waypoint.audioClip || '',
        nlbResources: waypoint.nlbResources as any[] || [],
      });
    } else {
      setEditingWaypoint(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWaypoint) {
      updateWaypointMutation.mutate({ id: editingWaypoint.id, data: formData });
    } else {
      createWaypointMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    setWaypointToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (waypointToDelete) {
      deleteWaypointMutation.mutate(waypointToDelete);
    }
  };

  if (trailLoading || waypointsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Manage Waypoints</h1>
              <p className="text-muted-foreground">
                {trail?.name} - {waypoints?.length || 0} waypoints
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Waypoint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWaypoint ? 'Edit Waypoint' : 'Create New Waypoint'}
                </DialogTitle>
                <DialogDescription>
                  {editingWaypoint
                    ? 'Update waypoint information and photos'
                    : 'Add a new waypoint to this trail'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-2">
                  <Label htmlFor="name">Waypoint Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Singapore River"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Historical and cultural information..."
                    rows={4}
                    required
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                      placeholder="1.290270"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                      placeholder="103.851959"
                      required
                    />
                  </div>
                </div>

                {/* Category and Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="historical">Historical</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="architectural">Architectural</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderIndex">Order in Trail *</Label>
                    <Input
                      id="orderIndex"
                      type="number"
                      value={formData.orderIndex}
                      onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Photos
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="heroImage">Hero Image URL</Label>
                    <Input
                      id="heroImage"
                      value={formData.heroImage}
                      onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                      placeholder="https://example.com/hero-image.jpg"
                    />
                    {formData.heroImage && (
                      <img src={formData.heroImage} alt="Hero preview" className="w-full h-32 object-cover rounded" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="historicalImage">Historical Image URL</Label>
                    <Input
                      id="historicalImage"
                      value={formData.historicalImage}
                      onChange={(e) => setFormData({ ...formData, historicalImage: e.target.value })}
                      placeholder="https://example.com/historical-image.jpg"
                    />
                    {formData.historicalImage && (
                      <img src={formData.historicalImage} alt="Historical preview" className="w-full h-32 object-cover rounded" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modernImage">Modern Image URL</Label>
                    <Input
                      id="modernImage"
                      value={formData.modernImage}
                      onChange={(e) => setFormData({ ...formData, modernImage: e.target.value })}
                      placeholder="https://example.com/modern-image.jpg"
                    />
                    {formData.modernImage && (
                      <img src={formData.modernImage} alt="Modern preview" className="w-full h-32 object-cover rounded" />
                    )}
                  </div>
                </div>

                {/* Audio */}
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="audioClip">Audio Guide URL</Label>
                  <Input
                    id="audioClip"
                    value={formData.audioClip}
                    onChange={(e) => setFormData({ ...formData, audioClip: e.target.value })}
                    placeholder="https://example.com/audio-guide.mp3"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingWaypoint(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createWaypointMutation.isPending || updateWaypointMutation.isPending}
                  >
                    {(createWaypointMutation.isPending || updateWaypointMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingWaypoint ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Waypoints List */}
        <div className="grid gap-4">
          {waypoints?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No waypoints yet. Click "Add Waypoint" to create one.
                </p>
              </CardContent>
            </Card>
          ) : (
            waypoints?.map((waypoint) => (
              <Card key={waypoint.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">#{waypoint.orderIndex}</Badge>
                        <Badge>{waypoint.category}</Badge>
                      </div>
                      <CardTitle className="text-xl">{waypoint.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {waypoint.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(waypoint)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(waypoint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(waypoint.heroImage || waypoint.historicalImage || waypoint.modernImage) && (
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {waypoint.heroImage && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Hero</p>
                          <img
                            src={waypoint.heroImage}
                            alt="Hero"
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      )}
                      {waypoint.historicalImage && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Historical</p>
                          <img
                            src={waypoint.historicalImage}
                            alt="Historical"
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      )}
                      {waypoint.modernImage && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Modern</p>
                          <img
                            src={waypoint.modernImage}
                            alt="Modern"
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Waypoint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the waypoint. It won't be visible to users but will remain in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWaypointToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWaypointMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
