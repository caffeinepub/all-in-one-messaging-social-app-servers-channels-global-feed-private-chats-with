import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Server, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Feed', icon: Home },
  { path: '/servers', label: 'Servers', icon: Server },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function AppNav() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:flex-col w-64 border-r border-border bg-card/30 p-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-40">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all flex-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
