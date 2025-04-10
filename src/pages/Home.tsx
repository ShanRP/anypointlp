
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Workspace App</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Create workspaces, collaborate with your team, and manage your projects.
        </p>
        <div className="flex flex-col gap-4 mt-8">
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
