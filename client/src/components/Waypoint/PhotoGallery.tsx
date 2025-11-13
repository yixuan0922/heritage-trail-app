import { useState, useRef } from 'react';
import { VisitorPhotoData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Upload, X } from 'lucide-react';

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
  if (!currentPhoto) return null;

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
  const [uploadCaption, setUploadCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Filter to show only approved photos
  const approvedPhotos = photos.filter(photo => photo.isApproved);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', file);

      // Upload the file
      const uploadResponse = await fetch('/api/visitor-photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { imageUrl } = await uploadResponse.json();

      // Create the photo record in database
      const username = `visitor_${Date.now()}`; // In a real app, this would come from auth
      return await apiRequest('POST', '/api/visitor-photos', {
        waypointId,
        username,
        imageUrl,
        caption,
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/waypoints', waypointId, 'photos'] });
      setShowUploader(false);
      setUploadCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate({
        file: selectedFile,
        caption: uploadCaption.trim() || undefined,
      });
    }
  };

  const handleCancelUpload = () => {
    setShowUploader(false);
    setUploadCaption('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif font-bold flex items-center">
          <i className="fas fa-users text-primary mr-2"></i>
          Visitor Memories
        </h3>
        <span className="text-sm text-muted-foreground">{approvedPhotos.length} photos</span>
      </div>

      {approvedPhotos.length > 0 ? (
        <div className="masonry-grid">
          {approvedPhotos.map((photo, index) => (
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
          <div className="border-2 border-dashed border-primary rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Share your memory and story
              </label>
              <Textarea
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="Tell us about your experience at this heritage site... What did you see? What did you learn? What memories will you take away?"
                className="resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {uploadCaption.length}/500 characters • Your photo will be reviewed before appearing in the gallery
              </p>
            </div>

            {/* File Upload Area */}
            <div className="w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 rounded-lg p-8 text-center cursor-pointer transition-colors"
                >
                  <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Click to select a photo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelUpload}
                disabled={uploadMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
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
        photos={approvedPhotos}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </section>
  );
}
