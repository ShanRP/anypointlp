import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, RefreshCw, Copy, FolderTree, Upload, Folder, File, Check } from 'lucide-react';
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
import { FileNode, isFileOfType } from '@/utils/githubUtils';

type SourceType = 'no-repository' | 'with-repository' | 'upload';

interface IntegrationGeneratorProps {
  onBack: () => void;
}

const IntegrationGenerator: React.FC<IntegrationGeneratorProps> = ({ onBack }) => {
  const [sourceType, setSourceType] = useState<SourceType>('no-repository');
  const [description, setDescription] = useState('');
  const [raml, setRaml] = useState('');
  const [result, setResult] = useState('');
  const [flowCode, setFlowCode] = useState('');
  const [configXml, setConfigXml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('input');
  
  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent, isRamlFile } = useGithubApi();
  const { selectedRepository } = useRepositoryData();
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const handleReset = () => {
    setSourceType('no-repository');
    setDescription('');
    setRaml('');
    setResult('');
    setFlowCode('');
    setConfigXml('');
    setActiveTab('input');
    setUploadedFiles([]);
    setFileContent('');
    setSelectedFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setUploadedFiles(files);
      
      // Try to find RAML files among the uploaded files
      const ramlFiles = files.filter(file => file.name.toLowerCase().endsWith('.raml'));
      
      if (ramlFiles.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const fileContent = e.target.result as string;
            setFileContent(fileContent);
            setRaml(fileContent);
            setSelectedFile(ramlFiles[0].name);
            toast.success(`RAML file "${ramlFiles[0].name}" loaded`);
          }
        };
        reader.readAsText(ramlFiles[0]);
      }
      
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

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.path);
      
      // Check if it's a RAML file
      if (isRamlFile(file.name)) {
        setIsLoadingFile(true);
        
        if (selectedRepository) {
          try {
            const content = await fetchFileContent(selectedRepository, file.path);
            if (content) {
              setFileContent(content);
              setRaml(content);
              toast.success(`RAML file "${file.name}" loaded successfully`);
            }
          } catch (error) {
            console.error('Error loading RAML file:', error);
            toast.error(`Failed to load RAML file: ${file.name}`);
          } finally {
            setIsLoadingFile(false);
          }
        }
      } else {
        toast.info(`File ${file.name} selected, but it's not a RAML file`);
      }
    }
  };

  const handleUploadedFileSelect = (file: File) => {
    setSelectedFile(file.name);
    
    // Check if it's a RAML file
    if (file.name.toLowerCase().endsWith('.raml')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const content = e.target.result as string;
          setFileContent(content);
          setRaml(content);
          toast.success(`RAML file "${file.name}" loaded successfully`);
        }
      };
      reader.onerror = () => {
        toast.error(`Failed to read file: ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      toast.info(`File ${file.name} selected, but it's not a RAML file`);
    }
  };

  const handleGenerate = async () => {
    if (!description) {
      toast.error('Please provide a description for the integration');
      return;
    }

    setIsLoading(true);
    try {
      let prompt = `Generate a detailed MuleSoft integration flow based on this description:\n\n${description}\n\n`;
      
      if (raml) {
        prompt += `RAML Specification:\n${raml}\n\n`;
      }
      
      prompt += `Your response MUST have exactly these two sections with these exact headings:
1. # Integration Flow: Create a detailed integration flow showing all connections and components in XML format. Make sure it's properly structured and clear.
2. # Configuration XML: List all the necessary configuration details for implementing this flow in XML format.

Both sections MUST begin with the exact headings "# Integration Flow" and "# Configuration XML". For both sections, be specific to MuleSoft implementation.`;

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
              content: 'You are a MuleSoft architect expert at creating integration flows. You create detailed, well-structured flows for MuleSoft implementations. ALWAYS format your response with EXACTLY these section headings: "# Integration Flow" and "# Configuration XML".'
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
        
        const flowCodeMatch = content.match(/# Integration Flow\s*\n([\s\S]*?)(?=\s*# Configuration XML|$)/i);
        const configXmlMatch = content.match(/# Configuration XML\s*\n([\s\S]*?)$/i);
        
        console.log("Integration flow match:", flowCodeMatch);
        console.log("Configuration XML match:", configXmlMatch);
        
        if (flowCodeMatch && flowCodeMatch[1]) {
          setFlowCode(flowCodeMatch[1].trim());
        } else {
          setFlowCode('Integration flow section not found in the generated content.');
          console.error("Integration Flow section not found in:", content);
        }
        
        if (configXmlMatch && configXmlMatch[1]) {
          setConfigXml(configXmlMatch[1].trim());
        } else {
          setConfigXml('Configuration XML section not found in the generated content.');
          console.error("Configuration XML section not found in:", content);
        }
        
        setActiveTab('result');
        toast.success('Integration generated successfully!');
      } else {
        throw new Error('No response received from API');
      }
    } catch (error) {
      console.error('Error generating integration:', error);
      toast.error('Failed to generate integration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Integration copied to clipboard!');
  };

  useEffect(() => {
    if (sourceType === 'with-repository' && !repositories.length) {
      fetchRepositories();
    }
  }, [sourceType, repositories, fetchRepositories]);

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
                          {getCurrentDirectoryContents().length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No files found in this directory
                            </div>
                          ) : (
                            <div className="divide-y">
                              {getCurrentDirectoryContents().map((item: any, index: number) => {
                                const isRaml = item.type === 'file' && isFileOfType(item.name, 'raml');
                                return (
                                  <div 
                                    key={index}
                                    onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                                    className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                      selectedFile === item.path
                                        ? 'bg-purple-50' 
                                        : ''
                                    } ${isRaml ? 'text-purple-700 font-medium' : ''}`}
                                  >
                                    {item.type === 'directory' ? (
                                      <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                    ) : isRaml ? (
                                      <File className="h-4 w-4 mr-2 text-purple-600" />
                                    ) : (
                                      <File className="h-4 w-4 mr-2 text-gray-500" />
                                    )}
                                    <span className="truncate">{item.name}</span>
                                    {selectedFile === item.path && (
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
                      <span className="text-xs text-gray-500 mt-1">RAML files will be automatically detected</span>
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
                      <div className="bg-gray-100 p-2 rounded border">
                        <div className="max-h-40 overflow-y-auto divide-y">
                          {uploadedFiles.map((file, index) => {
                            const isRaml = file.name.toLowerCase().endsWith('.raml');
                            return (
                              <div 
                                key={index} 
                                onClick={() => handleUploadedFileSelect(file)}
                                className={`py-2 px-3 flex items-center ${
                                  selectedFile === file.name ? 'bg-purple-50' : ''
                                } ${isRaml ? 'cursor-pointer hover:bg-gray-50 text-purple-700 font-medium' : ''}`}
                              >
                                {isRaml ? (
                                  <File className="h-4 w-4 mr-2 text-purple-600" />
                                ) : (
                                  <File className="h-4 w-4 mr-2 text-gray-400" />
                                )}
                                <span>{file.name}</span>
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
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the integration you want to build..."
                  className="min-h-[100px] resize-none border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    RAML Specification (Optional)
                  </label>
                  {selectedFile && isFileOfType(selectedFile, 'raml') && (
                    <div className="flex items-center text-sm text-purple-700 font-medium">
                      <File className="h-4 w-4 mr-1" />
                      {selectedFile.split('/').pop()}
                      {isLoadingFile && <RefreshCw size={14} className="ml-2 animate-spin" />}
                    </div>
                  )}
                </div>
                <div className="border rounded-md h-full" style={{ minHeight: "300px" }}>
                  {isLoadingFile ? (
                    <div className="flex items-center justify-center h-64 bg-gray-50">
                      <RefreshCw size={24} className="animate-spin mr-2" />
                      <span>Loading RAML content...</span>
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
                  disabled={isLoading || !description.trim() || isLoadingFile}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
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
                      <h3 className="font-semibold text-lg mb-2">Integration Flow</h3>
                      <Separator className="my-2" />
                      <div className="border rounded-md" style={{ minHeight: "300px" }}>
                        <MonacoEditor
                          value={flowCode}
                          language="xml"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                          }}
                          height="300px"
                        />
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <h3 className="font-semibold text-lg mb-2">Configuration XML</h3>
                      <Separator className="my-2" />
                      <div className="border rounded-md" style={{ minHeight: "300px" }}>
                        <MonacoEditor
                          value={configXml}
                          language="xml"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                          }}
                          height="300px"
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
                </Animation>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No integration generated yet. Generate an integration first.</p>
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
