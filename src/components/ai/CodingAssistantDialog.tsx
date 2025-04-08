
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CodingAssistant from './CodingAssistant';
import { Code, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

// Create a global state to track dialog open state
const globalState = {
  isDialogOpen: false,
  setDialogOpen: null as ((open: boolean) => void) | null,
  openCounter: 0,
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
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9));
  
  // Register this instance's setOpen with the global state
  useEffect(() => {
    if (globalState.setDialogOpen === null) {
      globalState.setDialogOpen = setOpen;
    }
    
    return () => {
      if (globalState.setDialogOpen === setOpen) {
        globalState.setDialogOpen = null;
      }
    };
  }, [setOpen]);
  
  const handleOpenChange = (newOpen: boolean) => {
    // Update global state
    if (newOpen) {
      globalState.openCounter++;
      globalState.isDialogOpen = true;
      
      // Only open if this is the first request or this instance is controlling the dialog
      if (globalState.openCounter === 1 || globalState.setDialogOpen === setOpen) {
        setOpen(newOpen);
        if (onOpenChange) onOpenChange(newOpen);
        
        // When dialog opens, reset the key to force a fresh instance of CodingAssistant
        if (newOpen) {
          setKey(prevKey => prevKey + 1);
        }
        
        // Set this instance as the controller
        globalState.setDialogOpen = setOpen;
      }
    } else {
      globalState.openCounter = Math.max(0, globalState.openCounter - 1);
      if (globalState.openCounter === 0) {
        globalState.isDialogOpen = false;
      }
      
      setOpen(false);
      if (onOpenChange) onOpenChange(false);
    }
  };
  
  // Use the controlled open state if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : open;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md">
              <Code size={16} />
              <span>Coding Assistant</span>
            </Button>
          </motion.div>
        )}
      </DialogTrigger>
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
