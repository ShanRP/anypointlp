import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Plus, Check, Loader2, Copy, FileCode, Users, Calendar, Edit, Trash2, ArrowRight, FileArchive, GitBranch, Folder, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MonacoEditor from './MonacoEditor';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useGithubApi } from '@/hooks/useGithubApi';
import type { FileNode, Repository } from '@/utils/githubUtils';
import { BackButton } from './ui/BackButton';

export interface IntegrationGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

interface RamlItem {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
}

interface Branch {
  name: string;
  commit: {
    sha: string;
  };
}

interface RamlFile {
  name: string;
  path: string;
  sha: string;
  content?: string;
}

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

const IntegrationGenerator: React.FC<IntegrationGeneratorProps> = ({
  onTaskCreated,
  selectedWorkspaceId,
  onBack,
  onSaveTask
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [diagrams, setDiagrams] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState('noRepository');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [javaVersion, setJavaVersion] = useState('8.0');
  const [mavenVersion, setMavenVersion] = useState('3.8');
  const [showVersionsPopup, setShowVersionsPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'editor' | 'result'>('editor');
  const [parsedSections, setParsedSections] = useState<{
    flowSummary: string;
    flowImplementation: string;
    flowConstants: string;
    pomDependencies: string;
    compilationCheck: string;
  } | null>(null);
  const [taskId, setTaskId] = useState<string>(`IG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [generatedTimestamp, setGeneratedTimestamp] = useState<string>('');

  const [ramlContent, setRamlContent] = useState<string>('');
  const [ramlOption, setRamlOption] = useState<'none' | 'input' | 'workspace'>('none');
  const [workspaceRamls, setWorkspaceRamls] = useState<RamlItem[]>([]);
  const [selectedRaml, setSelectedRaml] = useState<RamlItem | null>(null);
  const [loadingRamls, setLoadingRamls] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    repositories, 
    loadingRepositories, 
    fetchRepositories, 
    fileStructure, 
    loadingFileStructure, 
    fetchFileStructure,
    fetchFileContent 
  } = useGithubApi();
  
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [ramlFiles, setRamlFiles] = useState<RamlFile[]>([]);
  const [selectedRamlFile, setSelectedRamlFile] = useState<RamlFile | null>(null);
  const [loadingRamlFile, setLoadingRamlFile] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');
  const [localProjectFiles, setLocalProjectFiles] = useState<FileNode[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFolderRef = useRef<HTMLInputElement>(null);
  const { selectedWorkspace } = useWorkspaces();
  
  useEffect(() => {
    const storedRepo = localStorage.getItem('APL_selectedGithubRepo');
    if (storedRepo && selectedOption === 'withRepository') {
      try {
        const repoData = JSON.parse(storedRepo);
        setSelectedRepository(repoData);
        fetchFileStructure(repoData);
      } catch (error) {
        console.error('Error parsing stored GitHub repo:', error);
      }
    }
  }, [selectedOption, fetchFileStructure]);

  useEffect(() => {
    const storedRaml = sessionStorage.getItem('selectedRamlForIntegration');
    if (storedRaml) {
      try {
        const ramlData = JSON.parse(storedRaml) as RamlItem;
        setSelectedRaml(ramlData);
        setRamlContent(ramlData.content);
        setRamlOption('input');
        setDescription(ramlData.description || description);

        sessionStorage.removeItem('selectedRamlForIntegration');
        toast.success(`RAML "${ramlData.title}" loaded from Exchange`);
      } catch (error) {
        console.error('Error parsing stored RAML:', error);
      }
    }
  }, [description]);

  useEffect(() => {
    if (selectedOption === 'withRepository') {
      fetchRepositories();
    }
  }, [selectedOption, fetchRepositories]);

  useEffect(() => {
    if (selectedRepository) {
      fetchFileStructure(selectedRepository);
    }
  }, [selectedRepository, fetchFileStructure]);

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file' && file.isRaml) {
      setLoadingRamlFile(true);
      try {
        const existingRamlFile = ramlFiles.find(r => r.path === file.path);

        if (existingRamlFile && existingRamlFile.content) {
          setSelectedRamlFile(existingRamlFile);
          setRamlContent(existingRamlFile.content);
          setRamlOption('input');
          toast.success(`RAML file "${existingRamlFile.name}" selected`);
        } else {
          if (selectedRepository) {
            try {
              const content = await fetchFileContent(selectedRepository, file.path);
              
              if (content) {
                const ramlFile: RamlFile = {
                  name: file.name,
                  path: file.path,
                  sha: file.path,
                  content: content
                };
                
                const updatedRamlFiles = [...ramlFiles];
                const fileIndex = updatedRamlFiles.findIndex(r => r.path === file.path);
                
                if (fileIndex !== -1) {
                  updatedRamlFiles[fileIndex] = ramlFile;
                } else {
                  updatedRamlFiles.push(ramlFile);
                }
                
                setRamlFiles(updatedRamlFiles);
                setSelectedRamlFile(ramlFile);
                setRamlContent(content);
                setRamlOption('input');
                toast.success(`RAML file "${file.name}" loaded successfully`);
              } else {
                throw new Error(`Could not load content from "${file.name}"`);
              }
            } catch (error) {
              console.error("Error fetching file content:", error);
              toast.error(`Failed to fetch RAML content: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else if (selectedOption === 'uploadComputer') {
            try {
              const localFile = Array.from(projectFolderRef.current?.files || [])
                .find(f => f.webkitRelativePath === file.path);
                
              if (localFile) {
                const content = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.onerror = reject;
                  reader.readAsText(localFile);
                });
                
                const ramlFile: RamlFile = {
                  name: file.name,
                  path: file.path,
                  sha: file.path,
                  content: content
                };
                
                const updatedRamlFiles = [...ramlFiles];
                const fileIndex = updatedRamlFiles.findIndex(r => r.path === file.path);
                
                if (fileIndex !== -1) {
                  updatedRamlFiles[fileIndex] = ramlFile;
                } else {
                  updatedRamlFiles.push(ramlFile);
                }
                
                setRamlFiles(updatedRamlFiles);
                setSelectedRamlFile(ramlFile);
                setRamlContent(content);
                setRamlOption('input');
                toast.success(`RAML file "${file.name}" loaded successfully`);
              } else {
                throw new Error(`Could not find local file "${file.path}"`);
              }
            } catch (error) {
              console.error("Error reading local file:", error);
              toast.error(`Failed to read RAML file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      } catch (error) {
        console.error("Error selecting RAML file:", error);
        toast.error(`Error selecting RAML file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoadingRamlFile(false);
      }
    }
  };

  const navigateDirectory = (dir: FileNode) => {
    if (dir.type === 'directory') {
      setCurrentDirectory(dir.path);
      toast.success(`Navigated to ${dir.name}`);
    }
  };

  const getCurrentDirectoryContents = () => {
    if (currentDirectory === '/') {
      return selectedOption === 'withRepository' ? fileStructure : localProjectFiles;
    }

    const findDirectory = (nodes: FileNode[], path: string): FileNode[] | null => {
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

    const dirContents = findDirectory(
      selectedOption === 'withRepository' ? fileStructure : localProjectFiles,
      currentDirectory
    );

    return dirContents || [];
  };

  const goUpDirectory = () => {
    if (currentDirectory === '/') return;

    const pathParts = currentDirectory.split('/');
    pathParts.pop();
    const parentPath = pathParts.length === 1 ? '/' : pathParts.join('/');

    setCurrentDirectory(parentPath);
  };

  const handleRepositorySelect = (repo: Repository) => {
    setSelectedRepository(repo);
    setRamlFiles([]);
    setSelectedRamlFile(null);
    setCurrentDirectory('/');

    localStorage.setItem('APL_selectedGithubRepo', JSON.stringify(repo));

    toast.success(`Repository "${repo.name}" selected`);
  };

  const fetchWorkspaceRamls = async () => {
    if (!selectedWorkspaceId && !selectedWorkspace?.id) return;

    setLoadingRamls(true);
    try {
      const { data, error } = await supabase
        .from('apl_exchange_items')
        .select('*')
        .eq('type', 'raml')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRamls = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        content: typeof item.content === 'object' && item.content !== null && 'raml' in item.content
          ? String(item.content.raml)
          : '',
        type: 'raml'
      }));

      setWorkspaceRamls(formattedRamls);
    } catch (error) {
      console.error('Error fetching RAMLs:', error);
      toast.error('Failed to load RAMLs from workspace');
    } finally {
      setLoadingRamls(false);
    }
  };

  useEffect(() => {
    if (ramlOption === 'workspace') {
      fetchWorkspaceRamls();
    }
  }, [ramlOption, selectedWorkspaceId, selectedWorkspace?.id]);

  const handleRamlSelect = (raml: RamlItem) => {
    setSelectedRaml(raml);
    setRamlContent(raml.content);
    toast.success(`RAML "${raml.title}" selected`);
  };

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    setCurrentDirectory('/');

    if (option === 'uploadComputer') {
      setRamlOption('none');
      setSelectedRaml(null);
      setRamlContent('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDiagrams(Array.from(e.target.files));
    }
  };

  const handleProjectFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      const fileStructure: FileNode[] = [];
      const directories: Record<string, FileNode> = {};

      files.forEach(file => {
        const path = file.webkitRelativePath;
        const pathParts = path.split('/');

        if (pathParts.length <= 1) return;

        let currentPath = '';
        let parentNode: FileNode | null = null;

        for (let i = 0; < pathParts.length - 1; i++) {
          const part = pathParts[i];
          const newPath = currentPath ? `${currentPath}/${part}` : part;
          currentPath = newPath;

          if (!directories[newPath]) {
            const newNode: FileNode = {
              name: part,
              path: newPath,
              type: 'directory',
              children: []
            };

            directories[newPath] = newNode;

            if (i === 0) {
              fileStructure.push(newNode);
            } else if (parentNode) {
              parentNode.children?.push(newNode);
            }
          }

          parentNode = directories[newPath];
        }

        if (parentNode) {
          const fileName = pathParts[pathParts.length - 1];
          const isRaml = fileName.endsWith('.raml');

          const fileNode: FileNode = {
            name: fileName,
            path: path,
            type: 'file',
            isRaml
          };

          parentNode.children?.push(fileNode);

          if (isRaml) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target && typeof event.target.result === 'string') {
                const ramlFile: RamlFile = {
                  name: fileName,
                  path: path,
                  sha: path,
                  content: event.target.result
                };

                setRamlFiles(prev => [...prev, ramlFile]);
              }
            };
            reader.readAsText(file);
          }
        }
      });

      setLocalProjectFiles(fileStructure);
      toast.success('Project folder loaded successfully');
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProjectFolderClick = () => {
    if (projectFolderRef.current) {
      projectFolderRef.current.click();
    }
  };

  const handleRuntimeSettingsClick = () => {
    setShowVersionsPopup(!showVersionsPopup);
  };

  const handleJavaVersionSelect = (version: string) => {
    setJavaVersion(version);
    setShowVersionsPopup(false);
  };

  const handleMavenVersionSelect = (version: string) => {
    setMavenVersion(version);
    setShowVersionsPopup(false);
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const parseGeneratedCode = (code: string) => {
    const flowSummaryPattern = /(?:^|\n)(?:#{1,3}\s*)?Flow Summary\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?Flow Implementation|$)/i;
    const flowSummaryMatch = code.match(flowSummaryPattern);
    
    const flowImplementationPattern = /(?:^|\n)(?:#{1,3}\s*)?Flow Implementation\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?Flow Constants|$)/i;
    const flowImplementationMatch = code.match(flowImplementationPattern);
    
    const flowConstantsPattern = /(?:^|\n)(?:#{1,3}\s*)?Flow Constants\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?POM Dependencies|$)/i;
    const flowConstantsMatch = code.match(flowConstantsPattern);
    
    const pomDependenciesPattern = /(?:^|\n)(?:#{1,3}\s*)?POM Dependencies\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?Compilation Check|$)/i;
    const pomDependenciesMatch = code.match(pomDependenciesPattern);
    
    const compilationCheckPattern = /(?:^|\n)(?:#{1,3}\s*)?Compilation Check\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=$)/i;
    const compilationCheckMatch = code.match(compilationCheckPattern);

    return {
      flowSummary: flowSummaryMatch ? flowSummaryMatch[1].trim() : '',
      flowImplementation: flowImplementationMatch ? flowImplementationMatch[1].trim() : code,
      flowConstants: flowConstantsMatch ? flowConstantsMatch[1].trim() : '',
      pomDependencies: pomDependenciesMatch ? pomDependenciesMatch[1].trim() : '',
      compilationCheck: compilationCheckMatch ? compilationCheckMatch[1].trim() : ''
    };
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please provide a description for the integration');
      return;
    }

    setIsLoading(true);
    setError(null);
    const toastId = toast.loading('Generating integration code...');

    try {
      const diagramsBase64 = await Promise.all(
        diagrams.map(async (file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64.split(',')[1]);
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const runtime = `Java ${javaVersion}, Maven ${mavenVersion}`;
      
      const requestBody: any = {
        description,
        runtime,
        diagrams: diagramsBase64.length > 0 ? diagramsBase64 : null,
      };
      
      if (selectedRamlFile && selectedRamlFile.content) {
        requestBody.raml = { content: selectedRamlFile.content };
      } else if (ramlOption !== 'none' && ramlContent) {
        requestBody.raml = { content: ramlContent };
      }
      
      if (selectedRamlFile) {
        requestBody.selectedFile = {
          name: selectedRamlFile.name,
          path: selectedRamlFile.path
        };
      }

      console.log('Sending integration request with:', {
        description,
        runtime,
        diagrams: diagramsBase64.length > 0,
        raml: (selectedRamlFile && selectedRamlFile.content) || (ramlOption !== 'none' && ramlContent) 
          ? { content: 'RAML content present (not shown for brevity)' } 
          : undefined,
        selectedFile: selectedRamlFile 
          ? { name: selectedRamlFile.name, path: selectedRamlFile.path }
          : undefined
      });

      const { data, error } = await supabase.functions.invoke('generate-integration', {
        body: requestBody,
      });

      toast.dismiss(toastId);

      if (error) {
        console.error('Supabase function error:', error);
        setError(`Error calling the integration generator: ${error.message || 'Unknown error'}`);
        toast.error(`Failed to generate integration: ${error.message || 'Unknown error'}`);
        return;
      }

      console.log('Integration generation response:', data);

      if (!data || !data.success) {
        const errorMessage = data?.error || 'Failed to generate integration code';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const generatedCodeResult = data.code;
      setGeneratedCode(generatedCodeResult);

      const parsedResult = parseGeneratedCode(generatedCodeResult);
      setParsedSections(parsedResult);
      setCurrentView('result');
      
      const now = new Date();
      setGeneratedTimestamp(now.toLocaleString());

      const workspaceId = selectedWorkspaceId || selectedWorkspace?.id || '';
      console.log('Using workspace ID for saving:', workspaceId);

      if (user) {
        try {
          // Direct SQL RPC call to avoid TypeScript issues with database schema
          const { data: rpcData, error: rpcError } = await supabase.rpc('apl_save_integration_task', {
            p_task_id: taskId,
            p_task_name: 'Integration Flow',
            p_description: description,
            p_user_id: user.id,
            p_workspace_id: workspaceId,
            p_category: 'integration',
            p_runtime: `Java ${javaVersion}, Maven ${mavenVersion}`,
            p_raml_content: selectedRamlFile?.content || ramlContent || '',
            p_generated_code: generatedCodeResult,
            p_flow_summary: parsedResult.flowSummary || '',
            p_flow_implementation: parsedResult.flowImplementation || '',
            p_flow_constants: parsedResult.flowConstants || '',
            p_pom_dependencies: parsedResult.pomDependencies || '',
            p_compilation_check: parsedResult.compilationCheck || '',
            p_diagrams: diagramsBase64.length > 0 ? diagramsBase64 : null
          });

          if (rpcError) {
            console.error('Error saving integration task:', rpcError);
          } else {
            console.log('Successfully saved integration task:', rpcData);
            if (rpcData && onSaveTask) {
              onSaveTask(rpcData);
            }
          }
        } catch (error) {
          console.error("Error saving integration task:", error);
        }
      }

      if (user) {
        try {
          const taskData = {
            user_id: user.id,
            workspace_id: workspaceId,
            task_id: taskId,
            task_name: 'Integration Flow',
            input_format: 'Flow Specification',
            input_samples: JSON.parse(JSON.stringify([{ id: 'input1', value: description, isValid: true }])),
            output_samples: JSON.parse(JSON.stringify([])),
            notes: description,
            generated_scripts: JSON.parse(JSON.stringify([{
              id: `script-${Date.now()}`,
              code: generatedCodeResult,
              pairId: 'input1'
            }])),
            category: 'integration',
            username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
            description: description.substring(0, 255)
          };

          console.log('Saving integration task to general tasks table:', taskData.task_id);
          const { data, error } = await supabase
            .from('apl_dataweave_tasks')
            .insert([taskData]);
            
          if (error) {
            console.error('Error saving to general tasks table:', error);
          } else {
            console.log('Successfully saved to general tasks table');
          }
        } catch (error) {
          console.error("Error saving to general tasks table:", error);
        }
      }

      if (onTaskCreated) {
        const newTask = {
          id: `task-${Date.now()}`,
          label: `Integration Generator`,
          category: 'integration',
          task_id: taskId,
          task_name: 'Integration Flow',
          icon: 'CodeIcon',
          workspace_id: workspaceId,
          created_at: new Date().toISOString(),
          input_format: 'Flow Specification',
          notes: description,
          generated_scripts: [
            {
              id: `script-${Date.now()}`,
              code: generatedCodeResult
            }
          ]
        };

        onTaskCreated(newTask);
      }

      toast.success('Integration code generated successfully!');
    } catch (error: any) {
      console.error('Error generating integration:', error);
      setError(`Failed to generate integration code: ${error.message || 'Unknown error'}`);
      toast.error(`Failed to generate integration code: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const filteredRamls = workspaceRamls.filter(raml =>
    raml.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    raml.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRepositorySelection = () => {
    if (selectedOption !== 'withRepository') return null;

    return (
      <div className="space-y-4 mt-4">
        <label className="block font-medium mb-2">
          Repository:
        </label>

        {loadingRepositories ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {!selectedRepository ? (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">No repository selected</p>
                <p className="text-gray-400 text-sm mt-1">Select a repository in Repository Settings</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-md">
                  <div className="flex items-center">
                    <FileCode className="h-5 w-5 mr-2 text-purple-600" />
                    <div>
                      <div className="font-medium">{selectedRepository.name}</div>
                      <div className="text-sm text-gray-600">{selectedRepository.full_name}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Repository Files:
                  </label>

                  {loadingRamlFile ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
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
                            {getCurrentDirectoryContents().map((item, index) => (
                              <div
                                key={index}
                                onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                  selectedRamlFile && item.type === 'file' && item.path === selectedRamlFile.path
                                    ? 'bg-purple-50'
                                    : ''
                                }`}
                              >
                                {item.type === 'directory' ? (
                                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                ) : item.isRaml ? (
                                  <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                                ) : (
                                  <File className="h-4 w-4 mr-2 text-gray-500" />
                                )}
                                <span className={`${item.isRaml ? 'font-medium text-purple-700' : ''}`}>
                                  {item.name}
                                </span>
                                {selectedRamlFile && item.type === 'file' && item.path === selectedRamlFile.path && (
                                  <Check className="h-4 w-4 ml-auto text-purple-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedRamlFile && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Selected File:</h3>
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
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderProjectFolderUpload = () => {
    if (selectedOption !== 'uploadComputer') return null;

    return (
      <div className="mt-4">
        <input
          type="file"
          ref={projectFolderRef}
          style={{ display: 'none' }}
          onChange={handleProjectFolderUpload}
          webkitdirectory=""
          directory=""
          multiple
        />
        <div
          className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleProjectFolderClick}
        >
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-1">Drag and drop or select your Mule project folder</p>
            <p className="text-sm text-gray-500">
              The code is used only for the purpose of the task and will be deleted once task is done
            </p>
          </div>
        </div>

        {localProjectFiles.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Project Files:
            </label>

            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 p-2 flex items-center border-b">
                <button
                  onClick={goUpDirectory}
                  disabled={currentDirectory === '/'}
                  className={`p-1 rounded mr-2 ${currentDirectory === '/' ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <ArrowLeft size={16} />
                </
