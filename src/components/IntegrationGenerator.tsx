import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { BackButton } from './ui/BackButton';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import MonacoEditor from './MonacoEditor';
import { RefreshCw, RotateCcw, Check, Upload, ArrowLeft, File, Folder, FolderTree } from 'lucide-react';
import { FileNode, isFileOfType } from '@/utils/githubUtils';
import { useGithubApi } from '@/hooks/useGithubApi';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { WorkspaceTask, IntegrationGeneratorProps } from '@/hooks/useWorkspaceTasks';
import { Animation } from './ui/Animation';

export interface IntegrationGeneratorProps {
  onBack: () => void;
  onTaskCreated?: (task: WorkspaceTask) => void;
  selectedWorkspaceId?: string;
  onSaveTask?: () => void;
}

const apiTypes = ['REST', 'SOAP', 'GraphQL', 'Database', 'File', 'JMS', 'AMQP', 'WebSockets', 'gRPC'];
const environments = ['DEV', 'QA', 'UAT', 'PROD'];

const IntegrationGenerator: React.FC<IntegrationGeneratorProps> = ({
  onBack,
  onTaskCreated,
  selectedWorkspaceId,
  onSaveTask,
}) => {
  const [activeTab, setActiveTab] = useState<string>('input');
  const [sourceType, setSourceType] = useState<'no-repository' | 'with-repository' | 'upload'>('no-repository');
  const [apiName, setApiName] = useState<string>('');
  const [apiType, setApiType] = useState<string>('REST');
  const [apiDescription, setApiDescription] = useState<string>('');
  const [sourceSystem, setSourceSystem] = useState<string>('');
  const [targetSystem, setTargetSystem] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('DEV');
  const [raml, setRaml] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent } = useGithubApi();
  const { selectedRepository } = useRepositoryData();
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sourceType === 'with-repository' && !repositories.length) {
      fetchRepositories();
    }
  }, [sourceType, repositories, fetchRepositories]);

  const handleGenerate = async () => {
    if (apiName.trim() === '') {
      toast.error('Please provide an API name');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));

      const integrationCode = `
import org.mule.runtime.core.api.event.CoreEvent;
import org.mule.runtime.core.api.exception.ExceptionHelper;

// Integration Flow for ${apiName} (${apiType})
// Source: ${sourceSystem}
// Target: ${targetSystem}
// Environment: ${environment}

public class ${apiName.replace(/\s+/g, '')}Integration {
    
    /**
     * Main flow processor
     * @param event The Mule event
     * @return The processed event
     */
    public CoreEvent process(CoreEvent event) {
        // Implementation details
        return event;
    }
    
    /**
     * Error handler
     */
    public void handleError(Exception e) {
        ExceptionHelper.getRootException(e);
        // Error handling logic
    }
}
`;

      const yamlConfig = `
# ${apiName} Integration Configuration
api:
  name: ${apiName}
  type: ${apiType}
  description: ${apiDescription}
  
source:
  system: ${sourceSystem}
  
target:
  system: ${targetSystem}
  
environment: ${environment}

# Generated based on provided specifications
`;

      const xmlConfig = `
<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns="http://www.mule.org/schema/mule/core"
      xmlns:http="http://www.mule.org/schema/mule/http"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="
        http://www.mule.org/schema/mule/core http://www.mule.org/schema/mule/core/current/mule.xsd
        http://www.mule.org/schema/mule/http http://www.mule.org/schema/mule/http/current/mule-http.xsd">

    <http:listener-config name="${apiName.toLowerCase().replace(/\s+/g, '-')}-api-config">
        <http:listener-connection host="0.0.0.0" port="8081" />
    </http:listener-config>

    <flow name="${apiName.toLowerCase().replace(/\s+/g, '-')}-main-flow">
        <http:listener config-ref="${apiName.toLowerCase().replace(/\s+/g, '-')}-api-config" path="/api/*" />
        
        <!-- Source System: ${sourceSystem} -->
        <!-- Target System: ${targetSystem} -->
        <!-- Environment: ${environment} -->
        
        <logger level="INFO" message="Processing request for ${apiName}" />
        
        <!-- Implementation details based on API specifications -->
        
        <error-handler>
            <on-error-propagate type="ANY">
                <logger level="ERROR" message="Error occurred: #[error.description]" />
            </on-error-propagate>
        </error-handler>
    </flow>
</mule>
`;

      const combinedResult = `// JAVA INTEGRATION CODE
${integrationCode}

// YAML CONFIGURATION
${yamlConfig}

// XML CONFIGURATION
${xmlConfig}
`;

      setResult(combinedResult);
      setActiveTab('result');
      toast.success('Integration code generated successfully!');
    } catch (error) {
      console.error('Error generating integration code:', error);
      toast.error('Failed to generate integration code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setApiName('');
    setApiType('REST');
    setApiDescription('');
    setSourceSystem('');
    setTargetSystem('');
    setEnvironment('DEV');
    setRaml('');
    setResult('');
    setActiveTab('input');
    setSelectedFile(null);
    setFileContent('');
    setUploadedFiles([]);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Integration code copied to clipboard!');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setUploadedFiles(files);
      
      const ramlFiles = files.filter(file => isFileOfType(file.name, 'raml'));
      
      if (ramlFiles.length > 0) {
        handleUploadedFileSelect(ramlFiles[0]);
      } else {
        toast.warning('No RAML files found in the upload');
      }
      
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`);
    }
  };

  const handleUploadedFileSelect = (file: File) => {
    if (!isFileOfType(file.name, 'raml')) {
      toast.error('This file is not a RAML file');
      return;
    }
    
    setSelectedFile(file.name);
    setIsLoadingFile(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const fileContent = e.target.result as string;
        setFileContent(fileContent);
        setRaml(fileContent);
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

  const handleSelectRepository = async (repo: any) => {
    try {
      setCurrentDirectory('/');
      setSelectedFile(null);
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

  const goUpDirectory = () => {
    if (currentDirectory === '/') return;
    
    const pathParts = currentDirectory.split('/');
    pathParts.pop();
    const parentPath = pathParts.length === 1 ? '/' : pathParts.join('/');
    
    setCurrentDirectory(parentPath);
  };

  const navigateDirectory = (dir: FileNode) => {
    if (dir.type === 'directory') {
      setCurrentDirectory(dir.path);
      toast.success(`Navigated to ${dir.name}`);
    }
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      if (!isFileOfType(file.name, 'raml')) {
        toast.error('This file is not a RAML file');
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
            setRaml(content);
            toast.success(`File "${file.name}" loaded successfully`);
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton onBack={onBack} label="Back to Dashboard" />
      
      <Card className="mt-4 border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold">Integration Generator</CardTitle>
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
                              {getCurrentDirectoryContents().map((item: any, index: number) => {
                                const isRamlFile = item.type === 'file' && isFileOfType(item.name, 'raml');
                                return (
                                <div 
                                  key={index}
                                  onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                    selectedFile === item.path
                                      ? 'bg-purple-50' 
                                      : ''
                                  } ${isRamlFile ? 'text-purple-700' : ''}`}
                                >
                                  {item.type === 'directory' ? (
                                    <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                  ) : isRamlFile ? (
                                    <File className="h-4 w-4 mr-2 text-purple-600" />
                                  ) : (
                                    <File className="h-4 w-4 mr-2 text-gray-400" />
                                  )}
                                  <span className={`truncate ${isRamlFile ? 'font-medium' : ''}`}>
                                    {item.name}
                                    {item.type === 'file' && !isFileOfType(item.name, 'raml') && (
                                      <span className="text-xs text-gray-400 ml-2">
                                        (not raml)
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
                      htmlFor="file-upload" 
                      className="cursor-pointer bg-white py-6 px-4 border-2 border-dashed border-gray-300 rounded-md flex justify-center items-center flex-col text-center"
                    >
                      <Upload size={24} className="mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Drag and drop files here, or click to browse</span>
                      <span className="text-xs text-gray-500 mt-1">
                        Currently accepting .raml files
                      </span>
                      <input 
                        id="file-upload" 
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
                            const isRamlFile = isFileOfType(file.name, 'raml');
                            return (
                              <div 
                                key={index} 
                                onClick={() => isRamlFile && handleUploadedFileSelect(file)}
                                className={`py-2 px-3 flex items-center ${
                                  selectedFile === file.name ? 'bg-purple-50' : ''
                                } ${isRamlFile ? 'cursor-pointer hover:bg-gray-50 text-purple-700' : 'text-gray-400'}`}
                              >
                                {isRamlFile ? (
                                  <File className="h-4 w-4 mr-2 text-purple-600" />
                                ) : (
                                  <File className="h-4 w-4 mr-2 text-gray-400" />
                                )}
                                <span className={isRamlFile ? 'font-medium' : ''}>
                                  {file.name}
                                </span>
                                {!isRamlFile && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    (not raml)
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiName">API Name</Label>
                  <Input 
                    id="apiName" 
                    placeholder="Enter API name" 
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>API Type</Label>
                  <Select value={apiType} onValueChange={setApiType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select API type" />
                    </SelectTrigger>
                    <SelectContent>
                      {apiTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="apiDescription">API Description</Label>
                  <Textarea 
                    id="apiDescription" 
                    placeholder="Describe the API" 
                    value={apiDescription}
                    onChange={(e) => setApiDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sourceSystem">Source System</Label>
                  <Input 
                    id="sourceSystem" 
                    placeholder="Enter source system" 
                    value={sourceSystem}
                    onChange={(e) => setSourceSystem(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="targetSystem">Target System</Label>
                  <Input 
                    id="targetSystem" 
                    placeholder="Enter target system" 
                    value={targetSystem}
                    onChange={(e) => setTargetSystem(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Environment</Label>
                  <RadioGroup 
                    value={environment} 
                    onValueChange={setEnvironment}
                    className="flex space-x-4 mt-2"
                  >
                    {environments.map((env) => (
                      <div className="flex items-center space-x-2" key={env}>
                        <RadioGroupItem value={env} id={`env-${env}`} />
                        <Label htmlFor={`env-${env}`}>{env}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* RAML Section - Added for all source types */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    RAML Specification (Optional)
                  </Label>
                  {selectedFile && (
                    <div className="flex items-center text-sm text-purple-700 font-medium">
                      <File className="h-4 w-4 mr-1" />
                      {selectedFile.split('/').pop()}
                      {isLoadingFile && <RefreshCw size={14} className="ml-2 animate-spin" />}
                    </div>
                  )}
                </div>
                <div className="border rounded-md" style={{ height: "300px" }}>
                  {isLoadingFile ? (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <RefreshCw size={24} className="animate-spin mr-2" />
                      <span>Loading file content...</span>
                    </div>
                  ) : (
                    <MonacoEditor
                      value={raml}
                      onChange={(value) => setRaml(value || '')}
                      language="yaml"
                      height="300px"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  )}
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
                  disabled={isGenerating || apiName.trim() === ''}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Integration'
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="result" className="space-y-6">
              {result ? (
                <Animation animation="fadeIn" delay={0.1} duration={0.5}>
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Generated Integration Code</h3>
                      <Separator className="my-2" />
                      <div className="border rounded-md" style={{ height: "500px" }}>
                        <MonacoEditor
                          value={result}
                          language="java"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                          }}
                          height="500px"
                        />
                      </div>
                    </Card>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('input')}
                      >
                        Back to Input
                      </Button>
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={handleCopyToClipboard}
                        >
                          Copy to Clipboard
                        </Button>
                        {onSaveTask && (
                          <Button onClick={onSaveTask}>
                            Save as Task
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Animation>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No integration code generated yet. Fill the form and generate first.</p>
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

export default IntegrationGenerator;
