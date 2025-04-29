
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { toast } from 'sonner';

// Define our page types
type PageType = 'workspace' | 'tasks' | 'settings';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { workspaces, selectedWorkspace, loading: loadingWorkspaces } = useWorkspaces();
  const { tasks, loading, fetchWorkspaceTasks } = useWorkspaceTasks();
  const [currentPage, setCurrentPage] = useState<PageType>('workspace');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchWorkspaceTasks();
    }
  }, [selectedWorkspace, fetchWorkspaceTasks]);

  // Handle navigation between sections
  const handleNavigation = (page: string) => {
    if (page === 'workspace' || page === 'tasks' || page === 'settings') {
      setCurrentPage(page);
    } else {
      navigate(`/${page}`);
    }
  };

  // Select a workspace
  const handleWorkspaceChange = (workspace: any) => {
    if (workspace && workspaces.find(w => w.id === workspace.id)) {
      // Update the URL with the selected workspace ID
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('workspace', workspace.id);
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  // Handle task selection
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentPage('tasks');
  };

  // Handle refresh tasks
  const handleRefreshTasks = () => {
    if (selectedWorkspace) {
      fetchWorkspaceTasks();
      toast.success('Tasks refreshed');
    }
  };

  // If still loading workspaces, show a loading state
  if (loadingWorkspaces) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no workspaces, prompt to create one
  if (workspaces.length === 0 && !loadingWorkspaces) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to APL!</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            To get started, please create your first workspace.
          </p>
          <Button onClick={() => navigate('/workspaces/new')}>
            Create Workspace
          </Button>
        </div>
      </div>
    );
  }

  // If no selected workspace but workspaces exist, use the first one
  useEffect(() => {
    if (!selectedWorkspace && workspaces.length > 0) {
      handleWorkspaceChange(workspaces[0]);
    }
  }, [selectedWorkspace, workspaces]);

  return (
    <div className="flex h-screen dark:bg-gray-950">
      {/* Sidebar */}
      <DashboardSidebar
        onNavigate={handleNavigation}
        currentPage={currentPage}
        onTaskSelect={handleTaskSelect}
        selectedWorkspaceId={selectedWorkspace?.id || ''}
        onWorkspaceChange={handleWorkspaceChange}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="p-6">
            {/* Content based on current page */}
            {currentPage === 'workspace' && (
              <div>
                <h1 className="text-3xl font-bold mb-6">
                  {selectedWorkspace?.name || 'Workspace'}
                </h1>
                {/* Workspace content here */}
              </div>
            )}

            {currentPage === 'tasks' && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Tasks</h1>
                {/* Task content here */}
              </div>
            )}

            {currentPage === 'settings' && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Settings</h1>
                {/* Settings content here */}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
