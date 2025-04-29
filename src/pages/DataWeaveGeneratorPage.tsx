
import React, { useCallback } from 'react';
import DataWeaveGenerator from '@/components/DataWeaveGenerator';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { toast } from 'sonner';

const DataWeaveGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWorkspaceTasks } = useWorkspaceTasks('default'); // Use default workspace
  
  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSaveTask = useCallback((id: string) => {
    fetchWorkspaceTasks();
    toast.success(`DataWeave task saved with ID: ${id}`);
  }, [fetchWorkspaceTasks]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DataWeaveGenerator 
        selectedWorkspaceId="default"
        onBack={handleBack}
        onSaveTask={handleSaveTask}
      />
    </div>
  );
};

export default DataWeaveGeneratorPage;
