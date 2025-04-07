
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

export const UploadSettingsXml: React.FC = () => {
  const handleUploadClick = () => {
    // In a real application, this would trigger a file input
    toast.info('File upload dialog would open here');
  };
  
  return (
    <div className="mt-6">
      <Button 
        variant="outline" 
        className="flex items-center space-x-2" 
        onClick={handleUploadClick}
      >
        <Plus className="h-4 w-4" />
        <span>Upload Settings XML</span>
      </Button>
    </div>
  );
};
