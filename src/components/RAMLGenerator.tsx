
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Code, Copy, ExternalLink, FileCode, RotateCw, Save, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import MonacoEditor from './MonacoEditor';
import { v4 as uuidv4 } from 'uuid';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';

interface RAMLGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (id: string) => void;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({
  onTaskCreated,
  selectedWorkspaceId,
  onBack,
  onSaveTask,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveRamlTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('v1');
  const [baseUri, setBaseUri] = useState('https://api.example.com/{version}');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [endpoints, setEndpoints] = useState<Array<{
    id: string;
    path: string;
    description: string;
    methods: Array<{
      id: string;
      type: 'get' | 'post' | 'put' | 'delete';
      description: string;
      queryParams: Array<{
        id: string;
        name: string;
        required: boolean;
        type: string;
      }>;
      responses: Array<{
        id: string;
        code: string;
        description: string;
      }>;
    }>;
  }>>([
    {
      id: uuidv4(),
      path: 'resource',
      description: 'A sample resource',
      methods: [
        {
          id: uuidv4(),
          type: 'get',
          description: 'Get a list of resources',
          queryParams: [
            {
              id: uuidv4(),
              name: 'limit',
              required: false,
              type: 'number'
            }
          ],
          responses: [
            {
              id: uuidv4(),
              code: '200',
              description: 'Successful response'
            }
          ]
        }
      ]
    }
  ]);
  
  const [ramlOutput, setRamlOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskId, setTaskId] = useState('');
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [documentation, setDocumentation] = useState('');
  
  useEffect(() => {
    // Generate a unique task ID when component loads
    setTaskId(`R-${crypto.randomUUID().substring(0, 8).toUpperCase()}`);
  }, []);
  
  const addEndpoint = () => {
    setEndpoints([
      ...endpoints,
      {
        id: uuidv4(),
        path: '',
        description: '',
        methods: []
      }
    ]);
  };
  
  const updateEndpoint = (id: string, data: Partial<typeof endpoints[0]>) => {
    setEndpoints(endpoints.map(endpoint => 
      endpoint.id === id ? { ...endpoint, ...data } : endpoint
    ));
  };
  
  const removeEndpoint = (id: string) => {
    setEndpoints(endpoints.filter(endpoint => endpoint.id !== id));
  };
  
  const addMethod = (endpointId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: [
            ...endpoint.methods,
            {
              id: uuidv4(),
              type: 'get',
              description: '',
              queryParams: [],
              responses: [
                {
                  id: uuidv4(),
                  code: '200',
                  description: 'Successful response'
                }
              ]
            }
          ]
        };
      }
      return endpoint;
    }));
  };
  
  const updateMethod = (endpointId: string, methodId: string, data: Partial<typeof endpoints[0]['methods'][0]>) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.map(method => 
            method.id === methodId ? { ...method, ...data } : method
          )
        };
      }
      return endpoint;
    }));
  };
  
  const removeMethod = (endpointId: string, methodId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.filter(method => method.id !== methodId)
        };
      }
      return endpoint;
    }));
  };
  
  const addQueryParam = (endpointId: string, methodId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.map(method => {
            if (method.id === methodId) {
              return {
                ...method,
                queryParams: [
                  ...method.queryParams,
                  {
                    id: uuidv4(),
                    name: '',
                    required: false,
                    type: 'string'
                  }
                ]
              };
            }
            return method;
          })
        };
      }
      return endpoint;
    }));
  };
  
  const updateQueryParam = (
    endpointId: string, 
    methodId: string, 
    paramId: string, 
    data: Partial<typeof endpoints[0]['methods'][0]['queryParams'][0]>
  ) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.map(method => {
            if (method.id === methodId) {
              return {
                ...method,
                queryParams: method.queryParams.map(param => 
                  param.id === paramId ? { ...param, ...data } : param
                )
              };
            }
            return method;
          })
        };
      }
      return endpoint;
    }));
  };
  
  const removeQueryParam = (endpointId: string, methodId: string, paramId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.map(method => {
            if (method.id === methodId) {
              return {
                ...method,
                queryParams: method.queryParams.filter(param => param.id !== paramId)
              };
            }
            return method;
          })
        };
      }
      return endpoint;
    }));
  };
  
  const addResponse = (endpointId: string, methodId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.map(method => {
            if (method.id === methodId) {
              return {
                ...method,
                responses: [
                  ...method.responses,
                  {
                    id: uuidv4(),
                    code: '',
                    description: ''
                  }
                ]
              };
            }
            return method;
          })
        };
      }
      return endpoint;
    }));
  };
  
  const updateResponse = (
    endpointId: string, 
    methodId: string, 
    responseId: string, 
    data: Partial<typeof endpoints[0]['methods'][0]['responses'][0]>
  ) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.map(method => {
            if (method.id === methodId) {
              return {
                ...method,
                responses: method.responses.map(response => 
                  response.id === responseId ? { ...response, ...data } : response
                )
              };
            }
            return method;
          })
        };
      }
      return endpoint;
    }));
  };
  
  const removeResponse = (endpointId: string, methodId: string, responseId: string) => {
    setEndpoints(endpoints.map(endpoint => {
      if (endpoint.id === endpointId) {
        return {
          ...endpoint,
          methods: endpoint.methods.map(method => {
            if (method.id === methodId) {
              return {
                ...method,
                responses: method.responses.filter(response => response.id !== responseId)
              };
            }
            return method;
          })
        };
      }
      return endpoint;
    }));
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      if (!apiName) {
        toast.error("API name is required");
        setIsGenerating(false);
        return;
      }
      
      // Basic validation for important fields
      if (endpoints.some(endpoint => !endpoint.path)) {
        toast.error("All endpoints must have a path");
        setIsGenerating(false);
        return;
      }
      
      console.log("Generating RAML with data:", {
        apiName,
        apiVersion,
        baseUri,
        description,
        endpoints,
        documentation: showDocumentation ? documentation : undefined
      });
      
      // Call Supabase function to generate RAML
      const { data, error } = await supabase.functions.invoke('APL_generate-raml', {
        body: {
          apiName,
          apiVersion,
          baseUri,
          description,
          endpoints,
          documentation: showDocumentation ? documentation : undefined
        }
      });
      
      if (error) {
        console.error("Error generating RAML:", error);
        toast.error("Error generating RAML: " + error.message);
        setIsGenerating(false);
        return;
      }
      
      console.log("Generated RAML:", data);
      setRamlOutput(data.raml || "# Failed to generate RAML");
      
      if (data.raml) {
        toast.success("RAML specification generated successfully!");
        setActiveTab('result');
        
        if (onTaskCreated && selectedWorkspaceId) {
          onTaskCreated({
            id: taskId,
            label: apiName,
            category: 'raml',
            icon: "FileCode2",
            workspace_id: selectedWorkspaceId,
            content: {
              apiName,
              apiVersion,
              baseUri,
              description,
              endpoints,
              raml: data.raml,
              documentation: showDocumentation ? documentation : undefined
            }
          });
        }
      } else {
        toast.error("Failed to generate RAML");
      }
    } catch (error) {
      console.error("Error in handleGenerate:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveTask = async () => {
    if (!taskName.trim()) {
      toast.error("Task name is required");
      return;
    }
    
    if (!selectedWorkspaceId || !user) {
      toast.error("Workspace or user information is missing");
      return;
    }
    
    try {
      if (!ramlOutput) {
        toast.error("Generate RAML first before saving");
        return;
      }
      
      const task = {
        workspace_id: selectedWorkspaceId,
        task_id: taskId,
        task_name: taskName,
        user_id: user.id,
        description: description,
        raml_content: ramlOutput,
        api_name: apiName,
        api_version: apiVersion,
        base_uri: baseUri,
        endpoints: endpoints,
        documentation: showDocumentation ? documentation : ''
      };
      
      const result = await saveRamlTask(task);
      
      setSaveDialogOpen(false);
      toast.success("RAML task saved successfully!");
      
      if (onSaveTask) {
        onSaveTask(taskId);
      }
    } catch (error) {
      console.error("Error saving RAML task:", error);
      toast.error("Failed to save RAML task");
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(ramlOutput);
    toast.success("RAML copied to clipboard!");
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack || (() => navigate('/dashboard'))}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">RAML API Specification Generator</h1>
          <p className="text-muted-foreground">Generate RAML specifications for your APIs</p>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        <motion.div 
          className="mb-6 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5 }}
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="editor" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center">
              <FileCode className="h-4 w-4 mr-2" />
              Generated RAML
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="apiName" className="font-medium">API Name<span className="text-red-500">*</span></Label>
                <Input 
                  id="apiName"
                  placeholder="e.g. Sample API"
                  value={apiName}
                  onChange={(e) => setApiName(e.target.value)}
                  className="mb-2"
                />
              </div>
              
              <div>
                <Label htmlFor="apiVersion" className="font-medium">API Version</Label>
                <Input 
                  id="apiVersion"
                  placeholder="e.g. v1"
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  className="mb-2"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="baseUri" className="font-medium">Base URI</Label>
              <Input 
                id="baseUri"
                placeholder="e.g. https://api.example.com/{version}"
                value={baseUri}
                onChange={(e) => setBaseUri(e.target.value)}
                className="mb-2"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="font-medium">Description</Label>
              <Textarea 
                id="description"
                placeholder="Describe your API..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mb-4"
              />
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="documentation"
                checked={showDocumentation}
                onCheckedChange={setShowDocumentation}
              />
              <Label htmlFor="documentation">Include Additional Documentation</Label>
            </div>
            
            {showDocumentation && (
              <div className="mb-4">
                <Label htmlFor="documentation-content" className="font-medium">Documentation</Label>
                <Textarea
                  id="documentation-content"
                  placeholder="Add detailed documentation here..."
                  value={documentation}
                  onChange={(e) => setDocumentation(e.target.value)}
                  rows={5}
                  className="mb-4"
                />
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Endpoints</h3>
                <Button variant="outline" size="sm" onClick={addEndpoint}>
                  Add Endpoint
                </Button>
              </div>
              
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <Card key={endpoint.id} className="border-gray-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md">Endpoint {index + 1}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeEndpoint(endpoint.id)}
                          className="text-red-500 h-8 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-medium">Path<span className="text-red-500">*</span></Label>
                          <Input 
                            placeholder="e.g. users"
                            value={endpoint.path}
                            onChange={(e) => updateEndpoint(endpoint.id, { path: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="font-medium">Description</Label>
                          <Input 
                            placeholder="Description for this endpoint"
                            value={endpoint.description}
                            onChange={(e) => updateEndpoint(endpoint.id, { description: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <Collapsible className="w-full">
                        <div className="flex justify-between items-center py-2">
                          <h4 className="text-sm font-medium">Methods ({endpoint.methods.length})</h4>
                          <div className="flex">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addMethod(endpoint.id)}
                              className="mr-2"
                            >
                              Add Method
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-9 p-0">
                                <Terminal className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        <CollapsibleContent className="space-y-3">
                          {endpoint.methods.map((method, methodIndex) => (
                            <Card key={method.id} className="border-gray-100">
                              <CardHeader className="py-2 px-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <select
                                      value={method.type}
                                      onChange={(e) => updateMethod(endpoint.id, method.id, { type: e.target.value as any })}
                                      className="mr-2 text-xs font-medium py-1 px-2 rounded bg-gray-100 border-gray-200"
                                    >
                                      <option value="get">GET</option>
                                      <option value="post">POST</option>
                                      <option value="put">PUT</option>
                                      <option value="delete">DELETE</option>
                                    </select>
                                    <span className="text-sm font-medium">/{endpoint.path}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeMethod(endpoint.id, method.id)}
                                    className="text-red-500 h-6 px-2 text-xs"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="py-2 px-3">
                                <div className="mb-3">
                                  <Label className="text-xs font-medium">Description</Label>
                                  <Input 
                                    size="sm"
                                    placeholder="Method description"
                                    value={method.description}
                                    onChange={(e) => updateMethod(endpoint.id, method.id, { description: e.target.value })}
                                    className="text-sm"
                                  />
                                </div>
                                
                                <Collapsible className="w-full">
                                  <div className="flex justify-between items-center py-1">
                                    <h5 className="text-xs font-medium">Query Parameters ({method.queryParams.length})</h5>
                                    <div className="flex">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => addQueryParam(endpoint.id, method.id)}
                                        className="mr-1 h-6 text-xs"
                                      >
                                        Add Param
                                      </Button>
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                                          <Terminal className="h-3 w-3" />
                                        </Button>
                                      </CollapsibleTrigger>
                                    </div>
                                  </div>
                                  
                                  <CollapsibleContent className="space-y-2 mt-2">
                                    {method.queryParams.length > 0 ? (
                                      method.queryParams.map((param) => (
                                        <div key={param.id} className="grid grid-cols-4 gap-2 items-center">
                                          <Input 
                                            placeholder="Name"
                                            value={param.name}
                                            onChange={(e) => updateQueryParam(endpoint.id, method.id, param.id, { name: e.target.value })}
                                            className="text-xs col-span-1"
                                          />
                                          <select
                                            value={param.type}
                                            onChange={(e) => updateQueryParam(endpoint.id, method.id, param.id, { type: e.target.value })}
                                            className="text-xs py-1 px-2 rounded bg-white border border-gray-200 col-span-1"
                                          >
                                            <option value="string">string</option>
                                            <option value="number">number</option>
                                            <option value="boolean">boolean</option>
                                            <option value="date">date</option>
                                          </select>
                                          <div className="flex items-center col-span-1">
                                            <input
                                              type="checkbox"
                                              id={`required-${param.id}`}
                                              checked={param.required}
                                              onChange={(e) => updateQueryParam(endpoint.id, method.id, param.id, { required: e.target.checked })}
                                              className="mr-1"
                                            />
                                            <label htmlFor={`required-${param.id}`} className="text-xs">Required</label>
                                          </div>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => removeQueryParam(endpoint.id, method.id, param.id)}
                                            className="text-red-500 h-6 col-span-1"
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">No query parameters defined</div>
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                                
                                <Collapsible className="w-full mt-3">
                                  <div className="flex justify-between items-center py-1">
                                    <h5 className="text-xs font-medium">Responses ({method.responses.length})</h5>
                                    <div className="flex">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => addResponse(endpoint.id, method.id)}
                                        className="mr-1 h-6 text-xs"
                                      >
                                        Add Response
                                      </Button>
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                                          <Terminal className="h-3 w-3" />
                                        </Button>
                                      </CollapsibleTrigger>
                                    </div>
                                  </div>
                                  
                                  <CollapsibleContent className="space-y-2 mt-2">
                                    {method.responses.length > 0 ? (
                                      method.responses.map((response) => (
                                        <div key={response.id} className="grid grid-cols-7 gap-2 items-center">
                                          <Input 
                                            placeholder="Code"
                                            value={response.code}
                                            onChange={(e) => updateResponse(endpoint.id, method.id, response.id, { code: e.target.value })}
                                            className="text-xs col-span-1"
                                          />
                                          <Input 
                                            placeholder="Description"
                                            value={response.description}
                                            onChange={(e) => updateResponse(endpoint.id, method.id, response.id, { description: e.target.value })}
                                            className="text-xs col-span-5"
                                          />
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => removeResponse(endpoint.id, method.id, response.id)}
                                            className="text-red-500 h-6 col-span-1"
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-gray-500 italic">No responses defined</div>
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                              </CardContent>
                            </Card>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate RAML</>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="space-y-6 flex-1">
            {ramlOutput ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{apiName} API Specification</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={copyToClipboard}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button onClick={() => setSaveDialogOpen(true)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md h-[calc(100vh-300px)]">
                  <MonacoEditor
                    language="yaml"
                    value={ramlOutput}
                    readOnly={true}
                    height="100%"
                    options={{
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setActiveTab('editor')}>
                    Back to Editor
                  </Button>
                  <Button onClick={() => setSaveDialogOpen(true)}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                    window.open('https://editor.mulesoft.com', '_blank');
                  }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in MuleSoft Anypoint
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No RAML specification generated yet. Go to Editor tab and click Generate.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('editor')}
                  className="mt-4"
                >
                  Go to Editor
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save RAML Specification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder={apiName ? `${apiName} API Specification` : "RAML Specification"}
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
              <Save className="mr-2 h-4 w-4" />
              Save RAML
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RAMLGenerator;
