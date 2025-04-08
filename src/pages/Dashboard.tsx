import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import DataWeaveGenerator from '@/components/DataWeaveGenerator';
import JsonToSchemaGenerator from '@/components/JsonToSchemaGenerator';
import Settings from '@/components/SettingsPage';
import IntegrationGenerator from '@/components/IntegrationGenerator';
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"

interface SidebarTask {
  id: string;
  label: string;
  category: string;
  icon?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { workspaces, selectedWorkspace, selectWorkspace, createWorkspace, loading: isLoadingWorkspaces } = useWorkspaces();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleTaskCreated = (task: any) => {
    const sidebarTask: SidebarTask = {
      id: task.id,
      label: task.label,
      category: task.category,
      icon: task.icon
    };

    // Update tasks in selected workspace if tasks property exists
    if (selectedWorkspace) {
      const updatedTasks = [...(selectedWorkspace.tasks || []), sidebarTask];
      const updatedWorkspace = { ...selectedWorkspace, tasks: updatedTasks };
      selectWorkspace(updatedWorkspace);
    }

    toast({
      title: "Task created.",
      description: "Your task has been successfully created.",
    })
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    const workspace = workspaces?.find(w => w.id === workspaceId);
    if (workspace) {
      selectWorkspace(workspace);
    }
  };

  const handleCreateWorkspace = async () => {
    if (newWorkspaceName.trim() !== '') {
      await createWorkspace(newWorkspaceName);
      setShowCreateWorkspaceModal(false);
      setNewWorkspaceName('');
    }
  };

  const renderDataweaveGenerator = () => {
    return (
      <DataWeaveGenerator
        selectedWorkspaceId={selectedWorkspace?.id || ''}
        onTaskCreated={handleTaskCreated}
        onBack={() => setSelectedTool(null)}
        onSaveTask={() => {}}
      />
    );
  };

  const renderJsonToSchemaGenerator = () => {
    return (
      <JsonToSchemaGenerator
        selectedWorkspaceId={selectedWorkspace?.id || ''}
        onTaskCreated={handleTaskCreated}
        onBack={() => setSelectedTool(null)}
        onSaveTask={() => {}}
      />
    );
  };

  const renderIntegrationGenerator = () => {
    return (
      <IntegrationGenerator
        selectedWorkspaceId={selectedWorkspace?.id || ''}
        onBack={() => setSelectedTool(null)}
        onSaveTask={() => {}}
      />
    );
  };

  const renderSettings = () => {
    return (
      <div>
        <Button variant="ghost" onClick={() => setSelectedTool(null)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tools
        </Button>
        <Settings />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Main Content Area */}
      <div className="flex flex-col flex-grow overflow-x-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-grow p-6 overflow-y-auto">
          {selectedTool ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedTool(null)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tools
              </Button>
              {selectedTool === 'dataweave' && renderDataweaveGenerator()}
              {selectedTool === 'json-to-schema' && renderJsonToSchemaGenerator()}
              {selectedTool === 'integration-generator' && renderIntegrationGenerator()}
              {selectedTool === 'settings' && renderSettings()}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* DataWeave Generator */}
              <div
                className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTool('dataweave')}
              >
                <h2 className="text-xl font-semibold mb-2">DataWeave Generator</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Generate DataWeave transformations from sample data.
                </p>
              </div>

              {/* JSON to Schema Generator */}
              <div
                className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTool('json-to-schema')}
              >
                <h2 className="text-xl font-semibold mb-2">JSON to Schema Generator</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Create JSON schemas from JSON data.
                </p>
              </div>

              {/* Integration Generator */}
              <div
                className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTool('integration-generator')}
              >
                <h2 className="text-xl font-semibold mb-2">Integration Generator</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Generate integration flows from specifications and diagrams.
                </p>
              </div>

              {/* Settings */}
              <div
                className="bg-white dark:bg-gray-700 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTool('settings')}
              >
                <h2 className="text-xl font-semibold mb-2">Settings</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your account and preferences.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
