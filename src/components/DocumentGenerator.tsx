import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, FileText, RefreshCw, Copy, FolderTree, Upload, File, Folder, Check } from 'lucide-react';
import { toast } from 'sonner';
import MonacoEditor from './MonacoEditor';
import { BackButton } from './ui/BackButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useGithubApi } from '@/hooks/useGithubApi';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useAuth } from '@/hooks/useAuth';

type SourceType = 'no-repository' | 'with-repository' | 'upload';
type DocumentType = 'flow-implementation' | 'flow-endpoints';

interface DocumentGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId?: string;
  onSaveTask?: (taskId: string) => void;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ 
  onBack, 
  selectedWorkspaceId,
  onSaveTask 
}) => {
  const [sourceType, setSourceType] = useState<SourceType>('no-repository');
  const [documentType, setDocumentType] = useState<DocumentType>('flow-implementation');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('input');
  
  // Repository-related hooks
  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent } = useGithubApi();
  const { selectedRepository, repositoryFileStructure, toggleFileSelection } = useRepositoryData();
  const { user } = useAuth();
  const { saveDocumentTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  
  // State for file upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');

  const handleReset = () => {
    setSourceType('no-repository');
    setDocumentType('flow-implementation');
    setDescription('');
    setCode('');
    setResult('');
    setActiveTab('input');
    setUploadedFiles([]);
    setFileContent('');
    setSelectedFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setUploadedFiles(files);
      
      // Read the first file's content
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFileContent(e.target.result as string);
          setCode(e.target.result as string);
        }
      };
      reader.readAsText(files[0]);
      
      toast.success(`${files.length} files uploaded successfully`);
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
        const content = await fetchFileContent(selectedRepository, file.path);
        if (content) {
          setFileContent(content);
          setCode(content);
          toast.success(`File "${file.name}" loaded successfully`);
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }

    if (!code.trim()) {
      toast.error('Please provide code for documentation');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare the prompt based on sourceType and documentType
      let prompt = `Generate a detailed document for a ${documentType === 'flow-implementation' ? 'Flow Implementation' : 'Flow Endpoints'}.`;
      
      if (description) {
        prompt += ` Description: ${description}`;
      }
      
      prompt += ` Here is the code to document:\n\n${code}`;
      
      if (sourceType === 'with-repository' && selectedRepository) {
        prompt += ` Based on the repository: ${selectedRepository.name}`;
      } else if (sourceType === 'upload' && fileContent) {
        prompt += ` Based on the uploaded file.`;
      }
      
      // Using Mistral API key
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
              content: 'You are a documentation expert. You create detailed, structured, and interactive documentation for Mule applications.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const generatedResult = data.choices[0].message.content.trim();
        setResult(generatedResult);
        setActiveTab('result');
        
        // Save task if workspace ID is provided
        if (selectedWorkspaceId && user) {
          const taskName = documentType === 'flow-implementation' 
            ? 'Flow Implementation Document' 
            : 'Flow Endpoints Document';
            
          try {
            const savedTask = await saveDocumentTask({
              workspace_id: selectedWorkspaceId,
              task_name: taskName,
              user_id: user.id,
              description: description,
              document_type: documentType,
              source_type: sourceType,
              code: code,
              result_content: generatedResult
            });
            
            if (savedTask && savedTask.length > 0 && onSaveTask) {
              onSaveTask(savedTask[0].id);
            }
            
            toast.success('Document saved to workspace!');
          } catch (error) {
            console.error('Error saving document task:', error);
          }
        }
      } else {
        throw new Error('No response received from API');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('Failed to generate document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Document copied to clipboard!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton onBack={onBack} label="Back to Dashboard" />
      
      <Card className="mt-4 border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold">Document Generator</CardTitle>
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
                  
                  {/* Repository file structure */}
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
                  <h3 className="font-medium text-gray-900">Upload Files</h3>
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label>
                <div className="border rounded-md h-full" style={{ minHeight: '400px' }}>
                  <MonacoEditor
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    language="xml"
                    height="400px"
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description of what you'd like to document..."
                  className="min-h-[100px] resize-none border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <RadioGroup 
                  value={documentType} 
                  onValueChange={(value) => setDocumentType(value as DocumentType)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flow-implementation" id="flow-implementation" />
                    <Label htmlFor="flow-implementation">Flow Implementation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flow-endpoints" id="flow-endpoints" />
                    <Label htmlFor="flow-endpoints">Flow Endpoints</Label>
                  </div>
                </RadioGroup>
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
                  disabled={isLoading || !documentType || !code.trim()}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Generate Document
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="result" className="space-y-6">
              {result ? (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Generated Document</h3>
                    <Separator className="my-2" />
                    <div className="border rounded-md" style={{ minHeight: '400px' }}>
                      <MonacoEditor
                        value={result}
                        language="markdown"
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
                  <p className="text-gray-500">No document generated yet. Generate a document first.</p>
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
};

export default DocumentGenerator;
