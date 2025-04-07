
import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const SsoConfigurations: React.FC = () => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold">SSO Configurations</h2>
      </div>
      <ChevronLeft className="h-5 w-5 text-gray-500 transform rotate-180" />
    </div>
  );
};

export default SsoConfigurations;
