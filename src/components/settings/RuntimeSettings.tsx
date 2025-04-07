
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export const RuntimeSettings: React.FC = () => {
  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 text-white">
      <h2 className="text-lg font-semibold mb-4">Runtime Setting</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Java Version</div>
          <Select defaultValue="8.0">
            <SelectTrigger className="w-full bg-gray-900 border-gray-800 text-white">
              <SelectValue placeholder="Select Java version" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="8.0">8.0</SelectItem>
              <SelectItem value="11.0">11.0</SelectItem>
              <SelectItem value="17.0">17.0</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-400">Maven Version</div>
          <Select defaultValue="3.8">
            <SelectTrigger className="w-full bg-gray-900 border-gray-800 text-white">
              <SelectValue placeholder="Select Maven version" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="3.6">3.6</SelectItem>
              <SelectItem value="3.8">3.8</SelectItem>
              <SelectItem value="3.9">3.9</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
