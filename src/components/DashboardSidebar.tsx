
import React, { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Settings,
  Menu,
  Database,
  Workflow,
  FileCode,
  BarChart3,
  MessageSquare,
  Plus,
  Cpu,
  Box,
  Network,
  FastForward,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces, WorkspaceOption } from "@/hooks/useWorkspaces";
import { toast } from "sonner";

// Components
import { Button } from "@/components/ui/button";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import WorkspaceDetailsDialog from "@/components/workspace/WorkspaceDetailsDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define sidebar item interfaces
interface SubItem {
  icon: React.ElementType;
  name: string;
  path: string;
  description?: string;
}

interface SidebarItem {
  icon: React.ElementType;
  name: string;
  path: string;
  description?: string;
  subitems?: SubItem[];
  expanded?: boolean;
}

// SidebarItem component for rendering individual nav items
const SidebarItem: React.FC<{
  item: SidebarItem;
  isActive: boolean;
  onClick?: () => void;
  toggleExpand?: () => void;
  isExpanded?: boolean;
}> = ({ item, isActive, onClick, toggleExpand, isExpanded }) => {
  const IconComponent = item.icon;
  
  const hasSubitems = item.subitems && item.subitems.length > 0;
  
  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={hasSubitems ? toggleExpand : onClick}
              className={`flex items-center justify-between px-3 py-2 mb-1 rounded-md cursor-pointer transition-all group ${
                isActive
                  ? "bg-primary text-primary-foreground dark:bg-primary/90"
                  : "hover:bg-primary/10 dark:hover:bg-primary/20"
              }`}
            >
              <div className="flex items-center">
                <IconComponent className={`h-5 w-5 mr-3 ${isActive ? "text-inherit" : "text-primary"}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {hasSubitems && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="max-w-xs">
            {item.description || item.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// SubItemsList component for rendering subitems when a parent is expanded
const SubItemsList: React.FC<{
  subitems: SubItem[];
  isPathActive: (path: string) => boolean;
}> = ({ subitems, isPathActive }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="ml-4 pl-3 border-l border-border/50"
      >
        {subitems.map((subitem, index) => {
          const IconComponent = subitem.icon;
          const isActive = isPathActive(subitem.path);
          
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={subitem.path}
                    className={`flex items-center px-3 py-2 mb-1 rounded-md transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground dark:bg-primary/90"
                        : "hover:bg-primary/10 dark:hover:bg-primary/20"
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 mr-3 ${isActive ? "text-inherit" : "text-primary"}`} />
                    <span className="text-sm font-medium">{subitem.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="max-w-xs">
                  {subitem.description || subitem.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};

// Main DashboardSidebar component
export const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaces, selectedWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, selectWorkspace } = useWorkspaces();
  
  // State for dialogs and UI
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Toggle expansion of sidebar items with subitems
  const toggleItemExpand = useCallback((path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path)
        ? prev.filter((item) => item !== path)
        : [...prev, path]
    );
  }, []);

  // Check if a path is active for highlighting
  const isPathActive = useCallback(
    (path: string) => {
      if (path === "/dashboard" && location.pathname === "/dashboard") {
        return true;
      }
      return (
        location.pathname.startsWith(path) &&
        (path !== "/dashboard" || location.pathname === "/dashboard")
      );
    },
    [location.pathname]
  );

  // Define main sidebar navigation items
  const sidebarItems: SidebarItem[] = [
    { 
      icon: FileCode, 
      name: "AI Tools", 
      path: "/dashboard/ai-tools",
      description: "AI-powered tools for MuleSoft development",
      subitems: [
        { 
          icon: Workflow, 
          name: "Integration Flow", 
          path: "/dashboard/integration",
          description: "Generate MuleSoft integration flows using AI"
        },
        { 
          icon: Network, 
          name: "API Spec Generator", 
          path: "/dashboard/raml",
          description: "Generate RAML/OAS API specifications using AI"
        },
        { 
          icon: FastForward, 
          name: "DataWeave Transform", 
          path: "/dashboard/dw",
          description: "Create DataWeave transformations using AI"
        },
        { 
          icon: Cpu, 
          name: "MUnit Test Generator", 
          path: "/dashboard/munit",
          description: "Generate MUnit tests for your Mule applications"
        },
        { 
          icon: BarChart3, 
          name: "Sample Data Generator", 
          path: "/dashboard/sample-data",
          description: "Generate realistic sample data for testing"
        },
        { 
          icon: FileText, 
          name: "Document Generator", 
          path: "/dashboard/document",
          description: "Generate documentation for your APIs and integrations"
        },
        { 
          icon: Box, 
          name: "Diagram Generator", 
          path: "/dashboard/diagram",
          description: "Create architecture and flow diagrams"
        },
      ],
    },
    { 
      icon: Database, 
      name: "Exchange", 
      path: "/dashboard/exchange",
      description: "Browse and share integration components with the community",
      subitems: [
        { 
          icon: Box, 
          name: "Browse Items", 
          path: "/dashboard/exchange",
          description: "Browse shared components from the community"
        },
        { 
          icon: Plus, 
          name: "Publish Item", 
          path: "/dashboard/exchange/publish",
          description: "Share your components with the community"
        },
      ],
    },
    { 
      icon: Users, 
      name: "Workspace", 
      path: "/settings",
      description: "Workspace settings and team management"
    },
    { 
      icon: MessageSquare, 
      name: "Help & Feedback", 
      path: "/dashboard/help",
      description: "Get support and provide feedback"
    },
    { 
      icon: Settings, 
      name: "Settings", 
      path: "/settings",
      description: "Application settings and preferences"
    },
  ];

  // Create workspace handler
  const handleCreateWorkspace = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Workspace name cannot be empty");
      return;
    }
    
    try {
      await createWorkspace(trimmedName);
      toast.success(`Workspace "${trimmedName}" created successfully`);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace");
    }
  };

  // Initialize UI based on active path
  React.useEffect(() => {
    // Auto-expand parent items based on current route
    const expandedPaths = sidebarItems
      .filter(item => 
        item.subitems && 
        item.subitems.some(subitem => isPathActive(subitem.path))
      )
      .map(item => item.path);
    
    if (expandedPaths.length > 0) {
      setExpandedItems(expandedPaths);
    }
  }, []);

  return (
    <div className="h-full w-64 border-r bg-background flex flex-col overflow-hidden">
      {/* Workspace selector */}
      <div className="p-4 border-b flex items-center justify-between">
        <button
          onClick={() => setShowDetailsDialog(true)}
          className="flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded-md transition-colors flex-grow"
          disabled={!selectedWorkspace}
        >
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <span className="font-semibold">
              {selectedWorkspace?.initial || "W"}
            </span>
          </div>
          <div className="truncate flex-1">
            {selectedWorkspace?.name || "No workspace"}
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreateDialog(true)}
          title="Create new workspace"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {sidebarItems.map((item, index) => (
          <div key={index}>
            <SidebarItem
              item={item}
              isActive={isPathActive(item.path)}
              onClick={() => item.path && navigate(item.path)}
              toggleExpand={() => toggleItemExpand(item.path)}
              isExpanded={expandedItems.includes(item.path)}
            />
            
            {item.subitems && expandedItems.includes(item.path) && (
              <SubItemsList
                subitems={item.subitems}
                isPathActive={isPathActive}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer with copyright */}
      <div className="p-4 text-xs text-muted-foreground border-t">
        © {new Date().getFullYear()} Anypoint Learning Platform
      </div>

      {/* Workspace dialogs */}
      <CreateWorkspaceDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateWorkspace}
      />

      {selectedWorkspace && (
        <WorkspaceDetailsDialog
          isOpen={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
          workspace={selectedWorkspace}
          onDelete={deleteWorkspace}
          onUpdate={updateWorkspace}
        />
      )}
    </div>
  );
};

export default DashboardSidebar;
