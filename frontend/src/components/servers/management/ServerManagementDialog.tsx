import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ServerSettingsLayout from './ServerSettingsLayout';
import MembersManagementPanel from './MembersManagementPanel';
import InvitesManagementPanel from './InvitesManagementPanel';
import RolesManagementPanel from './RolesManagementPanel';
import ServerCustomizationPanel from './ServerCustomizationPanel';
import BrandingManagementPanel from './BrandingManagementPanel';
import DescriptionTopicPanel from './DescriptionTopicPanel';
import BansManagementPanel from './BansManagementPanel';
import DeleteServerPanel from './DeleteServerPanel';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../../../hooks/useQueries';
import type { ServerInfo } from '../../../backend';

interface ServerManagementDialogProps {
  server: ServerInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerDeleted?: () => void;
}

export default function ServerManagementDialog({ server, open, onOpenChange, onServerDeleted }: ServerManagementDialogProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const { identity } = useInternetIdentity();
  const { data: isCallerAdmin } = useIsCallerAdmin();

  const isOwner = identity && identity.getPrincipal().toString() === server.ownerPrincipal.toString();
  const canManage = isOwner || isCallerAdmin;

  const handleDeleteSuccess = () => {
    onOpenChange(false);
    if (onServerDeleted) {
      onServerDeleted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] settings-theme">
        <DialogHeader>
          <DialogTitle className="text-2xl">Server Settings</DialogTitle>
          <DialogDescription>{server.name}</DialogDescription>
        </DialogHeader>
        {!canManage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only the server owner or verified moderators can modify server settings.
            </AlertDescription>
          </Alert>
        )}
        <ServerSettingsLayout activeSection={activeSection} onSectionChange={setActiveSection}>
          {activeSection === 'overview' && (
            <ServerCustomizationPanel serverId={server.id} serverInfo={server} />
          )}
          {activeSection === 'invites' && (
            <InvitesManagementPanel serverId={server.id} serverInfo={server} />
          )}
          {activeSection === 'members' && (
            <MembersManagementPanel serverId={server.id} serverInfo={server} />
          )}
          {activeSection === 'bans' && (
            <BansManagementPanel serverId={server.id} serverInfo={server} />
          )}
          {activeSection === 'roles' && (
            <RolesManagementPanel serverId={server.id} serverInfo={server} />
          )}
          {activeSection === 'branding' && (
            <BrandingManagementPanel serverId={server.id} serverInfo={server} />
          )}
          {activeSection === 'description' && (
            <DescriptionTopicPanel serverId={server.id} serverInfo={server} />
          )}
          {activeSection === 'delete' && (
            <DeleteServerPanel serverId={server.id} serverInfo={server} onDeleteSuccess={handleDeleteSuccess} />
          )}
        </ServerSettingsLayout>
      </DialogContent>
    </Dialog>
  );
}
