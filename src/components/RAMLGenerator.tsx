import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, FileCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { MonacoEditor } from '@/components/MonacoEditor';
import { supabase } from '@/integrations/supabase/client';
import { useProfileStore } from '@/providers/ProfileProvider';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';

// Define the props interface with the correct properties
export interface RAMLGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId?: string;
}

interface TypeProperty {
  name: string;
  type: string;
}

interface ApiType {
  name: string;
  baseType: string;
  properties: TypeProperty[];
  example: string;
}

interface ApiMethod {
  type: 'get' | 'post' | 'put' | 'delete' | 'patch';
  description: string;
  requestType?: string;
  requestBody?: string;
  requestExample?: string;
  responses: Array<{
    code: string;
    description: string;
    bodyType?: string;
    body?: string;
    example?: string;
  }>;
}

interface ApiEndpoint {
  path: string;
  description: string;
  methods: ApiMethod[];
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({ onBack, selectedWorkspaceId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { workspaces, selectedWorkspace } = useWorkspaces();
  
  // Use selectedWorkspaceId from props, fallback to selectedWorkspace.id from hook
  const effectiveWorkspaceId = selectedWorkspaceId || selectedWorkspace?.id || "";
  
  const [activeTab, setActiveTab] = useState<'types' | 'endpoints' | 'raml'>('types');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ramlOutput, setRamlOutput] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // API Spec fields
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('v1');
  const [baseUri, setBaseUri] = useState('https://api.example.com/v1');
  const [apiDescription, setApiDescription] = useState('');
  const [mediaTypes, setMediaTypes] = useState(['application/json']);
  const [protocols, setProtocols] = useState(['HTTPS']);

  // Types and endpoints
  const [types, setTypes] = useState<ApiType[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);

  // Current type and endpoint being edited
  const [currentType, setCurrentType] = useState<ApiType>({
    name: '',
    baseType: 'object',
    properties: [],
    example: ''
  });
  
  const [currentEndpoint, setCurrentEndpoint] = useState<ApiEndpoint>({
    path: '',
    description: '',
    methods: []
  });

  const [currentMethod, setCurrentMethod] = useState<ApiMethod>({
    type: 'get',
    description: '',
    responses: [{
      code: '200',
      description: 'Success',
      example: ''
    }]
  });

  // Current property being edited
  const [currentProperty, setCurrentProperty] = useState<TypeProperty>({
    name: '',
    type: 'string'
  });

  // Handle adding a new type
  const handleAddType = () => {
    if (!currentType.name.trim()) {
      toast({
        title: "Error",
        description: "Type name is required",
        variant: "destructive"
      });
      return;
    }
    
    // Check if type already exists
    if (types.some(t => t.name === currentType.name)) {
      toast({
        title: "Error",
        description: `Type '${currentType.name}' already exists`,
        variant: "destructive"
      });
      return;
    }
    
    setTypes([...types, {...currentType}]);
    setCurrentType({
      name: '',
      baseType: 'object',
      properties: [],
      example: ''
    });
    
    toast({
      title: "Success",
      description: `Type '${currentType.name}' added successfully`
    });
  };

  // Handle adding a property to the current type
  const handleAddProperty = () => {
    if (!currentProperty.name.trim()) {
      toast({
        title: "Error",
        description: "Property name is required",
        variant: "destructive"
      });
      return;
    }
    
    // Check if property already exists
    if (currentType.properties.some(p => p.name === currentProperty.name)) {
      toast({
        title: "Error",
        description: `Property '${currentProperty.name}' already exists`,
        variant: "destructive"
      });
      return;
    }
    
    setCurrentType({
      ...currentType,
      properties: [...currentType.properties, {...currentProperty}]
    });
    
    setCurrentProperty({
      name: '',
      type: 'string'
    });
  };

  // Handle removing a property
  const handleRemoveProperty = (propertyName: string) => {
    setCurrentType({
      ...currentType,
      properties: currentType.properties.filter(p => p.name !== propertyName)
    });
  };

  // Handle removing a type
  const handleRemoveType = (typeName: string) => {
    setTypes(types.filter(t => t.name !== typeName));
    toast({
      title: "Success",
      description: `Type '${typeName}' removed`
    });
  };

  // Handle adding a new endpoint
  const handleAddEndpoint = () => {
    if (!currentEndpoint.path.trim()) {
      toast({
        title: "Error",
        description: "Endpoint path is required",
        variant: "destructive"
      });
      return;
    }
    
    // Check if endpoint already exists
    if (endpoints.some(e => e.path === currentEndpoint.path)) {
      toast({
        title: "Error",
        description: `Endpoint '${currentEndpoint.path}' already exists`,
        variant: "destructive"
      });
      return;
    }
    
    setEndpoints([...endpoints, {...currentEndpoint}]);
    setCurrentEndpoint({
      path: '',
      description: '',
      methods: []
    });
    
    toast({
      title: "Success",
      description: `Endpoint '${currentEndpoint.path}' added successfully`
    });
  };

  // Handle removing an endpoint
  const handleRemoveEndpoint = (path: string) => {
    setEndpoints(endpoints.filter(e => e.path !== path));
    toast({
      title: "Success",
      description: `Endpoint '${path}' removed`
    });
  };

  // Handle adding a method to the current endpoint
  const handleAddMethod = () => {
    if (currentEndpoint.methods.some(m => m.type === currentMethod.type)) {
      toast({
        title: "Error",
        description: `Method '${currentMethod.type.toUpperCase()}' already exists for this endpoint`,
        variant: "destructive"
      });
      return;
    }
    
    setCurrentEndpoint({
      ...currentEndpoint,
      methods: [...currentEndpoint.methods, {...currentMethod}]
    });
    
    setCurrentMethod({
      type: 'get',
      description: '',
      responses: [{
        code: '200',
        description: 'Success',
        example: ''
      }]
    });
  };

  // Handle removing a method
  const handleRemoveMethod = (methodType: 'get' | 'post' | 'put' | 'delete' | 'patch') => {
    setCurrentEndpoint({
      ...currentEndpoint,
      methods: currentEndpoint.methods.filter(m => m.type !== methodType)
    });
  };

  // Save RAML generation to workspace
  const saveToWorkspace = async () => {
    if (!effectiveWorkspaceId) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('apl_tasks')
        .insert([
          {
            workspace_id: effectiveWorkspaceId,
            category: 'raml',
            title: apiName,
            content: ramlOutput,
            metadata: JSON.stringify({
              apiName,
              apiVersion,
              baseUri,
              apiDescription,
              mediaTypes,
              protocols,
              types,
              endpoints
            })
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "RAML specification saved to workspace"
      });
    } catch (error: any) {
      console.error('Error saving to workspace:', error);
      toast({
        title: "Error",
        description: `Failed to save to workspace: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Generate RAML from the defined types and endpoints
  const generateRAML = async () => {
    if (!apiName) {
      toast({
        title: "Error",
        description: "API name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Log data being sent for debugging
      console.log('Sending to APL_generate-raml:', {
        apiName,
        apiVersion,
        baseUri,
        apiDescription,
        types,
        endpoints,
        mediaTypes,
        protocols,
        workspaceId: effectiveWorkspaceId
      });
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/APL_generate-raml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          apiName,
          apiVersion,
          baseUri,
          apiDescription,
          types,
          endpoints,
          mediaTypes,
          protocols,
          workspaceId: effectiveWorkspaceId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from APL_generate-raml:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      // Parse the response JSON
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setRamlOutput(data.raml);
      setActiveTab('raml');
      
      toast({
        title: "Success",
        description: "RAML specification generated successfully"
      });
    } catch (error: any) {
      console.error('Error generating RAML:', error);
      let errorMessage = "Failed to generate RAML specification";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setGenerationError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy RAML output to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(ramlOutput);
    toast({
      title: "Copied",
      description: "RAML specification copied to clipboard"
    });
  };

  // Render the types tab content
  const renderTypesTab = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Type editor */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Define a New Type</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="typeName">Type Name</Label>
                  <Input
                    id="typeName"
                    value={currentType.name}
                    onChange={(e) => setCurrentType({...currentType, name: e.target.value})}
                    placeholder="User"
                  />
                </div>
                <div>
                  <Label htmlFor="baseType">Base Type</Label>
                  <Select 
                    value={currentType.baseType} 
                    onValueChange={(value) => setCurrentType({...currentType, baseType: value})}
                  >
                    <SelectTrigger id="baseType">
                      <SelectValue placeholder="Select base type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="object">object</SelectItem>
                      <SelectItem value="array">array</SelectItem>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-md font-medium">Properties</h4>
                
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <Input
                      value={currentProperty.name}
                      onChange={(e) => setCurrentProperty({...currentProperty, name: e.target.value})}
                      placeholder="Property name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Select 
                      value={currentProperty.type} 
                      onValueChange={(value) => setCurrentProperty({...currentProperty, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">string</SelectItem>
                        <SelectItem value="number">number</SelectItem>
                        <SelectItem value="boolean">boolean</SelectItem>
                        <SelectItem value="date">date</SelectItem>
                        <SelectItem value="array">array</SelectItem>
                        <SelectItem value="object">object</SelectItem>
                        {types.map(type => (
                          <SelectItem key={type.name} value={type.name}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button onClick={handleAddProperty} className="w-full" variant="outline">Add</Button>
                  </div>
                </div>
                
                {currentType.properties.length > 0 && (
                  <div className="border rounded p-2 space-y-2">
                    {currentType.properties.map((prop, index) => (
                      <div key={index} className="flex justify-between items-center py-1 px-2 border-b last:border-0">
                        <div>
                          <span className="font-medium">{prop.name}</span>
                          <span className="text-gray-500 ml-2 text-sm">({prop.type})</span>
                        </div>
                        <Button 
                          onClick={() => handleRemoveProperty(prop.name)} 
                          variant="ghost" 
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="example">Example (JSON)</Label>
                <MonacoEditor
                  height="150px"
                  defaultLanguage="json"
                  value={currentType.example}
                  onChange={(value) => setCurrentType({...currentType, example: value || ''})}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
              
              <Button onClick={handleAddType} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Type
              </Button>
            </div>
          </div>
          
          {/* Right column: Type list */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Defined Types</h3>
            
            {types.length === 0 ? (
              <div className="text-center p-6 border rounded-md border-dashed">
                <p className="text-gray-500">No types defined yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {types.map((type, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{type.name}</h4>
                        <p className="text-sm text-gray-500">Base: {type.baseType}</p>
                      </div>
                      <Button 
                        onClick={() => handleRemoveType(type.name)} 
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    {type.properties.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Properties:</h5>
                        <div className="mt-1 text-sm">
                          {type.properties.map((prop, propIndex) => (
                            <div key={propIndex} className="flex justify-between py-1 border-b last:border-0">
                              <span>{prop.name}</span>
                              <span className="text-gray-500">{prop.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {type.example && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Example:</h5>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {type.example}
                        </pre>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the endpoints tab content
  const renderEndpointsTab = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Endpoint editor */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Define a New Endpoint</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="endpointPath">Endpoint Path</Label>
                <Input
                  id="endpointPath"
                  value={currentEndpoint.path}
                  onChange={(e) => setCurrentEndpoint({...currentEndpoint, path: e.target.value})}
                  placeholder="/users"
                />
              </div>
              
              <div>
                <Label htmlFor="endpointDescription">Description</Label>
                <Textarea
                  id="endpointDescription"
                  value={currentEndpoint.description}
                  onChange={(e) => setCurrentEndpoint({...currentEndpoint, description: e.target.value})}
                  placeholder="Get all users"
                  className="h-24"
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-md font-medium">Methods</h4>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Select 
                      value={currentMethod.type} 
                      onValueChange={(value) => setCurrentMethod({...currentMethod, type: value as 'get' | 'post' | 'put' | 'delete' | 'patch'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Method" />
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
                  <div className="col-span-3">
                    <Input
                      value={currentMethod.description}
                      onChange={(e) => setCurrentMethod({...currentMethod, description: e.target.value})}
                      placeholder="Method description"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Request Body</h5>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="requestType">Request Type</Label>
                      <Select 
                        value={currentMethod.requestType || ''} 
                        onValueChange={(value) => setCurrentMethod({...currentMethod, requestType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">string</SelectItem>
                          <SelectItem value="number">number</SelectItem>
                          <SelectItem value="boolean">boolean</SelectItem>
                          <SelectItem value="date">date</SelectItem>
                          <SelectItem value="array">array</SelectItem>
                          <SelectItem value="object">object</SelectItem>
                          {types.map(type => (
                            <SelectItem key={type.name} value={type.name}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="requestExample">Request Example</Label>
                      <MonacoEditor
                        height="100px"
                        defaultLanguage="json"
                        value={currentMethod.requestExample || ''}
                        onChange={(value) => setCurrentMethod({...currentMethod, requestExample: value || ''})}
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Responses</h5>
                  
                  {currentMethod.responses.map((response, index) => (
                    <div key={index} className="border rounded p-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`responseCode-${index}`}>Response Code</Label>
                          <Input
                            id={`responseCode-${index}`}
                            value={response.code}
                            onChange={(e) => {
                              const newResponses = [...currentMethod.responses];
                              newResponses[index] = {...response, code: e.target.value};
                              setCurrentMethod({...currentMethod, responses: newResponses});
                            }}
                            placeholder="200"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`responseDescription-${index}`}>Description</Label>
                          <Input
                            id={`responseDescription-${index}`}
                            value={response.description}
                            onChange={(e) => {
                              const newResponses = [...currentMethod.responses];
                              newResponses[index] = {...response, description: e.target.value};
                              setCurrentMethod({...currentMethod, responses: newResponses});
                            }}
                            placeholder="Success"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`responseType-${index}`}>Response Type</Label>
                          <Select 
                            value={response.bodyType || ''} 
                            onValueChange={(value) => {
                              const newResponses = [...currentMethod.responses];
                              newResponses[index] = {...response, bodyType: value};
                              setCurrentMethod({...currentMethod, responses: newResponses});
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select response type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">string</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="boolean">boolean</SelectItem>
                              <SelectItem value="date">date</SelectItem>
                              <SelectItem value="array">array</SelectItem>
                              <SelectItem value="object">object</SelectItem>
                              {types.map(type => (
                                <SelectItem key={type.name} value={type.name}>{type.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`responseExample-${index}`}>Response Example</Label>
                          <MonacoEditor
                            height="100px"
                            defaultLanguage="json"
                            value={response.example || ''}
                            onChange={(value) => {
                              const newResponses = [...currentMethod.responses];
                              newResponses[index] = {...response, example: value || ''};
                              setCurrentMethod({...currentMethod, responses: newResponses});
                            }}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button onClick={handleAddMethod} className="w-full" variant="outline">Add Method</Button>
              </div>
              
              <Button onClick={handleAddEndpoint} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Endpoint
              </Button>
            </div>
          </div>
          
          {/* Right column: Endpoint list */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Defined Endpoints</h3>
            
            {endpoints.length === 0 ? (
              <div className="text-center p-6 border rounded-md border-dashed">
                <p className="text-gray-500">No endpoints defined yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {endpoints.map((endpoint, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{endpoint.path}</h4>
                        <p className="text-sm text-gray-500">{endpoint.description}</p>
                      </div>
                      <Button 
                        onClick={() => handleRemoveEndpoint(endpoint.path)} 
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    {endpoint.methods.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Methods:</h5>
                        <div className="mt-1 text-sm">
                          {endpoint.methods.map((method, methodIndex) => (
                            <div key={methodIndex} className="flex justify-between py-1 border-b last:border-0">
                              <span>{method.type.toUpperCase()}</span>
                              <span className="text-gray-500">{method.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the RAML output tab content
  const renderRamlTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium">Generated RAML Specification</h3>
          <div className="space-x-2">
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              Copy to Clipboard
            </Button>
            <Button onClick={saveToWorkspace} variant="outline" size="sm">
              Save to Workspace
            </Button>
          </div>
        </div>
        
        {generationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h4 className="font-bold">Error generating RAML</h4>
            <p>{generationError}</p>
          </div>
        )}
        
        {ramlOutput ? (
          <MonacoEditor
            height="600px"
            defaultLanguage="yaml"
            value={ramlOutput}
            options={{
              readOnly: true,
              minimap: { enabled: true },
            }}
          />
        ) : (
          <div className="text-center p-12 border rounded-md border-dashed">
            <FileCode className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No RAML generated yet. Click "Generate RAML" to create your API specification.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">RAML Generator</h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiName">API Name</Label>
              <Input
                id="apiName"
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
                placeholder="My API"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apiVersion">API Version</Label>
                <Input
                  id="apiVersion"
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  placeholder="v1"
                />
              </div>
              <div>
                <Label htmlFor="baseUri">Base URI</Label>
                <Input
                  id="baseUri"
                  value={baseUri}
                  onChange={(e) => setBaseUri(e.target.value)}
                  placeholder="https://api.example.com/v1"
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="apiDescription">API Description</Label>
            <Textarea
              id="apiDescription"
              value={apiDescription}
              onChange={(e) => setApiDescription(e.target.value)}
              placeholder="Describe your API..."
              className="h-32"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={generateRAML} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-white rounded-full mr-2"></div>
                Generating...
              </>
            ) : (
              <>Generate RAML</>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'types' | 'endpoints' | 'raml')}>
        <TabsList className="mb-6">
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="raml">RAML</TabsTrigger>
        </TabsList>
        
        <TabsContent value="types">
          {renderTypesTab()}
        </TabsContent>
        
        <TabsContent value="endpoints">
          {renderEndpointsTab()}
        </TabsContent>
        
        <TabsContent value="raml">
          {renderRamlTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RAMLGenerator;
