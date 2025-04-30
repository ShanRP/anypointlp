
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Loader2, ArrowLeft, FileCode, Check, Folder, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAnimate, useFadeIn } from '@/utils/animationHooks';
import { supabase } from '@/integrations/supabase/client';
import DataWeaveInputOutputPair from './DataWeaveInputOutputPair';
import DataWeaveScripts from './DataWeaveScripts';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';
import { BackButton } from './ui/BackButton';
import { useNavigate } from 'react-router-dom';
import { buildFileTree, fetchFileContent, findDataWeaveFiles, isFileOfType } from '@/utils/githubUtils';
import { useGithubApi } from '@/hooks/useGithubApi';
import type { FileNode, Repository } from '@/utils/githubUtils';
// import { useUserCredits } from '@/hooks/useUserCredits';


type GeneratorMode = 'noRepository' | 'withRepository' | 'uploadFromComputer';

interface InputSample {
  id: string;
  value: string;
  isValid: boolean;
}

interface OutputSample {
  id: string;
  value: string;
  isValid: boolean;
}

interface InputOutputPair {
  id: string;
  inputSample: InputSample;
  outputSample: OutputSample;
}

interface GeneratedScript {
  id: string;
  code: string;
  pairId: string;
}

interface DataWeaveFile {
  name: string;
  path: string;
  content?: string;
}

interface IntegrationGeneratorProps {
  onTaskCreated?: (task: { id: string; label: string; category: string; icon: React.ReactNode }) => void;
  selectedWorkspaceId?: string;
  onSaveTask?: (taskId: string) => void;
  onBack?: () => void;
}

const Header = () => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">DataWeave Generator</h1>
    <p className="text-gray-600">Generate DataWeave transformations from input/output examples</p>
  </div>
);

const DataWeaveGenerator: React.FC<IntegrationGeneratorProps> = ({ 
  onTaskCreated,
  selectedWorkspaceId = 'default',
  onBack,
  onSaveTask
}) => {
  const [inputFormat, setInputFormat] = useState<string>('JSON');
  const [pairs, setPairs] = useState<InputOutputPair[]>([
    {
      id: uuidv4(),
      inputSample: { id: uuidv4(), value: '', isValid: false },
      outputSample: { id: uuidv4(), value: '', isValid: false }
    }
  ]);
  const [notes, setNotes] = useState<string>('');
  const [mode, setMode] = useState<GeneratorMode>('noRepository');
  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [isResultVisible, setIsResultVisible] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string>(`#${Math.floor(Math.random() * 9000) + 1000}`);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { 
    repositories, 
    loadingRepositories, 
    fetchRepositories, 
    fileStructure, 
    loadingFileStructure, 
    fetchFileStructure,
    fetchFileContent: fetchGithubFileContent 
  } = useGithubApi();
  
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');
  const [dataWeaveFiles, setDataWeaveFiles] = useState<DataWeaveFile[]>([]);
  const [selectedDataWeaveFile, setSelectedDataWeaveFile] = useState<DataWeaveFile | null>(null);
  const [localProjectFiles, setLocalProjectFiles] = useState<FileNode[]>([]);
  
  const projectFolderRef = useRef<HTMLInputElement>(null);
  
  const fadeIn = useFadeIn();
  const { ref, animate } = useAnimate();
  
  const { useCredit } = useUserCredits();
  
  useEffect(() => {
    const storedRepoJson = localStorage.getItem('APL_selectedGithubRepo');
    if (storedRepoJson && mode === 'withRepository') {
      try {
        const repoData = JSON.parse(storedRepoJson);
        setSelectedRepository(repoData);
        fetchFileStructure(repoData);
      } catch (error) {
        console.error('Error parsing stored GitHub repo:', error);
      }
    }
  }, [mode, fetchFileStructure]);
  
  useEffect(() => {
    if (mode === 'withRepository') {
      fetchRepositories();
    }
  }, [mode, fetchRepositories]);
  
  useEffect(() => {
    if (selectedRepository) {
      fetchFileStructure(selectedRepository);
    }
  }, [selectedRepository, fetchFileStructure]);

  useEffect(() => {
    if (fileStructure.length > 0) {
      const dwFiles = findDataWeaveFiles(fileStructure);
      
      const dataWeaveFilesArray: DataWeaveFile[] = dwFiles.map(file => ({
        name: file.name,
        path: file.path
      }));
      
      setDataWeaveFiles(dataWeaveFilesArray);
    }
  }, [fileStructure]);
  
  const handleProjectFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      const fileStructure: FileNode[] = [];
      const directories: Record<string, FileNode> = {};
      
      files.forEach(file => {
        const path = (file as any).webkitRelativePath;
        const pathParts = path.split('/');
        
        if (pathParts.length <= 1) return;
        
        let currentPath = '';
        let parentNode: FileNode | null = null;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
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
        
        const fileName = pathParts[pathParts.length - 1];
        const fileIsDataWeave = fileName.endsWith('.dwl');
        
        const fileNode: FileNode = {
          name: fileName,
          path: path,
          type: 'file',
          isDataWeave: fileIsDataWeave
        };
        
        parentNode?.children?.push(fileNode);
        
        if (fileIsDataWeave) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
              const dwFile: DataWeaveFile = {
                name: fileName,
                path: path,
                content: event.target.result
              };
              
              setDataWeaveFiles(prev => [...prev, dwFile]);
            }
          };
          reader.readAsText(file as Blob);
        }
      });
      
      setLocalProjectFiles(fileStructure);
      toast.success('Project folder loaded successfully');
    }
  };
  
  const handleRepositorySelect = (repo: Repository) => {
    setSelectedRepository(repo);
    setDataWeaveFiles([]);
    setSelectedDataWeaveFile(null);
    setCurrentDirectory('/');
    
    localStorage.setItem('APL_selectedGithubRepo', JSON.stringify(repo));
    
    toast.success(`Repository "${repo.name}" selected`);
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
    const parentPath = pathParts.length === 1 ? '/' : pathParts.join('/');
    
    setCurrentDirectory(parentPath);
  };
  
  const getCurrentDirectoryContents = () => {
    if (currentDirectory === '/') {
      return mode === 'withRepository' ? fileStructure : localProjectFiles;
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
      mode === 'withRepository' ? fileStructure : localProjectFiles, 
      currentDirectory
    );
    
    return dirContents || [];
  };
  
  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      const isDataWeaveFile = file.isDataWeave;
      const matchesInputFormat = isFileOfType(file.name, inputFormat);
      
      if (!isDataWeaveFile && !matchesInputFormat) {
        toast.error(`This file format does not match the selected ${isDataWeaveFile ? 'DataWeave' : inputFormat} format`);
        return;
      }
      
      toast.loading(`Loading file "${file.name}"...`, { id: 'fileLoading' });
      
      try {
        let fileContent: string | null = null;
        
        if (selectedRepository) {
          fileContent = await fetchGithubFileContent(selectedRepository, file.path);
        } else if (mode === 'uploadFromComputer') {
          const localFile = Array.from(projectFolderRef.current?.files || [])
            .find(f => (f as any).webkitRelativePath === file.path);
            
          if (localFile) {
            fileContent = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsText(localFile as Blob);
            });
          }
        }
        
        if (fileContent) {
          if (isDataWeaveFile) {
            setSelectedDataWeaveFile({
              name: file.name,
              path: file.path,
              content: fileContent
            });
            
            const inputMatch = fileContent.match(/input\s+([^\n]+)/);
            const outputMatch = fileContent.match(/output\s+([^\n]+)/);
            
            if (inputMatch && inputMatch[1]) {
              const format = inputMatch[1].replace('application/', '').toUpperCase();
              if (['JSON', 'XML', 'CSV', 'YAML'].includes(format)) {
                setInputFormat(format);
              }
            }
            
            const inputExample = fileContent.match(/Input example:([^]+?)(?:Output example:|---)/);
            const outputExample = fileContent.match(/Output example:([^]+?)(?:---|\*\/)/);
            
            if (inputExample && outputExample && pairs.length > 0) {
              const updatedPairs = [...pairs];
              updatedPairs[0] = {
                ...updatedPairs[0],
                inputSample: {
                  ...updatedPairs[0].inputSample,
                  value: inputExample[1].trim(),
                  isValid: true
                },
                outputSample: {
                  ...updatedPairs[0].outputSample,
                  value: outputExample[1].trim(),
                  isValid: true
                }
              };
              setPairs(updatedPairs);
              toast.success(`Input and output examples extracted from "${file.name}"`);
            }
          } else if (matchesInputFormat) {
            if (pairs.length > 0) {
              const updatedPairs = [...pairs];
              updatedPairs[0] = {
                ...updatedPairs[0],
                inputSample: {
                  ...updatedPairs[0].inputSample,
                  value: fileContent,
                  isValid: true
                }
              };
              setPairs(updatedPairs);
            }
          }
          
          toast.success(`File "${file.name}" loaded successfully`, { id: 'fileLoading' });
        } else {
          throw new Error(`Could not load content from "${file.name}"`);
        }
      } catch (error) {
        console.error("Error handling file selection:", error);
        toast.error(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'fileLoading' });
      }
    }
  };
  
  const handleProjectFolderClick = () => {
    if (projectFolderRef.current) {
      projectFolderRef.current.click();
    }
  };
  
  const renderRepositorySelection = () => {
    if (mode !== 'withRepository') return null;
    
    return (
      <div className="space-y-4 mt-4 mb-6">
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
                  
                  {loadingFileStructure ? (
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
                            {getCurrentDirectoryContents().map((item, index) => {
                              const isMatchingFormat = item.type === 'file' && 
                                (item.isDataWeave || isFileOfType(item.name, inputFormat));
                              
                              return (
                                <div 
                                  key={index}
                                  onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                    selectedDataWeaveFile && item.type === 'file' && item.path === selectedDataWeaveFile.path
                                      ? 'bg-purple-50' 
                                      : ''
                                  }`}
                                >
                                  {item.type === 'directory' ? (
                                    <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                  ) : isMatchingFormat ? (
                                    <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                                  ) : (
                                    <File className="h-4 w-4 mr-2 text-gray-500" />
                                  )}
                                  <span className={`${isMatchingFormat ? 'font-medium text-purple-700' : ''}`}>
                                    {item.name}
                                  </span>
                                  {selectedDataWeaveFile && item.type === 'file' && item.path === selectedDataWeaveFile.path && (
                                    <Check className="h-4 w-4 ml-auto text-purple-600" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedDataWeaveFile && (
                  <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <div className="flex items-center">
                      <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="font-medium">{selectedDataWeaveFile.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Selected DataWeave file</div>
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
    if (mode !== 'uploadFromComputer') return null;
    
    return (
      <div className="mt-4 mb-6">
        <input
          type="file"
          ref={projectFolderRef}
          style={{ display: 'none' }}
          onChange={handleProjectFolderUpload}
          multiple
          webkitdirectory=""
          directory=""
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
                    {getCurrentDirectoryContents().map((item, index) => {
                      const isMatchingFormat = item.type === 'file' && 
                        (item.isDataWeave || isFileOfType(item.name, inputFormat));
                      
                      return (
                        <div 
                          key={index}
                          onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                          className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                            selectedDataWeaveFile && item.type === 'file' && item.path === selectedDataWeaveFile.path
                              ? 'bg-purple-50' 
                              : ''
                          }`}
                        >
                          {item.type === 'directory' ? (
                            <Folder className="h-4 w-4 mr-2 text-blue-500" />
                          ) : isMatchingFormat ? (
                            <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                          ) : (
                            <File className="h-4 w-4 mr-2 text-gray-500" />
                          )}
                          <span className={`${isMatchingFormat ? 'font-medium text-purple-700' : ''}`}>
                            {item.name}
                          </span>
                          {selectedDataWeaveFile && item.type === 'file' && item.path === selectedDataWeaveFile.path && (
                            <Check className="h-4 w-4 ml-auto text-purple-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {selectedDataWeaveFile && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <div className="flex items-center">
                  <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                  <span className="font-medium">{selectedDataWeaveFile.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">Selected DataWeave file</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  useEffect(() => {
    const updatedPairs = pairs.map(pair => {
      let isOutputValid = false;
      if (pair.outputSample.value.trim()) {
        try {
          JSON.parse(pair.outputSample.value);
          isOutputValid = true;
        } catch (e) {
          isOutputValid = false;
        }
      }
      
      return {
        ...pair,
        outputSample: {
          ...pair.outputSample,
          isValid: isOutputValid
        }
      };
    });
    
    setPairs(updatedPairs);
  }, [pairs.map(p => p.outputSample.value).join(',')]);

  useEffect(() => {
    const validateInput = (input: string, format: string): boolean => {
      if (!input.trim()) return false;
      
      try {
        switch(format) {
          case 'XML':
            return input.trim().startsWith('<') && input.trim().endsWith('>');
          case 'JSON':
            JSON.parse(input);
            return true;
          case 'CSV':
            return input.includes(',') || input.includes('\n');
          case 'YAML':
            return input.includes(':') && !input.includes('{') && !input.includes('[');
          
          default:
            return true;
        }
      } catch (e) {
        return false;
      }
    };

    const updatedPairs = pairs.map(pair => {
      const isInputValid = validateInput(pair.inputSample.value, inputFormat);
      
      return {
        ...pair,
        inputSample: {
          ...pair.inputSample,
          isValid: isInputValid
        }
      };
    });
    
    setPairs(updatedPairs);
  }, [pairs.map(p => p.inputSample.value).join(','), inputFormat]);
  
  const addInputOutputPair = () => {
    setPairs([
      ...pairs, 
      {
        id: uuidv4(),
        inputSample: { id: uuidv4(), value: '', isValid: false },
        outputSample: { id: uuidv4(), value: '', isValid: false }
      }
    ]);
  };
  
  const removeInputOutputPair = (pairId: string) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter(pair => pair.id !== pairId));
    } else {
      toast.warning('At least one input/output pair is required.');
    }
  };
  
  const updateInputSample = (id: string, value: string) => {
    setPairs(pairs.map(pair => 
      pair.inputSample.id === id 
        ? { ...pair, inputSample: { ...pair.inputSample, value } } 
        : pair
    ));
  };
  
  const updateOutputSample = (id: string, value: string) => {
    setPairs(pairs.map(pair => 
      pair.outputSample.id === id 
        ? { ...pair, outputSample: { ...pair.outputSample, value } } 
        : pair
    ));
  };
  
  const validateForm = (): boolean => {
    const hasValidPair = pairs.some(
      pair => pair.inputSample.isValid && pair.outputSample.isValid
    );
    
    if (!hasValidPair) {
      setFormError('Please provide at least one valid input/output pair');
      return false;
    }
    
    setFormError('');
    return true;
  };
  
  const handleGenerateDataWeave = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    setFormError('');

    const canUseCredit = await useCredit();
    if (!canUseCredit) {
      setIsGenerating(false);
      return;
    }

    const scripts: GeneratedScript[] = [];
    
    try {
      const validPairs = pairs.filter(
        pair => pair.inputSample.isValid && pair.outputSample.isValid
      );
      
      const requestBody: any = {
        inputFormat,
        inputSamples: validPairs.map(p => p.inputSample),
        outputSamples: validPairs.map(p => p.outputSample),
        notes
      };
      
      if (selectedDataWeaveFile?.content) {
        requestBody.existingScript = selectedDataWeaveFile.content;
        requestBody.filePath = selectedDataWeaveFile.path;
      }
      
      for (const pair of validPairs) {
        const pairRequest = {
          ...requestBody,
          inputSamples: [pair.inputSample],
          outputSamples: [pair.outputSample]
        };
        
        const { data, error } = await supabase.functions.invoke('generate-dataweave', {
          body: pairRequest
        });
        
        if (error) {
          throw new Error(`Error from edge function: ${error.message}`);
        }
        
        scripts.push({
          id: uuidv4(),
          code: data.script,
          pairId: pair.id
        });
      }
      
      setGeneratedScripts(scripts);
      setIsResultVisible(true);
      
      if (user) {
        try {
          const taskData = {
            user_id: user.id,
            workspace_id: selectedWorkspaceId,
            task_id: taskId,
            task_name: 'DataWeave Generator',
            input_format: inputFormat,
            input_samples: JSON.parse(JSON.stringify(pairs.map(p => p.inputSample))) as Json,
            output_samples: JSON.parse(JSON.stringify(pairs.map(p => p.outputSample))) as Json,
            notes: notes,
            generated_scripts: JSON.parse(JSON.stringify(scripts)) as Json
          };
          
          const { data, error } = await supabase
            .from('apl_dataweave_tasks')
            .insert([taskData])
            .select();
          
          if (error) {
            console.error("Error saving task:", error);
          } else if (data && data.length > 0 && onSaveTask) {
            onSaveTask(data[0].id);
          }
        } catch (error) {
          console.error("Error saving task:", error);
        }
      }
      
      if (onTaskCreated) {
        const newTask = {
          id: taskId,
          label: `DataWeave Generator`,
          category: 'Coding',
          icon: <code className="text-blue-600">{'{'}</code>
        };
        onTaskCreated(newTask);
      }
      
      toast.success(`${scripts.length} DataWeave script(s) generated successfully!`);
    } catch (error: any) {
      console.error("Error in submit handler:", error);
      toast.error(`Failed to generate DataWeave script: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setPairs([
      {
        id: uuidv4(),
        inputSample: { id: uuidv4(), value: '', isValid: false },
        outputSample: { id: uuidv4(), value: '', isValid: false }
      }
    ]);
    setGeneratedScripts([]);
    setNotes('');
    setIsResultVisible(false);
    setTaskId(`#${Math.floor(Math.random() * 9000) + 1000}`);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      ref={ref}
      className="w-full h-full max-w-none mx-0 p-0 bg-white"
      {...fadeIn}
    >
      <div className="p-8 border-b border-purple-100">
        <BackButton 
          onBack={onBack}
          label={isResultVisible ? `Task: ${taskId}` : ''}
          description={isResultVisible ? new Date().toLocaleString() : ''}
        />

        {!isResultVisible && <Header />}
      </div>

      <div className="p-8">
        {!isResultVisible ? (
          <motion.div 
            className="mb-8 space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <RadioGroup 
              defaultValue="noRepository" 
              value={mode}
              onValueChange={(value) => setMode(value as GeneratorMode)}
              className="flex flex-wrap gap-8 mb-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="noRepository" id="noRepository" className="border-gray-300 text-black" />
                <Label htmlFor="noRepository" className="text-gray-700">No Repository</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="withRepository" id="withRepository" className="border-gray-300 text-black" />
                <Label htmlFor="withRepository" className="text-gray-700">With Repository</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="uploadFromComputer" id="uploadFromComputer" className="border-gray-300 text-black" />
                <Label htmlFor="uploadFromComputer" className="text-gray-700">Upload from computer</Label>
              </div>
            </RadioGroup>

            {renderRepositorySelection()}
            {renderProjectFolderUpload()}

            <div className="space-y-6">
              <div>
                <label htmlFor="inputFormat" className="block text-sm font-medium text-gray-700 mb-2">Input Format</label>
                <Select
                  value={inputFormat}
                  onValueChange={setInputFormat}
                >
                  <SelectTrigger className="w-full md:w-60">
                    <SelectValue placeholder="Select input format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="XML">XML</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="YAML">YAML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-6">
                {pairs.map((pair, index) => (
                  <DataWeaveInputOutputPair
                    key={pair.id}
                    id={pair.id}
                    inputFormat={inputFormat}
                    inputSample={pair.inputSample}
                    outputSample={pair.outputSample}
                    onInputChange={updateInputSample}
                    onOutputChange={updateOutputSample}
                    onDelete={() => removeInputOutputPair(pair.id)}
                  />
                ))}

                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={addInputOutputPair}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Input/Output Pair
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional context or requirements for the DataWeave transformation..."
                  className="h-24 resize-none"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {formError}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleGenerateDataWeave}
                  disabled={isGenerating}
                  className="w-full md:w-auto min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate DataWeave Script'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <DataWeaveScripts 
              scripts={generatedScripts} 
              onNewTask={handleReset}
              pairs={pairs}
              notes={notes}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataWeaveGenerator;
