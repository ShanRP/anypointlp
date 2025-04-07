
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import DataWeaveResult from './DataWeaveResult';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface Script {
  id: string;
  code: string;
  pairId: string;
}

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

interface Pair {
  id: string;
  inputSample: InputSample;
  outputSample: OutputSample;
}

interface DataWeaveScriptsProps {
  scripts: Script[];
  onNewTask?: () => void;
  pairs: Pair[];
  notes: string;
}

const DataWeaveScripts: React.FC<DataWeaveScriptsProps> = ({ 
  scripts, 
  onNewTask,
  pairs,
  notes
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(scripts.length > 0 ? scripts[0].id : '');
  const [updatedScripts, setUpdatedScripts] = useState<Script[]>(scripts);
  
  const getPairForScript = (script: Script) => {
    return pairs.find(pair => pair.id === script.pairId);
  };
  
  const handleScriptUpdate = (scriptId: string, newCode: string) => {
    setUpdatedScripts(prev => 
      prev.map(script => 
        script.id === scriptId ? {...script, code: newCode} : script
      )
    );
  };

  if (updatedScripts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No scripts have been generated yet.</p>
        {onNewTask && (
          <Button onClick={onNewTask} className="mt-4">
            Create New Task
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {updatedScripts.length > 1 ? (
        <Tabs value={activeTabId} onValueChange={setActiveTabId}>
          <TabsList className="mb-4">
            {updatedScripts.map((script, index) => (
              <TabsTrigger key={script.id} value={script.id}>
                Script {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {updatedScripts.map((script) => {
            const pair = getPairForScript(script);
            return (
              <TabsContent key={script.id} value={script.id}>
                <DataWeaveResult 
                  script={script.code} 
                  onSave={(newCode) => handleScriptUpdate(script.id, newCode)} 
                  onNewTask={onNewTask}
                  pairId={script.pairId}
                  inputSample={pair?.inputSample}
                  outputSample={pair?.outputSample}
                  originalNotes={notes}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        // Single script case
        <>
          {updatedScripts.map((script) => {
            const pair = getPairForScript(script);
            return (
              <DataWeaveResult 
                key={script.id} 
                script={script.code} 
                onSave={(newCode) => handleScriptUpdate(script.id, newCode)} 
                onNewTask={onNewTask}
                pairId={script.pairId}
                inputSample={pair?.inputSample}
                outputSample={pair?.outputSample}
                originalNotes={notes}
              />
            );
          })}
        </>
      )}
    </div>
  );
};

export default DataWeaveScripts;
