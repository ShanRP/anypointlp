
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MonacoEditor } from './MonacoEditor';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export interface RAMLGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({ 
  onTaskCreated, 
  selectedWorkspaceId,
  onBack,
  onSaveTask
}) => {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspaces();
  const { saveRamlTask } = useWorkspaceTasks(selectedWorkspaceId || selectedWorkspace?.id || '');
  
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('v1');
  const [baseUri, setBaseUri] = useState('https://api.example.com/{version}');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('application/json');
  const [protocol, setProtocol] = useState('HTTP');

  const [endpoints, setEndpoints] = useState([
    { path: '/resource', method: 'get', description: 'Get all resources' }
  ]);
  
  const [ramlContent, setRamlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  const [generatedTimestamp, setGeneratedTimestamp] = useState<string>('');

  const addEndpoint = () => {
    setEndpoints([...endpoints, { path: '/new-resource', method: 'get', description: 'Description' }]);
  };

  const updateEndpoint = (index: number, field: string, value: string) => {
    const updatedEndpoints = [...endpoints];
    updatedEndpoints[index] = { ...updatedEndpoints[index], [field]: value };
    setEndpoints(updatedEndpoints);
  };

  const removeEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  const generateRAML = async () => {
    try {
      setLoading(true);
      
      // Generate RAML content based on form inputs
      const raml = `#%RAML 1.0
title: ${apiName}
version: ${apiVersion}
baseUri: ${baseUri}
description: ${description}
mediaType: ${mediaType}
protocols: [${protocol}]

${endpoints.map(endpoint => `
/${endpoint.path.replace(/^\//, '')}:
  ${endpoint.method}:
    description: ${endpoint.description}
    responses:
      200:
        body:
          application/json:
            example: |
              { "success": true }
`).join('')}`;

      setRamlContent(raml);
      
      // Generate a unique task ID
      const newTaskId = `RAML-${Math.floor(Math.random() * 9000 + 1000)}`;
      setTaskId(newTaskId);
      
      // Set the timestamp
      setGeneratedTimestamp(new Date().toLocaleString());
      
      // Save the RAML task to the database if a user is logged in
      if (user && (selectedWorkspaceId || selectedWorkspace?.id)) {
        const mediaTypes = [mediaType];
        const protocols = [protocol];
        const types = [];
        
        const savedTask = await saveRamlTask({
          workspace_id: selectedWorkspaceId || selectedWorkspace?.id || '',
          task_id: newTaskId,
          task_name: apiName || 'RAML Specification',
          description: description,
          user_id: user.id,
          raml_content: raml,
          api_name: apiName,
          api_version: apiVersion,
          base_uri: baseUri,
          media_types: mediaTypes,
          protocols: protocols,
          types: types,
          endpoints: endpoints
        });
        
        toast.success('RAML specification saved successfully!');
        
        if (onTaskCreated) {
          onTaskCreated(savedTask);
        }
        
        if (onSaveTask) {
          onSaveTask(newTaskId);
        }
      }
    } catch (error) {
      console.error('Error generating RAML:', error);
      toast.error('Error generating RAML');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">RAML API Specification Generator</h1>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
        </div>
        
        {taskId && (
          <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium">Task ID: {taskId}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Generated: {generatedTimestamp}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-name">API Name</Label>
              <Input
                id="api-name"
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
                placeholder="My API"
              />
            </div>
            
            <div>
              <Label htmlFor="api-version">API Version</Label>
              <Input
                id="api-version"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                placeholder="v1"
              />
            </div>
            
            <div>
              <Label htmlFor="base-uri">Base URI</Label>
              <Input
                id="base-uri"
                value={baseUri}
                onChange={(e) => setBaseUri(e.target.value)}
                placeholder="https://api.example.com/{version}"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="API description..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="media-type">Media Type</Label>
              <Select value={mediaType} onValueChange={setMediaType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="application/json">application/json</SelectItem>
                  <SelectItem value="application/xml">application/xml</SelectItem>
                  <SelectItem value="text/plain">text/plain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="protocol">Protocol</Label>
              <Select value={protocol} onValueChange={setProtocol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="HTTPS">HTTPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Endpoints</h2>
            {endpoints.map((endpoint, index) => (
              <div key={index} className="p-4 border rounded-md space-y-2">
                <div className="flex justify-between">
                  <h3 className="font-medium">Endpoint {index + 1}</h3>
                  <Button size="sm" variant="destructive" onClick={() => removeEndpoint(index)}>
                    Remove
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor={`path-${index}`}>Path</Label>
                  <Input
                    id={`path-${index}`}
                    value={endpoint.path}
                    onChange={(e) => updateEndpoint(index, 'path', e.target.value)}
                    placeholder="/resource"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`method-${index}`}>Method</Label>
                  <Select 
                    value={endpoint.method} 
                    onValueChange={(value) => updateEndpoint(index, 'method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="get">GET</SelectItem>
                      <SelectItem value="post">POST</SelectItem>
                      <SelectItem value="put">PUT</SelectItem>
                      <SelectItem value="delete">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    value={endpoint.description}
                    onChange={(e) => updateEndpoint(index, 'description', e.target.value)}
                    placeholder="Endpoint description"
                  />
                </div>
              </div>
            ))}
            
            <Button type="button" variant="outline" onClick={addEndpoint}>
              Add Endpoint
            </Button>
          </div>
        </div>
        
        <Button
          onClick={generateRAML}
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate RAML'}
        </Button>
      </div>
      
      {ramlContent && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Generated RAML</h2>
          <div className="h-96 border rounded-md overflow-hidden">
            <MonacoEditor
              language="yaml"
              value={ramlContent}
              onChange={(value) => setRamlContent(value || '')}
              readOnly={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RAMLGenerator;
