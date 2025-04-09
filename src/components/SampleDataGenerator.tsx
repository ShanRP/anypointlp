import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, RefreshCw, Copy, FolderTree, Upload, Folder, File, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { BackButton } from './ui/BackButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from './ui/separator';
import MonacoEditor from './MonacoEditor';
import { toast } from 'sonner';
import { useGithubApi } from '@/hooks/useGithubApi';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { FileNode, isFileOfType, pathExistsInFileStructure, getNodeByPath } from '@/utils/githubUtils';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useUserCredits } from '@/hooks/useUserCredits';

type GenerationType = 'JSON' | 'XML' | 'CSV' | 'YAML';
type SourceType = 'no-repository' | 'with-repository' | 'upload';

interface SampleDataGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId?: string;
  onSaveTask?: (taskId: string) => void;
}

const SampleDataGenerator: React.FC<SampleDataGeneratorProps> = ({ 
  onBack, 
  selectedWorkspaceId = 'default',
  onSaveTask 
}) => {
  const [generationType, setGenerationType] = useState<GenerationType>('JSON');
  const [sourceType, setSourceType] = useState<SourceType>('no-repository');
  const [schemaContent, setSchemaContent] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [taskName, setTaskName] = useState(`Sample Data - ${new Date().toLocaleDateString()}`);
  const [taskId, setTaskId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent } = useGithubApi();
  const { selectedRepository, setSelectedRepository } = useRepositoryData();
  const { user } = useAuth();
  const { saveSampleDataTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  const { useCredit } = useUserCredits();
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');
  
  const projectFolderRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTaskId(`S-${crypto.randomUUID().substring(0, 8).toUpperCase()}`);
  }, []);

  const isValidFileForFormat = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.dwl');
  };

  const handleGenerateSampleData = async () => {
    if (!schemaContent.trim()) {
      toast.error('Please provide a schema');
      return;
    }
    
    const canUseCredit = await useCredit();
    if (!canUseCredit) {
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer CG0eH5ViBtkYjgubdeia5Au5tZHxsL1E'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: `You are a sample data generator. Generate realistic sample data based on the schema provided. 
                       The output should be in ${generationType} format. Make the data realistic and varied.`
            },
            {
              role: 'user',
              content: `Generate sample data in ${generationType} format based on this schema:\n${schemaContent}\n${notes ? `Additional notes: ${notes}` : ''}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        let content = data.choices[0].message.content.trim();
        
        const codeBlockMatch = content.match(/```(?:\w+)?\s*([\s\S]+?)\s*```/);
        if (codeBlockMatch) {
          content = codeBlockMatch[1].trim();
        }
        
        setResult(content);
        setActiveTab('result');
        toast.success('Sample data generated successfully!');
      } else {
        throw new Error('Failed to generate sample data');
      }
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTask = async () => {
    if (!selectedWorkspaceId || !user) {
      toast.error('You need to be logged in and have a workspace selected to save a task');
      return;
    }

    if (!result) {
      toast.error('You need to generate sample data before saving');
      return;
    }

    try {
      setIsSaving(true);
      
      console.log('Saving sample data task:', {
        workspace_id: selectedWorkspaceId,
        task_id: taskId,
        task_name: taskName,
        description: notes || `Sample data in ${generationType} format`,
        source_format: generationType,
        schema_content: schemaContent,
        result_content: result
      });
      
      const taskData = {
        workspace_id: selectedWorkspaceId,
        task_id: taskId,
        task_name: taskName,
        user_id: user.id,
        description: notes || `Sample data in ${generationType} format`,
        source_format: generationType,
        schema_content: schemaContent,
        result_content: result,
        notes: notes
      };
      
      await saveSampleDataTask(taskData);
      
      if (onSaveTask) {
        onSaveTask(taskId);
      }
      
      toast.success('Sample data task saved successfully!');
      setActiveTab('result');
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSchemaContent('');
    setNotes('');
    setResult('');
    setGenerationType('JSON');
    setSourceType('no-repository');
    setActiveTab('input');
    setUploadedFiles([]);
    setFileContent('');
    setSelectedFile(null);
    setTaskName(`Sample Data - ${new Date().toLocaleDateString()}`);
    setTaskId(`S-${crypto.randomUUID().substring(0, 8).toUpperCase()}`);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Sample data copied to clipboard!');
  };

  const handleSelectRepository = async (repo: any) => {
    try {
      setCurrentDirectory('/');
      setSelectedFile(null);
      await fetchFileStructure(repo);
      setSelectedRepository(repo);
      toast.success(`Repository ${repo.name} loaded successfully`);
    } catch (error) {
      toast.error('Failed to load repository structure');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setUploadedFiles(files);
      
      const matchingFiles = files.filter(file => isValidFileForFormat(file.name));
      
      if (matchingFiles.length > 0) {
        handleUploadedFileSelect(matchingFiles[0]);
      } else {
        toast.warning(`No ${generationType.toLowerCase()} files found in the upload`);
      }
      
      toast.success(`${files.length} files uploaded successfully`);
    }
  };

  const getCurrentDirectoryContents = () => {
    if (!fileStructure || fileStructure.length === 0) {
      return [];
    }
    
    if (currentDirectory === '/') {
      return fileStructure;
    }
    
    const dirNode = getNodeByPath(fileStructure, currentDirectory);
    return dirNode && dirNode.type === 'directory' ? (dirNode.children || []) : [];
  };

  const navigateDirectory = (dir: FileNode) => {
    if (dir.type === 'directory') {
      setCurrentDirectory(dir.path);
      toast.success(`Navigated to ${dir.name}`);
    }
  };
  
  const goUpDirectory = () => {
    if (currentDirectory === '/') return;
    
    const pathParts = currentDirectory.split('/');
    pathParts.pop();
    const parentPath = pathParts.length === 0 ? '/' : pathParts.join('/');
    
    setCurrentDirectory(parentPath);
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      if (!isValidFileForFormat(file.name)) {
        toast.error(`This file format does not match the selected ${generationType} format`);
        return;
      }
      
      setSelectedFile(file.path);
      setIsLoadingFile(true);
      
      if (selectedRepository) {
        try {
          console.log(`Attempting to fetch file content for: ${file.path}`);
          const content = await fetchFileContent(selectedRepository, file.path);
          
          if (content) {
            setFileContent(content);
            setSchemaContent(content);
            toast.success(`File "${file.name}" loaded successfully`);
            setActiveTab('input');
          } else {
            throw new Error(`Could not load content from "${file.name}"`);
          }
        } catch (error) {
          console.error("Error handling file selection:", error);
          toast.error(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setSelectedFile(null);
        } finally {
          setIsLoadingFile(false);
        }
      }
    }
  };

  const handleProjectFolderClick = () => {
    if (projectFolderRef.current) {
      projectFolderRef.current.click();
    }
  };

  const handleUploadedFileSelect = (file: File) => {
    if (!isValidFileForFormat(file.name)) {
      toast.error(`This file format does not match dwl format`);
      return;
    }
    
    setSelectedFile(file.name);
    setIsLoadingFile(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const fileContent = e.target.result as string;
        setFileContent(fileContent);
        setSchemaContent(fileContent);
        setActiveTab('input');
        toast.success(`File "${file.name}" loaded successfully`);
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error(`Failed to read file "${file.name}"`);
      setSelectedFile(null);
    };
    reader.onloadend = () => {
      setIsLoadingFile(false);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    setSelectedFile(null);
    setFileContent('');
    
    if (sourceType === 'upload' && uploadedFiles.length > 0) {
      const matchingFiles = uploadedFiles.filter(file => isValidFileForFormat(file.name));
      
      if (matchingFiles.length > 0) {
        handleUploadedFileSelect(matchingFiles[0]);
      }
    }
  }, [generationType]);

  useEffect(() => {
    if (sourceType === 'with-repository') {
      fetchRepositories();
    }
  }, [sourceType, fetchRepositories]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton onBack={onBack} label="Back to Dashboard" />

      <Card className="mt-4 border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold">Sample Data Generator</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <motion.div 
            className="mb-6 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>
            
            <TabsContent value="input" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <input
                  id="task-name"
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter a name for this task"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Source Type</label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={sourceType === 'no-repository' ? 'default' : 'outline'}
                    onClick={() => setSourceType('no-repository')}
                    className="flex-1 min-w-[180px]"
                  >
                    No Repository
                  </Button>
                  <Button
                    variant={sourceType === 'with-repository' ? 'default' : 'outline'}
                    onClick={() => setSourceType('with-repository')}
                    className="flex-1 min-w-[180px] flex items-center gap-2"
                  >
                    <FolderTree size={16} />
                    With Repository
                  </Button>
                  <Button
                    variant={sourceType === 'upload' ? 'default' : 'outline'}
                    onClick={() => setSourceType('upload')}
                    className="flex-1 min-w-[180px] flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Upload from Computer
                  </Button>
                </div>
              </div>

              {sourceType === 'with-repository' && (
                <div className="space-y-2 border p-4 rounded-md bg-gray-50">
                  <h3 className="font-medium text-gray-900">Repository Selection</h3>
                  {loadingRepositories ? (
                    <div className="py-4 text-center">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                      <p>Loading repositories...</p>
                    </div>
                  ) : repositories.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 mt-2">
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
                          >
                            <ArrowLeft size={16} />
                          </button>
                          <span className="text-sm font-medium truncate">
                            {currentDirectory === '/' ? 'Root' : currentDirectory}
                          </span>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto">
                          {loadingFileStructure ? (
                            <div className="p-4 text-center">
                              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                              <p className="text-sm">Loading files...</p>
                            </div>
                          ) : getCurrentDirectoryContents().length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No files found in this directory
                            </div>
                          ) : (
                            <div className="divide-y">
                              {getCurrentDirectoryContents().map((item, index) => {
                                const isValidFile = item.type === 'file' && isValidFileForFormat(item.name);
                                return (
                                <div 
                                  key={index}
                                  onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                    selectedFile === item.path
                                      ? 'bg-purple-50' 
                                      : ''
                                  } ${isValidFile ? 'text-purple-700' : ''}`}
                                >
                                  {item.type === 'directory' ? (
                                    <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                  ) : isValidFile ? (
                                    <File className="h-4 w-4 mr-2 text-purple-600" />
                                  ) : (
                                    <File className="h-4 w-4 mr-2 text-gray-400" />
                                  )}
                                  <span className={`truncate ${isValidFile ? 'font-medium' : ''}`}>
                                    {item.name}
                                    {item.type === 'file' && !isValidFileForFormat(item.name) && (
                                      <span className="text-xs text-gray-400 ml-2">
                                        (not DWL format)
                                      </span>
                                    )}
                                  </span>
                                  {selectedFile === item.path && (
                                    <Check className="h-4 w-4 ml-auto text-purple-600" />
                                  )}
                                </div>
                              )})}
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
                  <h3 className="font-medium text-gray-900">Upload Files</h3>
                  <div className="mt-2">
                    <label 
                      htmlFor="schema-file-upload" 
                      className="cursor-pointer bg-white py-6 px-4 border-2 border-dashed border-gray-300 rounded-md flex justify-center items-center flex-col text-center"
                    >
                      <Upload size={24} className="mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Drag and drop files here, or click to browse</span>
                      <span className="text-xs text-gray-500 mt-1">
    Only accepting DWL files
  </span>
                      <input 
                        id="schema-file-upload" 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Uploaded Files ({uploadedFiles.length})</h4>
                      <div className="bg-gray-100 p-2 rounded border">
                        <div className="max-h-40 overflow-y-auto divide-y">
                          {uploadedFiles.map((file, index) => {
                            const isValidFile = isValidFileForFormat(file.name);
                            return (
                              <div 
                                key={index} 
                                onClick={() => isValidFile && handleUploadedFileSelect(file)}
                                className={`py-2 px-3 flex items-center ${
                                  selectedFile === file.name ? 'bg-purple-50' : ''
                                } ${isValidFile ? 'cursor-pointer hover:bg-gray-50 text-purple-700' : 'text-gray-400'}`}
                              >
                                {isValidFile ? (
                                  <File className="h-4 w-4 mr-2 text-purple-600" />
                                ) : (
                                  <File className="h-4 w-4 mr-2 text-gray-400" />
                                )}
                                <span className={isValidFile ? 'font-medium' : ''}>
                                  {file.name}
                                </span>
                                {!isValidFile && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    (not DWL format)
                                  </span>
                                )}
                                {selectedFile === file.name && (
                                  <Check className="h-4 w-4 ml-auto text-purple-600" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Format <span className="text-red-500">*</span>
                </label>
                <RadioGroup 
                  value={generationType} 
                  onValueChange={(value) => setGenerationType(value as GenerationType)}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="JSON" id="json" />
                    <Label htmlFor="json">JSON</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="XML" id="xml" />
                    <Label htmlFor="xml">XML</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CSV" id="csv" />
                    <Label htmlFor="csv">CSV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="YAML" id="yaml" />
                    <Label htmlFor="yaml">YAML</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Schema <span className="text-red-500">*</span>
                  </label>
                  {selectedFile && (
                    <div className="flex items-center text-sm text-purple-700 font-medium">
                      <File className="h-4 w-4 mr-1" />
                      {selectedFile.split('/').pop()}
                      {isLoadingFile && <RefreshCw size={14} className="ml-2 animate-spin" />}
                    </div>
                  )}
                </div>
                
                <div className="border rounded-md overflow-hidden" style={{ height: "300px" }}>
                  {isLoadingFile ? (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <RefreshCw size={24} className="animate-spin mr-2" />
                      <span>Loading file content...</span>
                    </div>
                  ) : (
                    <MonacoEditor
                      value={schemaContent}
                      onChange={(value) => setSchemaContent(value || '')}
                      language={generationType.toLowerCase() === 'yaml' ? 'yaml' : generationType.toLowerCase()}
                      height="300px"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  Provide the schema for which you want to generate sample data
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any specific requirements or constraints for the generated data..."
                  className="min-h-[100px] resize-none"
                />
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
                  onClick={handleGenerateSampleData}
                  disabled={isGenerating || !schemaContent.trim() || isLoadingFile}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Sample Data'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="result" className="space-y-6">
              {result ? (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Generated Sample Data</h3>
                    <div className="text-sm text-gray-500 mb-2">Task ID: {taskId}</div>
                    <Separator className="my-2" />
                    <div className="border rounded-md" style={{ minHeight: '400px' }}>
                      <MonacoEditor
                        value={result}
                        language={generationType.toLowerCase()}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                        height="400px"
                      />
                    </div>
                  </Card>
                  <div className="flex justify-between space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('input')}
                    >
                      Back to Input
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCopyToClipboard}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Copy to Clipboard
                      </Button>
                      {selectedWorkspaceId && (
                        <Button 
                          onClick={handleSaveTask}
                          disabled={isSaving}
                          className="flex items-center gap-2"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw size={16} className="animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save to Workspace'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No sample data generated yet. Generate sample data first.</p>
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
  );
}

export default SampleDataGenerator;
