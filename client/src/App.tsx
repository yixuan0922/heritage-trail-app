import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import MapView from "@/pages/MapView";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import GameMode from "@/pages/GameMode";
import GamePlayMap from "@/pages/GamePlayMap";
import AdminDashboard from "@/pages/AdminDashboard";
import CampaignDetail from "@/pages/CampaignDetail";
import RouteManager from "@/pages/RouteManager";
import WaypointManager from "@/pages/WaypointManager";
import QRScanner from "@/pages/QRScanner";
import NotFound from "@/pages/not-found";

function Router() {
  // Enable location tracking for logged-in users
  useLocationTracking();

  return (
    <Switch>
      <Route path="/" component={MapView} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/game-mode" component={GameMode} />
      <Route path="/game-mode/play/:campaignId" component={GamePlayMap} />
      <Route path="/admin/campaigns" component={AdminDashboard} />
      <Route path="/admin/campaigns/:campaignId" component={CampaignDetail} />
      <Route path="/admin/campaigns/:campaignId/routes" component={RouteManager} />
      <Route path="/admin/trails/:trailId/waypoints" component={WaypointManager} />
      <Route path="/admin/qr-scanner" component={QRScanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
