import { useState } from 'react';
import { WaypointData, VisitorPhotoData } from '@/types/heritage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import ThenAndNowSlider from './ThenAndNowSlider';
import PhotoGallery from './PhotoGallery';

interface WaypointPopupProps {
  waypoint: WaypointData | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (waypoint: WaypointData) => void;
  onSharePhoto: (waypoint: WaypointData) => void;
}

export default function WaypointPopup({ 
  waypoint, 
  isOpen, 
  onClose, 
  onNavigate, 
  onSharePhoto 
}: WaypointPopupProps) {
  const [activeResourceIndex, setActiveResourceIndex] = useState(0);

  const { data: visitorPhotos = [] } = useQuery<VisitorPhotoData[]>({
    queryKey: ['/api/waypoints', waypoint?.id, 'photos'],
    enabled: !!waypoint?.id,
  });

  if (!waypoint) return null;

  const resourceIcons = {
    photograph: 'fas fa-camera',
    audio: 'fas fa-microphone',
    document: 'fas fa-file-alt',
    map: 'fas fa-map',
  } as const;

  const resourceColors = {
    photograph: 'bg-primary/10 text-primary',
    audio: 'bg-secondary/10 text-secondary',
    document: 'bg-accent/10 text-accent',
    map: 'bg-chart-4/10 text-chart-4',
  } as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0"
        data-testid="waypoint-popup"
      >
        {/* Hero Section */}
        <div className="relative">
          <div className="h-64 relative overflow-hidden">
            <img 
              src={waypoint.heroImage || `https://images.unsplash.com/photo-1591946614720-90a587da4a36?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400`}
              alt={waypoint.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center space-x-2 mb-2">
              <Badge 
                variant={waypoint.isCompleted ? 'default' : 'secondary'}
                className={waypoint.isCompleted ? 'bg-accent' : ''}
              >
                <i className={`mr-1 ${waypoint.isCompleted ? 'fas fa-check' : 'fas fa-map-marker-alt'}`}></i>
                {waypoint.isCompleted ? 'Completed' : 'Available'}
              </Badge>
              <Badge variant="outline" className="bg-card/90 backdrop-blur-sm">
                {waypoint.category}
              </Badge>
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-1">{waypoint.name}</h2>
            <p className="text-sm text-white/90 font-mono">
              <i className="fas fa-map-marker-alt mr-1"></i>
              {waypoint.latitude.toFixed(4)}° N, {waypoint.longitude.toFixed(4)}° E
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(90vh-16rem)] p-6">
          
          {/* Quick Actions */}
          <div className="flex space-x-3 mb-6">
            <Button 
              onClick={() => onNavigate(waypoint)} 
              className="flex-1"
              data-testid="button-navigate-waypoint"
            >
              <i className="fas fa-route mr-2"></i>Navigate Here
            </Button>
            <Button 
              onClick={() => onSharePhoto(waypoint)}
              variant="secondary" 
              className="flex-1"
              data-testid="button-share-photo"
            >
              <i className="fas fa-camera mr-2"></i>Share Photo
            </Button>
            <Button variant="outline" size="icon">
              <i className="fas fa-bookmark"></i>
            </Button>
          </div>
          
          {/* Historical Overview */}
          <section className="mb-8">
            <h3 className="text-xl font-serif font-bold mb-3 flex items-center">
              <i className="fas fa-book-open text-primary mr-2"></i>
              Historical Overview
            </h3>
            <p className="text-muted-foreground leading-relaxed">{waypoint.description}</p>
          </section>
          
          {/* Then & Now Comparison */}
          {waypoint.historicalImage && waypoint.modernImage && (
            <section className="mb-8">
              <h3 className="text-xl font-serif font-bold mb-4 flex items-center">
                <i className="fas fa-history text-primary mr-2"></i>
                Then & Now
              </h3>
              <ThenAndNowSlider
                historicalImage={waypoint.historicalImage}
                modernImage={waypoint.modernImage}
              />
            </section>
          )}
          
          {/* NLB Digital Resources */}
          {waypoint.nlbResources.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xl font-serif font-bold mb-4 flex items-center">
                <i className="fas fa-archive text-primary mr-2"></i>
                NLB Digital Resources
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waypoint.nlbResources.map((resource, index) => (
                  <div
                    key={index}
                    onClick={() => setActiveResourceIndex(index)}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                    data-testid={`resource-card-${index}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${resourceColors[resource.type]}`}>
                        <i className={`${resourceIcons[resource.type]} text-xl`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{resource.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                        <span className={`text-xs font-medium ${
                          resource.type === 'photograph' ? 'text-primary' :
                          resource.type === 'audio' ? 'text-secondary' :
                          resource.type === 'document' ? 'text-accent' : 'text-chart-4'
                        }`}>
                          {resource.type === 'photograph' ? 'View Collection' :
                           resource.type === 'audio' ? 'Listen Now' :
                           resource.type === 'document' ? 'Read More' : 'Explore'} →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Audio Clip */}
          {waypoint.audioClip && (
            <section className="mb-8">
              <h3 className="text-xl font-serif font-bold mb-4 flex items-center">
                <i className="fas fa-volume-up text-primary mr-2"></i>
                Audio Guide
              </h3>
              <div className="bg-muted rounded-lg p-4">
                <audio controls className="w-full">
                  <source src={waypoint.audioClip} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </section>
          )}
          
          {/* Visitor Photos */}
          <PhotoGallery 
            photos={visitorPhotos}
            waypointId={waypoint.id}
            onUploadPhoto={() => onSharePhoto(waypoint)}
          />
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
