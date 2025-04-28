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
  const { tasks, saveRAMLTask } = useWorkspaceTasks(workspaceId);
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

            const savedTask = await saveRAMLTask(taskData);

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

  // Rest of the component remains unchanged

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <Button onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="dataTypes">Data Types</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label htmlFor="apiName">API Name</Label>
                <Input
                  type="text"
                  id="apiName"
                  value={apiName}
                  onChange={e => setApiName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="apiVersion">API Version</Label>
                <Input
                  type="text"
                  id="apiVersion"
                  value={apiVersion}
                  onChange={e => setApiVersion(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="baseUri">Base URI</Label>
                <Input
                  type="text"
                  id="baseUri"
                  value={baseUri}
                  onChange={e => setBaseUri(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="apiDescription">API Description</Label>
                <Textarea
                  id="apiDescription"
                  value={apiDescription}
                  onChange={e => setApiDescription(e.target.value)}
                />
              </div>
              <div>
                <Label>Media Types</Label>
                <Select onValueChange={(value) => setMediaTypes([value])}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a media type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application/json">application/json</SelectItem>
                    <SelectItem value="application/xml">application/xml</SelectItem>
                    <SelectItem value="text/plain">text/plain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Protocols</Label>
                <RadioGroup defaultValue="HTTPS" className="flex">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HTTP" id="r1" onClick={() => setProtocols(['HTTP'])} />
                    <Label htmlFor="r1">HTTP</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HTTPS" id="r2" onClick={() => setProtocols(['HTTPS'])} />
                    <Label htmlFor="r2">HTTPS</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => {
                setEditingEndpoint(null);
                setShowEndpointDialog(true);
              }} className="mb-4">
                <Plus className="mr-2 h-4 w-4" /> Add Endpoint
              </Button>
              {endpoints.map((endpoint, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader>
                    <CardTitle>{endpoint.path}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{endpoint.description}</p>
                    <Button onClick={() => {
                      setCurrentEndpointIndex(index);
                      setEditingEndpoint(endpoint);
                      setShowEndpointDialog(true);
                    }} variant="secondary" size="sm">
                      <Edit className="mr-2 h-4 w-4" /> Edit Endpoint
                    </Button>
                    <Button onClick={() => {
                      const newEndpoints = [...endpoints];
                      newEndpoints.splice(index, 1);
                      setEndpoints(newEndpoints);
                    }} variant="destructive" size="sm" className="ml-2">
                      <Trash className="mr-2 h-4 w-4" /> Delete Endpoint
                    </Button>
                    <h4 className="mt-4 font-semibold">Methods:</h4>
                    {endpoint.methods.map((method, methodIndex) => (
                      <Card key={methodIndex} className="mb-2">
                        <CardHeader>
                          <CardTitle>{method.type.toUpperCase()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{method.description}</p>
                          <Button onClick={() => {
                            setCurrentEndpointIndex(index);
                            setCurrentMethodIndex(methodIndex);
                            setEditingMethod(method);
                            setShowMethodDialog(true);
                          }} variant="secondary" size="sm">
                            <Edit className="mr-2 h-4 w-4" /> Edit Method
                          </Button>
                          <Button onClick={() => {
                            const newEndpoints = [...endpoints];
                            newEndpoints[index].methods.splice(methodIndex, 1);
                            setEndpoints(newEndpoints);
                          }} variant="destructive" size="sm" className="ml-2">
                            <Trash className="mr-2 h-4 w-4" /> Delete Method
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    <Button onClick={() => {
                      setCurrentEndpointIndex(index);
                      setEditingMethod(null);
                      setShowMethodDialog(true);
                    }} className="mt-2">
                      <Plus className="mr-2 h-4 w-4" /> Add Method
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dataTypes">
          <Card>
            <CardHeader>
              <CardTitle>Data Types</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => {
                setEditingType(null);
                setShowTypeDialog(true);
              }} className="mb-4">
                <Plus className="mr-2 h-4 w-4" /> Add Data Type
              </Button>
              {types.map((type, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader>
                    <CardTitle>{type.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Base Type: {type.baseType}</p>
                    <Button onClick={() => {
                      setEditingType(type);
                      setShowTypeDialog(true);
                    }} variant="secondary" size="sm">
                      <Edit className="mr-2 h-4 w-4" /> Edit Data Type
                    </Button>
                    <Button onClick={() => {
                      const newTypes = [...types];
                      newTypes.splice(index, 1);
                      setTypes(newTypes);
                    }} variant="destructive" size="sm" className="ml-2">
                      <Trash className="mr-2 h-4 w-4" /> Delete Data Type
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Generated RAML</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedRAML ? (
                <MonacoEditor
                  value={generatedRAML}
                  language="yaml"
                  options={{ readOnly: true }}
                />
              ) : (
                <p>No RAML generated yet. Please provide API specifications and generate.</p>
              )}
              <Button onClick={handleGenerateRAML} disabled={isGenerating} className="mt-4">
                {isGenerating ? 'Generating...' : 'Generate RAML'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Publish API</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" value={publishDescription} onChange={(e) => setPublishDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visibility" className="text-right">
                Visibility
              </Label>
              <Select onValueChange={setVisibility}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing ...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish API
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEndpointDialog} onOpenChange={setShowEndpointDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEndpoint ? 'Edit Endpoint' : 'Add Endpoint'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="path" className="text-right">
                Path
              </Label>
              <Input id="path" value={editingEndpoint?.path || ''} onChange={(e) => {
                setEditingEndpoint({ ...editingEndpoint, path: e.target.value } as Endpoint);
              }} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" value={editingEndpoint?.description || ''} onChange={(e) => {
                setEditingEndpoint({ ...editingEndpoint, description: e.target.value } as Endpoint);
              }} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => {
              if (editingEndpoint) {
                const newEndpoints = [...endpoints];
                if (currentEndpointIndex !== null) {
                  newEndpoints[currentEndpointIndex] = editingEndpoint;
                } else {
                  newEndpoints.push(editingEndpoint);
                }
                setEndpoints(newEndpoints);
              } else {
                const newEndpoint = { path: 'New Endpoint', description: '', methods: [{ ...DEFAULT_METHOD }] };
                setEndpoints([...endpoints, newEndpoint]);
              }
              setShowEndpointDialog(false);
            }}>
              {editingEndpoint ? 'Update Endpoint' : 'Add Endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Edit Method' : 'Add Method'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select onValueChange={(value) => {
                setEditingMethod({ ...editingMethod, type: value } as Method);
              }}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select method type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="get">GET</SelectItem>
                  <SelectItem value="post">POST</SelectItem>
                  <SelectItem value="put">PUT</SelectItem>
                  <SelectItem value="delete">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" value={editingMethod?.description || ''} onChange={(e) => {
                setEditingMethod({ ...editingMethod, description: e.target.value } as Method);
              }} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => {
              if (editingMethod) {
                const newEndpoints = [...endpoints];
                if (currentEndpointIndex !== null && currentMethodIndex !== null) {
                  newEndpoints[currentEndpointIndex].methods[currentMethodIndex] = editingMethod;
                }
                setEndpoints(newEndpoints);
              } else {
                const newMethod = { type: 'get', description: '', responses: [{ code: '200', description: 'Success response' }] };
                if (currentEndpointIndex !== null) {
                  const newEndpoints = [...endpoints];
                  newEndpoints[currentEndpointIndex].methods.push(newMethod);
                  setEndpoints(newEndpoints);
                }
              }
              setShowMethodDialog(false);
            }}>
              {editingMethod ? 'Update Method' : 'Add Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddResponseDialog} onOpenChange={setShowAddResponseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Response</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input id="code" value={newResponse.code} onChange={(e) => setNewResponse({ ...newResponse, code: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" value={newResponse.description} onChange={(e) => setNewResponse({ ...newResponse, description: e.target.value })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => {
              // Implement logic to add the new response to the current method
              setShowAddResponseDialog(false);
            }}>
              Add Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Data Type' : 'Add Data Type'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={editingType?.name || ''} onChange={(e) => {
                setEditingType({ ...editingType, name: e.target.value } as DataType);
              }} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseType" className="text-right">
                Base Type
              </Label>
              <Input id="baseType" value={editingType?.baseType || ''} onChange={(e) => {
                setEditingType({ ...editingType, baseType: e.target.value } as DataType);
              }} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => {
              if (editingType) {
                // Update existing type
                const newTypes = [...types];
                const index = newTypes.findIndex(t => t.name === editingType.name);
                if (index !== -1) {
                  newTypes[index] = editingType;
                  setTypes(newTypes);
                }
              } else {
                // Add new type
                const newType = { name: 'New Type', baseType: 'string', properties: [] };
                setTypes([...types, newType]);
              }
              setShowTypeDialog(false);
            }}>
              {editingType ? 'Update Data Type' : 'Add Data Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RAMLGenerator;
