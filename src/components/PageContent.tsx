
import React from 'react';
import { Task } from '@/types';
import { Loader2 as Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import JobBoard from './JobBoard/JobBoard';

interface PageContentProps {
  currentPage: string;
  selectedTask: Task | null;
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onRefreshTasks: () => void;
}

const PageContent: React.FC<PageContentProps> = ({
  currentPage,
  selectedTask,
  tasks,
  onTaskSelect,
  onRefreshTasks
}) => {
  // This is a placeholder component that will render different content based on the currentPage
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <p className="text-gray-600 mb-4">
              Welcome to your workspace. Select a feature from the sidebar to get started.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dashboard cards would go here */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-medium mb-2">Recent Tasks</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You have {tasks.length} tasks in your workspace.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRefreshTasks}
                >
                  Refresh Tasks
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'jobBoard':
        return <JobBoard />;
        
      default:
        return (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">
              {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Generator
            </h1>
            <p className="text-gray-600 mb-6">
              This feature is coming soon. Stay tuned!
            </p>
            <Button onClick={onRefreshTasks}>Refresh</Button>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full overflow-auto">
      {renderContent()}
    </div>
  );
};

export default PageContent;
