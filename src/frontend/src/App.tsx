import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/layout/AppLayout';
import FeedPage from './pages/FeedPage';
import ServersPage from './pages/ServersPage';
import DirectMessagesPage from './pages/DirectMessagesPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';

const rootRoute = createRootRoute({
  component: AppLayout,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FeedPage,
});

const serversRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/servers',
  component: ServersPage,
});

const directMessagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: DirectMessagesPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfileSettingsPage,
});

const routeTree = rootRoute.addChildren([feedRoute, serversRoute, directMessagesRoute, profileRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
