import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import type { CampaignMarker, InsertCampaignMarker } from '@shared/schema';
import { z } from 'zod';

interface CampaignMarkerManagerProps {
  campaignId: string;
}

export default function CampaignMarkerManager({ campaignId }: CampaignMarkerManagerProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<CampaignMarker | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    category: 'Historical',
    heroImage: '',
    historicalImage: '',
    modernImage: '',
    audioClip: '',
  });

  const { data: markers, isLoading } = useQuery<CampaignMarker[]>({
    queryKey: ['campaign-markers', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/markers`);
      if (!response.ok) throw new Error('Failed to fetch campaign markers');
      return response.json();
    },
  });

  const createMarkerMutation = useMutation({
    mutationFn: async (data: InsertCampaignMarker) => {
      const response = await fetch('/api/campaign-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create marker');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-markers', campaignId] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateMarkerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignMarker> }) => {
      const response = await fetch(`/api/campaign-markers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update marker');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-markers', campaignId] });
      setEditingMarker(null);
      resetForm();
    },
  });

  const deleteMarkerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/campaign-markers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete marker');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-markers', campaignId] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      category: 'Historical',
      heroImage: '',
      historicalImage: '',
      modernImage: '',
      audioClip: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const markerData: InsertCampaignMarker = {
      campaignId,
      name: formData.name,
      description: formData.description,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      category: formData.category,
      heroImage: formData.heroImage || null,
      historicalImage: formData.historicalImage || null,
      modernImage: formData.modernImage || null,
      audioClip: formData.audioClip || null,
      nlbResources: [],
      isActive: true,
    };

    if (editingMarker) {
      updateMarkerMutation.mutate({ id: editingMarker.id, data: markerData });
    } else {
      createMarkerMutation.mutate(markerData);
    }
  };

  const handleEdit = (marker: CampaignMarker) => {
    setEditingMarker(marker);
    setFormData({
      name: marker.name,
      description: marker.description,
      latitude: marker.latitude.toString(),
      longitude: marker.longitude.toString(),
      category: marker.category,
      heroImage: marker.heroImage || '',
      historicalImage: marker.historicalImage || '',
      modernImage: marker.modernImage || '',
      audioClip: marker.audioClip || '',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this marker? This action cannot be undone.')) {
      deleteMarkerMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Campaign-Specific Markers
            </CardTitle>
            <CardDescription>
              Markers that are unique to this campaign and will be deleted when the campaign is deleted
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen || !!editingMarker} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingMarker(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Marker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMarker ? 'Edit' : 'Create'} Campaign Marker</DialogTitle>
                <DialogDescription>
                  Add a new location marker specific to this campaign
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Marker Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Historic Building"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                      placeholder="Describe this location..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      required
                      placeholder="1.3521"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      required
                      placeholder="103.8198"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Historical">Historical</SelectItem>
                        <SelectItem value="Cultural">Cultural</SelectItem>
                        <SelectItem value="Architectural">Architectural</SelectItem>
                        <SelectItem value="Religious">Religious</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Educational">Educational</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="heroImage">Hero Image URL</Label>
                    <Input
                      id="heroImage"
                      type="url"
                      value={formData.heroImage}
                      onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="historicalImage">Historical Image URL</Label>
                    <Input
                      id="historicalImage"
                      type="url"
                      value={formData.historicalImage}
                      onChange={(e) => setFormData({ ...formData, historicalImage: e.target.value })}
                      placeholder="https://example.com/old.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modernImage">Modern Image URL</Label>
                    <Input
                      id="modernImage"
                      type="url"
                      value={formData.modernImage}
                      onChange={(e) => setFormData({ ...formData, modernImage: e.target.value })}
                      placeholder="https://example.com/modern.jpg"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="audioClip">Audio Clip URL</Label>
                    <Input
                      id="audioClip"
                      type="url"
                      value={formData.audioClip}
                      onChange={(e) => setFormData({ ...formData, audioClip: e.target.value })}
                      placeholder="https://example.com/audio.mp3"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingMarker(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMarkerMutation.isPending || updateMarkerMutation.isPending}
                  >
                    {(createMarkerMutation.isPending || updateMarkerMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingMarker ? 'Update' : 'Create'} Marker
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {markers && markers.length > 0 ? (
          <div className="space-y-3">
            {markers.map((marker) => (
              <div
                key={marker.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">{marker.name}</h4>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded">
                      {marker.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{marker.description}</p>
                  <div className="text-xs font-mono text-muted-foreground">
                    📍 {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(marker)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(marker.id)}
                    disabled={deleteMarkerMutation.isPending}
                  >
                    {deleteMarkerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No campaign-specific markers yet</p>
            <p className="text-sm">Click "Add Marker" to create your first marker for this campaign</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
