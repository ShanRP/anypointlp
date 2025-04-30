import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { generateTaskId } from '@/utils/taskUtils';

interface RAMLGeneratorProps {
  selectedWorkspaceId: string;
  onBack: () => void;
  onSaveTask: (id: string) => void;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({ selectedWorkspaceId, onBack, onSaveTask }) => {
  const [ramlTitle, setRamlTitle] = useState('');
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('');
  const [baseUri, setBaseUri] = useState('');
  const [description, setDescription] = useState('');
  const [ramlContent, setRamlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const taskIdRef = useRef<string | null>(null);
  const workspaceTasks = useWorkspaceTasks(selectedWorkspaceId);

  useEffect(() => {
    if (!user) {
      toast.error('You must be logged in to use this feature.');
      navigate('/auth');
    }
  }, [user, navigate]);

  const generateRAML = async () => {
    setLoading(true);
    try {
      const generatedRaml = `#%RAML 1.0
title: ${apiName}
version: ${apiVersion}
baseUri: ${baseUri}
description: ${description}

/endpoint:
  get:
    description: |
      This is a sample endpoint.
    responses:
      200:
        body:
          application/json:
            example:
              message: Hello, world!
`;
      setRamlContent(generatedRaml);
      toast.success('RAML generated successfully!');
    } catch (error: any) {
      toast.error(`Error generating RAML: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // In your submit handler, make sure to use the taskId properly
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to save tasks.');
      return;
    }
  
    if (!ramlTitle || !apiName || !apiVersion || !baseUri || !ramlContent) {
      toast.error('Please fill in all fields.');
      return;
    }
  
    try {
      setLoading(true);
      
      // Save task to workspace
      if (selectedWorkspaceId) {
        const taskId = await workspaceTasks.saveRamlTask({
          task_id: taskIdRef.current || generateTaskId(),
          task_name: ramlTitle,
          description: description,
          raml_content: ramlContent,
          api_name: apiName,
          api_version: apiVersion,
          base_uri: baseUri
        });
        
        if (taskId) {
          onSaveTask(taskId);
        }
      }
      
    } catch (error) {
      toast.error(`Error saving RAML task: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-semibold">RAML Generator</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>RAML Configuration</CardTitle>
            <CardDescription>Define your API specifications</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="raml-title">Title</Label>
              <Input
                id="raml-title"
                placeholder="My API"
                value={ramlTitle}
                onChange={(e) => setRamlTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-name">API Name</Label>
              <Input
                id="api-name"
                placeholder="MyAPI"
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-version">API Version</Label>
              <Input
                id="api-version"
                placeholder="1.0"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="base-uri">Base URI</Label>
              <Input
                id="base-uri"
                placeholder="https://example.com/api"
                value={baseUri}
                onChange={(e) => setBaseUri(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description of the API"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateRAML} disabled={loading}>
              {loading ? 'Generating...' : 'Generate RAML'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>RAML Content</CardTitle>
            <CardDescription>Generated RAML content</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Generated RAML will appear here"
              value={ramlContent}
              onChange={(e) => setRamlContent(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save RAML'}
        </Button>
      </div>
    </div>
  );
};

export default RAMLGenerator;
