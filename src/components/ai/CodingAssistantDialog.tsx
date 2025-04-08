
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CodingAssistant from './CodingAssistant';
import { Code, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

// Create a global state to manage a single dialog instance
let globalSetIsOpen: ((open: boolean) => void) | null = null;
let globalOpenCallback: ((open: boolean) => void) | null = null;

// Function to control the dialog from anywhere in the app
export const openCodingAssistantDialog = () => {
  if (globalSetIsOpen) {
    globalSetIsOpen(true);
    if (globalOpenCallback) globalOpenCallback(true);
  }
};

export const closeCodingAssistantDialog = () => {
  if (globalSetIsOpen) {
    globalSetIsOpen(false);
    if (globalOpenCallback) globalOpenCallback(false);
  }
};

interface CodingAssistantDialogProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CodingAssistantDialog: React.FC<CodingAssistantDialogProps> = ({ 
  trigger,
  isOpen,
  onOpenChange
}) => {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0); // Add a key to force re-render when dialog opens
  
  // Register the setter with the global reference
  useEffect(() => {
    globalSetIsOpen = setOpen;
    globalOpenCallback = onOpenChange || null;
    
    return () => {
      // Clean up when component unmounts
      if (globalSetIsOpen === setOpen) {
        globalSetIsOpen = null;
      }
      if (globalOpenCallback === onOpenChange) {
        globalOpenCallback = null;
      }
    };
  }, [onOpenChange]);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) onOpenChange(newOpen);
    
    // When dialog opens, reset the key to force a fresh instance of CodingAssistant
    if (newOpen) {
      setKey(prevKey => prevKey + 1);
    }
  };
  
  // Use the controlled open state if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : open;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent 
        className={cn(
          "sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-5xl xl:max-w-6xl h-[85vh] p-0 overflow-hidden rounded-xl border-0 shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        )}
      >
        {/* Custom close button positioned at the top-right corner */}
        <div className="absolute top-8 right-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-black-700 dark:text-gray-300 shadow-sm"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="h-full w-full overflow-hidden flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          {/* Use the key to force re-render when dialog opens */}
          <CodingAssistant key={key} initialSidebarOpen={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodingAssistantDialog;
