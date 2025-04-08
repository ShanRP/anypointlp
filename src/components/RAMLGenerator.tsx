
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Code2, Copy, Download, FileCode, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import MonacoEditor from './MonacoEditor';
import { FileCode2 } from 'lucide-react';

interface RAMLField {
  id: string;
  path: string;
  method: string;
  description: string;
  queryParams?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  uriParams?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    mimeType: string;
    schema?: string;
    example?: string;
  };
  responses?: {
    code: string;
    description: string;
    mimeType: string;
    schema?: string;
    example?: string;
  }[];
}

const RAML_TEMPLATE = `#%RAML 1.0
title: API
version: v1
baseUri: https://api.example.com/{version}
mediaType: application/json

/resource:
  get:
    description: Get all resources
    responses:
      200:
        body:
          application/json:
            example: |
              {
                "data": []
              }
`;

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('define');
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('v1');
  const [baseUri, setBaseUri] = useState('https://{hostname}/{version}');
  const [description, setDescription] = useState('');
  const [endpoints, setEndpoints] = useState<RAMLField[]>([
    {
      id: '1',
      path: '/resource',
      method: 'get',
      description: 'Get all resources',
      queryParams: [],
      uriParams: [],
      responses: [
        {
          code: '200',
          description: 'Success',
          mimeType: 'application/json',
          example: '{\n  "data": []\n}'
        }
      ]
    }
  ]);
  const [ramlContent, setRamlContent] = useState(RAML_TEMPLATE);
  const [previewMode, setPreviewMode] = useState<'pretty' | 'raw'>('pretty');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskId, setTaskId] = useState('');
  const { user } = useAuth();
  const { saveRamlTask } = useWorkspaceTasks(selectedWorkspaceId || '');

  useEffect(() => {
    // Generate a unique task ID when component loads
    setTaskId(`R-${crypto.randomUUID().substring(0, 8).toUpperCase()}`);
  }, []);

  const handleGenerateRAML = () => {
    if (!apiName.trim()) {
      toast.error("API name is required");
      return;
    }

    try {
      let raml = `#%RAML 1.0
title: ${apiName}
version: ${apiVersion}
baseUri: ${baseUri}
mediaType: application/json
${description ? `description: |\n  ${description.replace(/\n/g, '\n  ')}` : ''}

`;

      endpoints.forEach(endpoint => {
        raml += `${endpoint.path}:\n`;
        raml += `  ${endpoint.method}:\n`;
        raml += `    description: ${endpoint.description}\n`;

        if (endpoint.queryParams && endpoint.queryParams.length > 0) {
          raml += '    queryParameters:\n';
          endpoint.queryParams.forEach(param => {
            raml += `      ${param.name}:\n`;
            raml += `        type: ${param.type}\n`;
            raml += `        required: ${param.required}\n`;
            if (param.description) {
              raml += `        description: ${param.description}\n`;
            }
          });
        }

        if (endpoint.uriParams && endpoint.uriParams.length > 0) {
          raml += '    uriParameters:\n';
          endpoint.uriParams.forEach(param => {
            raml += `      ${param.name}:\n`;
            raml += `        type: ${param.type}\n`;
            raml += `        required: ${param.required}\n`;
            if (param.description) {
              raml += `        description: ${param.description}\n`;
            }
          });
        }

        if (endpoint.requestBody) {
          raml += '    body:\n';
          raml += `      ${endpoint.requestBody.mimeType}:\n`;
          if (endpoint.requestBody.schema) {
            raml += '        schema: |\n';
            endpoint.requestBody.schema.split('\n').forEach(line => {
              raml += `          ${line}\n`;
            });
          }
          if (endpoint.requestBody.example) {
            raml += '        example: |\n';
            endpoint.requestBody.example.split('\n').forEach(line => {
              raml += `          ${line}\n`;
            });
          }
        }

        if (endpoint.responses && endpoint.responses.length > 0) {
          raml += '    responses:\n';
          endpoint.responses.forEach(response => {
            raml += `      ${response.code}:\n`;
            raml += `        description: ${response.description}\n`;
            raml += '        body:\n';
            raml += `          ${response.mimeType}:\n`;
            if (response.schema) {
              raml += '            schema: |\n';
              response.schema.split('\n').forEach(line => {
                raml += `              ${line}\n`;
              });
            }
            if (response.example) {
              raml += '            example: |\n';
              response.example.split('\n').forEach(line => {
                raml += `              ${line}\n`;
              });
            }
          });
        }
      });

      setRamlContent(raml);
      setActiveTab('result');
      toast.success('RAML specification generated successfully');
    } catch (error) {
      console.error('Error generating RAML:', error);
      toast.error('Failed to generate RAML');
    }
  };

  const addEndpoint = () => {
    const newEndpoint: RAMLField = {
      id: Date.now().toString(),
      path: '/new-resource',
      method: 'get',
      description: 'Description of the endpoint',
      queryParams: [],
      uriParams: [],
      responses: [
        {
          code: '200',
          description: 'Success',
          mimeType: 'application/json',
          example: '{\n  "data": {}\n}'
        }
      ]
    };
    setEndpoints([...endpoints, newEndpoint]);
  };

  const removeEndpoint = (id: string) => {
    setEndpoints(endpoints.filter(endpoint => endpoint.id !== id));
  };

  const updateEndpoint = (id: string, field: keyof RAMLField, value: any) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === id) {
        return { ...endpoint, [field]: value };
      }
      return endpoint;
    }));
  };

  const addQueryParam = (endpointId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        const queryParams = endpoint.queryParams || [];
        return {
          ...endpoint,
          queryParams: [
            ...queryParams,
            {
              name: `param${queryParams.length + 1}`,
              type: 'string',
              required: false,
              description: 'Description of the parameter'
            }
          ]
        };
      }
      return endpoint;
    }));
  };

  const updateQueryParam = (endpointId: string, paramIndex: number, field: string, value: any) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId && endpoint.queryParams) {
        const updatedParams = [...endpoint.queryParams];
        updatedParams[paramIndex] = {
          ...updatedParams[paramIndex],
          [field]: field === 'required' ? value : value
        };
        return { ...endpoint, queryParams: updatedParams };
      }
      return endpoint;
    }));
  };

  const removeQueryParam = (endpointId: string, paramIndex: number) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId && endpoint.queryParams) {
        const updatedParams = [...endpoint.queryParams];
        updatedParams.splice(paramIndex, 1);
        return { ...endpoint, queryParams: updatedParams };
      }
      return endpoint;
    }));
  };

  const addResponse = (endpointId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        const responses = endpoint.responses || [];
        return {
          ...endpoint,
          responses: [
            ...responses,
            {
              code: '201',
              description: 'Created',
              mimeType: 'application/json',
              example: '{\n  "message": "Resource created"\n}'
            }
          ]
        };
      }
      return endpoint;
    }));
  };

  const updateResponse = (endpointId: string, responseIndex: number, field: string, value: any) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId && endpoint.responses) {
        const updatedResponses = [...endpoint.responses];
        updatedResponses[responseIndex] = {
          ...updatedResponses[responseIndex],
          [field]: value
        };
        return { ...endpoint, responses: updatedResponses };
      }
      return endpoint;
    }));
  };

  const removeResponse = (endpointId: string, responseIndex: number) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId && endpoint.responses) {
        const updatedResponses = [...endpoint.responses];
        updatedResponses.splice(responseIndex, 1);
        return { ...endpoint, responses: updatedResponses };
      }
      return endpoint;
    }));
  };

  const handleSaveTask = async () => {
    if (!taskName.trim()) {
      toast.error("Task name is required");
      return;
    }

    if (!selectedWorkspaceId || !user) {
      toast.error("Workspace or user information missing");
      return;
    }

    try {
      const task = {
        task_id: taskId,
        task_name: taskName,
        workspace_id: selectedWorkspaceId,
        user_id: user.id,
        description: description || `RAML specification for ${apiName}`,
        raml_content: ramlContent,
        api_name: apiName,
        api_version: apiVersion,
        base_uri: baseUri,
        endpoints: endpoints as unknown as any,
        documentation: ''
      };

      const result = await saveRamlTask(task);
      
      setSaveDialogOpen(false);
      toast.success("RAML task saved successfully!");
      
      if (onSaveTask) {
        onSaveTask(taskId);
      }
    } catch (error) {
      console.error('Error saving RAML task:', error);
      toast.error("Failed to save RAML task");
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(ramlContent);
    toast.success("RAML copied to clipboard");
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBack || (() => navigate('/dashboard'))}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">RAML API Specification Generator</h1>
          <p className="text-muted-foreground">Generate RAML specifications for your APIs</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="define">Define API</TabsTrigger>
          <TabsTrigger value="result">Generated RAML</TabsTrigger>
        </TabsList>

        <TabsContent value="define" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="apiName">API Name</Label>
                  <Input
                    id="apiName"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="My API"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="apiVersion">API Version</Label>
                  <Input
                    id="apiVersion"
                    value={apiVersion}
                    onChange={(e) => setApiVersion(e.target.value)}
                    placeholder="v1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="baseUri">Base URI</Label>
                  <Input
                    id="baseUri"
                    value={baseUri}
                    onChange={(e) => setBaseUri(e.target.value)}
                    placeholder="https://{hostname}/{version}"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label htmlFor="description">API Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your API..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Separator className="my-6" />

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Endpoints</h3>
                  <Button onClick={addEndpoint} size="sm">Add Endpoint</Button>
                </div>

                {endpoints.map((endpoint, index) => (
                  <div key={endpoint.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Endpoint {index + 1}</h4>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeEndpoint(endpoint.id)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor={`path-${endpoint.id}`}>Path</Label>
                        <Input
                          id={`path-${endpoint.id}`}
                          value={endpoint.path}
                          onChange={(e) => updateEndpoint(endpoint.id, 'path', e.target.value)}
                          placeholder="/resource"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`method-${endpoint.id}`}>Method</Label>
                        <Select
                          value={endpoint.method}
                          onValueChange={(value) => updateEndpoint(endpoint.id, 'method', value)}
                        >
                          <SelectTrigger id={`method-${endpoint.id}`}>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="get">GET</SelectItem>
                            <SelectItem value="post">POST</SelectItem>
                            <SelectItem value="put">PUT</SelectItem>
                            <SelectItem value="delete">DELETE</SelectItem>
                            <SelectItem value="patch">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label htmlFor={`description-${endpoint.id}`}>Description</Label>
                      <Textarea
                        id={`description-${endpoint.id}`}
                        value={endpoint.description}
                        onChange={(e) => updateEndpoint(endpoint.id, 'description', e.target.value)}
                        placeholder="Describe this endpoint..."
                        className="mt-1"
                      />
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-sm">Query Parameters</h5>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addQueryParam(endpoint.id)}
                        >
                          Add Parameter
                        </Button>
                      </div>

                      {endpoint.queryParams && endpoint.queryParams.length > 0 ? (
                        <div className="space-y-4">
                          {endpoint.queryParams.map((param, paramIndex) => (
                            <div key={paramIndex} className="p-3 border rounded-md">
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="text-sm font-medium">Parameter {paramIndex + 1}</h6>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeQueryParam(endpoint.id, paramIndex)}
                                >
                                  Remove
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <Label htmlFor={`param-name-${endpoint.id}-${paramIndex}`} className="text-xs">Name</Label>
                                  <Input
                                    id={`param-name-${endpoint.id}-${paramIndex}`}
                                    value={param.name}
                                    onChange={(e) => updateQueryParam(endpoint.id, paramIndex, 'name', e.target.value)}
                                    className="mt-1"
                                    size="sm"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`param-type-${endpoint.id}-${paramIndex}`} className="text-xs">Type</Label>
                                  <Select
                                    value={param.type}
                                    onValueChange={(value) => updateQueryParam(endpoint.id, paramIndex, 'type', value)}
                                  >
                                    <SelectTrigger id={`param-type-${endpoint.id}-${paramIndex}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="string">string</SelectItem>
                                      <SelectItem value="number">number</SelectItem>
                                      <SelectItem value="boolean">boolean</SelectItem>
                                      <SelectItem value="date">date</SelectItem>
                                      <SelectItem value="array">array</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center mt-6">
                                  <Checkbox
                                    id={`param-required-${endpoint.id}-${paramIndex}`}
                                    checked={param.required}
                                    onCheckedChange={(checked) => 
                                      updateQueryParam(endpoint.id, paramIndex, 'required', !!checked)
                                    }
                                  />
                                  <Label htmlFor={`param-required-${endpoint.id}-${paramIndex}`} className="ml-2 text-xs">
                                    Required
                                  </Label>
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <Label htmlFor={`param-desc-${endpoint.id}-${paramIndex}`} className="text-xs">Description</Label>
                                <Input
                                  id={`param-desc-${endpoint.id}-${paramIndex}`}
                                  value={param.description}
                                  onChange={(e) => updateQueryParam(endpoint.id, paramIndex, 'description', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No query parameters defined</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-sm">Responses</h5>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addResponse(endpoint.id)}
                        >
                          Add Response
                        </Button>
                      </div>

                      {endpoint.responses && endpoint.responses.length > 0 ? (
                        <div className="space-y-4">
                          {endpoint.responses.map((response, responseIndex) => (
                            <div key={responseIndex} className="p-3 border rounded-md">
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="text-sm font-medium">Response {responseIndex + 1}</h6>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeResponse(endpoint.id, responseIndex)}
                                >
                                  Remove
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                <div>
                                  <Label htmlFor={`response-code-${endpoint.id}-${responseIndex}`} className="text-xs">Status Code</Label>
                                  <Input
                                    id={`response-code-${endpoint.id}-${responseIndex}`}
                                    value={response.code}
                                    onChange={(e) => updateResponse(endpoint.id, responseIndex, 'code', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`response-desc-${endpoint.id}-${responseIndex}`} className="text-xs">Description</Label>
                                  <Input
                                    id={`response-desc-${endpoint.id}-${responseIndex}`}
                                    value={response.description}
                                    onChange={(e) => updateResponse(endpoint.id, responseIndex, 'description', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              
                              <div className="mb-2">
                                <Label htmlFor={`response-mime-${endpoint.id}-${responseIndex}`} className="text-xs">MIME Type</Label>
                                <Select
                                  value={response.mimeType}
                                  onValueChange={(value) => updateResponse(endpoint.id, responseIndex, 'mimeType', value)}
                                >
                                  <SelectTrigger id={`response-mime-${endpoint.id}-${responseIndex}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="application/json">application/json</SelectItem>
                                    <SelectItem value="application/xml">application/xml</SelectItem>
                                    <SelectItem value="text/plain">text/plain</SelectItem>
                                    <SelectItem value="text/html">text/html</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor={`response-example-${endpoint.id}-${responseIndex}`} className="text-xs">Example</Label>
                                <Textarea
                                  id={`response-example-${endpoint.id}-${responseIndex}`}
                                  value={response.example}
                                  onChange={(e) => updateResponse(endpoint.id, responseIndex, 'example', e.target.value)}
                                  className="mt-1 font-mono text-xs"
                                  rows={4}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No responses defined</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActiveTab('result')}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateRAML}>
                  Generate RAML
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Generated RAML Specification</h3>
                <div className="flex space-x-2">
                  <RadioGroup value={previewMode} onValueChange={(value) => setPreviewMode(value as 'pretty' | 'raw')} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pretty" id="pretty" />
                      <Label htmlFor="pretty">Pretty</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="raw" id="raw" />
                      <Label htmlFor="raw">Raw</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden" style={{ height: '500px' }}>
                {previewMode === 'pretty' ? (
                  <MonacoEditor
                    value={ramlContent}
                    language="yaml"
                    onChange={(value) => setRamlContent(value || '')}
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                ) : (
                  <Textarea
                    value={ramlContent}
                    onChange={(e) => setRamlContent(e.target.value)}
                    className="h-full w-full font-mono text-sm p-4 resize-none"
                  />
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('define')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Editor
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleCopyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const blob = new Blob([ramlContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${apiName || 'api'}.raml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={() => setSaveDialogOpen(true)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save RAML Task</DialogTitle>
            <DialogDescription>
              Enter a name for this RAML specification to save it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder={`RAML for ${apiName || 'API'}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-id">Task ID</Label>
              <Input
                id="task-id"
                value={taskId}
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask}>
              Save Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RAMLGenerator;
