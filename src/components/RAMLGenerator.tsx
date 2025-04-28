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
      {/* Rest of the component JSX */}
    </div>
  );
};

export default RAMLGenerator;
