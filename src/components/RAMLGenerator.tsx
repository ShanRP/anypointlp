import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuid } from 'uuid';
import { RAMLGeneratorPayload, useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useNavigate } from 'react-router-dom';
import { BackButton } from './ui/BackButton';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface RAMLGeneratorProps {
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
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('1.0');
  const [baseUri, setBaseUri] = useState('https://example.com/api');
  const [endpoints, setEndpoints] = useState([{ path: '/resource', methods: [{ type: 'get', description: 'Retrieve resource' }] }]);
  const [apiDescription, setApiDescription] = useState('');
  const [apiDocumentation, setApiDocumentation] = useState('');
  const [ramlContent, setRamlContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { saveRamlTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const handleAddEndpoint = () => {
    setEndpoints([...endpoints, { path: '/new-resource', methods: [{ type: 'get', description: 'Retrieve new resource' }] }]);
  };

  const handleEndpointChange = (index: number, field: string, value: string) => {
    const newEndpoints = [...endpoints];
    newEndpoints[index][field] = value;
    setEndpoints(newEndpoints);
  };

  const handleAddMethod = (endpointIndex: number) => {
    const newEndpoints = [...endpoints];
    newEndpoints[endpointIndex].methods = [...newEndpoints[endpointIndex].methods, { type: 'get', description: 'New method' }];
    setEndpoints(newEndpoints);
  };

  const handleMethodChange = (endpointIndex: number, methodIndex: number, field: string, value: string) => {
    const newEndpoints = [...endpoints];
    newEndpoints[endpointIndex].methods[methodIndex][field] = value;
    setEndpoints(newEndpoints);
  };

  const generateRAML = useCallback(() => {
    let raml = `#%RAML 1.0\n`;
    raml += `title: ${apiName}\n`;
    raml += `version: ${apiVersion}\n`;
    raml += `baseUri: ${baseUri}\n`;
    raml += `description: ${apiDescription}\n`;
    raml += `documentation:\n  - title: API Documentation\n    content: ${apiDocumentation}\n`;

    endpoints.forEach(endpoint => {
      raml += `${endpoint.path}:\n`;
      endpoint.methods.forEach(method => {
        raml += `  ${method.type}:\n`;
        raml += `    description: ${method.description}\n`;
      });
    });

    return raml;
  }, [apiName, apiVersion, baseUri, apiDescription, apiDocumentation, endpoints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const generatedRaml = generateRAML();
      setRamlContent(generatedRaml);

      toast({
        children: "RAML specification generated successfully!",
        duration: 3000,
        className: 'bg-green-500 text-white'
      });
      
      if (selectedWorkspaceId) {
        setIsSaving(true);
        
        try {
          const taskData: RAMLGeneratorPayload = {
            task_id: `R-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
            task_name: `${apiName} API Specification`,
            user_id: user?.id || '',
            workspace_id: selectedWorkspaceId,
            description: apiDescription,
            raml_content: ramlContent,
            api_name: apiName,
            api_version: apiVersion,
            base_uri: baseUri,
            endpoints: endpointsArray,
            documentation: apiDocumentation,
            category: "raml" // Explicitly set as literal "raml" type
          };
          
          const result = await saveRamlTask(taskData);
          console.log('RAML task saved:', result);
          
          toast({
            children: "RAML specification saved to workspace!",
            duration: 3000,
            className: 'bg-green-500 text-white'
          });
          
          if (onTaskCreated) {
            onTaskCreated(result);
          }
          
          if (onSaveTask && result && result[0] && result[0].id) {
            onSaveTask(result[0].id);
          }
          
        } catch (saveError) {
          console.error('Error saving RAML task:', saveError);
          toast({
            children: "Failed to save RAML specification",
            duration: 3000,
            className: 'bg-red-500 text-white'
          });
        } finally {
          setIsSaving(false);
        }
      }
      
    } catch (error) {
      console.error('Error generating RAML:', error);
      
      toast({
        children: "Failed to generate RAML specification",
        duration: 3000,
        className: 'bg-red-500 text-white'
      });
      
      setGenerationError(error as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const endpointsArray = endpoints.map(endpoint => ({
    path: endpoint.path,
    methods: endpoint.methods.map(method => ({
      type: method.type,
      description: method.description
    }))
  }));

  return (
    <div className="p-8 max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm">
      <BackButton 
        onBack={onBack || (() => navigate('/dashboard'))}
        label="RAML Generator"
        description="Generate RAML specifications for your APIs"
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="apiName">API Name</Label>
          <Input
            id="apiName"
            placeholder="My API"
            value={apiName}
            onChange={(e) => setApiName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="apiVersion">API Version</Label>
          <Input
            id="apiVersion"
            placeholder="1.0"
            value={apiVersion}
            onChange={(e) => setApiVersion(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="baseUri">Base URI</Label>
          <Input
            id="baseUri"
            placeholder="https://example.com/api"
            value={baseUri}
            onChange={(e) => setBaseUri(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="apiDescription">API Description</Label>
          <Textarea
            id="apiDescription"
            placeholder="Description of the API"
            rows={3}
            value={apiDescription}
            onChange={(e) => setApiDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="apiDocumentation">API Documentation</Label>
          <Textarea
            id="apiDocumentation"
            placeholder="Detailed documentation content"
            rows={5}
            value={apiDocumentation}
            onChange={(e) => setApiDocumentation(e.target.value)}
          />
        </div>

        <div>
          <Label>Endpoints</Label>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`endpointPath-${index}`}>Endpoint {index + 1}</Label>
                  <Button type="button" variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
                <Input
                  id={`endpointPath-${index}`}
                  placeholder="/resource"
                  value={endpoint.path}
                  onChange={(e) => handleEndpointChange(index, 'path', e.target.value)}
                />
                <div className="space-y-2">
                  {endpoint.methods.map((method, methodIndex) => (
                    <div key={methodIndex} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`methodType-${index}-${methodIndex}`}>Method {methodIndex + 1}</Label>
                        <Button type="button" variant="ghost" size="sm">
                          Remove
                        </Button>
                      </div>
                      <Input
                        id={`methodType-${index}-${methodIndex}`}
                        placeholder="get"
                        value={method.type}
                        onChange={(e) => handleMethodChange(index, methodIndex, 'type', e.target.value)}
                      />
                      <Textarea
                        placeholder="Description"
                        value={method.description}
                        onChange={(e) => handleMethodChange(index, methodIndex, 'description', e.target.value)}
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => handleAddMethod(index)}>
                    Add Method
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddEndpoint}>
              Add Endpoint
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="ramlContent">Generated RAML</Label>
          <Textarea
            id="ramlContent"
            placeholder="Generated RAML content will appear here"
            rows={10}
            value={ramlContent}
            readOnly
            className="bg-gray-100 dark:bg-gray-800 font-mono"
          />
        </div>

        <div className="flex justify-between">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Button type="submit" disabled={isGenerating || isSaving}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Generate RAML'
            )}
          </Button>
        </div>
        {generationError && (
          <div className="text-red-500 mt-4">
            Error: {generationError.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default RAMLGenerator;
