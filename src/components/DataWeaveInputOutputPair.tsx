
import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataWeaveInputSample from './DataWeaveInputSample';
import DataWeaveOutputSample from './DataWeaveOutputSample';

interface InputSample {
  id: string;
  value: string;
  isValid: boolean;
}

interface OutputSample {
  id: string;
  value: string;
  isValid: boolean;
}

interface DataWeaveInputOutputPairProps {
  id: string;
  inputFormat: string;
  inputSample: InputSample;
  outputSample: OutputSample;
  onInputChange: (id: string, value: string) => void;
  onOutputChange: (id: string, value: string) => void;
  onDelete: () => void;
}

const DataWeaveInputOutputPair: React.FC<DataWeaveInputOutputPairProps> = ({
  id,
  inputFormat,
  inputSample,
  outputSample,
  onInputChange,
  onOutputChange,
  onDelete
}) => {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DataWeaveInputSample
        id={inputSample.id}
        format={inputFormat}
        value={inputSample.value}
        onChange={(value) => onInputChange(inputSample.id, value)}
        onDelete={onDelete}
        isValid={inputSample.isValid}
      />

      <DataWeaveOutputSample
        id={outputSample.id}
        value={outputSample.value}
        onChange={(value) => onOutputChange(outputSample.id, value)}
        onDelete={onDelete}
        isValid={outputSample.isValid}
      />

      <div className="md:col-span-2 flex justify-end mt-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-gray-500 hover:text-red-500 transition-colors text-xs"
        >
          <Trash2 size={14} className="mr-1" /> Remove Pair
        </Button>
      </div>
    </motion.div>
  );
};

export default DataWeaveInputOutputPair;
