import { Link } from '@tanstack/react-router';
import LoginButton from '../auth/LoginButton';

export default function AppHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/assets/generated/app-logo.dim_512x512.png" alt="App Logo" className="h-10 w-10 rounded-lg" />
          <span className="font-bold text-xl hidden sm:inline">Nexus</span>
        </Link>
        <LoginButton />
      </div>
    </header>
  );
}
