import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetAllServers } from '../../hooks/useQueries';
import { Users, UserPlus } from 'lucide-react';
import { useState } from 'react';
import JoinServerDialog from './JoinServerDialog';
import type { ServerInfo } from '../../backend';

export default function ServerBrowser() {
  const { data: servers, isLoading } = useGetAllServers();
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const handleJoinClick = (server: ServerInfo) => {
    setSelectedServer(server);
    setJoinDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discover Servers</CardTitle>
          <CardDescription>Loading available servers...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discover Servers</CardTitle>
          <CardDescription>No servers available to browse</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Discover Servers</h2>
          <p className="text-muted-foreground">Browse and join available servers</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{server.name}</CardTitle>
                    <CardDescription className="truncate">
                      Owner: {server.owner}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    <span>Server</span>
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleJoinClick(server)}
                    className="gap-1"
                  >
                    <UserPlus className="h-4 w-4" />
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedServer && (
        <JoinServerDialog
          open={joinDialogOpen}
          onOpenChange={setJoinDialogOpen}
          serverId={selectedServer.id}
        />
      )}
    </>
  );
}
