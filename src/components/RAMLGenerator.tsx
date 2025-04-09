import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import MonacoEditor from './MonacoEditor';
import LoadingSpinner from './ui/LoadingSpinner';

interface RAMLGeneratorProps {
  onTaskCreated?: (taskId: string) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({
  onTaskCreated,
  selectedWorkspaceId,
  onBack
}) => {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspaces();
  const { saveRamlTask } = useWorkspaceTasks(selectedWorkspace?.id || '');
  
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('');
  const [baseUri, setBaseUri] = useState('');
  const [ramlContent, setRamlContent] = useState('');
  const [taskName, setTaskName] = useState('New RAML Specification');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const workspaceId = selectedWorkspaceId || selectedWorkspace?.id || '';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        setRamlContent(event.target?.result as string);
      };

      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {
    'text/yaml': ['.yaml', '.yml'],
    'text/raml': ['.raml'],
  } });

  const handleSave = async () => {
    if (!ramlContent) {
      toast.error('Please provide RAML content to save');
      return;
    }
    
    if (!taskName) {
      toast.error('Please provide a name for the RAML task');
      return;
    }
    
    if (!workspaceId) {
      toast.error('No workspace selected');
      return;
    }
    
    setIsSaving(true);
    toast.info('Saving RAML...');
    
    try {
      const data = await saveRamlTask({
        task_name: taskName,
        user_id: user?.id || '',
        workspace_id: workspaceId,
        description,
        raml_content: ramlContent,
        api_name: apiName,
        api_version: apiVersion,
        base_uri: baseUri
      });
      
      toast.success('RAML saved successfully!');
      
      if (onTaskCreated && data && data[0]) {
        onTaskCreated(data[0].id);
      }
    } catch (error: any) {
      console.error('Error saving RAML:', error);
      toast.error('Failed to save RAML');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RAML Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate or upload RAML specifications for your APIs
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>RAML Specification</CardTitle>
            <CardDescription>
              Define your API using RAML
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">Task Name</Label>
              <Input
                id="taskName"
                placeholder="Enter a name for this RAML task"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the API"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiName">API Name</Label>
                <Input
                  id="apiName"
                  placeholder="My API"
                  value={apiName}
                  onChange={(e) => setApiName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiVersion">API Version</Label>
                <Input
                  id="apiVersion"
                  placeholder="1.0"
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseUri">Base URI</Label>
                <Input
                  id="baseUri"
                  placeholder="https://example.com/api"
                  value={baseUri}
                  onChange={(e) => setBaseUri(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RAML Content</Label>
              <div {...getRootProps()} className="relative border rounded-md p-4 cursor-pointer bg-gray-50 dark:bg-gray-800">
                <input {...getInputProps()} />
                {ramlContent ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    File loaded. Edit below or drag and drop a new file to replace.
                  </div>
                ) : isDragActive ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Drop the files here ...</p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag 'n' drop a RAML file here, or click to select files
                  </p>
                )}
              </div>
              <div className="border rounded-md">
                <MonacoEditor
                  value={ramlContent}
                  onChange={setRamlContent}
                  language="yaml"
                  height="400px"
                  options={{
                    minimap: { enabled: true }
                  }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save RAML'
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RAMLGenerator;
