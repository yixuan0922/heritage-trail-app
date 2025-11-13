import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { VisitorPhotoData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Eye, ArrowLeft } from 'lucide-react';

export default function PhotoModeration() {
  const [, setLocation] = useLocation();
  const [selectedPhoto, setSelectedPhoto] = useState<VisitorPhotoData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingPhotos = [], isLoading } = useQuery<VisitorPhotoData[]>({
    queryKey: ['/api/visitor-photos/pending'],
  });

  const approveMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return await apiRequest('PATCH', `/api/visitor-photos/${photoId}/approve`, {}).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-photos/pending'] });
      toast({
        title: "Photo Approved",
        description: "The photo is now visible in the community gallery.",
      });
      setSelectedPhoto(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return await apiRequest('DELETE', `/api/visitor-photos/${photoId}`, {}).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-photos/pending'] });
      toast({
        title: "Photo Rejected",
        description: "The photo has been removed from the queue.",
        variant: "destructive",
      });
      setSelectedPhoto(null);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/campaigns')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-serif font-bold">Photo Moderation</h1>
              <p className="text-sm text-muted-foreground">Review community submissions</p>
            </div>
          </div>
          <Badge variant={pendingPhotos.length > 0 ? "default" : "secondary"}>
            {pendingPhotos.length} pending
          </Badge>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading submissions...</p>
          </div>
        ) : pendingPhotos.length === 0 ? (
          <Card className="p-12 text-center border-2 border-green-200 bg-green-50/50">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold mb-2 text-green-900">All Caught Up!</h2>
            <p className="text-green-700">
              There are no pending photo submissions to review.
            </p>
            <p className="text-sm text-green-600 mt-2">
              This page shows photos waiting for approval.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={photo.imageUrl}
                    alt={`Photo by ${photo.username}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">@{photo.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {photo.caption && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => approveMutation.mutate(photo.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => rejectMutation.mutate(photo.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Photo Detail Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative bg-black">
              <img
                src={selectedPhoto.imageUrl}
                alt={`Photo by ${selectedPhoto.username}`}
                className="w-full h-[70vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                <div className="text-white">
                  <p className="font-medium text-lg mb-1">@{selectedPhoto.username}</p>
                  {selectedPhoto.caption && (
                    <p className="text-sm opacity-90 mb-3">{selectedPhoto.caption}</p>
                  )}
                  <p className="text-xs opacity-70">
                    Submitted on {new Date(selectedPhoto.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 flex space-x-4">
              <Button
                size="lg"
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => approveMutation.mutate(selectedPhoto.id)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve Photo
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="flex-1"
                onClick={() => rejectMutation.mutate(selectedPhoto.id)}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Reject Photo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
