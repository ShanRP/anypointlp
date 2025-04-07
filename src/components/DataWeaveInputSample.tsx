
import React from 'react';
import { Trash2, Check, AlertCircle, Info } from 'lucide-react';
import { useFadeIn } from '@/utils/animationHooks';
import { motion } from "framer-motion";
import MonacoEditor from './MonacoEditor';

interface DataWeaveInputSampleProps {
  id: string;
  format: string;
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  isValid: boolean;
}

const DataWeaveInputSample: React.FC<DataWeaveInputSampleProps> = ({
  id,
  format,
  value,
  onChange,
  onDelete,
  isValid
}) => {
  const fadeIn = useFadeIn();

  return (
    <motion.div 
      className="rounded-lg p-6 mb-4 relative bg-white shadow-lg border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...fadeIn}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium flex items-center text-gray-800">
          Input Sample ({format})
          {isValid ? 
            <Check size={16} className="ml-2 text-green-600" /> : 
            value.trim() !== '' ? 
              <AlertCircle size={16} className="ml-2 text-amber-500" /> :
              <Info size={16} className="ml-2 text-blue-500" />
          }
        </div>
        <button 
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Delete input sample"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="h-[200px] w-full border rounded-md overflow-hidden">
        <MonacoEditor
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          language={format.toLowerCase()}
        />
      </div>

      {!isValid && value.trim() !== '' && (
        <p className="text-amber-500 text-xs mt-2">
          This doesn't appear to be valid {format} format.
        </p>
      )}

      <div className="text-xs text-gray-500 mt-2">
        This will be deserialized into DataWeave objects automatically.
      </div>
    </motion.div>
  );
};

export default DataWeaveInputSample;
