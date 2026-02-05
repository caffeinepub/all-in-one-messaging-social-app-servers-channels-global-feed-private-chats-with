import { useState } from 'react';
import { useGetAllChannels, useEditChannel, useDeleteChannel } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateChannelForm from './CreateChannelForm';
import { Plus, Hash, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
  const { data: channels } = useGetAllChannels(serverId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editChannel = useEditChannel();
  const deleteChannel = useDeleteChannel();

  const isOwner = serverOwnerPrincipal === serverInfo.ownerPrincipal.toString();

  const handleEditStart = (channelId: string, channelName: string) => {
    setEditingChannelId(channelId);
    setEditName(channelName);
  };

  const handleEditSave = async (channelId: string) => {
    if (!editName.trim()) {
      toast.error('Channel name cannot be empty');
      return;
    }

    try {
      await editChannel.mutateAsync({ serverId, channelId, newName: editName.trim() });
      setEditingChannelId(null);
      toast.success('Channel renamed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename channel');
    }
  };

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg mb-3">Channels</h2>
        {isOwner && (
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
            channels.map((channel) => {
              const isEditing = editingChannelId === channel.id;

              return (
                <div
                  key={channel.id}
                  className={cn(
                    'w-full rounded-lg transition-colors flex items-center gap-2 group',
                    selectedChannelId === channel.id ? 'bg-primary text-primary-foreground' : ''
                  )}
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 px-3 py-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(channel.id);
                          if (e.key === 'Escape') setEditingChannelId(null);
                        }}
                        className="h-8"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleEditSave(channel.id)} disabled={editChannel.isPending}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingChannelId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectChannel(channel.id)}
                        className={cn(
                          'flex-1 text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
                          selectedChannelId === channel.id ? '' : 'hover:bg-accent text-foreground'
                        )}
                      >
                        <Hash className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium truncate">{channel.name}</span>
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
                            <DropdownMenuItem onClick={() => handleEditStart(channel.id, channel.name)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
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
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No channels yet</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
