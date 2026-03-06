import { Outlet } from '@tanstack/react-router';
import AppHeader from './AppHeader';
import AppNav from './AppNav';
import ProfileSetupModal from '../profile/ProfileSetupModal';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 flex flex-col md:flex-row">
        <AppNav />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <ProfileSetupModal />
    </div>
  );
}
