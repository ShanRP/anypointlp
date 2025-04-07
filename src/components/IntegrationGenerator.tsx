
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, FileCode, RefreshCw, Copy, Download, FolderTree, Upload, File, Folder, Check } from 'lucide-react';
import { toast } from 'sonner';
import MonacoEditor from './MonacoEditor';
import { BackButton } from './ui/BackButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useGithubApi } from '@/hooks/useGithubApi';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { findRamlFiles } from '@/utils/githubUtils';

type SourceType = 'no-repository' | 'with-repository' | 'upload';

interface IntegrationGeneratorProps {
  onBack: () => void;
}

const IntegrationGenerator: React.FC<IntegrationGeneratorProps> = ({ onBack }) => {
  const [sourceType, setSourceType] = useState<SourceType>('no-repository');
  const [description, setDescription] = useState('');
  const [raml, setRaml] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [runtime, setRuntime] = useState('Mule 4.4');
  const [includeDiagrams, setIncludeDiagrams] = useState(false);
  
  // Repository-related hooks
  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent } = useGithubApi();
  const { selectedRepository, toggleFileSelection } = useRepositoryData();
  
  // State for file upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');
  const [ramlFiles, setRamlFiles] = useState<any[]>([]);

  const handleReset = () => {
    setSourceType('no-repository');
    setDescription('');
    setRaml('');
    setResult('');
    setActiveTab('input');
    setRuntime('Mule 4.4');
    setIncludeDiagrams(false);
    setUploadedFiles([]);
    setFileContent('');
    setSelectedFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setUploadedFiles(files);
      
      // Find RAML files
      const ramlFiles = files.filter(file => file.name.toLowerCase().endsWith('.raml'));
      
      // Read the first file's content
      if (ramlFiles.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setFileContent(e.target.result as string);
            setRaml(e.target.result as string);
          }
        };
        reader.readAsText(ramlFiles[0]);
      }
      
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
    try {
      setSelectedFile(file.path);
      
      if (file.isRaml && selectedRepository) {
        const content = await fetchFileContent(selectedRepository, file.path);
        if (content) {
          setRaml(content);
          toast.success(`RAML file "${file.name}" loaded successfully`);
        }
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Failed to load file content');
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please provide a description for the integration');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          runtime,
          diagrams: includeDiagrams,
          raml: raml
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }
        throw new Error(errorData.error || 'Failed to generate integration');
      }

      const data = await response.json();
      if (data.success) {
        setResult(data.code);
        setActiveTab('result');
        toast.success('Integration generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate integration');
      }
    } catch (error: any) {
      console.error('Error generating integration:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Code copied to clipboard!');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'mule-integration.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('File downloaded successfully!');
  };

  // Find RAML files when fileStructure changes
  useEffect(() => {
    if (fileStructure && fileStructure.length > 0) {
      const ramlFiles = findRamlFiles(fileStructure);
      setRamlFiles(ramlFiles);
    }
  }, [fileStructure]);

  // Fetch repositories when sourceType changes to 'with-repository'
  useEffect(() => {
    if (sourceType === 'with-repository' && repositories.length === 0) {
      fetchRepositories();
    }
  }, [sourceType, repositories.length, fetchRepositories]);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                {getCurrentDirectoryContents().map((item: any, index: number) => (
                                  <div 
                                    key={index}
                                    onClick={() => item.type === 'directory' ? navigateDirectory(item) : handleFileSelect(item)}
                                    className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                      selectedFile === item.path
                                        ? 'bg-purple-50' 
                                        : ''
                                    } ${item.isRaml ? 'text-blue-600 font-medium' : ''}`}
                                  >
                                    {item.type === 'directory' ? (
                                      <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                    ) : item.isRaml ? (
                                      <FileCode className="h-4 w-4 mr-2 text-blue-600" />
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
                  
                  {/* RAML Files Section */}
                  <div className="space-y-2 border p-4 rounded-md bg-gray-50">
                    <h3 className="font-medium text-gray-900">RAML Files</h3>
                    {ramlFiles.length > 0 ? (
                      <div className="mt-2 divide-y border rounded-md overflow-hidden">
                        {ramlFiles.map((file, index) => (
                          <div 
                            key={index}
                            onClick={() => handleFileSelect(file)}
                            className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                              selectedFile === file.path
                                ? 'bg-purple-50 text-blue-600'
                                : 'text-blue-600'
                            }`}
                          >
                            <FileCode className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="truncate">{file.name}</span>
                            {selectedFile === file.path && (
                              <Check className="h-4 w-4 ml-auto text-purple-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 border rounded-md">
                        No RAML files found in this repository
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sourceType === 'upload' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-y-auto divide-y">
                          {uploadedFiles.map((file, index) => (
                            <div 
                              key={index} 
                              className={`py-2 px-1 cursor-pointer ${
                                file.name.toLowerCase().endsWith('.raml') 
                                  ? 'text-blue-600 font-medium' 
                                  : ''
                              }`}
                              onClick={() => {
                                if (file.name.toLowerCase().endsWith('.raml')) {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    if (e.target?.result) {
                                      setRaml(e.target.result as string);
                                      toast.success(`RAML file "${file.name}" loaded successfully`);
                                    }
                                  };
                                  reader.readAsText(file);
                                }
                              }}
                            >
                              {file.name.toLowerCase().endsWith('.raml') ? (
                                <span className="flex items-center">
                                  <FileCode className="h-4 w-4 mr-2 inline" />
                                  {file.name}
                                </span>
                              ) : (
                                file.name
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* RAML Files Section */}
                  <div className="space-y-2 border p-4 rounded-md bg-gray-50">
                    <h3 className="font-medium text-gray-900">RAML Files</h3>
                    <div className="p-4 text-center border rounded-md">
                      {uploadedFiles.filter(file => file.name.toLowerCase().endsWith('.raml')).length > 0 ? (
                        <div className="divide-y">
                          {uploadedFiles
                            .filter(file => file.name.toLowerCase().endsWith('.raml'))
                            .map((file, index) => (
                              <div 
                                key={index} 
                                className="py-2 px-1 cursor-pointer text-blue-600 font-medium flex items-center"
                                onClick={() => {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    if (e.target?.result) {
                                      setRaml(e.target.result as string);
                                      toast.success(`RAML file "${file.name}" loaded successfully`);
                                    }
                                  };
                                  reader.readAsText(file);
                                }}
                              >
                                <FileCode className="h-4 w-4 mr-2" />
                                {file.name}
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <p className="text-gray-500">Upload RAML files to view them here</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the integration you want to generate..."
                  className="min-h-[100px] resize-none border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Runtime</label>
                  <Input
                    type="text"
                    value={runtime}
                    onChange={(e) => setRuntime(e.target.value)}
                    placeholder="Mule 4.4"
                    className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="diagrams"
                      checked={includeDiagrams}
                      onCheckedChange={setIncludeDiagrams}
                    />
                    <Label htmlFor="diagrams">Include Diagrams</Label>
                  </div>
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
                      Generate Integration
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="result" className="space-y-6">
              {result ? (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Generated Integration Code</h3>
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
                      variant="outline"
                    >
                      <Copy size={16} />
                      Copy to Clipboard
                    </Button>
                    <Button 
                      onClick={handleDownload}
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </Button>
                  </div>
                </div>
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
