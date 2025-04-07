
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, RefreshCw, Copy, FolderTree, Upload, Folder, File, Check } from 'lucide-react';
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

type GenerationType = 'JSON' | 'XML' | 'CSV' | 'YAML';
type SourceType = 'no-repository' | 'with-repository' | 'upload';

function SampleDataGenerator({ onBack }: { onBack: () => void }) {
  const [generationType, setGenerationType] = useState<GenerationType>('JSON');
  const [sourceType, setSourceType] = useState<SourceType>('no-repository');
  const [schema, setSchema] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  
  // Repository-related hooks
  const { repositories, loadingRepositories, fetchRepositories, 
          fileStructure, loadingFileStructure, fetchFileStructure,
          fetchFileContent } = useGithubApi();
  const { selectedRepository } = useRepositoryData();
  
  // State for file upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('/');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!schema.trim()) {
      toast.error('Please provide a schema');
      return;
    }

    setIsGenerating(true);
    try {
      // Here you would call your API to generate sample data
      // For demo purposes, we'll just simulate a response
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
              content: `Generate sample data in ${generationType} format based on this schema:\n${schema}\n${notes ? `Additional notes: ${notes}` : ''}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        let content = data.choices[0].message.content.trim();
        
        // Extract the code block if it exists
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

  const handleReset = () => {
    setSchema('');
    setNotes('');
    setResult('');
    setGenerationType('JSON');
    setSourceType('no-repository');
    setActiveTab('input');
    setUploadedFiles([]);
    setFileContent('');
    setSelectedFile(null);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Sample data copied to clipboard!');
  };

  const handleSelectRepository = async (repo: any) => {
    try {
      await fetchFileStructure(repo);
      toast.success(`Repository ${repo.name} loaded successfully`);
    } catch (error) {
      toast.error('Failed to load repository structure');
    }
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
          setSchema(e.target.result as string);
        }
      };
      reader.readAsText(files[0]);
      
      toast.success(`${files.length} files uploaded successfully`);
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
          setSchema(content);
          toast.success(`File "${file.name}" loaded successfully`);
        }
      }
    }
  };

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
                      htmlFor="schema-file-upload" 
                      className="cursor-pointer bg-white py-6 px-4 border-2 border-dashed border-gray-300 rounded-md flex justify-center items-center flex-col text-center"
                    >
                      <Upload size={24} className="mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Drag and drop files here, or click to browse</span>
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
                <label className="block text-sm font-medium text-gray-700">
                  Dataweave <span className="text-red-500">*</span>
                </label>
                
                <div className="border rounded-md overflow-hidden" style={{ height: '200px' }}>
                  <MonacoEditor
                    value={schema}
                    onChange={(value) => setSchema(value || '')}
                    language={generationType.toLowerCase()}
                    height="200px"
                  />
                </div>
                
                <div className="text-sm text-gray-500">
                  Provide the schema or structure for which you want to generate sample data
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any specific requirements or constraints for the generated data..."
                  className="min-h-[100px]"
                />
              </div>

              {/* <div className="space-y-2">
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
              </div> */}

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
                  disabled={isGenerating || !schema.trim()}
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
