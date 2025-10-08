import { TrailData, UserProgressData, WaypointData } from '@/types/heritage';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TrailProgressProps {
  trail: TrailData;
  userProgress: UserProgressData;
  waypoints: WaypointData[];
}

export default function TrailProgress({ trail, userProgress, waypoints }: TrailProgressProps) {
  const completedCount = (userProgress.completedWaypoints || []).length;
  const progressPercentage = (completedCount / trail.totalWaypoints) * 100;
  
  const getNextAchievement = () => {
    const achievements = [
      { threshold: 3, name: "Explorer", icon: "fas fa-compass" },
      { threshold: 5, name: "Heritage Seeker", icon: "fas fa-search" },
      { threshold: 8, name: "Cultural Navigator", icon: "fas fa-map" },
      { threshold: 10, name: "Master Explorer", icon: "fas fa-crown" },
    ];
    
    const nextAchievement = achievements.find(achievement => completedCount < achievement.threshold);
    if (!nextAchievement) return null;
    
    const remaining = nextAchievement.threshold - completedCount;
    return { ...nextAchievement, remaining };
  };

  const nextAchievement = getNextAchievement();

  return (
    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Your Progress</span>
        <Badge variant="outline" className="text-primary border-primary">
          {completedCount}/{trail.totalWaypoints} Sites
        </Badge>
      </div>
      
      <Progress value={progressPercentage} className="mb-2" />
      
      {nextAchievement ? (
        <p className="text-xs text-muted-foreground">
          <i className={`${nextAchievement.icon} text-secondary mr-1`}></i>
          Visit {nextAchievement.remaining} more site{nextAchievement.remaining > 1 ? 's' : ''} to unlock "{nextAchievement.name}"!
        </p>
      ) : (
        <p className="text-xs text-accent font-medium">
          <i className="fas fa-trophy text-secondary mr-1"></i>
          Trail completed! You're a Master Explorer!
        </p>
      )}
    </div>
  );
}
