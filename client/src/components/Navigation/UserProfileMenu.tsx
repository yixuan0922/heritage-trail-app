import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function UserProfileMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page when it's created
    setLocation('/settings');
  };

  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary p-0 flex-shrink-0"
        onClick={() => setLocation('/login')}
      >
        <i className="fas fa-user text-primary-foreground text-sm"></i>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary p-0 flex-shrink-0"
        >
          <i className="fas fa-user text-primary-foreground text-sm"></i>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'No email provided'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation('/game-mode')} className="sm:hidden">
          <i className="fas fa-gamepad mr-2 text-sm"></i>
          <span>Game Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettings}>
          <i className="fas fa-cog mr-2 text-sm"></i>
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <i className="fas fa-sign-out-alt mr-2 text-sm"></i>
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
