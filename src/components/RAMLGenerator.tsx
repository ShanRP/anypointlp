
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Trash, Edit, Save, CheckCircle, Copy, Globe, Lock, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { supabase } from '@/integrations/supabase/client';
import MonacoEditor from '@/components/MonacoEditor';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

interface Response {
  code: string;
  description: string;
  bodyType?: string;
  example?: string;
}

interface Method {
  type: string;
  description?: string;
  requestBody?: boolean;
  requestType?: string;
  requestExample?: string;
  responses: Response[];
  queryParams?: Parameter[];
  uriParams?: Parameter[];
}

interface Endpoint {
  path: string;
  description?: string;
  methods: Method[];
  uriParams?: Parameter[];
}

interface DataType {
  name: string;
  baseType: string;
  properties: Parameter[];
  example?: string;
}

const DEFAULT_METHOD: Method = {
  type: 'get',
  description: '',
  responses: [{ code: '200', description: 'Success response' }]
};

interface RAMLGeneratorProps {
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onTaskCreated?: (task: any) => void;
  onSaveTask?: (taskId: string) => void;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({ 
  selectedWorkspaceId, 
  onBack,
  onTaskCreated,
  onSaveTask
}) => {
  const navigate = useNavigate();
  const { selectedWorkspace } = useWorkspaces();
  const workspaceId = selectedWorkspaceId || selectedWorkspace?.id || '';
  const { user } = useAuth();
  const { saveRamlTask } = useWorkspaceTasks(workspaceId);
  
  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('v1');
  const [baseUri, setBaseUri] = useState('https://api.example.com/v1');
  const [apiDescription, setApiDescription] = useState('');
  const [mediaTypes, setMediaTypes] = useState(['application/json']);
  const [protocols, setProtocols] = useState(['HTTPS']);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [types, setTypes] = useState<DataType[]>([]);
  const [generatedRAML, setGeneratedRAML] = useState('');
  const [currentTab, setCurrentTab] = useState('editor');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [showEndpointDialog, setShowEndpointDialog] = useState(false);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [currentEndpointIndex, setCurrentEndpointIndex] = useState<number | null>(null);
  const [currentMethodIndex, setCurrentMethodIndex] = useState<number | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [editingMethod, setEditingMethod] = useState<Method | null>(null);
  const [newParam, setNewParam] = useState({ name: '', type: 'string', required: true, description: '' });
  const [newResponse, setNewResponse] = useState<Response>({ code: '200', description: 'Success response' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddResponseDialog, setShowAddResponseDialog] = useState(false);

  useEffect(() => {
    if (endpoints.length === 0) {
      setEndpoints([{
        path: 'Endpoint1',
        description: '',
        methods: [{ ...DEFAULT_METHOD }]
      }]);
    }
  }, []);

  useEffect(() => {
    console.log('Current workspace ID in RAMLGenerator:', workspaceId);
  }, [workspaceId]);

  const handleAddEndpoint = () => {
    setEditingEndpoint({
      path: '',
      description: '',
      methods: [{ ...DEFAULT_METHOD }],
      uriParams: []
    });
    setShowEndpointDialog(true);
  };

  const handleEditEndpoint = (index: number) => {
    setCurrentEndpointIndex(index);
    setEditingEndpoint({ ...endpoints[index] });
    setShowEndpointDialog(true);
  };

  const handleSaveEndpoint = () => {
    if (!editingEndpoint) return;
    
    if (!editingEndpoint.path.trim()) {
      toast.error('Endpoint path is required');
      return;
    }

    const updatedEndpoints = [...endpoints];
    
    if (currentEndpointIndex !== null) {
      updatedEndpoints[currentEndpointIndex] = editingEndpoint;
    } else {
      updatedEndpoints.push(editingEndpoint);
    }
    
    setEndpoints(updatedEndpoints);
    setShowEndpointDialog(false);
    setEditingEndpoint(null);
    setCurrentEndpointIndex(null);
    toast.success(currentEndpointIndex !== null ? 'Endpoint updated' : 'Endpoint added');
  };

  const handleDeleteEndpoint = (index: number) => {
    const updatedEndpoints = [...endpoints];
    updatedEndpoints.splice(index, 1);
    setEndpoints(updatedEndpoints);
    toast.success('Endpoint deleted');
  };

  const handleAddMethod = (endpointIndex: number) => {
    setCurrentEndpointIndex(endpointIndex);
    setEditingMethod({ ...DEFAULT_METHOD });
    setShowMethodDialog(true);
  };

  const handleEditMethod = (endpointIndex: number, methodIndex: number) => {
    setCurrentEndpointIndex(endpointIndex);
    setCurrentMethodIndex(methodIndex);
    setEditingMethod({ ...endpoints[endpointIndex].methods[methodIndex] });
    setShowMethodDialog(true);
  };

  const handleSaveMethod = () => {
    if (!editingMethod || currentEndpointIndex === null) return;
    
    if (!editingMethod.type) {
      toast.error('Method type is required');
      return;
    }

    const updatedEndpoints = [...endpoints];
    
    if (currentMethodIndex !== null) {
      updatedEndpoints[currentEndpointIndex].methods[currentMethodIndex] = editingMethod;
    } else {
      updatedEndpoints[currentEndpointIndex].methods.push(editingMethod);
    }
    
    setEndpoints(updatedEndpoints);
    setShowMethodDialog(false);
    setEditingMethod(null);
    setCurrentMethodIndex(null);
    toast.success(currentMethodIndex !== null ? 'Method updated' : 'Method added');
  };

  const handleDeleteMethod = (endpointIndex: number, methodIndex: number) => {
    const updatedEndpoints = [...endpoints];
    if (updatedEndpoints[endpointIndex].methods.length > 1) {
      updatedEndpoints[endpointIndex].methods.splice(methodIndex, 1);
      setEndpoints(updatedEndpoints);
      toast.success('Method deleted');
    } else {
      toast.error('Cannot delete the only method. Endpoints must have at least one method.');
    }
  };

  const handleAddEndpointParam = () => {
    if (!editingEndpoint) return;
    
    if (!newParam.name.trim()) {
      toast.error('Parameter name is required');
      return;
    }

    const updatedEndpoint = { ...editingEndpoint };
    if (!updatedEndpoint.uriParams) {
      updatedEndpoint.uriParams = [];
    }
    
    updatedEndpoint.uriParams.push({ ...newParam });
    setEditingEndpoint(updatedEndpoint);
    setNewParam({ name: '', type: 'string', required: true, description: '' });
  };

  const handleDeleteEndpointParam = (index: number) => {
    if (!editingEndpoint || !editingEndpoint.uriParams) return;
    
    const updatedParams = [...editingEndpoint.uriParams];
    updatedParams.splice(index, 1);
    
    setEditingEndpoint({
      ...editingEndpoint,
      uriParams: updatedParams
    });
  };

  const handleAddMethodParam = (paramType: 'queryParams' | 'uriParams') => {
    if (!editingMethod) return;
    
    if (!newParam.name.trim()) {
      toast.error('Parameter name is required');
      return;
    }

    const updatedMethod = { ...editingMethod };
    if (!updatedMethod[paramType]) {
      updatedMethod[paramType] = [];
    }
    
    updatedMethod[paramType]?.push({ ...newParam });
    setEditingMethod(updatedMethod);
    setNewParam({ name: '', type: 'string', required: true, description: '' });
  };

  const handleDeleteMethodParam = (paramType: 'queryParams' | 'uriParams', index: number) => {
    if (!editingMethod || !editingMethod[paramType]) return;
    
    const updatedParams = [...(editingMethod[paramType] || [])];
    updatedParams.splice(index, 1);
    
    setEditingMethod({
      ...editingMethod,
      [paramType]: updatedParams
    });
  };

  const handleAddResponse = () => {
    if (!editingMethod) return;
    
    if (!newResponse.code.trim()) {
      toast.error('Response code is required');
      return;
    }

    const updatedMethod = { ...editingMethod };
    updatedMethod.responses.push({ ...newResponse });
    setEditingMethod(updatedMethod);
    setNewResponse({ code: '', description: '' });
    setShowAddResponseDialog(false);
  };

  const handleDeleteResponse = (index: number) => {
    if (!editingMethod) return;
    
    if (editingMethod.responses.length > 1) {
      const updatedResponses = [...editingMethod.responses];
      updatedResponses.splice(index, 1);
      
      setEditingMethod({
        ...editingMethod,
        responses: updatedResponses
      });
    } else {
      toast.error('Cannot delete the only response. Methods must have at least one response.');
    }
  };

  const handleAddMediaType = (type: string) => {
    if (!mediaTypes.includes(type)) {
      setMediaTypes([...mediaTypes, type]);
    }
  };

  const handleRemoveMediaType = (index: number) => {
    const updatedTypes = [...mediaTypes];
    updatedTypes.splice(index, 1);
    setMediaTypes(updatedTypes);
  };

  const handleAddProtocol = (protocol: string) => {
    if (!protocols.includes(protocol)) {
      setProtocols([...protocols, protocol]);
    }
  };

  const handleRemoveProtocol = (index: number) => {
    const updatedProtocols = [...protocols];
    updatedProtocols.splice(index, 1);
    setProtocols(updatedProtocols);
  };

  const generateRAML = async () => {
    if (!apiName.trim()) {
      toast.error('API name is required');
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('APL_generate-raml', {
        body: {
          apiName,
          apiVersion,
          baseUri,
          apiDescription,
          types,
          endpoints,
          mediaTypes,
          protocols
        },
      });

      if (error) {
        throw error;
      }

      if (data && data.raml) {
        setGeneratedRAML(data.raml);
        setCurrentTab('preview');
        toast.success('RAML specification generated successfully');
        
        if (user) {
          try {
            const taskId = `R-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
            
            const taskData = {
              task_id: taskId,
              task_name: apiName,
              user_id: user.id,
              workspace_id: workspaceId,
              description: apiDescription,
              raml_content: data.raml,
              api_name: apiName,
              api_version: apiVersion,
              base_uri: baseUri,
              endpoints: endpoints as any,
              category: 'raml'
            };
            
            const savedTask = await saveRamlTask(taskData);
            
            if (savedTask && onTaskCreated) {
              onTaskCreated({
                id: taskId,
                label: apiName,
                category: 'raml',
                icon: <Code className="h-4 w-4" />,
                workspace_id: workspaceId
              });
            }
            
            if (onSaveTask && savedTask) {
              onSaveTask(savedTask[0].id);
            }
            
            setPublishTitle(apiName);
            setPublishDescription(apiDescription);
            
            toast.success('RAML task saved to workspace');
          } catch (err) {
            console.error('Error saving RAML task:', err);
            toast.error('Failed to save RAML task to workspace');
          }
        }
      } else {
        throw new Error('Failed to generate RAML');
      }
    } catch (error) {
      console.error('Error generating RAML:', error);
      toast.error('Failed to generate RAML specification');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishToExchange = async () => {
    if (!publishTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!generatedRAML) {
      toast.error('Generate RAML before publishing');
      return;
    }

    setIsPublishing(true);

    try {
      console.log('Publishing with workspace ID:', workspaceId);
      
      const { data, error } = await supabase
        .from('apl_exchange_items')
        .insert({
          title: publishTitle,
          description: publishDescription,
          type: 'raml',
          content: { raml: generatedRAML },
          user_id: (await supabase.auth.getUser()).data.user?.id,
          username: (await supabase.auth.getUser()).data.user?.email?.split('@')[0] || 'Anonymous',
          visibility: visibility,
          workspace_id: visibility === 'private' ? workspaceId : null
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        toast.success('RAML specification published to Exchange');
        setShowPublishDialog(false);
        navigate(`/dashboard/exchange/item/${data[0].id}`);
      }
    } catch (error) {
      console.error('Error publishing to Exchange:', error);
      toast.error('Failed to publish specification');
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedRAML);
    toast.success('RAML copied to clipboard');
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center mb-6">
        {onBack && (
          <Button variant="outline" size="icon" className="mr-2" onClick={() => onBack()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">RAML API Specification Generator</h1>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>API Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Name*</label>
                  <Input 
                    value={apiName} 
                    onChange={(e) => setApiName(e.target.value)} 
                    placeholder="My API"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Version</label>
                  <Input 
                    value={apiVersion} 
                    onChange={(e) => setApiVersion(e.target.value)} 
                    placeholder="v1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base URI</label>
                <Input 
                  value={baseUri} 
                  onChange={(e) => setBaseUri(e.target.value)} 
                  placeholder="https://api.example.com/v1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={apiDescription} 
                  onChange={(e) => setApiDescription(e.target.value)} 
                  placeholder="Describe your API"
                  rows={3}
                  className='resize-none'
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Media Types</label>
                  <div className="flex flex-wrap gap-2">
                    {mediaTypes.map((type, index) => (
                      <div key={index} className="flex items-center bg-blue-100 px-2 py-1 rounded-md">
                        <span className="text-sm">{type}</span>
                        <button 
                          onClick={() => handleRemoveMediaType(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAddMediaType('application/xml')}
                        className="h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Protocols</label>
                  <div className="flex flex-wrap gap-2">
                    {protocols.map((protocol, index) => (
                      <div key={index} className="flex items-center bg-blue-100 px-2 py-1 rounded-md">
                        <span className="text-sm">{protocol}</span>
                        <button 
                          onClick={() => handleRemoveProtocol(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAddProtocol('HTTP')}
                        className="h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Endpoints</CardTitle>
              <Button onClick={handleAddEndpoint} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Endpoint
              </Button>
            </CardHeader>
            <CardContent>
              {endpoints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No endpoints defined. Click "Create Endpoint" to add one.
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {endpoints.map((endpoint, endpointIndex) => (
                    <AccordionItem value={`endpoint-${endpointIndex}`} key={endpointIndex}>
                      <AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-md">
                        <div className="flex items-center">
                          <span className="font-mono text-blue-600 mr-2">/{endpoint.path}</span>
                          <span className="text-gray-600 text-sm">{endpoint.description}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-2">
                        <div className="space-y-4">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditEndpoint(endpointIndex)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit Endpoint
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteEndpoint(endpointIndex)}
                            >
                              <Trash className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>

                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">Methods</h4>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAddMethod(endpointIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Method
                              </Button>
                            </div>
                            
                            <div className="space-y-4">
                              {endpoint.methods.map((method, methodIndex) => (
                                <div 
                                  key={methodIndex}
                                  className="border rounded-md p-4 bg-gray-50"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center">
                                      <span className={`uppercase font-mono ${
                                        method.type === 'get' ? 'text-green-600' :
                                        method.type === 'post' ? 'text-blue-600' :
                                        method.type === 'put' ? 'text-orange-600' :
                                        method.type === 'delete' ? 'text-red-600' : 'text-gray-600'
                                      }`}>
                                        {method.type}
                                      </span>
                                      {method.description && (
                                        <span className="ml-2 text-sm text-gray-600">
                                          {method.description}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditMethod(endpointIndex, methodIndex)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" /> Edit
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteMethod(endpointIndex, methodIndex)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash className="h-3 w-3 mr-1" /> Delete
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {method.requestBody && (
                                    <div className="mt-2 text-sm">
                                      <div className="font-medium">Request Body:</div>
                                      {method.requestType && (
                                        <div className="text-gray-600">Type: {method.requestType}</div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {method.responses && method.responses.length > 0 && (
                                    <div className="mt-2 text-sm">
                                      <div className="font-medium">Responses:</div>
                                      <div className="space-y-1 mt-1">
                                        {method.responses.map((response, respIndex) => (
                                          <div key={respIndex} className="text-gray-600">
                                            {response.code}: {response.description}
                                            {response.bodyType && ` (${response.bodyType})`}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {method.queryParams && method.queryParams.length > 0 && (
                                    <div className="mt-2 text-sm">
                                      <div className="font-medium">Query Parameters:</div>
                                      <div className="space-y-1 mt-1">
                                        {method.queryParams.map((param, paramIndex) => (
                                          <div key={paramIndex} className="text-gray-600">
                                            {param.name} ({param.type}){param.required ? ' *' : ''}
                                            {param.description && `: ${param.description}`}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-4 pt-6">
              <Button 
                variant="secondary" 
                onClick={() => setCurrentTab('preview')}
                disabled={!generatedRAML}
              >
                View Generated RAML
              </Button>
              <Button 
                onClick={generateRAML}
                disabled={isGenerating || !apiName.trim()}
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : 'Generate RAML'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generated RAML</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentTab('editor')}
                >
                  Back to Editor
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setShowPublishDialog(true)}
                  disabled={!generatedRAML}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Publish to Exchange
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden bg-gray-50">
                {generatedRAML ? (
                  <MonacoEditor
                    value={generatedRAML}
                    language="yaml"
                    height="600px"
                    readOnly={true}
                    options={{
                      minimap: { enabled: true }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-60 text-gray-500">
                    No RAML generated yet. Go to Editor tab and click "Generate RAML".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEndpointDialog} onOpenChange={setShowEndpointDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentEndpointIndex !== null ? 'Edit Endpoint' : 'Create New Endpoint'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Path*</label>
                <Input 
                  value={editingEndpoint?.path || ''}
                  onChange={(e) => setEditingEndpoint(prev => prev ? ({...prev, path: e.target.value}) : null)}
                  placeholder="resource/{id}"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input 
                  value={editingEndpoint?.description || ''}
                  onChange={(e) => setEditingEndpoint(prev => prev ? ({...prev, description: e.target.value}) : null)}
                  placeholder="Description of this endpoint"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">URI Parameters</label>
                <div className="flex space-x-2 items-center">
                  <Input 
                    placeholder="Parameter name"
                    value={newParam.name}
                    onChange={(e) => setNewParam({...newParam, name: e.target.value})}
                    className="w-32"
                  />
                  <Select 
                    value={newParam.type}
                    onValueChange={(value) => setNewParam({...newParam, type: value})}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="integer">integer</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      <SelectItem value="date">date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddEndpointParam}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {editingEndpoint?.uriParams && editingEndpoint.uriParams.length > 0 ? (
                <div className="space-y-2 border rounded-md p-2">
                  {editingEndpoint.uriParams.map((param, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{param.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({param.type}{param.required ? ', required' : ''})</span>
                        {param.description && (
                          <span className="text-sm text-gray-500 ml-2">{param.description}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEndpointParam(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No URI parameters defined</div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndpointDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEndpoint}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentMethodIndex !== null ? 'Edit Method' : 'Add New Method'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Method Type*</label>
                <Select 
                  value={editingMethod?.type || ''}
                  onValueChange={(value) => setEditingMethod(prev => prev ? ({...prev, type: value}) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="get">GET</SelectItem>
                    <SelectItem value="post">POST</SelectItem>
                    <SelectItem value="put">PUT</SelectItem>
                    <SelectItem value="delete">DELETE</SelectItem>
                    <SelectItem value="patch">PATCH</SelectItem>
                    <SelectItem value="options">OPTIONS</SelectItem>
                    <SelectItem value="head">HEAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input 
                  value={editingMethod?.description || ''}
                  onChange={(e) => setEditingMethod(prev => prev ? ({...prev, description: e.target.value}) : null)}
                  placeholder="Description of this method"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="requestBody"
                  checked={editingMethod?.requestBody || false}
                  onChange={(e) => setEditingMethod(prev => prev ? ({...prev, requestBody: e.target.checked}) : null)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="requestBody" className="text-sm font-medium">Has Request Body</label>
              </div>
              
              {editingMethod?.requestBody && (
                <div className="ml-6 space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Content Type</label>
                    <Input 
                      value={editingMethod?.requestType || ''}
                      onChange={(e) => setEditingMethod(prev => prev ? ({...prev, requestType: e.target.value}) : null)}
                      placeholder="application/json"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Example (optional)</label>
                    <Textarea 
                      value={editingMethod?.requestExample || ''}
                      onChange={(e) => setEditingMethod(prev => prev ? ({...prev, requestExample: e.target.value}) : null)}
                      placeholder="Example request body"
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Responses</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddResponseDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Response
                </Button>
              </div>
              
              {editingMethod?.responses && editingMethod.responses.length > 0 ? (
                <div className="space-y-2">
                  {editingMethod.responses.map((response, index) => (
                    <div key={index} className="flex justify-between items-center border rounded-md p-2">
                      <div>
                        <span className="font-medium">{response.code}</span>
                        <span className="text-gray-600 ml-2">{response.description}</span>
                        {response.bodyType && (
                          <span className="text-gray-500 text-sm ml-2">({response.bodyType})</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResponse(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No responses defined</div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Query Parameters</label>
                <div className="flex space-x-2 items-center">
                  <Input 
                    placeholder="Parameter name"
                    value={newParam.name}
                    onChange={(e) => setNewParam({...newParam, name: e.target.value})}
                    className="w-32"
                  />
                  <Select 
                    value={newParam.type}
                    onValueChange={(value) => setNewParam({...newParam, type: value})}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="integer">integer</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      <SelectItem value="date">date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddMethodParam('queryParams')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {editingMethod?.queryParams && editingMethod.queryParams.length > 0 ? (
                <div className="space-y-2 border rounded-md p-2">
                  {editingMethod.queryParams.map((param, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{param.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({param.type}{param.required ? ', required' : ''})</span>
                        {param.description && (
                          <span className="text-sm text-gray-500 ml-2">{param.description}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMethodParam('queryParams', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No query parameters defined</div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">URI Parameters (specific to this method)</label>
                <div className="flex space-x-2 items-center">
                  <Input 
                    placeholder="Parameter name"
                    value={newParam.name}
                    onChange={(e) => setNewParam({...newParam, name: e.target.value})}
                    className="w-32"
                  />
                  <Select 
                    value={newParam.type}
                    onValueChange={(value) => setNewParam({...newParam, type: value})}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="integer">integer</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      <SelectItem value="date">date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddMethodParam('uriParams')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {editingMethod?.uriParams && editingMethod.uriParams.length > 0 ? (
                <div className="space-y-2 border rounded-md p-2">
                  {editingMethod.uriParams.map((param, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{param.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({param.type}{param.required ? ', required' : ''})</span>
                        {param.description && (
                          <span className="text-sm text-gray-500 ml-2">{param.description}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMethodParam('uriParams', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No method-specific URI parameters defined</div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMethodDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveMethod}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddResponseDialog} onOpenChange={setShowAddResponseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Response</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Code*</label>
              <Input 
                value={newResponse.code}
                onChange={(e) => setNewResponse({...newResponse, code: e.target.value})}
                placeholder="200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description*</label>
              <Input 
                value={newResponse.description}
                onChange={(e) => setNewResponse({...newResponse, description: e.target.value})}
                placeholder="Success response"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Body Type (optional)</label>
              <Input 
                value={newResponse.bodyType || ''}
                onChange={(e) => setNewResponse({...newResponse, bodyType: e.target.value})}
                placeholder="application/json"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Example (optional)</label>
              <Textarea 
                value={newResponse.example || ''}
                onChange={(e) => setNewResponse({...newResponse, example: e.target.value})}
                placeholder="Example response body"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddResponseDialog(false)}>Cancel</Button>
            <Button onClick={handleAddResponse}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish RAML to Exchange</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title*</label>
              <Input 
                value={publishTitle}
                onChange={(e) => setPublishTitle(e.target.value)}
                placeholder="My API Specification"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={publishDescription}
                onChange={(e) => setPublishDescription(e.target.value)}
                placeholder="Description of this RAML specification"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <RadioGroup value={visibility} onValueChange={setVisibility}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Public (visible to everyone)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Private (visible only to workspace members)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
            <Button 
              onClick={publishToExchange}
              disabled={isPublishing || !publishTitle.trim()}
            >
              {isPublishing ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                  Publishing...
                </>
              ) : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RAMLGenerator;
