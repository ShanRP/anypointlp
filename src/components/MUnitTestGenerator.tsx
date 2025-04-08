import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Save, RefreshCw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { useMUnitRepositoryData } from '@/hooks/useMUnitRepositoryData';
import MonacoEditor from './MonacoEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type MUnitTestGeneratorProps = {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (id: string) => void;
};

const runtimeOptions = [
  { label: 'Mule 3.9.0', value: '3.9.0' },
  { label: 'Mule 4.3.0', value: '4.3.0' },
  { label: 'Mule 4.4.0', value: '4.4.0' },
  { label: 'Mule 4.5.0', value: '4.5.0' }
];

const MUnitTestGenerator: React.FC<MUnitTestGeneratorProps> = ({
  onTaskCreated,
  selectedWorkspaceId,
  onBack,
  onSaveTask
}) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourceType, setSourceType] = useState<'noRepository' | 'withRepository' | 'local'>('noRepository');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [flowImplementation, setFlowImplementation] = useState('');
  const [runtime, setRuntime] = useState('4.4.0');
  const [scenarioCount, setScenarioCount] = useState(1);
  const [generatedTests, setGeneratedTests] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('input');
  const [taskId, setTaskId] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const { user } = useAuth();
  
  const { 
    repositories, 
    selectedRepository, 
    selectRepository, 
    branches, 
    selectedBranch, 
    selectBranch, 
    files, 
    selectedFilePath, 
    selectFile, 
    fileContent, 
    loading 
  } = useMUnitRepositoryData();

  const { saveMUnitTask } = useWorkspaceTasks(selectedWorkspaceId || '');

  useEffect(() => {
    // Generate a unique task ID when component loads
    setTaskId(`M-${crypto.randomUUID().substring(0, 8).toUpperCase()}`);
  }, []);

  const handleGenerate = async () => {
    if (!description) {
      toast({
        description: "Please provide a description for the test."
      });
      return;
    }

    if (!flowImplementation) {
      toast({
        description: "Please provide the flow implementation to generate tests for."
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log("Sending request with payload:", {
        description,
        notes,
        flowImplementation,
        runtime,
        numberOfScenarios: scenarioCount
      });
      
      const { data, error } = await supabase.functions.invoke('generate-munit', {
        body: {
          description,
          notes,
          flowImplementation,
          runtime,
          numberOfScenarios: scenarioCount
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Response from generate-munit:", data);
      
      setGeneratedTests(data.code || "// No tests generated");

      if (onTaskCreated && selectedWorkspaceId) {
        onTaskCreated({
          id: taskId,
          label: description.substring(0, 30) + (description.length > 30 ? '...' : ''),
          category: 'munit',
          icon: "TestTube2",
          workspace_id: selectedWorkspaceId,
          content: {
            description,
            notes,
            flow: flowImplementation,
            tests: data.code,
            runtime,
            scenarioCount
          }
        });

        toast({
          description: "MUnit tests generated successfully."
        });
      }
      
      setActiveTab('result');
    } catch (error) {
      console.error('Error generating MUnit tests:', error);
      toast({
        description: error instanceof Error ? error.message : "Failed to generate MUnit tests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setDescription('');
    setNotes('');
    setFlowImplementation('');
    setRuntime('4.4.0');
    setScenarioCount(1);
    setGeneratedTests('');
    setActiveTab('input');
  };

  const handleFileSelect = (filePath: string) => {
    selectFile(filePath);
    if (fileContent) {
      setFlowImplementation(fileContent);
    }
  };

  const handleSaveTask = async () => {
    if (!taskName.trim()) {
      toast({
        description: "Please provide a name for this task",
        variant: "destructive"
      });
      return;
    }

    if (!selectedWorkspaceId || !user) {
      toast({
        description: "Workspace or user information is missing",
        variant: "destructive"
      });
      return;
    }

    try {
      const task = {
        task_id: taskId,
        task_name: taskName,
        user_id: user.id,
        workspace_id: selectedWorkspaceId,
        description: description,
        flow_implementation: flowImplementation,
        generated_tests: generatedTests,
        runtime: runtime,
        notes: notes,
        scenario_count: scenarioCount
      };

      await saveMUnitTask(task);
      
      toast({
        description: "MUnit task has been saved successfully"
      });

      setSaveDialogOpen(false);
      
      if (onSaveTask) {
        onSaveTask(taskId);
      }
    } catch (error) {
      console.error('Error saving MUnit task:', error);
      toast({
        description: "Failed to save the MUnit task",
        variant: "destructive"
      });
    }
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
          <h1 className="text-2xl font-semibold">MUnit Test Generator</h1>
          <p className="text-muted-foreground">Generate MUnit tests for your Mule flows</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto flex flex-col">
        <motion.div 
          className="mb-6 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5 }}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-6 flex-1 flex flex-col h-full">
            <div className="mb-6">
              <RadioGroup 
                value={sourceType} 
                onValueChange={(value) => setSourceType(value as 'noRepository' | 'withRepository' | 'local')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="noRepository" id="noRepository" />
                  <Label htmlFor="noRepository">No Repository</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="withRepository" id="withRepository" />
                  <Label htmlFor="withRepository">With Repository</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local">Upload from Computer</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <Label htmlFor="description" className="font-medium mb-1 block">Description<span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description"
                  placeholder="Describe what the MUnit test should validate"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="font-medium mb-1 block">Notes (optional)</Label>
                <Textarea 
                  id="notes"
                  placeholder="Add any additional notes or context for the test generation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {sourceType === 'withRepository' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="repository" className="font-medium mb-1 block">Repository</Label>
                      <Select
                        value={selectedRepository || ""}
                        onValueChange={selectRepository}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {repositories.map((repo) => (
                            <SelectItem key={repo.id} value={repo.id}>{repo.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="branch" className="font-medium mb-1 block">Branch</Label>
                      <Select
                        value={selectedBranch}
                        onValueChange={selectBranch}
                        disabled={!selectedRepository}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="file" className="font-medium mb-1 block">File</Label>
                    <Select
                      value={selectedFilePath}
                      onValueChange={handleFileSelect}
                      disabled={!selectedBranch}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select file" />
                      </SelectTrigger>
                      <SelectContent>
                        {files.map((file) => (
                          <SelectItem 
                            key={file.path} 
                            value={file.path}
                          >
                            {file.path}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {sourceType === 'local' && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Drag and drop your XML file here, or click to browse</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setFlowImplementation(event.target.result as string);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Browse
                  </Button>
                </div>
              )}

              <div className="flex-1 flex flex-col h-full">
                <Label htmlFor="flowImplementation" className="font-medium mb-1 block">
                  Flow Implementation<span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-md flex-1 h-full" style={{ minHeight: '400px' }}>
                  <MonacoEditor
                    language="xml"
                    value={flowImplementation}
                    onChange={setFlowImplementation}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                    height="90vh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="runtime" className="font-medium mb-1 block">Runtime</Label>
                  <Select
                    value={runtime}
                    onValueChange={setRuntime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select runtime" />
                    </SelectTrigger>
                    <SelectContent>
                      {runtimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scenarioCount" className="font-medium mb-1 block">Number of MUnit Scenarios</Label>
                  <Input
                    id="scenarioCount"
                    type="number"
                    min={1}
                    max={5}
                    value={scenarioCount}
                    onChange={(e) => setScenarioCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !description || !flowImplementation}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-6 flex-1 flex flex-col h-full">
            {generatedTests ? (
              <div className="space-y-4 flex-1 flex flex-col h-full">
                <Card className="p-4 flex-1 flex flex-col h-full">
                  <h3 className="font-semibold text-lg mb-2">Generated MUnit Tests</h3>
                  <Separator className="my-2" />
                  <div className="border rounded-md flex-1 h-full" style={{ minHeight: '400px' }}>
                    <MonacoEditor
                      language="xml"
                      value={generatedTests}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                      height="90vh"
                    />
                  </div>
                </Card>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('input')}
                  >
                    Back to Input
                  </Button>
                  <Button onClick={() => {
                    navigator.clipboard.writeText(generatedTests);
                    toast({
                      description: "MUnit tests copied to clipboard"
                    });
                  }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button onClick={() => setSaveDialogOpen(true)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 flex-1 flex flex-col justify-center">
                <p className="text-gray-500">No test results yet. Generate tests first.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('input')}
                  className="mt-4 mx-auto"
                >
                  Back to Input
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save MUnit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="MUnit tests for..."
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

export default MUnitTestGenerator;
