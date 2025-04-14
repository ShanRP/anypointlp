
/* 
  This is the dashboard sidebar component that includes:
  - User avatar and menu
  - Workspace selector
  - Navigation menu
*/

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Settings, 
  LogOut, 
  Plus,
  Code,
  FileJson,
  PanelLeft,
  ChevronDown,
  User,
  Database,
  FileText,
  FileCode,
  MoreHorizontal
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces, WorkspaceOption } from '@/hooks/useWorkspaces';
import { useWorkspaceTasks, WorkspaceTask } from '@/hooks/useWorkspaceTasks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';
import WorkspaceDetailsDialog from './workspace/WorkspaceDetailsDialog';

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    workspaces, 
    selectedWorkspace, 
    createWorkspace, 
    selectWorkspace, 
    deleteWorkspace,
    updateWorkspace,
    generateInviteLink
  } = useWorkspaces();
  
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isWorkspaceDetailsOpen, setIsWorkspaceDetailsOpen] = useState(false);
  const [selectedWorkspaceForDetails, setSelectedWorkspaceForDetails] = useState<WorkspaceOption | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileWidth, setMobileWidth] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState<WorkspaceTask[]>([]);
  
  const { tasks, loading, error } = useWorkspaceTasks(selectedWorkspace?.id || '');

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setMobileWidth(window.innerWidth < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Filter tasks for the current workspace
  useEffect(() => {
    if (tasks && selectedWorkspace) {
      // Filter tasks to only include those for the selected workspace
      const filtered = tasks.filter(task => task.workspace_id === selectedWorkspace.id);
      setVisibleTasks(filtered);
    } else {
      setVisibleTasks([]);
    }
  }, [tasks, selectedWorkspace]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateWorkspace = async (name: string) => {
    await createWorkspace(name);
    setIsCreateWorkspaceOpen(false);
  };

  const handleWorkspaceClick = (workspace: WorkspaceOption) => {
    selectWorkspace(workspace);
    setIsMobileMenuOpen(false);
  };

  const handleWorkspaceDetailsClick = (e: React.MouseEvent, workspace: WorkspaceOption) => {
    e.stopPropagation();
    setSelectedWorkspaceForDetails(workspace);
    setIsWorkspaceDetailsOpen(true);
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'US';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dataweave':
        return <Code className="h-4 w-4" />;
      case 'integration':
        return <Code className="h-4 w-4" />;
      case 'raml':
        return <Code className="h-4 w-4" />;
      case 'munit':
        return <Code className="h-4 w-4" />;
      case 'sampledata':
        return <Database className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'diagram':
        return <FileCode className="h-4 w-4" />;
      default:
        return <FileJson className="h-4 w-4" />;
    }
  };

  const getTaskCategoryName = (category: string) => {
    switch (category) {
      case 'dataweave':
        return 'DataWeave';
      case 'integration':
        return 'Integration';
      case 'raml':
        return 'RAML';
      case 'munit':
        return 'MUnit';
      case 'sampledata':
        return 'Sample Data';
      case 'document':
        return 'Document';
      case 'diagram':
        return 'Diagram';
      default:
        return category;
    }
  };

  // Sidebar content (used both in desktop and mobile views)
  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* User menu */}
      <div className="p-4 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-white">{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer flex items-center">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Link 
          to="/dashboard" 
          className="font-semibold text-primary hidden md:block"
        >
          Anypoint LP
        </Link>
        
        {mobileWidth && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Workspace selector */}
      <div className="px-4 mb-4">
        <div className="text-xs font-medium uppercase text-muted-foreground mb-2 ml-1">
          Workspaces
        </div>
        <div className="space-y-1">
          {workspaces.map(workspace => (
            <Button
              key={workspace.id}
              variant={selectedWorkspace?.id === workspace.id ? "secondary" : "ghost"}
              className="w-full justify-between"
              onClick={() => handleWorkspaceClick(workspace)}
            >
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 text-xs font-semibold">
                  {workspace.initial}
                </div>
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {workspace.name}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => handleWorkspaceDetailsClick(e, workspace)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </Button>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 text-xs"
            onClick={() => setIsCreateWorkspaceOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Workspace
          </Button>
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-2">
          <div className="text-xs font-medium uppercase text-muted-foreground mb-2 ml-1">
            Dashboard
          </div>
          <div className="space-y-1">
            <Button 
              variant={location.pathname === '/dashboard' ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              asChild
            >
              <Link to="/dashboard">
                <FileJson className="mr-2 h-4 w-4" />
                Data Transformations
              </Link>
            </Button>
            
            <Button 
              variant={location.pathname.includes('/dashboard/exchange') ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              asChild
            >
              <Link to="/dashboard/exchange">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M3.75 4.5H20.25C20.6642 4.5 21 4.83579 21 5.25V18.75C21 19.1642 20.6642 19.5 20.25 19.5H3.75C3.33579 19.5 3 19.1642 3 18.75V5.25C3 4.83579 3.33579 4.5 3.75 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9.75C9 10.5784 8.32843 11.25 7.5 11.25C6.67157 11.25 6 10.5784 6 9.75C6 8.92157 6.67157 8.25 7.5 8.25C8.32843 8.25 9 8.92157 9 9.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 15.75L11.25 12L8.25 15L6 12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.5 12.75H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Exchange
              </Link>
            </Button>
            
            <Button 
              variant={location.pathname.includes('/dashboard/munit') ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              asChild
            >
              <Link to="/dashboard/munit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M21 7.5V6.75C21 5.50736 19.9926 4.5 18.75 4.5H5.25C4.00736 4.5 3 5.50736 3 6.75V17.25C3 18.4926 4.00736 19.5 5.25 19.5H18.75C19.9926 19.5 21 18.4926 21 17.25V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 12L21 9M21 9L18 6M21 9H8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                MUnit Tests
              </Link>
            </Button>
            
            <Button 
              variant={location.pathname.includes('/dashboard/sample-data') ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              asChild
            >
              <Link to="/dashboard/sample-data">
                <Database className="mr-2 h-4 w-4" />
                Sample Data
              </Link>
            </Button>
            
            <Button 
              variant={location.pathname.includes('/dashboard/document') ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              asChild
            >
              <Link to="/dashboard/document">
                <FileText className="mr-2 h-4 w-4" />
                Documentation
              </Link>
            </Button>
            
            <Button 
              variant={location.pathname.includes('/dashboard/diagram') ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              asChild
            >
              <Link to="/dashboard/diagram">
                <FileCode className="mr-2 h-4 w-4" />
                Flow Diagrams
              </Link>
            </Button>
          </div>
        </div>
        
        {selectedWorkspace && visibleTasks.length > 0 && (
          <div className="mt-4 px-4 py-2">
            <div className="text-xs font-medium uppercase text-muted-foreground mb-2 ml-1 flex items-center justify-between">
              <span>Recent Tasks</span>
              <Badge variant="outline" className="text-xs font-normal">{visibleTasks.length}</Badge>
            </div>
            
            <div className="space-y-1.5">
              {visibleTasks.slice(0, 10).map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    to={`/dashboard/task/${task.task_id}`}
                    className={cn(
                      "group flex items-center justify-between w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent/50",
                      location.pathname === `/dashboard/task/${task.task_id}` ? "bg-accent" : "transparent"
                    )}
                  >
                    <div className="flex items-center max-w-[85%]">
                      <div className="flex-shrink-0 mr-2 text-muted-foreground">
                        {getCategoryIcon(task.category)}
                      </div>
                      <div className="truncate">
                        <div className="font-medium truncate">{task.task_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getTaskCategoryName(task.category)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              
              {visibleTasks.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  asChild
                >
                  <Link to="/dashboard">
                    View all tasks
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          asChild
        >
          <Link to="/settings" className="flex items-center justify-center">
            <Settings className="mr-2 h-3.5 w-3.5" />
            <span className="text-xs">Settings</span>
          </Link>
        </Button>
      </div>
    </div>
  );

  // Desktop sidebar
  if (!mobileWidth) {
    return (
      <>
        <aside className="w-64 h-screen border-r bg-background flex flex-col">
          {sidebarContent}
        </aside>
        <CreateWorkspaceDialog 
          isOpen={isCreateWorkspaceOpen}
          onClose={() => setIsCreateWorkspaceOpen(false)}
          onCreateWorkspace={handleCreateWorkspace}
        />
        <WorkspaceDetailsDialog
          isOpen={isWorkspaceDetailsOpen}
          onClose={() => setIsWorkspaceDetailsOpen(false)}
          workspace={selectedWorkspaceForDetails}
          onDelete={deleteWorkspace}
          onUpdate={updateWorkspace}
          onGenerateInviteLink={generateInviteLink}
        />
      </>
    );
  }

  // Mobile sidebar
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 h-14 border-b bg-background px-4 flex items-center">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        
        <Link 
          to="/dashboard" 
          className="ml-3 font-semibold text-primary"
        >
          Anypoint LP
        </Link>
        
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-white text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {selectedWorkspace?.name || 'No workspace selected'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <CreateWorkspaceDialog 
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />
      
      <WorkspaceDetailsDialog
        isOpen={isWorkspaceDetailsOpen}
        onClose={() => setIsWorkspaceDetailsOpen(false)}
        workspace={selectedWorkspaceForDetails}
        onDelete={deleteWorkspace}
        onUpdate={updateWorkspace}
        onGenerateInviteLink={generateInviteLink}
      />
    </>
  );
};

export default AppSidebar;
