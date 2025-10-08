import { useState } from 'react';
import { VisitorPhotoData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PhotoGalleryProps {
  photos: VisitorPhotoData[];
  waypointId: string;
  onUploadPhoto: () => void;
}

interface PhotoLightboxProps {
  photos: VisitorPhotoData[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

function PhotoLightbox({ photos, currentIndex, isOpen, onClose }: PhotoLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  
  const nextPhoto = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };
  
  const prevPhoto = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };
  
  if (!photos.length) return null;
  
  const currentPhoto = photos[activeIndex];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0" data-testid="photo-lightbox">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <img 
            src={currentPhoto.imageUrl}
            alt={`Visitor photo by ${currentPhoto.username}`}
            className="w-full h-[80vh] object-contain"
          />
          
          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button 
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                data-testid="button-prev-photo"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                data-testid="button-next-photo"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </>
          )}
          
          {/* Photo Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="text-white">
              <p className="font-medium">@{currentPhoto.username}</p>
              {currentPhoto.caption && <p className="text-sm opacity-90 mt-1">{currentPhoto.caption}</p>}
              <p className="text-xs opacity-70 mt-2">
                {new Date(currentPhoto.uploadedAt).toLocaleDateString()} • {currentPhoto.likes} likes
              </p>
            </div>
          </div>
          
          {/* Counter */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {activeIndex + 1} / {photos.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PhotoGallery({ photos, waypointId, onUploadPhoto }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [showUploader, setShowUploader] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ imageURL, username, caption }: { imageURL: string; username: string; caption?: string }) => {
      // First normalize the path
      const { objectPath } = await apiRequest('PUT', '/api/visitor-photos/upload', { imageURL }).then(r => r.json());
      
      // Then create the photo record
      return await apiRequest('POST', '/api/visitor-photos', {
        waypointId,
        username,
        imageUrl: objectPath,
        caption,
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/waypoints', waypointId, 'photos'] });
      setShowUploader(false);
    },
  });

  const getUploadParameters = async () => {
    const response = await apiRequest('POST', '/api/objects/upload', {});
    const { uploadURL } = await response.json();
    return {
      method: 'PUT' as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const uploadedFile = result.successful?.[0];
    if (uploadedFile?.uploadURL) {
      const username = `visitor_${Date.now()}`; // In a real app, this would come from auth
      uploadMutation.mutate({ 
        imageURL: uploadedFile.uploadURL,
        username,
        caption: `Great memories at this heritage site!`,
      });
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif font-bold flex items-center">
          <i className="fas fa-users text-primary mr-2"></i>
          Visitor Memories
        </h3>
        <span className="text-sm text-muted-foreground">{photos.length} photos</span>
      </div>
      
      {photos.length > 0 ? (
        <div className="masonry-grid">
          {photos.map((photo, index) => (
            <div 
              key={photo.id}
              className="masonry-item group cursor-pointer" 
              onClick={() => setLightboxIndex(index)}
              data-testid={`visitor-photo-${index}`}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img 
                  src={photo.imageUrl}
                  alt={`Photo by ${photo.username}`}
                  className="w-full h-auto transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="text-white text-xs">
                    <p className="font-medium">@{photo.username}</p>
                    {photo.caption && <p>{photo.caption}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <i className="fas fa-camera text-4xl mb-4 opacity-50"></i>
          <p>No visitor photos yet. Be the first to share!</p>
        </div>
      )}
      
      {/* Upload Photo Button */}
      <div className="mt-4">
        {showUploader ? (
          <div className="border-2 border-dashed border-primary rounded-lg p-6">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={getUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full"
            >
              <div className="flex items-center justify-center space-x-2">
                <i className="fas fa-camera-retro text-xl"></i>
                <span className="font-medium">Select Photo to Upload</span>
              </div>
            </ObjectUploader>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowUploader(false)}
              className="mt-2 w-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowUploader(true)}
            variant="outline"
            className="w-full border-dashed hover:border-primary"
            data-testid="button-upload-photo"
          >
            <i className="fas fa-camera-retro mr-2 text-xl"></i>
            Share Your Memory Here
          </Button>
        )}
      </div>

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </section>
  );
}
