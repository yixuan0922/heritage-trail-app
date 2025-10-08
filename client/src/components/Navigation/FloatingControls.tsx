import { TrailData, UserProgressData, WaypointData } from '@/types/heritage';
import { Badge } from '@/components/ui/badge';

interface FloatingControlsProps {
  activeTrail: TrailData | null;
  userProgress: UserProgressData | null;
  currentWaypoint: WaypointData | null;
  totalWaypoints: number;
}

export default function FloatingControls({ 
  activeTrail, 
  userProgress, 
  currentWaypoint, 
  totalWaypoints 
}: FloatingControlsProps) {
  if (!activeTrail || !userProgress) return null;

  const completedCount = (userProgress.completedWaypoints || []).length;
  const progressPercentage = (completedCount / totalWaypoints) * 100;
  
  // Calculate progress ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="absolute top-20 md:top-24 right-4 md:right-6 z-20" data-testid="progress-ring">
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <svg className="transform -rotate-90 w-16 h-16 md:w-20 md:h-20">
          <circle 
            cx="32" 
            cy="32" 
            r={28} 
            stroke="hsl(30 20% 88%)" 
            strokeWidth="5" 
            fill="none"
            className="md:hidden"
          />
          <circle 
            className="progress-ring md:hidden" 
            cx="32" 
            cy="32" 
            r={28} 
            stroke="hsl(0 84% 50%)" 
            strokeWidth="5" 
            fill="none" 
            strokeDasharray={2 * Math.PI * 28}
            strokeDashoffset={2 * Math.PI * 28 - (progressPercentage / 100) * 2 * Math.PI * 28}
            strokeLinecap="round"
          />
          <circle 
            cx="40" 
            cy="40" 
            r={radius} 
            stroke="hsl(30 20% 88%)" 
            strokeWidth="6" 
            fill="none"
            className="hidden md:block"
          />
          <circle 
            className="progress-ring hidden md:block" 
            cx="40" 
            cy="40" 
            r={radius} 
            stroke="hsl(0 84% 50%)" 
            strokeWidth="6" 
            fill="none" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-base md:text-lg font-bold text-foreground">{completedCount}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">of {totalWaypoints}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
