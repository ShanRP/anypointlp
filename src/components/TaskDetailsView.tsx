import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonacoEditor } from './MonacoEditor';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TaskDetailsViewProps {
  taskId: string;
  workspaceId: string;
  onBack?: () => void;
}

const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({ taskId, workspaceId, onBack }) => {
  const { fetchTaskDetails, selectedTask, loading } = useWorkspaceTasks(workspaceId);
  const [activeTab, setActiveTab] = useState('input');
  const [copySuccess, setCopySuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails(taskId);
    }
  }, [taskId, fetchTaskDetails]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading task details...</div>;
  }

  if (!selectedTask) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Task not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The task you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Determine task category and render appropriate view
  const taskCategory = selectedTask.category || 'dataweave';

  if (taskCategory === 'raml') {
    // Handle RAML task details
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{selectedTask.task_name}</h2>
              <Badge variant="outline">{taskCategory.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Task ID: {selectedTask.task_id}</span>
              <span>•</span>
              <span>Created: {new Date(selectedTask.created_at).toLocaleString()}</span>
            </div>
            {selectedTask.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-300">{selectedTask.description}</p>
            )}
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-4 border dark:border-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">API Specification Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">API Name</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedTask.api_name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">API Version</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedTask.api_version || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Base URI</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedTask.base_uri || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="raml" className="w-full">
            <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="raml">RAML Specification</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            </TabsList>
            <TabsContent value="raml" className="mt-4">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(selectedTask.generated_scripts?.[0]?.code || '')}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="h-[500px] border dark:border-gray-700 rounded-lg overflow-hidden">
                  <MonacoEditor
                    language="yaml"
                    value={selectedTask.generated_scripts?.[0]?.code || '# No RAML content available'}
                    onChange={() => {}}
                    readOnly={true}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="endpoints" className="mt-4">
              <div className="border dark:border-gray-700 rounded-lg p-4 space-y-4">
                {Array.isArray(selectedTask.endpoints) && selectedTask.endpoints.length > 0 ? (
                  selectedTask.endpoints.map((endpoint: any, index: number) => (
                    <div key={index} className="p-4 border dark:border-gray-700 rounded-md">
                      <div className="flex gap-2 items-center mb-2">
                        <Badge variant="outline" className="uppercase">{endpoint.method}</Badge>
                        <h4 className="font-medium">{endpoint.path}</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{endpoint.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No endpoints defined</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } else if (taskCategory === 'integration') {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{selectedTask.task_name}</h2>
              <Badge variant="outline">{taskCategory.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Task ID: {selectedTask.task_id}</span>
              <span>•</span>
              <span>Created: {new Date(selectedTask.created_at).toLocaleString()}</span>
            </div>
            {selectedTask.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-300">{selectedTask.description}</p>
            )}
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList>
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="script">Generated Script</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="mt-4">
            <div className="space-y-4">
              {selectedTask.input_samples &&
                (Array.isArray(selectedTask.input_samples) ? selectedTask.input_samples : [selectedTask.input_samples]).map((sample, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Input Sample {index + 1}</h4>
                    <MonacoEditor
                      language="json"
                      value={JSON.stringify(sample, null, 2) || ''}
                      onChange={() => {}}
                      readOnly={true}
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="output" className="mt-4">
            <div className="space-y-4">
              {selectedTask.output_samples &&
                (Array.isArray(selectedTask.output_samples) ? selectedTask.output_samples : [selectedTask.output_samples]).map((sample, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Output Sample {index + 1}</h4>
                    <MonacoEditor
                      language="json"
                      value={JSON.stringify(sample, null, 2) || ''}
                      onChange={() => {}}
                      readOnly={true}
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="script" className="mt-4">
            {selectedTask.generated_scripts && selectedTask.generated_scripts.length > 0 ? (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(selectedTask.generated_scripts[0].code || '')}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="h-[500px] border dark:border-gray-700 rounded-lg overflow-hidden">
                  <MonacoEditor
                    language="xml"
                    value={selectedTask.generated_scripts[0].code || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center p-4">No generated script available.</div>
            )}
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <div className="border dark:border-gray-700 rounded-lg p-4">
              {selectedTask.notes ? (
                <p className="text-gray-600 dark:text-gray-300">{selectedTask.notes}</p>
              ) : (
                <div className="text-center p-4">No notes available.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  } else {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{selectedTask.task_name}</h2>
              <Badge variant="outline">{taskCategory.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Task ID: {selectedTask.task_id}</span>
              <span>•</span>
              <span>Created: {new Date(selectedTask.created_at).toLocaleString()}</span>
            </div>
            {selectedTask.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-300">{selectedTask.description}</p>
            )}
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList>
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="script">Generated Script</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="mt-4">
            <div className="space-y-4">
              {selectedTask.input_samples &&
                (Array.isArray(selectedTask.input_samples) ? selectedTask.input_samples : [selectedTask.input_samples]).map((sample, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Input Sample {index + 1}</h4>
                    <MonacoEditor
                      language="json"
                      value={JSON.stringify(sample, null, 2) || ''}
                      onChange={() => {}}
                      readOnly={true}
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="output" className="mt-4">
            <div className="space-y-4">
              {selectedTask.output_samples &&
                (Array.isArray(selectedTask.output_samples) ? selectedTask.output_samples : [selectedTask.output_samples]).map((sample, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Output Sample {index + 1}</h4>
                    <MonacoEditor
                      language="json"
                      value={JSON.stringify(sample, null, 2) || ''}
                      onChange={() => {}}
                      readOnly={true}
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="script" className="mt-4">
            {selectedTask.generated_scripts && selectedTask.generated_scripts.length > 0 ? (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(selectedTask.generated_scripts[0].code || '')}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="h-[500px] border dark:border-gray-700 rounded-lg overflow-hidden">
                  <MonacoEditor
                    language="json"
                    value={selectedTask.generated_scripts[0].code || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center p-4">No generated script available.</div>
            )}
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <div className="border dark:border-gray-700 rounded-lg p-4">
              {selectedTask.notes ? (
                <p className="text-gray-600 dark:text-gray-300">{selectedTask.notes}</p>
              ) : (
                <div className="text-center p-4">No notes available.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
};

export default TaskDetailsView;
