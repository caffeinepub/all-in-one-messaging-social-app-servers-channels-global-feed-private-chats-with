import { useState } from 'react';
import { useGetChannels, useDeleteChannel, useIsCallerAdmin } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateChannelForm from './CreateChannelForm';
import EditChannelDialog from './EditChannelDialog';
import { Plus, Hash, MoreVertical, Trash2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ServerInfo } from '../../backend';

interface ChannelListProps {
  serverId: string;
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onChannelDeleted: () => void;
  serverOwnerPrincipal?: string;
  serverInfo: ServerInfo;
}

export default function ChannelList({
  serverId,
  selectedChannelId,
  onSelectChannel,
  onChannelDeleted,
  serverOwnerPrincipal,
  serverInfo,
}: ChannelListProps) {
  const { identity } = useInternetIdentity();
  const { data: channels } = useGetChannels(serverId);
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<{ id: string; name: string } | null>(null);
  const deleteChannel = useDeleteChannel();

  const currentUserPrincipal = identity?.getPrincipal().toString();
  const isOwner = currentUserPrincipal === serverInfo.ownerPrincipal.toString();
  const canManage = isOwner || isCallerAdmin;

  const handleDelete = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel? All messages will be lost.')) return;

    try {
      await deleteChannel.mutateAsync({ serverId, channelId });
      onChannelDeleted();
      toast.success('Channel deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete channel');
    }
  };

  const handleEditSuccess = () => {
    setEditingChannel(null);
    toast.success('Channel updated successfully');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg mb-3">Channels</h2>
        {canManage && (
          <>
            {showCreateForm ? (
              <CreateChannelForm
                serverId={serverId}
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <Button onClick={() => setShowCreateForm(true)} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Channel
              </Button>
            )}
          </>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {channels && channels.length > 0 ? (
            channels.map((channel) => (
              <div
                key={channel.id}
                className={cn(
                  'w-full rounded-lg transition-colors flex items-center gap-2 group',
                  selectedChannelId === channel.id ? 'bg-primary text-primary-foreground' : ''
                )}
              >
                <button
                  onClick={() => onSelectChannel(channel.id)}
                  className={cn(
                    'flex-1 text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
                    selectedChannelId === channel.id ? '' : 'hover:bg-accent text-foreground'
                  )}
                >
                  <Hash className="h-4 w-4 shrink-0" />
                  <span className="font-medium truncate">{channel.name}</span>
                </button>
                {canManage && (
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
                      <DropdownMenuItem onClick={() => setEditingChannel({ id: channel.id, name: channel.name })}>
                        <Settings className="h-4 w-4 mr-2" />
                        Channel Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(channel.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No channels yet</p>
          )}
        </div>
      </ScrollArea>

      {editingChannel && (
        <EditChannelDialog
          serverId={serverId}
          channelId={editingChannel.id}
          channelName={editingChannel.name}
          open={!!editingChannel}
          onOpenChange={(open) => !open && setEditingChannel(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
