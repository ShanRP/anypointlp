
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">Page Not Found</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
        <Button 
          onClick={() => navigate('/')}
          className="mt-6"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
