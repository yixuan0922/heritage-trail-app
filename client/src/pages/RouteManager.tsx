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
import { Loader2, Plus, Edit, Trash2, ArrowLeft, MapPin } from 'lucide-react';
import type { Campaign, Route, RouteMarker, Waypoint, Question, CampaignMarker } from '@shared/schema';

export default function RouteManager() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isMarkerDialogOpen, setIsMarkerDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<RouteMarker | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingMarker, setEditingMarker] = useState<(RouteMarker & { waypoint?: Waypoint; campaignMarker?: CampaignMarker }) | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'route' | 'marker' | 'question', id: string } | null>(null);

  // Route form
  const [routeForm, setRouteForm] = useState({
    name: '',
    description: '',
    startingHint: '',
    orderIndex: 0,
  });

  // Marker form
  const [markerForm, setMarkerForm] = useState({
    markerType: 'waypoint' as 'waypoint' | 'campaign',
    waypointId: '',
    campaignMarkerId: '',
    orderIndex: 0,
    hintToNext: '',
  });

  // Question form
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'text_input',
    options: ['', '', '', ''],
    correctAnswer: '',
    orderIndex: 0,
    points: 10,
  });

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
  });

  const { data: waypoints } = useQuery<Waypoint[]>({
    queryKey: ['waypoints'],
    queryFn: async () => {
      const response = await fetch('/api/trails');
      if (!response.ok) throw new Error('Failed to fetch trails');
      const trails = await response.json();

      // Fetch waypoints for all trails
      const allWaypoints = await Promise.all(
        trails.map(async (trail: any) => {
          const wpResponse = await fetch(`/api/trails/${trail.id}/waypoints`);
          return wpResponse.json();
        })
      );

      return allWaypoints.flat();
    },
  });

  const { data: campaignMarkers } = useQuery<CampaignMarker[]>({
    queryKey: ['campaign-markers', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/markers`);
      if (!response.ok) throw new Error('Failed to fetch campaign markers');
      return response.json();
    },
    enabled: !!campaignId,
  });

  const { data: markers } = useQuery<(RouteMarker & { waypoint?: Waypoint; campaignMarker?: CampaignMarker })[]>({
    queryKey: ['markers', selectedRoute?.id],
    queryFn: async () => {
      if (!selectedRoute?.id) return [];
      const response = await fetch(`/api/routes/${selectedRoute.id}/markers`);
      if (!response.ok) throw new Error('Failed to fetch markers');
      return response.json();
    },
    enabled: !!selectedRoute?.id,
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

  // Mutations
  const createRouteMutation = useMutation({
    mutationFn: async (data: typeof routeForm) => {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, campaignId }),
      });
      if (!response.ok) throw new Error('Failed to create route');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', campaignId] });
      setIsRouteDialogOpen(false);
      setRouteForm({ name: '', description: '', startingHint: '', orderIndex: 0 });
    },
  });

  const createMarkerMutation = useMutation({
    mutationFn: async (data: typeof markerForm) => {
      // Prepare payload based on marker type
      const payload: any = {
        routeId: selectedRoute?.id,
        orderIndex: data.orderIndex,
        hintToNext: data.hintToNext,
      };

      // Add either waypointId or campaignMarkerId
      if (data.markerType === 'waypoint') {
        payload.waypointId = data.waypointId;
      } else {
        payload.campaignMarkerId = data.campaignMarkerId;
      }

      const response = await fetch('/api/markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create marker');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markers', selectedRoute?.id] });
      setIsMarkerDialogOpen(false);
      setMarkerForm({ markerType: 'waypoint', waypointId: '', campaignMarkerId: '', orderIndex: 0, hintToNext: '' });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: typeof questionForm) => {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          routeMarkerId: selectedMarker?.id,
          options: data.questionType === 'multiple_choice' ? data.options.filter(o => o) : [],
        }),
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', selectedMarker?.id] });
      setIsQuestionDialogOpen(false);
      setQuestionForm({
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        orderIndex: 0,
        points: 10,
      });
    },
  });

  // Update mutations
  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: typeof routeForm }) => {
      const response = await fetch(`/api/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update route');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', campaignId] });
      setIsRouteDialogOpen(false);
      setEditingRoute(null);
      setRouteForm({ name: '', description: '', startingHint: '', orderIndex: 0 });
    },
  });

  const updateMarkerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: typeof markerForm }) => {
      // Prepare payload based on marker type
      const payload: any = {
        orderIndex: data.orderIndex,
        hintToNext: data.hintToNext,
      };

      // Add either waypointId or campaignMarkerId
      if (data.markerType === 'waypoint') {
        payload.waypointId = data.waypointId;
        payload.campaignMarkerId = null;
      } else {
        payload.campaignMarkerId = data.campaignMarkerId;
        payload.waypointId = null;
      }

      const response = await fetch(`/api/markers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update marker');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markers', selectedRoute?.id] });
      setIsMarkerDialogOpen(false);
      setEditingMarker(null);
      setMarkerForm({ markerType: 'waypoint', waypointId: '', campaignMarkerId: '', orderIndex: 0, hintToNext: '' });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: typeof questionForm }) => {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          options: data.questionType === 'multiple_choice' ? data.options.filter(o => o) : [],
        }),
      });
      if (!response.ok) throw new Error('Failed to update question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', selectedMarker?.id] });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      setQuestionForm({
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        orderIndex: 0,
        points: 10,
      });
    },
  });

  // Delete mutations
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/routes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete route');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', campaignId] });
      if (selectedRoute?.id === deleteTarget?.id) {
        setSelectedRoute(null);
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
  });

  const deleteMarkerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/markers/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete marker');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markers', selectedRoute?.id] });
      if (selectedMarker?.id === deleteTarget?.id) {
        setSelectedMarker(null);
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete question');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', selectedMarker?.id] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
  });

  // Helper functions
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'route') deleteRouteMutation.mutate(deleteTarget.id);
    else if (deleteTarget.type === 'marker') deleteMarkerMutation.mutate(deleteTarget.id);
    else if (deleteTarget.type === 'question') deleteQuestionMutation.mutate(deleteTarget.id);
  };

  const openRouteDialog = (route?: Route) => {
    if (route) {
      setEditingRoute(route);
      setRouteForm({
        name: route.name,
        description: route.description || '',
        startingHint: route.startingHint || '',
        orderIndex: route.orderIndex,
      });
    } else {
      setEditingRoute(null);
      setRouteForm({ name: '', description: '', startingHint: '', orderIndex: 0 });
    }
    setIsRouteDialogOpen(true);
  };

  const openMarkerDialog = (marker?: RouteMarker & { waypoint?: Waypoint; campaignMarker?: CampaignMarker }) => {
    if (marker) {
      setEditingMarker(marker);
      setMarkerForm({
        markerType: marker.waypointId ? 'waypoint' : 'campaign',
        waypointId: marker.waypointId || '',
        campaignMarkerId: marker.campaignMarkerId || '',
        orderIndex: marker.orderIndex,
        hintToNext: marker.hintToNext || '',
      });
    } else {
      setEditingMarker(null);
      setMarkerForm({ markerType: 'waypoint', waypointId: '', campaignMarkerId: '', orderIndex: 0, hintToNext: '' });
    }
    setIsMarkerDialogOpen(true);
  };

  const openQuestionDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      const options = Array.isArray(question.options) ? question.options : [];
      setQuestionForm({
        questionText: question.questionText,
        questionType: question.questionType as any,
        options: options.length >= 4 ? options.slice(0, 4) : [...options, '', '', '', ''].slice(0, 4),
        correctAnswer: question.correctAnswer,
        orderIndex: question.orderIndex,
        points: question.points,
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        orderIndex: 0,
        points: 10,
      });
    }
    setIsQuestionDialogOpen(true);
  };

  const handleSaveRoute = () => {
    if (editingRoute) {
      updateRouteMutation.mutate({ id: editingRoute.id, data: routeForm });
    } else {
      createRouteMutation.mutate(routeForm);
    }
  };

  const handleSaveMarker = () => {
    if (editingMarker) {
      updateMarkerMutation.mutate({ id: editingMarker.id, data: markerForm });
    } else {
      createMarkerMutation.mutate(markerForm);
    }
  };

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data: questionForm });
    } else {
      createQuestionMutation.mutate(questionForm);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/campaigns')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">{campaign?.name}</h1>
              <p className="text-muted-foreground">Manage routes and challenges</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Routes List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Routes</CardTitle>
                <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => openRouteDialog()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingRoute ? 'Edit Route' : 'Create Route'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={routeForm.name}
                          onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={routeForm.description}
                          onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Starting Hint</Label>
                        <Textarea
                          value={routeForm.startingHint}
                          onChange={(e) => setRouteForm({ ...routeForm, startingHint: e.target.value })}
                          placeholder="Clue to guide players to the first marker..."
                        />
                      </div>
                      <div>
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={routeForm.orderIndex}
                          onChange={(e) => setRouteForm({ ...routeForm, orderIndex: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveRoute}>
                        {editingRoute ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {routes?.map((route) => (
                <div key={route.id} className="flex items-center gap-2">
                  <Button
                    variant={selectedRoute?.id === route.id ? 'default' : 'outline'}
                    className="flex-1 justify-start"
                    onClick={() => setSelectedRoute(route)}
                  >
                    {route.name}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRouteDialog(route);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: 'route', id: route.id });
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Markers List */}
          {selectedRoute && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Markers</CardTitle>
                  <Dialog open={isMarkerDialogOpen} onOpenChange={setIsMarkerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => openMarkerDialog()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingMarker ? 'Edit Marker' : 'Add Marker'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Marker Type</Label>
                          <Select
                            value={markerForm.markerType}
                            onValueChange={(value: 'waypoint' | 'campaign') =>
                              setMarkerForm({ ...markerForm, markerType: value, waypointId: '', campaignMarkerId: '' })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="waypoint">General Waypoint</SelectItem>
                              <SelectItem value="campaign">Campaign-Specific Marker</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {markerForm.markerType === 'waypoint' ? (
                          <div>
                            <Label>Waypoint</Label>
                            <Select
                              value={markerForm.waypointId}
                              onValueChange={(value) => setMarkerForm({ ...markerForm, waypointId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select waypoint" />
                              </SelectTrigger>
                              <SelectContent>
                                {waypoints?.map((wp) => (
                                  <SelectItem key={wp.id} value={wp.id}>
                                    {wp.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label>Campaign Marker</Label>
                            <Select
                              value={markerForm.campaignMarkerId}
                              onValueChange={(value) => setMarkerForm({ ...markerForm, campaignMarkerId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select campaign marker" />
                              </SelectTrigger>
                              <SelectContent>
                                {campaignMarkers?.map((cm) => (
                                  <SelectItem key={cm.id} value={cm.id}>
                                    {cm.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {(!campaignMarkers || campaignMarkers.length === 0) && (
                              <p className="text-sm text-muted-foreground mt-2">
                                No campaign markers yet. Create one in the Campaign Detail page.
                              </p>
                            )}
                          </div>
                        )}
                        <div>
                          <Label>Hint to Next</Label>
                          <Textarea
                            value={markerForm.hintToNext}
                            onChange={(e) => setMarkerForm({ ...markerForm, hintToNext: e.target.value })}
                            placeholder="Give players a hint to the next location..."
                          />
                        </div>
                        <div>
                          <Label>Order</Label>
                          <Input
                            type="number"
                            value={markerForm.orderIndex}
                            onChange={(e) => setMarkerForm({ ...markerForm, orderIndex: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveMarker}>
                          {editingMarker ? 'Update' : 'Add Marker'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {markers?.map((marker) => (
                  <div key={marker.id} className="flex items-center gap-2">
                    <Button
                      variant={selectedMarker?.id === marker.id ? 'default' : 'outline'}
                      className="flex-1 justify-start"
                      onClick={() => setSelectedMarker(marker)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {marker.waypoint?.name || marker.campaignMarker?.name}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMarkerDialog(marker);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ type: 'marker', id: marker.id });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Questions List */}
          {selectedMarker && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Questions</CardTitle>
                  <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => openQuestionDialog()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Question</Label>
                          <Textarea
                            value={questionForm.questionText}
                            onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={questionForm.questionType}
                            onValueChange={(value: any) => setQuestionForm({ ...questionForm, questionType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="text_input">Text Input</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {questionForm.questionType === 'multiple_choice' && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            {questionForm.options.map((opt, i) => (
                              <Input
                                key={i}
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...questionForm.options];
                                  newOptions[i] = e.target.value;
                                  setQuestionForm({ ...questionForm, options: newOptions });
                                }}
                                placeholder={`Option ${i + 1}`}
                              />
                            ))}
                          </div>
                        )}
                        <div>
                          <Label>Correct Answer</Label>
                          <Input
                            value={questionForm.correctAnswer}
                            onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={questionForm.points}
                            onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveQuestion}>
                          {editingQuestion ? 'Update' : 'Add Question'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions?.map((q, idx) => (
                  <Card key={q.id}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <CardDescription className="text-sm">Q{idx + 1}</CardDescription>
                            <Badge>{q.points} pts</Badge>
                          </div>
                          <p className="text-sm">{q.questionText}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openQuestionDialog(q)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setDeleteTarget({ type: 'question', id: q.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deleteTarget?.type}.
              {deleteTarget?.type === 'route' && ' All associated markers and questions will also be deleted.'}
              {deleteTarget?.type === 'marker' && ' All associated questions will also be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
