export interface MapLocation {
  lat: number;
  lng: number;
}

export interface NLBResource {
  type: 'photograph' | 'audio' | 'document' | 'map';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  count?: number;
}

export interface WaypointData {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  heroImage?: string;
  historicalImage?: string;
  modernImage?: string;
  nlbResources: NLBResource[];
  audioClip?: string;
  isCompleted: boolean;
  isActive: boolean;
  orderIndex: number;
}

export interface TrailData {
  id: string;
  name: string;
  description: string;
  neighborhood: string;
  totalWaypoints: number;
  estimatedDuration: number;
  difficulty: string;
  heroImage?: string;
  completedWaypoints: number;
}

export interface UserProgressData {
  id: string;
  userId: string;
  trailId: string;
  completedWaypoints: string[];
  currentWaypointId?: string;
  startedAt: string;
  completedAt?: string;
  lastVisitedAt: string;
}

export interface VisitorPhotoData {
  id: string;
  waypointId: string;
  userId?: string;
  username: string;
  imageUrl: string;
  caption?: string;
  likes: number;
  uploadedAt: string;
}
