import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';

export function useViewPollingEnabled(routePath: string): boolean {
  const router = useRouterState();
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isActiveRoute = router.location.pathname === routePath;
  return isActiveRoute && isVisible;
}
