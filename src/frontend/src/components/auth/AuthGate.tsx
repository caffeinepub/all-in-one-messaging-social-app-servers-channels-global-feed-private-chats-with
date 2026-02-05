import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
  message?: string;
}

export default function AuthGate({ children, message = 'Please sign in to continue' }: AuthGateProps) {
  const { identity, login, isLoggingIn } = useInternetIdentity();

  if (!identity) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={login} disabled={isLoggingIn} className="w-full">
            {isLoggingIn ? 'Logging in...' : 'Sign In'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
