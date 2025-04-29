
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { WorkspaceOption } from '@/hooks/useWorkspaces';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaces, selectedWorkspace, selectWorkspace, loading, refreshWorkspaces } = useWorkspaces();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleWorkspaceSelect = (workspace: WorkspaceOption) => {
    selectWorkspace(workspace);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user) {
    return null;
  }

  const handleNavigate = (page: string) => {
    console.log(`Navigating to: ${page}`);
    // This function would be implemented to handle navigation
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex h-screen">
        {/* Updated DashboardSidebar props to match the component interface */}
        <DashboardSidebar
          onNavigate={handleNavigate}
          currentPage="dashboard"
          selectedWorkspaceId={selectedWorkspace?.id}
          onWorkspaceChange={handleWorkspaceSelect}
        />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isSidebarOpen ? 'ml-64' : ''} transition-marginLeft duration-300`}>
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
            <Button variant="ghost" onClick={toggleSidebar}>
              {isSidebarOpen ? <ArrowLeft /> : <ArrowRight />}
            </Button>
            <h1 className="text-2xl font-semibold">
              {selectedWorkspace ? selectedWorkspace.name : 'Select a Workspace'}
            </h1>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
            {selectedWorkspace ? (
              <div>
                <p>Welcome to the {selectedWorkspace.name} workspace!</p>
                {/* Add your main content here */}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                {loading ? (
                  <p>Loading workspaces...</p>
                ) : (
                  <>
                    <p className="text-gray-500">No workspace selected.</p>
                    <Button onClick={() => refreshWorkspaces()}>Refresh Workspaces</Button>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
