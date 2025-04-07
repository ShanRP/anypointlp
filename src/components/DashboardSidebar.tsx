import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  FileCode2, 
  TestTube2, 
  FileText, 
  Database, 
  MessageSquare, 
  FileQuestion, 
  RefreshCcw,
  Share2,
  Users,
  ChevronDown,
  Settings,
  LogOut,
  PlusCircle,
  Layers,
  Clock,
  X,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/providers/LanguageProvider';
import { WorkspaceOption, useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceTasks, type WorkspaceTask } from '@/hooks/useWorkspaceTasks';
import { Button } from '@/components/ui/button';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';
import CodingAssistantDialog from './ai/CodingAssistantDialog';
import { useAnimations } from '@/utils/animationUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import WorkspaceActionMenu from './workspace/WorkspaceActionMenu';
import EditWorkspaceDialog from './workspace/EditWorkspaceDialog';
import DeleteWorkspaceDialog from './workspace/DeleteWorkspaceDialog';
import InviteWorkspaceDialog from './workspace/InviteWorkspaceDialog';
import { getTaskCategoryIcon } from '@/utils/taskUtils';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number | string;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon, 
  label, 
  active = false, 
  onClick,
  badge 
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer mb-1",
        active
          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      <div className={cn(
        "flex-shrink-0 flex items-center justify-center w-6 h-6",
        active
          ? "text-white"
          : "text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400"
      )}>
        {icon}
      </div>
      <span className="flex-1">{label}</span>
      {badge && (
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium",
          active
            ? "bg-white/20 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        )}>
          {badge}
        </div>
      )}
    </div>
  );
};

interface ActivityItemProps {
  id: string;
  title: string;
  time: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  id,
  title,
  time,
  icon,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          #{id} - {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Clock className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

interface DashboardSidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onTaskSelect?: (taskId: string) => void;
  selectedWorkspaceId?: string;
  onWorkspaceChange?: (workspace: WorkspaceOption) => void;
  onViewAllActivities?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onNavigate,
  currentPage,
  onTaskSelect,
  selectedWorkspaceId,
  onWorkspaceChange,
  onViewAllActivities
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { t } = useLanguage();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [isCreateWorkspaceDialogOpen, setIsCreateWorkspaceDialogOpen] = useState(false);
  const [isCodingAssistantOpen, setIsCodingAssistantOpen] = useState(false);
  const { workspaces, selectedWorkspace, createWorkspace, updateWorkspace, selectWorkspace, generateInviteLink, refreshWorkspaces } = useWorkspaces();
  const { tasks } = useWorkspaceTasks(selectedWorkspace?.id || '');
  const { fadeIn } = useAnimations();
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [activeWorkspaceMenu, setActiveWorkspaceMenu] = useState<string | null>(null);
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const [isInviteWorkspaceOpen, setIsInviteWorkspaceOpen] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      uiToast({
        title: t('auth.signedOut'),
        description: t('auth.signedOutSuccess'),
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      uiToast({
        variant: "destructive",
        title: t('common.error'),
        description: t('auth.signOutError'),
      });
    }
  };

  const handleViewAllActivities = () => {
    setIsActivitySheetOpen(true);
    if (onViewAllActivities) {
      onViewAllActivities();
    }
  };

  const handleUpdateWorkspace = async (name: string) => {
    if (!selectedWorkspace) return;
    
    const initial = name.charAt(0).toUpperCase();
    const success = await updateWorkspace(selectedWorkspace.id, { name, initial });
    
    if (success) {
      toast.success("Workspace Updated", {
        description: "Workspace name has been updated."
      });
    } else {
      toast.error("Update Failed", {
        description: "Could not update workspace name."
      });
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace || !user) return;
    
    try {
      const { error } = await supabase
        .from('apl_workspaces')
        .delete()
        .eq('id', selectedWorkspace.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success("Workspace deleted successfully");
      refreshWorkspaces();
      
      if (workspaces.length > 1) {
        // Select another workspace
        const newSelectedWorkspace = workspaces.find(w => w.id !== selectedWorkspace.id);
        if (newSelectedWorkspace) {
          selectWorkspace(newSelectedWorkspace);
          if (onWorkspaceChange) onWorkspaceChange(newSelectedWorkspace);
        }
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error("Failed to delete workspace");
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!selectedWorkspace) return;
    
    const inviteLink = await generateInviteLink(selectedWorkspace.id);
    
    if (inviteLink) {
      toast.success("Invite link generated successfully");
      return inviteLink;
    } else {
      toast.error("Failed to generate invite link");
      return null;
    }
  };

  const toggleWorkspaceMenu = (workspaceId: string) => {
    if (activeWorkspaceMenu === workspaceId) {
      setActiveWorkspaceMenu(null);
    } else {
      setActiveWorkspaceMenu(workspaceId);
    }
  };

  const formatRecentTasks = (tasks: WorkspaceTask[]) => {
    if (!tasks || tasks.length === 0) return [];
    
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return sortedTasks.slice(0, 4).map(task => {
      const taskDate = new Date(task.created_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60));
      
      let timeDisplay;
      if (diffHours < 24) {
        timeDisplay = diffHours < 1 ? 'Just now' : `${diffHours}h ago`;
      } else if (diffHours < 48) {
        timeDisplay = 'Yesterday';
      } else {
        timeDisplay = `${Math.floor(diffHours / 24)} days ago`;
      }
      
      return {
        id: task.id,
        task_id: task.task_id || task.id.slice(0, 4),
        title: task.task_name || 'Task',
        time: timeDisplay,
        category: task.category || 'dataweave',
      };
    });
  };
  
  const recentTasks = formatRecentTasks(tasks || []);
  const allTasks = tasks ? [...tasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) : [];

  const getTaskIcon = (category: string) => {
    const iconName = getTaskCategoryIcon(category);
    
    switch (iconName) {
      case 'database':
        return <Database size={16} />;
      case 'file-code-2':
        return <FileCode2 size={16} />;
      case 'file-code':
        return <FileCode2 size={16} />;
      case 'test-tube-2':
        return <TestTube2 size={16} />;
      case 'file-text':
        return <FileText size={16} />;
      case 'file-question':
        return <FileQuestion size={16} />;
      default:
        return <FileText size={16} />;
    }
  };
  
  return (
    <div className="w-72 relative z-10">
      <div className="absolute inset-0 bg-white dark:bg-gray-900 shadow-xl rounded-r-3xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 overflow-hidden z-0 opacity-10">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-purple-400"></div>
          <div className="absolute top-20 -right-10 w-60 h-60 rounded-full bg-indigo-400"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10">
                <div className="absolute w-8 h-8 bg-purple-600 rounded-lg opacity-80 transform rotate-6 translate-x-0.5 translate-y-0.5"></div>
                <div className="absolute w-8 h-8 bg-indigo-500 rounded-lg opacity-80 transform -rotate-3"></div>
                <div className="absolute w-8 h-8 bg-purple-400 rounded-lg opacity-90"></div>
                <Layers className="w-4 h-4 text-white relative z-10" />
              </div>
              <div className="font-bold text-xl text-gray-900 dark:text-white">
                Anypoint{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                  LP
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/20">
              <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-sm">
                <AvatarImage src="/placeholder-user.jpg" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                  {selectedWorkspace?.initial || user?.email?.charAt(0).toUpperCase() || 'W'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedWorkspace?.name || 'Personal Workspace'}</p>
              </div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-sm"
                  onClick={() => {
                    setWorkspaceDropdownOpen(!workspaceDropdownOpen);
                    setActiveWorkspaceMenu(null);
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <WorkspaceActionMenu 
                  onEdit={() => setIsEditWorkspaceOpen(true)}
                  onDelete={() => setIsDeleteWorkspaceOpen(true)}
                  onInvite={() => setIsInviteWorkspaceOpen(true)}
                />
              </div>
            </div>

            {workspaceDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-6 right-6 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 divide-y divide-gray-100 dark:divide-gray-700"
              >
                <div className="pb-2">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className={`flex items-center gap-3 px-4 py-2 ${
                        workspace.id === selectedWorkspace?.id
                          ? "bg-gray-100 dark:bg-gray-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      } cursor-pointer`}
                    >
                      <div onClick={() => {
                        selectWorkspace(workspace);
                        if (onWorkspaceChange) onWorkspaceChange(workspace);
                        setWorkspaceDropdownOpen(false);
                      }} className="flex items-center gap-3 flex-1">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                            {workspace.initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium dark:text-white">
                            {workspace.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => {
                      setIsCreateWorkspaceDialogOpen(true);
                      setWorkspaceDropdownOpen(false);
                    }}
                  >
                    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <PlusCircle className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Create new workspace</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex-1 overflow-auto px-6 pb-6">
            <div className="mb-6">
              <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                Navigation
              </p>
              <NavItem
                icon={<Home size={18} />}
                label="Dashboard"
                active={currentPage === "dashboard"}
                onClick={() => onNavigate("dashboard")}
              />
              <NavItem
                icon={<MessageSquare size={18} />}
                label="Coding Assistant"
                active={currentPage === "chat"}
                onClick={() => setIsCodingAssistantOpen(true)}
              />
              <NavItem
                icon={<Database size={18} />}
                label="DataWeave"
                active={currentPage === "dataweave"}
                onClick={() => onNavigate("dataweave")}
              />
              <NavItem
                icon={<FileCode2 size={18} />}
                label="Integration"
                active={currentPage === "integration"}
                onClick={() => onNavigate("integration")}
              />
              <NavItem
                icon={<FileCode2 size={18} />}
                label="RAML"
                active={currentPage === "raml"}
                onClick={() => onNavigate("raml")}
              />
              <NavItem
                icon={<TestTube2 size={18} />}
                label="MUnit Testing"
                active={currentPage === "munit"}
                onClick={() => onNavigate("munit")}
              />
              <NavItem
                icon={<Database size={18} />}
                label="Sample Data"
                active={currentPage === "sampleData"}
                onClick={() => onNavigate("sampleData")}
              />
              <NavItem
                icon={<FileText size={18} />}
                label="Documentation"
                active={currentPage === "document"}
                onClick={() => onNavigate("document")}
              />
              <NavItem
                icon={<FileQuestion size={18} />}
                label="Diagrams"
                active={currentPage === "diagram"}
                onClick={() => onNavigate("diagram")}
              />
              <NavItem
                icon={<Share2 size={18} />}
                label="Exchange"
                active={currentPage === "exchange"}
                onClick={() => onNavigate("exchange")}
              />
              <NavItem
                icon={<Users size={18} />}
                label="Job Board"
                active={currentPage === "jobBoard"}
                onClick={() => onNavigate("jobBoard")}
              />
            </div>

            {recentTasks.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400 px-2">
                    Recent Activities
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleViewAllActivities}
                  >
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskSelect?.(task.id)}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {getTaskIcon(task.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {task.task_id} - {task.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{task.time}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <NavItem
                icon={<Settings size={18} />}
                label="Settings"
                active={currentPage === "settings"}
                onClick={() => onNavigate("settings")}
              />
              <NavItem
                icon={<LogOut size={18} />}
                label="Logout"
                onClick={handleSignOut}
              />
            </div>
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        isOpen={isCreateWorkspaceDialogOpen}
        onClose={() => setIsCreateWorkspaceDialogOpen(false)}
        onCreate={createWorkspace}
      />
      
      <CodingAssistantDialog
        isOpen={isCodingAssistantOpen}
        onOpenChange={setIsCodingAssistantOpen}
        trigger={<button data-dialog-trigger="coding-assistant" className="hidden"></button>}
      />
      
      <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
        <SheetContent side="right" className="w-[400px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">All Activities</SheetTitle>
          </SheetHeader>
          
          {allTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center">No activities yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-center text-sm">Activities will appear here as you use the application</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-gray-100 dark:border-gray-800"
                  onClick={() => {
                    onTaskSelect?.(task.id);
                    setIsActivitySheetOpen(false);
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {getTaskIcon(task.category || 'default')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-2">
                        {task.task_id || 'Task'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mt-1">
                      {task.task_name}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      <EditWorkspaceDialog
        isOpen={isEditWorkspaceOpen}
        onClose={() => setIsEditWorkspaceOpen(false)}
        workspaceName={selectedWorkspace?.name || ''}
        onSave={handleUpdateWorkspace}
      />
      
      <DeleteWorkspaceDialog
        isOpen={isDeleteWorkspaceOpen}
        onClose={() => setIsDeleteWorkspaceOpen(false)}
        workspaceName={selectedWorkspace?.name || ''}
        onDelete={handleDeleteWorkspace}
      />
      
      <InviteWorkspaceDialog
        isOpen={isInviteWorkspaceOpen}
        onClose={() => setIsInviteWorkspaceOpen(false)}
        workspaceName={selectedWorkspace?.name || ''}
        onGenerateLink={handleGenerateInviteLink}
      />
    </div>
  );
};

export default DashboardSidebar;
