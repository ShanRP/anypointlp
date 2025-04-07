
import React from 'react';
import DataWeaveGenerator from '@/components/DataWeaveGenerator';
import { useNavigate } from 'react-router-dom';

const DataWeaveGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DataWeaveGenerator 
        selectedWorkspaceId="default"
        onBack={handleBack}
      />
    </div>
  );
};

export default DataWeaveGeneratorPage;
