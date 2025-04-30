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
  Info,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/providers/LanguageProvider';
import { WorkspaceOption, useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceTasks, type WorkspaceTask } from '@/hooks/useWorkspaceTasks';
import { Button } from '@/components/ui/button';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';
import WorkspaceDetailsDialog from './workspace/WorkspaceDetailsDialog';
import CodingAssistantDialog from './ai/CodingAssistantDialog';
import { useAnimations } from '@/utils/animationUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";

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
  category: string;
  onClick?: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  id,
  title,
  time,
  icon,
  category,
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
        <div className="flex items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mr-2">{time}</p>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
            {category}
          </span>
        </div>
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
  selectedWorkspaceId: string;
  onWorkspaceChange: (workspace: any) => void;
  onRefreshTasks?: () => Promise<void>; // Added this prop
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onNavigate,
  currentPage,
  onTaskSelect,
  selectedWorkspaceId,
  onWorkspaceChange,
  onRefreshTasks
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [isCreateWorkspaceDialogOpen, setIsCreateWorkspaceDialogOpen] = useState(false);
  const [isWorkspaceDetailsOpen, setIsWorkspaceDetailsOpen] = useState(false);
  const [selectedWorkspaceForDetails, setSelectedWorkspaceForDetails] = useState<WorkspaceOption | null>(null);
  const [isCodingAssistantOpen, setIsCodingAssistantOpen] = useState(false);
  const { workspaces, selectedWorkspace, createWorkspace, selectWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();
  const { tasks } = useWorkspaceTasks(selectedWorkspace?.id || '');
  const { fadeIn } = useAnimations();
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleViewAllActivities = () => {
    setIsActivitySheetOpen(true);
    if (onViewAllActivities) {
      onViewAllActivities();
    }
  };

  const handleOpenWorkspaceDetails = (workspace: WorkspaceOption, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkspaceForDetails(workspace);
    setIsWorkspaceDetailsOpen(true);
    setWorkspaceDropdownOpen(false);
  };

  const getTaskIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'raml':
        return <FileCode2 className="h-4 w-4" />;
      case 'integration':
        return <RefreshCcw className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'diagram':
        return <FileQuestion className="h-4 w-4" />;
      case 'munit':
        return <TestTube2 className="h-4 w-4" />;
      case 'sampledata':
        return <Database className="h-4 w-4" />;
      case 'dataweave':
      default:
        return <FileCode2 className="h-4 w-4" />;
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-sm"
                onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {workspaceDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-6 right-6 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="py-2 max-h-64 overflow-y-auto">
                  {workspaces.map(workspace => (
                    <div
                      key={workspace.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        selectedWorkspace?.id === workspace.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-medium"
                        onClick={() => {
                          selectWorkspace(workspace);
                          if (onWorkspaceChange) onWorkspaceChange(workspace);
                          setWorkspaceDropdownOpen(false);
                        }}
                      >
                        {workspace.initial}
                      </div>
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => {
                          selectWorkspace(workspace);
                          if (onWorkspaceChange) onWorkspaceChange(workspace);
                          setWorkspaceDropdownOpen(false);
                        }}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {workspace.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => handleOpenWorkspaceDetails(workspace, e)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      {selectedWorkspace?.id === workspace.id && (
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      )}
                    </div>
                  ))}
                </div>

                <div 
                  className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setWorkspaceDropdownOpen(false);
                    setIsCreateWorkspaceDialogOpen(true);
                  }}
                >
                  <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <PlusCircle size={16} />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Create Workspace
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex-1 overflow-auto px-3 py-6 scrollbar-thin">
            <nav className="space-y-1 px-3">
              <NavItem 
                icon={<Home className="h-4 w-4" />} 
                label={t('sidebar.home')}
                active={currentPage === 'dashboard'}
                onClick={() => onNavigate('dashboard')}
              />
              
              <NavItem 
                icon={<FileCode2 className="h-4 w-4" />} 
                label="DataWeave Generator"
                active={currentPage === 'dataweave'}
                onClick={() => onNavigate('dataweave')}
              />
              
              <NavItem 
                icon={<FileCode2 className="h-4 w-4" />} 
                label="Integration Generator"
                active={currentPage === 'integration'}
                onClick={() => onNavigate('integration')}
              />
              
              <NavItem 
                icon={<FileCode2 className="h-4 w-4" />} 
                label="RAML Generator"
                active={currentPage === 'raml'}
                onClick={() => onNavigate('raml')}
              />
              
              <NavItem 
                icon={<TestTube2 className="h-4 w-4" />} 
                label="MUnit Test Generator"
                active={currentPage === 'munit'}
                onClick={() => onNavigate('munit')}
              />
              
              <NavItem 
                icon={<Database className="h-4 w-4" />} 
                label="Sample Data Generator"
                active={currentPage === 'sampleData'}
                onClick={() => onNavigate('sampleData')}
              />
              
              <NavItem 
                icon={<FileText className="h-4 w-4" />} 
                label="Document Generator"
                active={currentPage === 'document'}
                onClick={() => onNavigate('document')}
              />
              
              <NavItem 
                icon={<FileQuestion className="h-4 w-4" />} 
                label="Diagram Generator"
                active={currentPage === 'diagram'}
                onClick={() => onNavigate('diagram')}
              />
              
              <NavItem 
                icon={<Share2 className="h-4 w-4" />} 
                label="Exchange Marketplace"
                active={currentPage === 'exchange'}
                onClick={() => onNavigate('exchange')}
                // badge={2}
              />
              
              <NavItem 
                icon={<Users className="h-4 w-4" />} 
                label="Community Board"
                active={currentPage === 'jobBoard'}
                onClick={() => onNavigate('jobBoard')}
              />
              
              {/* <NavItem 
                icon={<MessageSquare className="h-4 w-4" />} 
                label="Coding Assistant"
                active={currentPage === 'chat'}
                onClick={() => {
                  setIsCodingAssistantOpen(true);
                  onNavigate('chat');
                }}
              /> */}
            </nav>

            <div className="mt-6 px-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent Activity
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <ActivityItem
                      key={task.id}
                      id={task.task_id}
                      title={task.title}
                      time={task.time}
                      category={task.category}
                      icon={getTaskIcon(task.category)}
                      onClick={() => onTaskSelect && onTaskSelect(task.id)}
                    />
                  ))
                ) : (
                  <div className="text-center p-3 text-gray-500 dark:text-gray-400 text-sm">
                    No recent activities
                  </div>
                )}
              </div>

              <Button 
                variant="ghost" 
                className="w-full mt-2 text-xs text-gray-500 dark:text-gray-400 justify-start"
                onClick={handleViewAllActivities}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-2" />
                View all activities
              </Button>
            </div>
          </div>

          <div className="p-4 mt-auto">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => onNavigate('settings')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        isOpen={isCreateWorkspaceDialogOpen}
        onClose={() => setIsCreateWorkspaceDialogOpen(false)}
        onCreateWorkspace={(name) => {
          createWorkspace(name);
          toast.success(`${name} workspace has been created successfully.`);
        }}
      />
      
      <WorkspaceDetailsDialog
        isOpen={isWorkspaceDetailsOpen}
        onClose={() => setIsWorkspaceDetailsOpen(false)}
        workspace={selectedWorkspaceForDetails}
        onDelete={deleteWorkspace}
        onUpdate={updateWorkspace}
      />
      
      <CodingAssistantDialog 
        isOpen={isCodingAssistantOpen} 
        onOpenChange={setIsCodingAssistantOpen} 
      />

      <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">All Activities</SheetTitle>
            </div>
          </SheetHeader>
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            {allTasks.length > 0 ? (
              <AnimatePresence>
                <div className="space-y-4">
                  {allTasks.map((task, index) => {
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

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => {
                          onTaskSelect && onTaskSelect(task.id);
                          setIsActivitySheetOpen(false);
                        }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          {getTaskIcon(task.category || 'dataweave')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                            #{task.task_id || task.id.slice(0, 4)} - {task.task_name || 'Task'}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                              {timeDisplay}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                              {task.category || 'dataweave'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Clock className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No activities yet</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  When you complete tasks, they will appear here.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardSidebar;
