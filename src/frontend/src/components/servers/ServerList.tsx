import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditServer, useDeleteServer } from '../../hooks/useQueries';
import CreateServerForm from './CreateServerForm';
import EmptyState from '../empty/EmptyState';
import { Plus, Server, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ServerInfo } from '../../backend';

interface ServerListProps {
  servers: ServerInfo[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
  onServerDeleted: () => void;
  currentUserPrincipal?: string;
}

export default function ServerList({
  servers,
  selectedServerId,
  onSelectServer,
  onServerDeleted,
  currentUserPrincipal,
}: ServerListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editServer = useEditServer();
  const deleteServer = useDeleteServer();

  const handleEditStart = (server: ServerInfo) => {
    setEditingServerId(server.id);
    setEditName(server.name);
  };

  const handleEditSave = async (serverId: string) => {
    if (!editName.trim()) {
      toast.error('Server name cannot be empty');
      return;
    }

    try {
      await editServer.mutateAsync({ serverId, newName: editName.trim() });
      setEditingServerId(null);
      toast.success('Server renamed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename server');
    }
  };

  const handleDelete = async (serverId: string) => {
    if (!confirm('Are you sure you want to delete this server? All channels and messages will be lost.')) return;

    try {
      await deleteServer.mutateAsync(serverId);
      onServerDeleted();
      toast.success('Server deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete server');
    }
  };

  if (servers.length === 0 && !showCreateForm) {
    return (
      <div className="p-4">
        <EmptyState
          imageSrc="/assets/generated/empty-messages.dim_900x600.png"
          title="No servers yet"
          description="Create your first server to get started"
        />
        <Button onClick={() => setShowCreateForm(true)} className="w-full mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Create Server
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg mb-3">Servers</h2>
        {showCreateForm ? (
          <CreateServerForm onSuccess={() => setShowCreateForm(false)} onCancel={() => setShowCreateForm(false)} />
        ) : (
          <Button onClick={() => setShowCreateForm(true)} variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Server
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {servers.map((server) => {
            const isOwner = currentUserPrincipal === server.owner;
            const isEditing = editingServerId === server.id;

            return (
              <div
                key={server.id}
                className={cn(
                  'w-full rounded-lg transition-colors flex items-center gap-2 group',
                  selectedServerId === server.id ? 'bg-primary text-primary-foreground' : ''
                )}
              >
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(server.id);
                        if (e.key === 'Escape') setEditingServerId(null);
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleEditSave(server.id)} disabled={editServer.isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingServerId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSelectServer(server.id)}
                      className={cn(
                        'flex-1 text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
                        selectedServerId === server.id ? '' : 'hover:bg-accent text-foreground'
                      )}
                    >
                      <Server className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{server.name}</p>
                        <p className="text-xs opacity-70 truncate">by {server.owner}</p>
                      </div>
                    </button>
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditStart(server)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(server.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
