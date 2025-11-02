import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Loader2, QrCode, CheckCircle2, XCircle, Trophy, ArrowLeft, User } from 'lucide-react';
import UserProfileMenu from '../components/Navigation/UserProfileMenu';

interface VerificationResult {
  user: {
    id: string;
    username: string;
    email?: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  progress: {
    id: string;
    totalScore: number;
    isCompleted: boolean;
    pointsCollected: boolean;
    startedAt: string;
    completedAt?: string;
  };
}

export default function QRScanner() {
  const { user, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [qrToken, setQrToken] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      setLocation('/game-mode');
    }
  }, [loading, isAdmin, setLocation]);

  // Auto-verify if token is in URL
  useEffect(() => {
    if (!isAdmin || loading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl && !verificationResult && !isVerifying) {
      setQrToken(tokenFromUrl);
      // Auto-verify the token
      handleVerifyQR(tokenFromUrl);
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleVerifyQR = async (tokenOverride?: string) => {
    const tokenToVerify = tokenOverride || qrToken;

    // Ensure we have a string token
    if (!tokenToVerify || typeof tokenToVerify !== 'string' || !tokenToVerify.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setSuccess(null);
    setVerificationResult(null);

    try {
      const trimmedToken = tokenToVerify.trim();

      // Determine if it's a verification code (short alphanumeric) or full token
      const isVerificationCode = trimmedToken.length <= 8 && /^[A-Z0-9]+$/i.test(trimmedToken);

      const response = await fetch('/api/admin/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isVerificationCode
            ? { verificationCode: trimmedToken }
            : { token: trimmedToken }),
          adminId: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify QR code');
      }

      const data = await response.json();
      setVerificationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify QR code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMarkCollected = async () => {
    if (!verificationResult) return;

    setIsCollecting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/mark-points-collected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressId: verificationResult.progress.id,
          adminId: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark points as collected');
      }

      setSuccess('Points marked as collected successfully!');
      // Update the verification result to reflect the collection
      setVerificationResult({
        ...verificationResult,
        progress: {
          ...verificationResult.progress,
          pointsCollected: true,
        },
      });
      // Clear the QR token to prepare for next scan
      setQrToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark points as collected');
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation('/admin/campaigns')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2">QR Code Scanner</h1>
              <p className="text-muted-foreground">Verify and collect campaign completion points</p>
            </div>
          </div>
          <UserProfileMenu />
        </div>

        {/* Scanner Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-6 w-6" />
              Scan QR Code
            </CardTitle>
            <CardDescription>
              Enter the 6-character verification code or scan the QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value.toUpperCase())}
                placeholder="Enter verification code (e.g., ABC123)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyQR();
                  }
                }}
                maxLength={6}
                className="font-mono text-lg tracking-widest text-center"
              />
              <Button onClick={handleVerifyQR} disabled={isVerifying || !qrToken.trim()}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {verificationResult && (
              <div className="space-y-4 mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold text-lg">Valid QR Code</span>
                </div>

                {/* User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Username:</span>
                      <span className="font-medium">{verificationResult.user.username}</span>
                    </div>
                    {verificationResult.user.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="font-medium">{verificationResult.user.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Campaign Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Campaign Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Campaign:</span>
                      <span className="font-medium">{verificationResult.campaign.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Score:</span>
                      <Badge variant="default" className="text-lg">
                        {verificationResult.progress.totalScore} points
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={verificationResult.progress.isCompleted ? "default" : "secondary"}>
                        {verificationResult.progress.isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Started:</span>
                      <span className="text-sm">
                        {new Date(verificationResult.progress.startedAt).toLocaleString()}
                      </span>
                    </div>
                    {verificationResult.progress.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completed:</span>
                        <span className="text-sm">
                          {new Date(verificationResult.progress.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Points Collected:</span>
                      {verificationResult.progress.pointsCollected ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50">Not Yet</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Button */}
                {!verificationResult.progress.pointsCollected && verificationResult.progress.isCompleted && (
                  <Button
                    onClick={handleMarkCollected}
                    disabled={isCollecting}
                    className="w-full"
                    size="lg"
                  >
                    {isCollecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Points as Collected
                      </>
                    )}
                  </Button>
                )}

                {verificationResult.progress.pointsCollected && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Points have already been collected for this campaign completion.
                    </AlertDescription>
                  </Alert>
                )}

                {!verificationResult.progress.isCompleted && (
                  <Alert>
                    <AlertDescription>
                      This campaign has not been completed yet. The user cannot collect points until all markers are finished.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
