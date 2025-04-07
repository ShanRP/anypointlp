
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from 'lucide-react';

interface InviteWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  onGenerateLink: () => Promise<string | null>;
}

const InviteWorkspaceDialog: React.FC<InviteWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  workspaceName,
  onGenerateLink
}) => {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !inviteLink) {
      handleGenerateLink();
    }
  }, [isOpen]);

  const handleGenerateLink = async () => {
    setIsLoading(true);
    try {
      const link = await onGenerateLink();
      setInviteLink(link);
    } catch (error) {
      console.error('Error generating invite link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Workspace</DialogTitle>
          <DialogDescription>
            Share this link to invite people to your workspace: {workspaceName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Input
              value={inviteLink || ''}
              readOnly
              disabled={isLoading || !inviteLink}
              placeholder={isLoading ? "Generating link..." : "No invite link generated yet"}
            />
          </div>
          <Button 
            size="icon" 
            onClick={copyToClipboard} 
            disabled={isLoading || !inviteLink}
            variant="outline"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            type="button" 
            onClick={handleGenerateLink} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Generating..." : "Generate New Link"}
          </Button>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteWorkspaceDialog;
