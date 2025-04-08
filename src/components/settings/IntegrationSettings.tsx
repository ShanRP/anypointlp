
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RuntimeSettings } from './RuntimeSettings';
import { CodingGuidelines } from './CodingGuidelines';

interface IntegrationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  javaVersion: string;
  mavenVersion: string;
  onJavaVersionSelect: (version: string) => void;
  onMavenVersionSelect: (version: string) => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  open,
  onOpenChange,
  javaVersion,
  mavenVersion,
  onJavaVersionSelect,
  onMavenVersionSelect
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Integration Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <RuntimeSettings 
            javaVersion={javaVersion}
            mavenVersion={mavenVersion}
            onJavaVersionSelect={onJavaVersionSelect}
            onMavenVersionSelect={onMavenVersionSelect}
          />
          <CodingGuidelines />
        </div>
      </DialogContent>
    </Dialog>
  );
};
