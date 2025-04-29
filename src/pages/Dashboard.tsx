import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 as Loader2Icon } from "lucide-react";
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageContent from '@/components/PageContent';

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { workspaces, selectedWorkspaceId, selectWorkspace } = useWorkspaces();
  const { tasks, loading, fetchWorkspaceTasks } = useTasks();

  useEffect(() => {
    // If there are workspaces, select the first one by default
    if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      selectWorkspace(workspaces[0].id);
    }
  }, [workspaces, selectWorkspace, selectedWorkspaceId]);

  useEffect(() => {
    // Fetch tasks for the selected workspace
    if (selectedWorkspaceId) {
      fetchWorkspaceTasks(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, fetchWorkspaceTasks]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    // Additional logic based on the page, e.g., navigate
    if (page === 'settings') {
      navigate('/settings');
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleWorkspaceChange = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    if (workspaceId) {
      fetchWorkspaceTasks(workspaceId);
    } else {
      toast({
        title: "Workspace Not Found",
        description: "Please select a valid workspace.",
        variant: "destructive",
      });
    }
  };
  
  const handleRefreshTasks = useCallback(() => {
    if (selectedWorkspaceId) {
      fetchWorkspaceTasks(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, fetchWorkspaceTasks]);
  
  const PageContentComponent = () => (
    <PageContent
      currentPage={currentPage}
      selectedTask={selectedTask}
      tasks={tasks}
      onTaskSelect={handleTaskSelect}
      onRefreshTasks={handleRefreshTasks}
    />
  );

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2Icon className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        onNavigate={handlePageChange}
        currentPage={currentPage}
        onTaskSelect={handleTaskSelect}
        selectedWorkspaceId={selectedWorkspaceId}
        onWorkspaceChange={handleWorkspaceChange}
        onRefreshTasks={handleRefreshTasks}
      />
      
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <PageContentComponent />
      </div>
    </div>
  );
};

export default Dashboard;
