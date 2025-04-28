import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, FileCode, RefreshCw, Copy, FolderTree, Upload, File, Folder, Check } from 'lucide-react';
import { toast } from 'sonner';
import MonacoEditor from './MonacoEditor';
import { BackButton } from './ui/BackButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { useGithubApi } from '@/hooks/useGithubApi';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { Input } from './ui/input';
import { Animation } from './ui/Animation';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';

type SourceType = 'no-repository' | 'with-repository' | 'upload';

interface DiagramGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId?: string;
  onSaveTask?: (taskId: string) => void;
  onTaskCreated?: (task: any) => void;
}

const DiagramGenerator: React.FC<DiagramGeneratorProps> = ({ 
  onBack, 
  selectedWorkspaceId = 'default',
  onSaveTask,
  onTaskCreated
}) => {
  const [sourceType, setSourceType] = useState<SourceType>('no-repository');
  const [description, setDescription] = useState('');
  const [raml, setRaml] = useState('');
  const [result, setResult] = useState('');
  const [flowDiagram, setFlowDiagram] = useState('');
  const [connectionSteps, setConnectionSteps] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [taskName, setTaskName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent } = useGithubApi();
  const { selectedRepository, toggleFileSelection } = useRepositoryData();
  const { user } = useAuth();
  const { saveDiagramTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  const { useCredit } = useUserCredits();
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');

  const handleReset = () => {
    setSourceType('no-repository');
    setDescription('');
    setRaml('');
    setResult('');
    setFlowDiagram('');
    setConnectionSteps('');
    setActiveTab('input');
    setUploadedFiles([]);
    setFileContent('');
    setSelectedFile(null);
    setTaskName('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setUploadedFiles(files);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFileContent(e.target.result as string);
          
          const fileName = files[0].name.toLowerCase();
          if (fileName.endsWith('.raml')) {
            setRaml(e.target.result as string);
          }
        }
      };
      reader.readAsText(files[0]);
      
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`);
    }
  };

  const handleSelectRepository = async (repo: any) => {
    try {
      await fetchFileStructure(repo);
      toast.success(`Repository ${repo.name} loaded successfully`);
    } catch (error) {
      toast.error('Failed to load repository structure');
    }
  };

  const getCurrentDirectoryContents = () => {
    if (!fileStructure || fileStructure.length === 0) {
      return [];
    }
    
    if (currentDirectory === '/') {
      return fileStructure;
    }
    
    const findDirectory = (nodes: any[], path: string): any[] | null => {
      for (const node of nodes) {
        if (node.path === path && node.type === 'directory') {
          return node.children || [];
        }
        if (node.children) {
          const result = findDirectory(node.children, path);
          if (result) return result;
        }
      }
      return null;
    };
    
    const dirContents = findDirectory(fileStructure, currentDirectory);
    return dirContents || [];
  };

  const navigateDirectory = (dir: any) => {
    if (dir.type === 'directory') {
      setCurrentDirectory(dir.path);
      toast.success(`Navigated to ${dir.name}`);
    }
  };
  
  const goUpDirectory = () => {
    if (currentDirectory === '/') return;
    
    const pathParts = currentDirectory.split('/');
    pathParts.pop();
    const parentPath = pathParts.length === 1 ? '/' : pathParts.join('/');
    
    setCurrentDirectory(parentPath);
  };

  const handleFileSelect = async (file: any) => {
    if (file.type === 'file') {
      setSelectedFile(file.path);
      
      if (selectedRepository) {
        try {
          const content = await fetchFileContent(selectedRepository, file.path);
          if (content) {
            setFileContent(content);
            
            if (file.name.toLowerCase().endsWith('.raml')) {
              setRaml(content);
            }
            
            toast.success(`File "${file.name}" loaded successfully`);
          }
        } catch (error) {
          toast.error(`Failed to load file: ${file.name}`);
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (!description) {
      toast.error('Please provide a description for the diagram');
      return;
    }
    
    // Check if user has credits available
    const canUseCredit = await useCredit();
    if (!canUseCredit) {
      return;
    }

    setIsLoading(true);
    try {
      let prompt = `Generate a detailed MuleSoft flow diagram based on this description:\n\n${description}\n\n`;
      
      if (raml) {
        prompt += `RAML Specification:\n${raml}\n\n`;
      }
      
      prompt += `Your response MUST have exactly these two sections with these exact headings:
1. # Flow Diagram: Create a detailed flow diagram showing all connections and components in ASCII art or markdown format with a proper backgroud colour and try to display the diagram in a detailed way. Make sure it's properly structured and clear.
2. # Connection Steps: List all the necessary connection steps and configuration details for implementing this flow.

Both sections MUST begin with the exact headings "# Flow Diagram" and "# Connection Steps". For both sections, be specific to MuleSoft implementation.`;

      console.log("Sending request to Mistral AI with prompt:", prompt);

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 4oHKJ2sxR1hkZDuclKddFjSrmLilELBO'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: 'You are a MuleSoft architect expert at creating flow diagrams. You create detailed, well-structured diagrams for MuleSoft implementations. ALWAYS format your response with EXACTLY these section headings: "# Flow Diagram" and "# Connection Steps".'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      console.log("Mistral AI response:", data);
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content.trim();
        setResult(content);
        
        const flowDiagramMatch = content.match(/# Flow Diagram\s*\n([\s\S]*?)(?=\s*# Connection Steps|$)/i);
        const connectionStepsMatch = content.match(/# Connection Steps\s*\n([\s\S]*?)$/i);
        
        console.log("Flow diagram match:", flowDiagramMatch);
        console.log("Connection steps match:", connectionStepsMatch);
        
        if (flowDiagramMatch && flowDiagramMatch[1]) {
          setFlowDiagram(flowDiagramMatch[1].trim());
        } else {
          setFlowDiagram('Flow diagram section not found in the generated content.');
          console.error("Flow Diagram section not found in:", content);
        }
        
        if (connectionStepsMatch && connectionStepsMatch[1]) {
          setConnectionSteps(connectionStepsMatch[1].trim());
        } else {
          setConnectionSteps('Connection steps section not found in the generated content.');
          console.error("Connection Steps section not found in:", content);
        }
        
        setActiveTab('result');
        toast.success('Diagram generated successfully!');
        
        // Save task automatically after generating
        await saveGeneratedTask();
      } else {
        throw new Error('No response received from API');
      }
    } catch (error) {
      console.error('Error generating diagram:', error);
      toast.error('Failed to generate diagram. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveGeneratedTask = async () => {
    try {
      if (!user) {
        toast.error('You must be logged in to save a task.');
        return;
      }
      
      // Ensure we have a valid task name
      const diagramTitle = taskName.trim() || 'Flow Diagram';
      
      const diagramData = {
        workspace_id: selectedWorkspaceId,
        task_name: diagramTitle,
        user_id: user.id,
        description: description,
        raml_content: raml,
        flow_diagram: flowDiagram,
        connection_steps: connectionSteps,
        result_content: `
Flow Diagram:
${flowDiagram}

Connection Steps:
${connectionSteps}
      `.trim()
      };
      
      // Save the task using the useWorkspaceTasks hook
      const savedTask = await saveDiagramTask(diagramData);
      
      // Check if the task was saved successfully
      if (savedTask && Array.isArray(savedTask) && savedTask.length > 0) {
        const taskId = savedTask[0].task_id;
        toast.success(`Diagram task saved successfully with ID: ${taskId}`);
        
        if (onSaveTask) onSaveTask(taskId);
        
        if (onTaskCreated) {
          onTaskCreated({
            id: taskId,
            label: diagramTitle,
            category: 'diagram',
            icon: React.createElement('div'),
            workspace_id: selectedWorkspaceId
          });
        }
      } else {
        toast.error('Failed to save diagram task.');
      }
    } catch (err: any) {
      console.error('Error saving diagram task:', err);
      setError(err.message);
      toast.error('Failed to save diagram task');
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Diagram copied to clipboard!');
  };

  useEffect(() => {
    if (sourceType === 'with-repository' && !repositories.length) {
      fetchRepositories();
    }
  }, [sourceType, repositories, fetchRepositories]);

  return (
    <div className="min-h-screen  max-w-7xl mx-auto bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton onBack={onBack} label="Back to Dashboard" />
        
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Diagram Generator</h1>
        
        <Card className="shadow-md">
          {/* <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Create MuleSoft Flow Diagram</CardTitle>
            </div>
          </CardHeader> */}
          
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="input">Input</TabsTrigger>
                <TabsTrigger value="result">Result</TabsTrigger>
              </TabsList>
              
              <TabsContent value="input" className="space-y-6 mt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="taskName">Task Name</label>
                    <Input
                      id="taskName"
                      placeholder="Name this diagram task"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Source Type</label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant={sourceType === 'no-repository' ? 'default' : 'outline'}
                        onClick={() => setSourceType('no-repository')}
                        className="flex-1"
                      >
                        No Repository
                      </Button>
                      <Button
                        variant={sourceType === 'with-repository' ? 'default' : 'outline'}
                        onClick={() => setSourceType('with-repository')}
                        className="flex-1 flex items-center gap-2"
                      >
                        <FolderTree size={16} />
                        With Repository
                      </Button>
                      <Button
                        variant={sourceType === 'upload' ? 'default' : 'outline'}
                        onClick={() => setSourceType('upload')}
                        className="flex-1 flex items-center gap-2"
                      >
                        <Upload size={16} />
                        Upload Files
                      </Button>
                    </div>
                  </div>
                  
                  {sourceType === 'with-repository' && (
                    <div className="space-y-4 border p-4 rounded-md bg-gray-50">
                      <h3 className="font-medium">Repository Selection</h3>
                      {loadingRepositories ? (
                        <div className="py-4 text-center">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                          <p>Loading repositories...</p>
                        </div>
                      ) : repositories.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {repositories.map((repo) => (
                            <div 
                              key={repo.id}
                              onClick={() => handleSelectRepository(repo)}
                              className={`p-3 rounded-md cursor-pointer border ${
                                selectedRepository?.id === repo.id 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : 'border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <div className="font-medium">{repo.name}</div>
                              <div className="text-xs text-gray-500">{repo.full_name}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <p>No repositories found. Connect your GitHub account in settings.</p>
                          <Button 
                            variant="outline" 
                            onClick={fetchRepositories}
                            className="mt-2"
                          >
                            Refresh Repositories
                          </Button>
                        </div>
                      )}
                      
                      {selectedRepository && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Files</h4>
                          <div className="border rounded-md overflow-hidden">
                            <div className="bg-gray-100 p-2 flex items-center border-b">
                              <button 
                                onClick={goUpDirectory}
                                disabled={currentDirectory === '/'} 
                                className={`p-1 rounded mr-2 ${currentDirectory === '/' ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
                                type="button"
                              >
                                <ArrowLeft size={16} />
                              </button>
                              <span className="text-sm font-medium truncate">
                                {currentDirectory === '/' ? 'Root' : currentDirectory}
                              </span>
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto">
                              {getCurrentDirectoryContents().length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                  No files found in this directory
                                </div>
                              ) : (
                                <div className="divide-y">
                                  {getCurrentDirectoryContents().map((item: any, index: number) => (
                                    <div 
                                      key={index}
                                      onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                        selectedFile === item.path
                                          ? 'bg-purple-50' 
                                          : ''
                                      }`}
                                    >
                                      {item.type === 'directory' ? (
                                        <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                      ) : (
                                        <File className="h-4 w-4 mr-2 text-gray-500" />
                                      )}
                                      <span className="truncate">{item.name}</span>
                                      {selectedFile === item.path && (
                                        <Check className="h-4 w-4 ml-auto text-purple-600" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {sourceType === 'upload' && (
                    <div className="space-y-2 border p-4 rounded-md bg-gray-50">
                      <h3 className="font-medium">Upload Files</h3>
                      <div className="mt-2">
                        <label 
                          htmlFor="file-upload" 
                          className="cursor-pointer bg-white py-6 px-4 border-2 border-dashed border-gray-300 rounded-md flex justify-center items-center flex-col text-center"
                        >
                          <Upload size={24} className="mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600">Drag and drop files here, or click to browse</span>
                          <input 
                            id="file-upload" 
                            type="file" 
                            multiple 
                            onChange={handleFileUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Uploaded Files ({uploadedFiles.length})</h4>
                          <div className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-y-auto">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="py-1">{file.name}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the flow you want to visualize..."
                      className="min-h-[100px] resize-none border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      RAML Specification (Optional)
                    </label>
                    <div className="border rounded-md h-full" style={{ minHeight: "400px" }}>
                      <MonacoEditor
                        value={raml}
                        onChange={(value) => setRaml(value || '')}
                        language="yaml"
                        height="400px"
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Reset
                    </Button>
                    <Button 
                      onClick={handleGenerate}
                      disabled={isLoading || !description.trim()}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileCode size={16} />
                          Generate Diagram
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="result" className="space-y-6 mt-4">
                {result ? (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Flow Diagram</h3>
                      <Separator className="my-2" />
                      <div className="border rounded-md overflow-auto bg-white p-4" style={{ minHeight: "250px" }}>
                        {flowDiagram === 'Flow diagram section not found in the generated content.' ? (
                          <div className="text-red-500 py-3">
                            {flowDiagram}
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {flowDiagram}
                          </pre>
                        )}
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Connection Steps</h3>
                      <Separator className="my-2" />
                      <div className="border rounded-md bg-white p-4" style={{ minHeight: "250px" }}>
                        {connectionSteps === 'Connection steps section not found in the generated content.' ? (
                          <div className="text-red-500 py-3">
                            {connectionSteps}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {connectionSteps.split('\n').map((line, index) => (
                              <div key={index} className="py-1">
                                {line}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('input')}
                      >
                        Back to Input
                      </Button>
                      <Button 
                        onClick={handleCopyToClipboard}
                        className="flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Copy to Clipboard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No diagram generated yet. Generate a diagram first.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('input')}
                      className="mt-4"
                    >
                      Back to Input
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiagramGenerator;
