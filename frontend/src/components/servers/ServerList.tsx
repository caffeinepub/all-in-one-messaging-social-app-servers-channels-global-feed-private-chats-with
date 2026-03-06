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
import { useEditServer, useCheckVerificationStatus } from '../../hooks/useQueries';
import CreateServerForm from './CreateServerForm';
import JoinServerDialog from './JoinServerDialog';
import EmptyState from '../empty/EmptyState';
import ProfilePopover from '../profile/ProfilePopover';
import ModeratorVisualTreatment from '../users/ModeratorVisualTreatment';
import { Plus, Server, MoreVertical, Edit, Trash2, Settings, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ServerInfo } from '../../backend';

interface ServerListProps {
  servers: ServerInfo[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
  onServerDeleted: () => void;
  currentUserPrincipal?: string;
  onOpenManagement?: (serverId: string) => void;
}

export default function ServerList({
  servers,
  selectedServerId,
  onSelectServer,
  onServerDeleted,
  currentUserPrincipal,
  onOpenManagement,
}: ServerListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editServer = useEditServer();

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

  if (servers.length === 0 && !showCreateForm) {
    return (
      <div className="p-4">
        <EmptyState
          imageSrc="/assets/generated/empty-messages.dim_900x600.png"
          title="No servers yet"
          description="Create or join a server to get started"
        />
        <div className="space-y-2 mt-4">
          <Button onClick={() => setShowCreateForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Server
          </Button>
          <Button onClick={() => setShowJoinDialog(true)} variant="outline" className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Server
          </Button>
        </div>
        <JoinServerDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} />
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
          <div className="space-y-2">
            <Button onClick={() => setShowCreateForm(true)} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Server
            </Button>
            <Button onClick={() => setShowJoinDialog(true)} variant="outline" size="sm" className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Join Server
            </Button>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {servers.map((server) => {
            const isOwner = currentUserPrincipal === server.ownerPrincipal.toString();
            const isEditing = editingServerId === server.id;

            return (
              <ServerListItem
                key={server.id}
                server={server}
                isOwner={isOwner}
                isEditing={isEditing}
                isSelected={selectedServerId === server.id}
                editName={editName}
                onEditNameChange={setEditName}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditingServerId(null)}
                onEditStart={handleEditStart}
                onSelect={onSelectServer}
                onOpenManagement={onOpenManagement}
                editServerPending={editServer.isPending}
              />
            );
          })}
        </div>
      </ScrollArea>
      <JoinServerDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} />
    </div>
  );
}

interface ServerListItemProps {
  server: ServerInfo;
  isOwner: boolean;
  isEditing: boolean;
  isSelected: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onEditSave: (serverId: string) => void;
  onEditCancel: () => void;
  onEditStart: (server: ServerInfo) => void;
  onSelect: (serverId: string) => void;
  onOpenManagement?: (serverId: string) => void;
  editServerPending: boolean;
}

function ServerListItem({
  server,
  isOwner,
  isEditing,
  isSelected,
  editName,
  onEditNameChange,
  onEditSave,
  onEditCancel,
  onEditStart,
  onSelect,
  onOpenManagement,
  editServerPending,
}: ServerListItemProps) {
  const { data: isOwnerVerified } = useCheckVerificationStatus(server.ownerPrincipal);

  return (
    <div
      className={cn(
        'w-full rounded-lg transition-colors flex items-center gap-2 group',
        isSelected ? 'bg-primary text-primary-foreground' : ''
      )}
    >
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2 px-3 py-2">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave(server.id);
              if (e.key === 'Escape') onEditCancel();
            }}
            className="h-8"
            autoFocus
          />
          <Button size="sm" onClick={() => onEditSave(server.id)} disabled={editServerPending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onEditCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <button
            onClick={() => onSelect(server.id)}
            className={cn(
              'flex-1 text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
              isSelected ? '' : 'hover:bg-accent text-foreground'
            )}
          >
            <Server className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{server.name}</p>
              <div className="text-xs opacity-70 truncate">
                <ProfilePopover userPrincipal={server.ownerPrincipal} displayName={server.owner}>
                  <button className="hover:underline" onClick={(e) => e.stopPropagation()}>
                    <ModeratorVisualTreatment
                      displayName={`by ${server.owner}`}
                      isVerified={!!isOwnerVerified}
                      userPrincipal={server.ownerPrincipal}
                      className="text-xs"
                      showLabel={false}
                    />
                  </button>
                </ProfilePopover>
              </div>
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
                {onOpenManagement && (
                  <DropdownMenuItem onClick={() => onOpenManagement(server.id)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Server Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEditStart(server)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
    </div>
  );
}
