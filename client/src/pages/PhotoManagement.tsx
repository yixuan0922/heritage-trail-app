import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { VisitorPhotoData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Trash2, Eye, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function PhotoManagement() {
  const [, setLocation] = useLocation();
  const [selectedPhoto, setSelectedPhoto] = useState<VisitorPhotoData | null>(null);
  const [deleteConfirmPhoto, setDeleteConfirmPhoto] = useState<VisitorPhotoData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: approvedPhotos = [], isLoading } = useQuery<VisitorPhotoData[]>({
    queryKey: ['/api/visitor-photos/approved'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return await apiRequest('DELETE', `/api/visitor-photos/${photoId}`, {}).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-photos/approved'] });
      toast({
        title: "Photo Deleted",
        description: "The photo has been permanently removed.",
        variant: "destructive",
      });
      setSelectedPhoto(null);
      setDeleteConfirmPhoto(null);
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
              <h1 className="text-xl font-serif font-bold">Photo Management</h1>
              <p className="text-sm text-muted-foreground">Manage approved community photos</p>
            </div>
          </div>
          <Badge variant="secondary">
            {approvedPhotos.length} approved
          </Badge>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading photos...</p>
          </div>
        ) : approvedPhotos.length === 0 ? (
          <Card className="p-12 text-center border-2 border-blue-200 bg-blue-50/50">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-images text-3xl text-blue-600"></i>
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2 text-blue-900">No Approved Photos</h2>
            <p className="text-blue-700 mb-2">
              There are no approved photos to manage yet.
            </p>
            <p className="text-sm text-blue-600">
              This page shows approved photos that are visible in galleries. You can delete them from here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {approvedPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={photo.imageUrl}
                    alt={`Photo by ${photo.username}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      // Show placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                      target.className = 'w-full h-full object-contain';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
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
                  <p className="text-xs text-muted-foreground mb-2 truncate" title={photo.imageUrl}>
                    Path: {photo.imageUrl}
                  </p>
                  {photo.caption && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteConfirmPhoto(photo)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
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
                    Uploaded on {new Date(selectedPhoto.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <Button
                size="lg"
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setDeleteConfirmPhoto(selectedPhoto);
                  setSelectedPhoto(null);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Photo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmPhoto && (
        <Dialog open={!!deleteConfirmPhoto} onOpenChange={() => setDeleteConfirmPhoto(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <DialogTitle>Delete Photo?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <img
                  src={deleteConfirmPhoto.imageUrl}
                  alt="Photo to delete"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-sm">
                <p className="font-medium mb-1">Photo by @{deleteConfirmPhoto.username}</p>
                {deleteConfirmPhoto.caption && (
                  <p className="text-muted-foreground">{deleteConfirmPhoto.caption}</p>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirmPhoto(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => deleteMutation.mutate(deleteConfirmPhoto.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Photo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
