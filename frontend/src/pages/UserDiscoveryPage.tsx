import { useState, useMemo } from 'react';
import { useSearchUsers } from '../hooks/useQueries';
import AuthGate from '../components/auth/AuthGate';
import ProfilePopover from '../components/profile/ProfilePopover';
import UserAvatar from '../components/profile/UserAvatar';
import ModeratorVisualTreatment from '../components/users/ModeratorVisualTreatment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users } from 'lucide-react';
import type { UserSearchResult } from '../backend';

export default function UserDiscoveryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: searchResults, isLoading } = useSearchUsers(searchTerm);

  const sortedResults = useMemo(() => {
    if (!searchResults) return [];
    // Backend already prioritizes moderators, but we ensure it here too
    return [...searchResults].sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return 0;
    });
  }, [searchResults]);

  return (
    <AuthGate message="Sign in to discover and search for users">
      <div className="h-full overflow-y-auto pb-20 md:pb-4">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Discover Users</h1>
            <p className="text-muted-foreground">Search for users by username, display name, pronouns, or links</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Users</CardTitle>
              <CardDescription>Find and connect with other users in the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by username, display name, pronouns, or links..."
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[60vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : searchTerm.trim() && sortedResults.length > 0 ? (
                  <div className="space-y-2">
                    {sortedResults.map((result) => (
                      <ProfilePopover
                        key={result.principal.toString()}
                        userPrincipal={result.principal}
                        displayName={result.displayName}
                      >
                        <button className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3">
                            <UserAvatar displayName={result.displayName} profile={null} />
                            <div className="flex-1 min-w-0">
                              <ModeratorVisualTreatment
                                displayName={result.displayName}
                                isVerified={result.isAdmin}
                                userPrincipal={result.principal}
                              />
                            </div>
                          </div>
                        </button>
                      </ProfilePopover>
                    ))}
                  </div>
                ) : searchTerm.trim() ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No users found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Start typing to search for users</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <footer className="text-center text-sm text-muted-foreground py-8">
            © 2026. Built with ❤️ using{' '}
            <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              caffeine.ai
            </a>
          </footer>
        </div>
      </div>
    </AuthGate>
  );
}
