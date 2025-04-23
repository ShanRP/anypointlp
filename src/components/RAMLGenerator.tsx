import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Trash, Edit, Save, CheckCircle, Copy, Globe, Lock, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useUserCredits } from '@/hooks/useUserCredits';

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
  onBack: () => void;
  selectedWorkspaceId?: string;
  onSaveTask?: (taskId: string) => void;
  onTaskCreated?: (task: any) => void;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({
  onBack,
  selectedWorkspaceId = 'default',
  onSaveTask,
  onTaskCreated
}) => {
  const navigate = useNavigate();
  const { selectedWorkspace } = useWorkspaces();
  const workspaceId = selectedWorkspaceId || selectedWorkspace?.id || '';
  const { user } = useAuth();
  const { saveRamlTask } = useWorkspaceTasks(workspaceId);
  const { useCredit } = useUserCredits();

  const [apiName, setApiName] = useState('');
  const [apiVersion, setApiVersion] = useState('v1');
  const [baseUri, setBaseUri] = useState('https://api.example.com/v1');
  const [apiDescription, setApiDescription] = useState('');
  const [mediaTypes, setMediaTypes] = useState(['application/json']);
  const [protocols, setProtocols] = useState(['HTTPS']);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [types, setTypes] = useState<DataType[]>([]);
  const [generatedRAML, setGeneratedRAML] = useState('');
  const [currentTab, setCurrentTab] = useState('basic');
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
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState<DataType | null>(null);


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

  const handleGenerateRAML = async () => {
    if (!apiName.trim()) {
      toast.error('Please provide API specifications');
      return;
    }

    const canUseCredit = await useCredit();
    if (!canUseCredit) {
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
        const tabsList = document.querySelector('[role="tablist"]');
        const previewTab = tabsList?.querySelector('[data-state="inactive"][value="preview"]');
        if (previewTab instanceof HTMLElement) {
          previewTab.click();
        } else {
          setCurrentTab('preview');
        }
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
        .select('id, title, description, content, type')
        .eq('type', 'raml')
        .limit(20);

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

  const handleAddType = () => {
    setEditingType({ name: '', baseType: 'object', properties: [] });
    setShowTypeDialog(true);
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center mb-6">
        {onBack && (
          <Button variant="outline" size="icon" className="mr-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">RAML API Specification Generator</h1>
      </div>

      <Tabs defaultValue="basic" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="types">Data Types</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>API Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Name*</label>
                  <Input
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="Enter API name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Version</label>
                  <Input
                    value={apiVersion}
                    onChange={(e) => setApiVersion(e.target.value)}
                    placeholder="v1"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Base URI</label>
                <Input
                  value={baseUri}
                  onChange={(e) => setBaseUri(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={apiDescription}
                  onChange={(e) => setApiDescription(e.target.value)}
                  placeholder="Describe your API"
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Protocols</label>
                  <Select
                    value={protocols[0]}
                    onValueChange={(value) => setProtocols([value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HTTP">HTTP</SelectItem>
                      <SelectItem value="HTTPS">HTTPS</SelectItem>
                      <SelectItem value="FTP">FTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Media Types</label>
                  <Select
                    value={mediaTypes[0]}
                    onValueChange={(value) => setMediaTypes([value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application/json">application/json</SelectItem>
                      <SelectItem value="application/xml">application/xml</SelectItem>
                      <SelectItem value="text/plain">text/plain</SelectItem>
                      <SelectItem value="multipart/form-data">multipart/form-data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Data Types</CardTitle>
              <Button onClick={handleAddType}>
                <Plus className="h-4 w-4 mr-2" /> Add Type
              </Button>
            </CardHeader>
            <CardContent>
              {/* Data types content */}
              <ul>
                {types.map((type, index) => (
                  <li key={index} className="flex justify-between items-center mb-2">
                    <span>{type.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => {
                      // Add handler to delete data type
                    }}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>API Endpoints</CardTitle>
              <Button onClick={handleAddEndpoint}>
                <Plus className="h-4 w-4 mr-2" /> Add Endpoint
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardHeader className="bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-blue-600">/{endpoint.path}</span>
                          <span className="text-sm text-gray-500">{endpoint.description}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditEndpoint(index)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteEndpoint(index)}>
                            <Trash className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Methods</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMethod(index)}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Method
                          </Button>
                        </div>
                        {endpoint.methods.map((method, methodIndex) => (
                          <div key={methodIndex} className="border rounded-md p-4 bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <span className={`uppercase font-mono ${
                                  method.type === 'get' ? 'text-green-600' :
                                    method.type === 'post' ? 'text-blue-600' :
                                    method.type === 'put' ? 'text-orange-600' :
                                    method.type === 'delete' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {method.type}
                                </span>
                                <span className="text-sm text-gray-600">{method.description}</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMethod(index, methodIndex)}
                                >
                                  <Edit className="h-3 w-3 mr-1" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMethod(index, methodIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash className="h-3 w-3 mr-1" /> Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generated RAML</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button onClick={() => setShowPublishDialog(true)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Publish
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden bg-gray-50">
                <MonacoEditor
                  value={generatedRAML}
                  language="yaml"
                  height="500px"
                  options={{ readOnly: true, minimap: { enabled: true } }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6 space-x-4">
        <Button variant="outline" onClick={() => setCurrentTab('preview')} disabled={!generatedRAML}>
          View Generated RAML
        </Button>
        <Button
          onClick={handleGenerateRAML}
          disabled={isGenerating || !apiName.trim()}
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            'Generate RAML'
          )}
        </Button>
      </div>

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
                  onChange={(e) => setEditingEndpoint(prev => prev ? ({ ...prev, path: e.target.value }) : null)}
                  placeholder="resource/{id}"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editingEndpoint?.description || ''}
                  onChange={(e) => setEditingEndpoint(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
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
                    onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                    className="w-32"
                  />
                  <Select
                    value={newParam.type}
                    onValueChange={(value) => setNewParam({ ...newParam, type: value })}
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
                  onValueChange={(value) => setEditingMethod(prev => prev ? ({ ...prev, type: value }) : null)}
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
                  onChange={(e) => setEditingMethod(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
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
                  onChange={(e) => setEditingMethod(prev => prev ? ({ ...prev, requestBody: e.target.checked }) : null)}
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
                      onChange={(e) => setEditingMethod(prev => prev ? ({ ...prev, requestType: e.target.value }) : null)}                    placeholder="application/json"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Example (optional)</label>
                    <Textarea
                      value={editingMethod?.requestExample || ''}
                      onChange={(e) => setEditingMethod(prev => prev ? ({ ...prev, requestExample: e.target.value }) : null)}
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
                    onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                    className="w-32"
                  />
                  <Select
                    value={newParam.type}
                    onValueChange={(value) => setNewParam({ ...newParam, type: value })}
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
                    onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                    className="w-32"
                  />
                  <Select
                    value={newParam.type}
                    onValueChange={(value) => setNewParam({ ...newParam, type: value })}
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
                onChange={(e) => setNewResponse({ ...newResponse, code: e.target.value })}
                placeholder="200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description*</label>
              <Input
                value={newResponse.description}
                onChange={(e) => setNewResponse({ ...newResponse, description: e.target.value })}
                placeholder="Success response"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Body Type (optional)</label>
              <Input
                value={newResponse.bodyType || ''}
                onChange={(e) => setNewResponse({ ...newResponse, bodyType: e.target.value })}
                placeholder="application/json"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Example (optional)</label>
              <Textarea
                value={newResponse.example || ''}
                onChange={(e) => setNewResponse({ ...newResponse, example: e.target.value })}
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

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingType?.name ? 'Edit Type' : 'Add New Type'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type Name*</label>
                <Input
                  value={editingType?.name || ''}
                  onChange={(e) => setEditingType(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  placeholder="UserType"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Type</label>
                <Select
                  value={editingType?.baseType || 'object'}
                  onValueChange={(value) => setEditingType(prev => prev ? ({ ...prev, baseType: value }) : null)}
                >
                  <SelectTrigger>
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Properties</label>
                <div className="flex space-x-2 items-center">
                  <Input
                    placeholder="Property name"
                    value={newParam.name}
                    onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                    className="w-32"
                  />
                  <Select
                    value={newParam.type}
                    onValueChange={(value) => setNewParam({ ...newParam, type: value })}
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
                    onClick={() => {
                      if (!editingType) return;
                      if (!newParam.name.trim()) {
                        toast.error('Property name is required');
                        return;
                      }
                      const updatedType = { ...editingType };
                      updatedType.properties = [...(updatedType.properties || []), { ...newParam }];
                      setEditingType(updatedType);
                      setNewParam({ name: '', type: 'string', required: true, description: '' });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {editingType?.properties && editingType.properties.length > 0 ? (
                <div className="space-y-2 border rounded-md p-2">
                  {editingType.properties.map((prop, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{prop.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({prop.type})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedProperties = [...editingType.properties];
                          updatedProperties.splice(index, 1);
                          setEditingType({ ...editingType, properties: updatedProperties });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No properties defined</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!editingType?.name.trim()) {
                toast.error('Type name is required');
                return;
              }
              const updatedTypes = [...types];
              const existingIndex = types.findIndex(t => t.name === editingType.name);
              if (existingIndex >= 0) {
                updatedTypes[existingIndex] = editingType;
              } else {
                updatedTypes.push(editingType);
              }
              setTypes(updatedTypes);
              setShowTypeDialog(false);
              setEditingType(null);
              toast.success(existingIndex >= 0 ? 'Type updated' : 'Type added');
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RAMLGenerator;