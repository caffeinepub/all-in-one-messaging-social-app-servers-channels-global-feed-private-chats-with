import { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Settings, Users, UserPlus, Shield, Image, FileText, Ban, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServerSettingsLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: ReactNode;
}

const sections = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'invites', label: 'Invites', icon: UserPlus },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'bans', label: 'Bans & Kicks', icon: Ban },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'branding', label: 'Branding', icon: Image },
  { id: 'description', label: 'Description', icon: FileText },
  { id: 'delete', label: 'Delete Server', icon: Trash2, danger: true },
];

export default function ServerSettingsLayout({ activeSection, onSectionChange, children }: ServerSettingsLayoutProps) {
  return (
    <div className="flex gap-6 h-[calc(85vh-8rem)]">
      <nav className="w-48 flex-shrink-0">
        <ScrollArea className="h-full">
          <div className="space-y-1 pr-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-settings-accent text-settings-accent-foreground'
                      : section.danger
                      ? 'text-destructive hover:bg-destructive/10'
                      : 'text-settings-muted-foreground hover:bg-settings-muted hover:text-settings-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </nav>
      <Separator orientation="vertical" className="h-full" />
      <ScrollArea className="flex-1">
        <div className="pr-4 pb-4">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
