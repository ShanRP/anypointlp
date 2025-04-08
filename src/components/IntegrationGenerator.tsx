import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import MonacoEditor from './MonacoEditor';
import { BackButton } from './ui/BackButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Check, FileCode, RefreshCw, UploadCloud, ArrowLeft, Folder, File, FolderTree, Upload, X } from 'lucide-react';
import { useGithubApi } from '@/hooks/useGithubApi';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useSaveToWorkspace } from '@/hooks/useSaveToWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { Input } from './ui/input';

export interface IntegrationGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

interface RamlFile {
  name: string;
  path: string;
  content: string;
  sha?: string;
}

interface FileNode {
  type: 'file' | 'directory';
  name: string;
  path: string;
  isRaml?: boolean;
  children?: FileNode[];
}

const IntegrationGenerator: React.FC<IntegrationGeneratorProps> = ({ 
  onTaskCreated,
  selectedWorkspaceId, 
  onBack,
  onSaveTask
}) => {
  const [description, setDescription] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('noRepository');
  const [runtime, setRuntime] = useState<string>('4.4');
  const [diagrams, setDiagrams] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [result, setResult] = useState('');
  const [ramlOption, setRamlOption] = useState<string>('none');
  const [ramlContent, setRamlContent] = useState('');
  const [diagramsBase64, setDiagramsBase64] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFolderRef = useRef<HTMLInputElement>(null);
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [folderStructure, setFolderStructure] = useState<FileNode[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('/');
  const [selectedRamlFile, setSelectedRamlFile] = useState<RamlFile | null>(null);
  const [loadingRamlFile, setLoadingRamlFile] = useState(false);

  const { saveTask } = useSaveToWorkspace();
  const { user } = useAuth();
  
  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent } = useGithubApi();
  const { selectedRepository } = useRepositoryData();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setDiagrams(files);
      toast.success(`${files.length} diagram${files.length > 1 ? 's' : ''} uploaded`);
    }
  };

  const handleProjectFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setProjectFiles(files);
      
      const structure = buildFolderStructure(files);
      setFolderStructure(structure);
      setCurrentFolder('/');
      
      toast.success(`Project folder with ${files.length} files uploaded`);
    }
  };

  const buildFolderStructure = (files: File[]): FileNode[] => {
    const root: Record<string, FileNode> = {};
    
    files.forEach(file => {
      const path = file.webkitRelativePath || file.name;
      const parts = path.split('/');
      
      let current = root;
      
      // Process directory parts
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {
            type: 'directory',
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            children: []
          };
        }
        
        if (!current[part].children) {
          current[part].children = [];
        }
        
        current = current[part].children?.reduce((acc, child) => {
          acc[child.name] = child;
          return acc;
        }, {} as Record<string, FileNode>) || {};
      }
      
      // Add the file
      const fileName = parts[parts.length - 1];
      const filePath = path;
      const isRaml = fileName.toLowerCase().endsWith('.raml');
      
      const fileNode: FileNode = {
        type: 'file',
        name: fileName,
        path: filePath,
        isRaml
      };
      
      if (parts.length === 1) {
        // Root level file
        root[fileName] = fileNode;
      } else {
        // Add to parent directory's children
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const parentParts = parentPath.split('/');
        let parent = root;
        
        // Navigate to parent
        for (const part of parentParts) {
          if (parent[part] && parent[part].children) {
            const childrenMap = parent[part].children?.reduce((acc, child) => {
              acc[child.name] = child;
              return acc;
            }, {} as Record<string, FileNode>) || {};
            
            parent = childrenMap;
          } else {
            break;
          }
        }
        
        // Add file to parent's children
        const parentDir = parentParts[parentParts.length - 1];
        if (parent[parentDir] && Array.isArray(parent[parentDir].children)) {
          parent[parentDir].children?.push(fileNode);
        }
      }
    });
    
    // Convert the nested object to an array structure
    const convertToArray = (obj: Record<string, FileNode>): FileNode[] => {
      return Object.values(obj).map(node => {
        if (node.children) {
          node.children = Array.isArray(node.children) 
            ? node.children 
            : convertToArray(node.children as unknown as Record<string, FileNode>);
        }
        return node;
      });
    };
    
    return convertToArray(root);
  };

  const getCurrentFolderContents = (): FileNode[] => {
    if (selectedOption === 'withRepository') {
      // GitHub repository browser logic
      if (!fileStructure || fileStructure.length === 0) {
        return [];
      }
      
      if (currentFolder === '/') {
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
      
      const dirContents = findDirectory(fileStructure, currentFolder);
      return dirContents || [];
    } else if (selectedOption === 'uploadComputer') {
      // Local folder browser logic
      const parts = currentFolder.split('/').filter(Boolean);
      let currentNode = { children: folderStructure } as { children: FileNode[] };
      
      // Navigate to the current folder
      for (const part of parts) {
        const nextNode = currentNode.children?.find(
          node => node.type === 'directory' && node.name === part
        );
        if (nextNode && nextNode.children) {
          currentNode = { children: nextNode.children } as { children: FileNode[] };
        } else {
          return [];
        }
      }
      
      return currentNode.children || [];
    }
    
    return [];
  };

  const navigateFolder = (folder: FileNode) => {
    if (folder.type === 'directory') {
      const newPath = currentFolder === '/' 
        ? `/${folder.name}` 
        : `${currentFolder}/${folder.name}`;
      setCurrentFolder(newPath);
    }
  };

  const navigateUp = () => {
    if (currentFolder === '/') return;
    
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length === 0 ? '/' : `/${parts.join('/')}`;
    setCurrentFolder(newPath);
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      // Check if it's a RAML file (end with .raml extension)
      const isRamlFile = file.name.toLowerCase().endsWith('.raml');
      
      if (isRamlFile) {
        setLoadingRamlFile(true);
        try {
          let content: string | null = null;
          
          if (selectedOption === 'withRepository' && selectedRepository) {
            // For GitHub repository files
            content = await fetchFileContent(selectedRepository, file.path);
          } else if (selectedOption === 'uploadComputer') {
            // For uploaded local files, find the file in projectFiles
            const uploadedFile = projectFiles.find(f => {
              const relativePath = f.webkitRelativePath || f.name;
              return relativePath === file.path || relativePath.endsWith(file.path);
            });
            
            if (uploadedFile) {
              content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = reject;
                reader.readAsText(uploadedFile);
              });
            }
          }
          
          if (content) {
            // Create a RAML file object
            const ramlFile = {
              name: file.name,
              path: file.path,
              content: content
            };
            
            // Update state
            setSelectedRamlFile(ramlFile);
            setRamlContent(content);
            setRamlOption('input'); // Set to 'input' to show the content
            
            toast.success(`RAML file "${file.name}" loaded successfully`);
          } else {
            throw new Error(`Could not load content from "${file.name}"`);
          }
        } catch (error) {
          console.error("Error loading RAML file:", error);
          toast.error(`Error loading RAML file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setLoadingRamlFile(false);
        }
      } else {
        // Handle non-RAML files if needed
        toast.info(`Selected file "${file.name}" is not a RAML file`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!description) {
      toast.error('Please provide a description');
      return;
    }

    setIsLoading(true);
    try {
      // Convert diagrams to base64 if any
      if (diagrams.length > 0) {
        const base64Promises = Array.from(diagrams).map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64.split(',')[1]); // Remove the data URL prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        const base64Results = await Promise.all(base64Promises);
        setDiagramsBase64(base64Results);
      }

      // Prepare the prompt based on source type and inputs
      const requestBody: any = {
        description,
        runtime,
        diagrams: diagramsBase64.length > 0 ? diagramsBase64 : null,
      };
      
      // Add RAML content if provided
      if (selectedRamlFile) {
        requestBody.raml = { content: selectedRamlFile.content };
      } else if (ramlOption === 'input' && ramlContent) {
        requestBody.raml = { content: ramlContent };
      }

      // Generate a response
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
              content: 'You are a MuleSoft expert specialized in creating integration flows based on specifications. Provide detailed, well-structured integration code.'
            },
            {
              role: 'user',
              content: `Please generate a MuleSoft integration flow based on the following specification:\n\nDescription: ${description}\nRuntime: ${runtime}\n${selectedRamlFile || (ramlOption === 'input' && ramlContent) ? `RAML: ${selectedRamlFile?.content || ramlContent}` : 'No RAML provided'}\n${diagramsBase64.length > 0 ? 'Diagrams are provided.' : 'No diagrams provided.'}`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const generatedXml = data.choices[0].message.content;
        setResult(generatedXml);
        
        // Save the task to workspace
        if (user && selectedWorkspaceId) {
          // Generate a unique task ID with a format similar to the dataweave tasks
          const taskId = `T-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
          
          // Create a task object with structure matching the tasks in useWorkspaceTasks
          const newTask = {
            workspace_id: selectedWorkspaceId,
            task_id: taskId,
            task_name: `Integration Flow`,
            user_id: user.id,
            category: 'integration',
            description: description,
            input_format: 'xml',
            input_samples: [
              {
                description: description,
                raml: selectedRamlFile?.content || ramlContent || '',
                runtime: runtime
              }
            ],
            output_samples: [],
            notes: '',
            generated_scripts: [
              {
                name: 'Generated Flow',
                content: generatedXml,
                language: 'xml'
              }
            ],
            username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous'
          };
          
          try {
            const savedTask = await saveTask(newTask);
            
            if (savedTask && onTaskCreated) {
              onTaskCreated({
                id: savedTask[0].id,
                label: `Integration Flow`,
                category: 'integration',
                icon: <FileCode size={16} />,
                workspace_id: selectedWorkspaceId
              });
            }
            
            toast.success('Integration flow generated and saved successfully!');
            
            // Notify parent component about the saved task if callback is provided
            if (onSaveTask && savedTask) {
              onSaveTask(savedTask[0].id);
            }
          } catch (error) {
            console.error('Error saving task:', error);
            toast.error('Generated successfully but failed to save task');
          }
        }
        
        setActiveTab('result');
      } else {
        throw new Error('Failed to generate integration flow');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate integration flow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton onBack={onBack} label="Back to Dashboard" />
      
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardTitle>Integration Generator</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create flow code from flow specifications and flow diagrams</p>
        </CardHeader>
        
        <motion.div 
          className="h-1 bg-gradient-to-r from-purple-500 to-indigo-600"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5 }}
        />
        
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>
            
            <TabsContent value="input" className="space-y-6">
              <div className="space-y-4">
                <RadioGroup 
                  value={selectedOption} 
                  onValueChange={setSelectedOption}
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
                    <RadioGroupItem value="uploadComputer" id="uploadComputer" />
                    <Label htmlFor="uploadComputer">Upload from Computer</Label>
                  </div>
                </RadioGroup>
                
                {selectedOption === 'withRepository' && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    <h3 className="font-medium">Repository Selection</h3>
                    
                    {loadingRepositories ? (
                      <div className="py-4 text-center">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading repositories...</p>
                      </div>
                    ) : repositories.length > 0 ? (
                      <div className="space-y-2">
                        {repositories.map((repo) => (
                          <div 
                            key={repo.id}
                            onClick={() => {
                              fetchFileStructure(repo);
                            }}
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
                        <p className="text-sm text-gray-500 mb-2">No repositories found.</p>
                        <Button onClick={fetchRepositories} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Repositories
                        </Button>
                      </div>
                    )}
                    
                    {selectedRepository && fileStructure && fileStructure.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Files</h4>
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-gray-100 p-2 flex items-center border-b">
                            <button 
                              onClick={navigateUp}
                              disabled={currentFolder === '/'} 
                              className={`p-1 rounded mr-2 ${currentFolder === '/' ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
                            >
                              <ArrowLeft size={16} />
                            </button>
                            <span className="text-sm font-medium truncate">
                              {currentFolder === '/' ? 'Root' : currentFolder}
                            </span>
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto">
                            {getCurrentFolderContents().length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No files found in this directory
                              </div>
                            ) : (
                              <div className="divide-y">
                                {getCurrentFolderContents().map((item, index) => {
                                  // Check if it's a RAML file
                                  const isRamlFile = item.type === 'file' && item.name.toLowerCase().endsWith('.raml');
                                  
                                  return (
                                    <div 
                                      key={index}
                                      onClick={() => item.type === 'directory' ? navigateFolder(item) : handleFileSelect({...item, isRaml: isRamlFile})}
                                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                        selectedRamlFile && item.type === 'file' && item.path === selectedRamlFile.path
                                          ? 'bg-purple-50' 
                                          : ''
                                      }`}
                                    >
                                      {item.type === 'directory' ? (
                                        <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                      ) : isRamlFile ? (
                                        <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                                      ) : (
                                        <File className="h-4 w-4 mr-2 text-gray-500" />
                                      )}
                                      <span className={`${isRamlFile ? 'font-medium text-purple-700' : ''}`}>
                                        {item.name}
                                      </span>
                                      {selectedRamlFile && item.type === 'file' && item.path === selectedRamlFile.path && (
                                        <Check className="h-4 w-4 ml-auto text-purple-600" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedOption === 'uploadComputer' && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    <h3 className="font-medium">Upload Project Folder</h3>
                    
                    {projectFiles.length === 0 ? (
                      <div
                        onClick={() => projectFolderRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors"
                      >
                        <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to select a project folder</p>
                        <input 
                          type="file" 
                          ref={projectFolderRef} 
                          onChange={handleProjectFolderUpload} 
                          style={{ display: 'none' }} 
                          webkitdirectory="" 
                          directory=""
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Uploaded: {projectFiles.length} files from folder
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setProjectFiles([]);
                              setFolderStructure([]);
                              setCurrentFolder('/');
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Change Folder
                          </Button>
                        </div>
                        
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-gray-100 p-2 flex items-center border-b">
                            <button 
                              onClick={navigateUp}
                              disabled={currentFolder === '/'} 
                              className={`p-1 rounded mr-2 ${currentFolder === '/' ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
                            >
                              <ArrowLeft size={16} />
                            </button>
                            <span className="text-sm font-medium truncate">
                              {currentFolder === '/' ? 'Root' : currentFolder}
                            </span>
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto">
                            {getCurrentFolderContents().length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No files found in this directory
                              </div>
                            ) : (
                              <div className="divide-y">
                                {getCurrentFolderContents().map((item, index) => {
                                  // Check if it's a RAML file
                                  const isRamlFile = item.type === 'file' && item.name.toLowerCase().endsWith('.raml');
                                  
                                  return (
                                    <div 
                                      key={index}
                                      onClick={() => item.type === 'directory' ? navigateFolder(item) : handleFileSelect({...item, isRaml: isRamlFile})}
                                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                        selectedRamlFile && item.type === 'file' && item.path === selectedRamlFile.path
                                          ? 'bg-purple-50' 
                                          : ''
                                      }`}
                                    >
                                      {item.type === 'directory' ? (
                                        <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                      ) : isRamlFile ? (
                                        <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                                      ) : (
                                        <File className="h-4 w-4 mr-2 text-gray-500" />
                                      )}
                                      <span className={`${isRamlFile ? 'font-medium text-purple-700' : ''}`}>
                                        {item.name}
                                      </span>
                                      {selectedRamlFile && item.type === 'file' && item.path === selectedRamlFile.path && (
                                        <Check className="h-4 w-4 ml-auto text-purple-600" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Description<span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the flow that you want to add."
                    className="min-h-32"
                    required
                  />
                </div>
                
                {/* Display the selected RAML file if one is selected */}
                {selectedRamlFile && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Selected RAML File:</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedRamlFile(null);
                          setRamlContent('');
                          setRamlOption('none');
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                      <div className="flex items-center mb-2">
                        <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                        <span className="font-medium">{selectedRamlFile.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Path: {selectedRamlFile.path}</div>
                      {selectedRamlFile.content && (
                        <div className="mt-2 border rounded-md overflow-hidden">
                          <MonacoEditor
                            value={selectedRamlFile.content}
                            language="yaml"
                            height="200px"
                            options={{ minimap: { enabled: false }, readOnly: true }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* RAML section - shown when no RAML file is selected */}
                {!selectedRamlFile && (
                  <div className="space-y-2">
                    <Label className="text-base font-medium">RAML</Label>
                    <p className="text-sm text-gray-500">Add RAML specifications to generate code from.</p>
                
                    <RadioGroup 
                      value={ramlOption} 
                      onValueChange={setRamlOption}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="raml-none" />
                        <Label htmlFor="raml-none">No RAML</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="input" id="raml-input" />
                        <Label htmlFor="raml-input">Enter RAML</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="workspace" id="raml-workspace" />
                        <Label htmlFor="raml-workspace">Select from Exchange</Label>
                      </div>
                    </RadioGroup>
                
                    {ramlOption === 'input' && (
                      <div className="mt-4">
                        <Label htmlFor="raml-content" className="block text-sm font-medium mb-2">
                          RAML Content:
                        </Label>
                        <div className="h-64 border rounded-md overflow-hidden">
                          <MonacoEditor
                            value={ramlContent}
                            onChange={(value) => setRamlContent(value || '')}
                            language="yaml"
                            height="256px"
                          />
                        </div>
                      </div>
                    )}
                
                    {ramlOption === 'workspace' && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md border">
                        <p className="text-center text-gray-500">Exchange RAML selection coming soon</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-base font-medium">Diagrams:</Label>
                  <p className="text-sm text-gray-500">Upload diagrams that explain the flow (Optional)</p>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors"
                  >
                    <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload diagrams</p>
                    <span className="text-xs text-gray-400 mt-1">Supports PNG, JPG, or PDF</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                      multiple 
                      accept="image/*,.pdf"
                    />
                  </div>
                  
                  {diagrams.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Uploaded Diagrams:</h3>
                      <div className="space-y-2">
                        {Array.from(diagrams).map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDiagrams = Array.from(diagrams);
                                newDiagrams.splice(index, 1);
                                setDiagrams(newDiagrams);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 h-auto"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base font-medium">Runtime Version:</Label>
                  <select 
                    value={runtime}
                    onChange={(e) => setRuntime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="4.4">Mule 4.4</option>
                    <option value="4.3">Mule 4.3</option>
                    <option value="4.2">Mule 4.2</option>
                    <option value="3.9">Mule 3.9</option>
                  </select>
                </div>
                
                <div className="pt-4">
                  <Button 
                    disabled={!description || isLoading} 
                    onClick={handleSubmit} 
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : 'Generate Integration Flow'}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="result" className="space-y-6">
              {result ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Flow Summary</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(result);
                        toast.success('Copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  
                  <div className="prose prose-sm max-w-none mb-6">
                    {result.split('\n').map((line, i) => (
                      <div key={i}>
                        {line || <br />}
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b">
                      <h3 className="font-medium">Generated Flow XML</h3>
                    </div>
                    <MonacoEditor
                      value={result}
                      language="xml"
                      height="400px"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false }
                      }}
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('input')}
                    >
                      Back to Input
                    </Button>
                    <Button 
                      onClick={() => {
                        setDescription('');
                        setRamlOption('none');
                        setRamlContent('');
                        setSelectedRamlFile(null);
                        setDiagrams([]);
                        setDiagramsBase64([]);
                        setResult('');
                        setActiveTab('input');
                      }}
                    >
                      Create New Flow
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No integration flow has been generated yet.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('input')}
                  >
                    Go to Input
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

export default IntegrationGenerator;
