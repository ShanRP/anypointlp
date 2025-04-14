import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Check,
  Users,
  Database,
  Layers,
  LucideIcon,
  Workflow,
  FileCode,
  BarChart3,
  MessageSquare,
  Plus,
  Cpu,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Box,
  Network,
  FastForward
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces, WorkspaceOption } from "@/hooks/useWorkspaces";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import WorkspaceDetailsDialog from "@/components/workspace/WorkspaceDetailsDialog";
import { toast } from "sonner";

interface SidebarItem {
  icon: LucideIcon;
  name: string;
  path: string;
  subitems?: SidebarItem[];
  expanded?: boolean;
}

export const AppSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    workspaces, 
    selectedWorkspace, 
    createWorkspace, 
    updateWorkspace, 
    deleteWorkspace, 
    selectWorkspace,
    refreshWorkspaces
  } = useWorkspaces();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    try {
      await createWorkspace(name);
      toast.success(`Workspace "${name}" created successfully`);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace");
    }
  };

  const sidebarItems: SidebarItem[] = useMemo(() => [
    { icon: Home, name: "Home", path: "/dashboard" },
    {
      icon: Database,
      name: "Exchange",
      path: "/dashboard/exchange",
      subitems: [
        { icon: Box, name: "Explore Items", path: "/dashboard/exchange" },
        { icon: Plus, name: "Publish Item", path: "/dashboard/exchange/publish" },
      ],
    },
    {
      icon: FileCode,
      name: "AI Tools",
      path: "/dashboard/ai-tools",
      subitems: [
        { icon: Workflow, name: "Integration Flow", path: "/dashboard/integration" },
        { icon: Network, name: "API Spec Generator", path: "/dashboard/raml" },
        { icon: FastForward, name: "DataWeave Transform", path: "/dashboard/dw" },
        { icon: Cpu, name: "MUnit Test Generator", path: "/dashboard/munit" },
        { icon: BarChart3, name: "Sample Data Generator", path: "/dashboard/sample-data" },
        { icon: FileText, name: "Document Generator", path: "/dashboard/document" },
        { icon: Layers, name: "Diagram Generator", path: "/dashboard/diagram" },
      ],
    },
    { icon: MessageSquare, name: "Help & Feedback", path: "/dashboard/help" },
    { icon: Settings, name: "Settings", path: "/settings" },
  ], []);

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

  const activeWorkspaceInitial = selectedWorkspace ? selectedWorkspace.initial : "W";

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 z-40 flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent className="h-[90vh] overflow-y-auto">
          <div className="p-4 flex flex-col h-full">
            <div className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={!workspaces.length}
                  >
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold mr-2">
                        {activeWorkspaceInitial}
                      </div>
                      <span className="truncate max-w-[150px]">
                        {selectedWorkspace?.name || "No Workspace"}
                      </span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => selectWorkspace(workspace)}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold mr-2">
                          {workspace.initial}
                        </div>
                        <span className="truncate max-w-[180px]">{workspace.name}</span>
                      </div>
                      {selectedWorkspace?.id === workspace.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Workspace
                  </DropdownMenuItem>
                  {selectedWorkspace && (
                    <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Workspace Settings
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Accordion
                type="multiple"
                defaultValue={sidebarItems
                  .filter((item) => item.subitems && isPathActive(item.path))
                  .map((item) => item.path)}
                className="space-y-1"
              >
                {sidebarItems.map((item) => {
                  const isActive = isPathActive(item.path);
                  const Icon = item.icon;
                  
                  if (item.subitems) {
                    return (
                      <AccordionItem
                        key={item.path}
                        value={item.path}
                        className="border-none"
                      >
                        <AccordionTrigger
                          className={`flex items-center p-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                            isActive ? "bg-accent text-accent-foreground" : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{item.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-6 pt-1">
                          <div className="space-y-1">
                            {item.subitems.map((subitem) => {
                              const SubIcon = subitem.icon;
                              const isSubActive = isPathActive(subitem.path);
                              return (
                                <Link
                                  key={subitem.path}
                                  to={subitem.path}
                                  className={`flex items-center p-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                                    isSubActive
                                      ? "bg-accent text-accent-foreground"
                                      : ""
                                  }`}
                                >
                                  <SubIcon className="h-4 w-4 mr-2" />
                                  <span>{subitem.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center p-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                        isActive ? "bg-accent text-accent-foreground" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </Accordion>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {user?.email || "User"}
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:w-72 lg:pb-4 lg:border-r bg-background">
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 flex justify-between items-center">
            <DropdownMenu open={showWorkspaceMenu} onOpenChange={setShowWorkspaceMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 justify-between"
                  disabled={!workspaces.length}
                >
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold mr-2">
                      {activeWorkspaceInitial}
                    </div>
                    <span className="truncate max-w-[150px]">
                      {selectedWorkspace?.name || "No Workspace"}
                    </span>
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[280px]">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => selectWorkspace(workspace)}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold mr-2">
                        {workspace.initial}
                      </div>
                      <span className="truncate max-w-[180px]">{workspace.name}</span>
                    </div>
                    {selectedWorkspace?.id === workspace.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Workspace
                </DropdownMenuItem>
                {selectedWorkspace && (
                  <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Workspace Settings
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={() => refreshWorkspaces()} title="Refresh workspaces">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          <div className="flex-1 overflow-y-auto">
            <div className="px-2 py-3">
              <Accordion
                type="multiple"
                defaultValue={sidebarItems
                  .filter((item) => item.subitems && isPathActive(item.path))
                  .map((item) => item.path)}
                className="space-y-1"
              >
                {sidebarItems.map((item) => {
                  const isActive = isPathActive(item.path);
                  const Icon = item.icon;
                  
                  if (item.subitems) {
                    return (
                      <AccordionItem
                        key={item.path}
                        value={item.path}
                        className="border-none"
                      >
                        <AccordionTrigger
                          className={`flex items-center p-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                            isActive ? "bg-accent text-accent-foreground" : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{item.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-6 pt-1">
                          <div className="space-y-1">
                            {item.subitems.map((subitem) => {
                              const SubIcon = subitem.icon;
                              const isSubActive = isPathActive(subitem.path);
                              return (
                                <Link
                                  key={subitem.path}
                                  to={subitem.path}
                                  className={`flex items-center p-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                                    isSubActive
                                      ? "bg-accent text-accent-foreground"
                                      : ""
                                  }`}
                                >
                                  <SubIcon className="h-4 w-4 mr-2" />
                                  <span>{subitem.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center p-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                        isActive ? "bg-accent text-accent-foreground" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </Accordion>
            </div>
          </div>

          <div className="mt-auto px-4 py-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {user?.email || "User"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <CreateWorkspaceDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateWorkspace}
      />

      <WorkspaceDetailsDialog
        isOpen={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        workspace={selectedWorkspace}
        onDelete={deleteWorkspace}
        onUpdate={updateWorkspace}
      />
    </>
  );
};

export default AppSidebar;
