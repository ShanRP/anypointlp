import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Check,
  FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './assets/Logo';
import { useWorkspaces, WorkspaceOption } from '@/hooks/useWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/providers/LanguageProvider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import CreateWorkspaceDialog from './CreateWorkspaceDialog';
import { useWorkspaceTasks, WorkspaceTask } from '@/hooks/useWorkspaceTasks';

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 text-sm mb-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 ${
        active ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-gray-400 dark:text-slate-300'
      } ${className || ''}`}
    >
      <div className="mr-3">{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  );
};

type SidebarSectionProps = {
  title: string;
  children: React.ReactNode;
};

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => {
  return (
    <div className="mb-6">
      <div className="px-4 mb-2">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
};

interface AppSidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onTaskSelect?: (taskId: string) => void;
  selectedWorkspaceId?: string;
  onWorkspaceChange?: (workspace: WorkspaceOption) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ 
  onNavigate, 
  currentPage,
  onTaskSelect,
  selectedWorkspaceId,
  onWorkspaceChange
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [isCreateWorkspaceDialogOpen, setIsCreateWorkspaceDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { 
    workspaces, 
    selectedWorkspace, 
    loading: workspacesLoading, 
    createWorkspace,
    selectWorkspace
  } = useWorkspaces();
  
  const { 
    tasks, 
    loading: tasksLoading, 
    fetchWorkspaceTasks 
  } = useWorkspaceTasks(
    selectedWorkspaceId || selectedWorkspace?.id || ''
  );

  useEffect(() => {
    if (selectedWorkspace && selectedWorkspace.id) {
      fetchWorkspaceTasks();
    }
  }, [selectedWorkspace?.id, fetchWorkspaceTasks]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('auth.signedOut'),
        description: t('auth.signedOutSuccess'),
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('auth.signOutError'),
      });
    }
  };

  const handleWorkspaceSelect = (workspace: WorkspaceOption) => {
    selectWorkspace(workspace);
    setWorkspaceDropdownOpen(false);
    setSelectedTaskId(null);
    
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace);
    }
  };
  
  const handleCreateWorkspace = (name: string) => {
    createWorkspace(name);
    toast({
      title: t('workspace.created'),
      description: t('workspace.createdSuccess', { name }),
    });
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (onTaskSelect) {
      onTaskSelect(taskId);
    }
  };

  const organizeTasks = (tasks: WorkspaceTask[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayTasks: WorkspaceTask[] = [];
    const yesterdayTasks: WorkspaceTask[] = [];
    const olderTasks: WorkspaceTask[] = [];
    
    const workspaceTasks = tasks.filter(task => 
      task.workspace_id === selectedWorkspace?.id
    );
    
    workspaceTasks.forEach(task => {
      const taskDate = new Date(task.created_at);
      if (taskDate.toDateString() === today.toDateString()) {
        todayTasks.push(task);
      } else if (taskDate.toDateString() === yesterday.toDateString()) {
        yesterdayTasks.push(task);
      } else {
        olderTasks.push(task);
      }
    });
    
    return { todayTasks, yesterdayTasks, olderTasks };
  };
  
  const { todayTasks, yesterdayTasks, olderTasks } = organizeTasks(tasks || []);

  const hasTasks = todayTasks.length > 0 || yesterdayTasks.length > 0 || olderTasks.length > 0;

  return (
    <>
      <div className="fixed top-0 left-0 h-screen w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Logo className="!text-left !text-xl" />
        </div>
        
        <div className="relative px-4 py-2 flex items-center border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex items-center space-x-2 w-full"
          >
            <span className="w-5 h-5 rounded-sm flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium">
              {selectedWorkspace?.initial || 'P'}
            </span>
            <span className="text-sm font-medium dark:text-white flex-1">
              {selectedWorkspace?.name || t('workspace.personal')}
            </span>
            {workspaceDropdownOpen ? (
              <ChevronUp size={16} className="text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-500 dark:text-slate-400" />
            )}
          </button>
          
          <AnimatePresence>
            {workspaceDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-2 px-1 mx-2"
              >
                {workspacesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {workspaces.map((workspace) => (
                      <div 
                        key={workspace.id}
                        onClick={() => handleWorkspaceSelect(workspace)}
                        className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                      >
                        <span className="w-10 h-10 rounded-sm flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-lg font-medium mr-3">
                          {workspace.initial}
                        </span>
                        <span className="text-sm text-slate-800 dark:text-white">
                          {workspace.name}
                        </span>
                        {selectedWorkspace?.id === workspace.id && (
                          <Check size={16} className="ml-auto text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                    ))}
                  </>
                )}
                <div 
                  onClick={() => {
                    setWorkspaceDropdownOpen(false);
                    setIsCreateWorkspaceDialogOpen(true);
                  }}
                  className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer mt-1"
                >
                  <span className="w-10 h-10 rounded-sm flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white text-lg font-medium mr-3">
                    <PlusCircle size={18} />
                  </span>
                  <span className="text-sm text-slate-800 dark:text-white">
                    {t('workspace.create')}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <SidebarItem 
            icon={<Home size={18} />} 
            label={t('sidebar.home')}
            active={currentPage === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
            className="mb-4"
          />
          
          {tasksLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {todayTasks.length > 0 && (
                <SidebarSection title="Today">
                  {todayTasks.map((task: WorkspaceTask) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded mb-1 cursor-pointer ${
                        selectedTaskId === task.id 
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' 
                          : 'text-gray-400 dark:text-slate-300'
                      }`}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div className="mr-3">
                        <FileCode size={18} className="text-black dark:text-white" />
                      </div>
                      <span className="flex-1 truncate font-medium">{task.task_id} - {task.task_name}</span>
                    </motion.div>
                  ))}
                </SidebarSection>
              )}
              
              {yesterdayTasks.length > 0 && (
                <SidebarSection title="Yesterday">
                  {yesterdayTasks.map((task: WorkspaceTask) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded mb-1 cursor-pointer ${
                        selectedTaskId === task.id 
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' 
                          : 'text-gray-400 dark:text-slate-300'
                      }`}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div className="mr-3">
                        <FileCode size={18} className="text-black dark:text-white" />
                      </div>
                      <span className="flex-1 truncate font-medium">{task.task_id} - {task.task_name}</span>
                    </motion.div>
                  ))}
                </SidebarSection>
              )}
              
              {olderTasks.length > 0 && (
                <SidebarSection title={t('Previous Days')}>
                  {olderTasks.map((task: WorkspaceTask) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded mb-1 cursor-pointer ${
                        selectedTaskId === task.id 
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' 
                          : 'text-gray-400 dark:text-slate-300'
                      }`}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div className="mr-3">
                        <FileCode size={18} className="text-black dark:text-white" />
                      </div>
                      <span className="flex-1 truncate font-medium">{task.task_id} - {task.task_name}</span>
                    </motion.div>
                  ))}
                </SidebarSection>
              )}
              
              {!tasksLoading && !hasTasks && (
                <div className="px-4 mt-6">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t('sidebar.noMoreConversations')}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <User size={18} />
                </div>
                <span className="text-sm font-medium dark:text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer dark:text-white dark:hover:bg-gray-700">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('auth.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <button 
            onClick={() => onNavigate('settings')}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              currentPage === 'settings' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Settings size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
      
      <CreateWorkspaceDialog 
        isOpen={isCreateWorkspaceDialogOpen}
        onClose={() => setIsCreateWorkspaceDialogOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </>
  );
};

export default AppSidebar;
