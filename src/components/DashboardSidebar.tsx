
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, Plus, X, Loader2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { WorkspaceOption } from "@/hooks/useWorkspaces";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFeatures } from "@/contexts/FeaturesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface DashboardSidebarProps {
  workspaces: WorkspaceOption[];
  selectedWorkspace: WorkspaceOption | null;
  onSelectWorkspace: (workspace: WorkspaceOption) => void;
  loading: boolean;
  refreshWorkspaces: () => Promise<any>;
  isOpen?: boolean;
  toggle?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
  loading,
  refreshWorkspaces,
  isOpen = true,
  toggle = () => {},
}) => {
  const { user } = useAuth();
  const { enabledFeatures } = useFeatures();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshWorkspaces = async () => {
    setIsRefreshing(true);
    await refreshWorkspaces();
    setIsRefreshing(false);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 bottom-0 bg-white dark:bg-gray-900 transition-all duration-300 z-30 h-full flex flex-col ${
          isOpen ? "translate-x-0 w-64 shadow-lg" : "-translate-x-full w-0"
        }`}
      >
        <div className="flex justify-between items-center p-4">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <img src="/images/mulesoft-logo.png" alt="Logo" className="h-8 w-8" />
            MuleSoft AI
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mb-4" />

        <div className="flex-1 overflow-auto px-4">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Workspaces
              </h2>
              {loading || isRefreshing ? (
                <Loader2 className="animate-spin h-4 w-4 text-gray-400" />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleRefreshWorkspaces}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-gray-400"
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                  </svg>
                </Button>
              )}
            </div>

            <AnimatePresence>
              <div className="space-y-1">
                {workspaces.map((workspace) => (
                  <motion.div
                    key={workspace.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-all ${
                        selectedWorkspace?.id === workspace.id
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => onSelectWorkspace(workspace)}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">
                          {workspace.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{workspace.name}</span>
                    </button>
                  </motion.div>
                ))}

                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center w-full px-3 py-2 text-sm justify-start font-normal mb-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Workspace</DialogTitle>
                    </DialogHeader>
                    <CreateWorkspaceDialog
                      onSuccess={() => setShowCreateDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </AnimatePresence>
          </div>

          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Tools
          </h2>
          <nav className="space-y-1 mb-6">
            {enabledFeatures.includes("dataweaveGenerator") && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
                end
              >
                DataWeave Generator
              </NavLink>
            )}

            {enabledFeatures.includes("integrationGenerator") && (
              <NavLink
                to="/dashboard/munit"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                MUnit Generator
              </NavLink>
            )}

            {enabledFeatures.includes("sampleDataGenerator") && (
              <NavLink
                to="/dashboard/sample-data"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                Sample Data Generator
              </NavLink>
            )}

            {enabledFeatures.includes("document") && (
              <NavLink
                to="/dashboard/document"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                Document Generator
              </NavLink>
            )}

            {enabledFeatures.includes("diagram") && (
              <NavLink
                to="/dashboard/diagram"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                Diagram Generator
              </NavLink>
            )}

            {enabledFeatures.includes("jobBoard") && (
              <NavLink
                to="/dashboard/jobs"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                Job Board
              </NavLink>
            )}

            {enabledFeatures.includes("exchange") && (
              <NavLink
                to="/dashboard/exchange"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                Exchange
              </NavLink>
            )}
            
            {enabledFeatures.includes("codingAssistant") && (
              <NavLink
                to="/dashboard/assistant"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                Coding Assistant
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex justify-between items-center p-4 border-t dark:border-gray-800">
          <div className="flex items-center space-x-2">
            {user && (
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="text-sm">
              <div className="font-medium truncate max-w-[120px]">
                {user?.email?.split("@")[0] || "User"}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <ThemeToggle variant="ghost" size="sm" />

            <NavLink to="/settings">
              <Button variant="ghost" size="sm" className="ml-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              </Button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={toggle}
        ></div>
      )}

      {/* Toggle button for mobile */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggle}
        className="fixed bottom-4 left-4 z-20 rounded-full shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
};

export default DashboardSidebar;
