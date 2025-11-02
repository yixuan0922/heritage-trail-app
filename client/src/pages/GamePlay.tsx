import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useParams } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, CheckCircle2, XCircle, MapPin, Trophy, Lightbulb } from 'lucide-react';
import type { Campaign, Route, RouteMarker, Question, CampaignProgress, Waypoint } from '@shared/schema';

export default function GamePlay() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

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
    enabled: !!campaignId,
  });

  const currentRoute = routes?.[currentRouteIndex];

  const { data: markers } = useQuery<(RouteMarker & { waypoint: Waypoint })[]>({
    queryKey: ['markers', currentRoute?.id],
    queryFn: async () => {
      const response = await fetch(`/api/routes/${currentRoute?.id}/markers`);
      if (!response.ok) throw new Error('Failed to fetch markers');
      const markersData = await response.json();

      // Fetch waypoint details for each marker
      const markersWithWaypoints = await Promise.all(
        markersData.map(async (marker: RouteMarker) => {
          const waypointResponse = await fetch(`/api/waypoints/${marker.waypointId}`);
          const waypoint = await waypointResponse.json();
          return { ...marker, waypoint };
        })
      );

      return markersWithWaypoints;
    },
    enabled: !!currentRoute?.id,
  });

  const currentMarker = markers?.[currentMarkerIndex];

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['questions', currentMarker?.id],
    queryFn: async () => {
      const response = await fetch(`/api/markers/${currentMarker?.id}/questions`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: !!currentMarker?.id,
  });

  const currentQuestion = questions?.[currentQuestionIndex];

  const { data: progress, refetch: refetchProgress } = useQuery<CampaignProgress>({
    queryKey: ['campaign-progress', user?.id, campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/campaigns/${campaignId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
    enabled: !!user?.id && !!campaignId,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      const response = await fetch('/api/question-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          questionId: currentQuestion?.id,
          campaignProgressId: progress?.id,
          userAnswer: answer,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit answer');
      return response.json();
    },
    onSuccess: (data) => {
      setIsCorrect(data.isCorrect);
      setShowResult(true);
      refetchProgress();
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (updates: Partial<CampaignProgress>) => {
      const response = await fetch(`/api/campaign-progress/${progress?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return response.json();
    },
    onSuccess: () => {
      refetchProgress();
    },
  });

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    submitAnswerMutation.mutate(userAnswer);
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);

    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      // Next question in current marker
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered for this marker
      setShowHint(true);
    }
  };

  const handleNextMarker = () => {
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
    setCurrentQuestionIndex(0);

    if (currentMarkerIndex < (markers?.length || 0) - 1) {
      // Next marker in current route
      setCurrentMarkerIndex(currentMarkerIndex + 1);
      updateProgressMutation.mutate({
        currentMarkerIndex: currentMarkerIndex + 1,
      });
    } else {
      // Route completed
      handleRouteComplete();
    }
  };

  const handleRouteComplete = () => {
    const completedRoutes = [...(progress?.completedRoutes as string[] || []), currentRoute?.id];

    if (currentRouteIndex < (routes?.length || 0) - 1) {
      // Next route
      setCurrentRouteIndex(currentRouteIndex + 1);
      setCurrentMarkerIndex(0);
      setCurrentQuestionIndex(0);
      updateProgressMutation.mutate({
        currentRouteId: routes?.[currentRouteIndex + 1]?.id,
        currentMarkerIndex: 0,
        completedRoutes,
      });
    } else {
      // Campaign completed!
      updateProgressMutation.mutate({
        isCompleted: true,
        completedAt: new Date().toISOString(),
        completedRoutes,
      });
      setLocation('/game-mode');
    }
  };

  const totalQuestions = routes?.reduce((sum, route) => {
    return sum + (markers?.length || 0) * (questions?.length || 0);
  }, 0) || 0;

  const answeredQuestions = (currentRouteIndex * (markers?.length || 0) * (questions?.length || 0)) +
    (currentMarkerIndex * (questions?.length || 0)) +
    currentQuestionIndex;

  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  if (!campaign || !routes || !markers || !questions || !progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>{progress.totalScore} points</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Route {currentRouteIndex + 1} of {routes.length}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Show Hint Screen */}
        {showHint && currentMarker?.hintToNext && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Hint to Next Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">{currentMarker.hintToNext}</p>
              <Button onClick={handleNextMarker} size="lg" className="w-full">
                Proceed to Next Destination
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Location */}
        {!showHint && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {currentMarker?.waypoint?.name || 'Current Location'}
              </CardTitle>
              <CardDescription>
                {currentMarker?.waypoint?.description || ''}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Question Card */}
        {!showHint && currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                <span className="text-sm font-medium text-primary">
                  {currentQuestion.points} points
                </span>
              </div>
              <CardDescription className="text-lg">
                {currentQuestion.questionText}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showResult ? (
                <Alert variant={isCorrect ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <AlertDescription>
                      {isCorrect
                        ? `Correct! You earned ${currentQuestion.points} points.`
                        : `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`}
                    </AlertDescription>
                  </div>
                </Alert>
              ) : (
                <>
                  {currentQuestion.questionType === 'multiple_choice' && (
                    <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                      {(currentQuestion.options as string[])?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.questionType === 'true_false' && (
                    <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="true" />
                        <Label htmlFor="true" className="cursor-pointer">True</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="false" />
                        <Label htmlFor="false" className="cursor-pointer">False</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {currentQuestion.questionType === 'text_input' && (
                    <Input
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer..."
                    />
                  )}
                </>
              )}

              <div className="flex gap-2">
                {showResult ? (
                  <Button onClick={handleNextQuestion} size="lg" className="w-full">
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Hint'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitAnswer}
                    size="lg"
                    className="w-full"
                    disabled={!userAnswer.trim() || submitAnswerMutation.isPending}
                  >
                    {submitAnswerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
