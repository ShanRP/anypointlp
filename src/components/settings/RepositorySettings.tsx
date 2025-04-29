
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGithubApi } from '@/hooks/useGithubApi';
import { Repository, FileNode } from '@/utils/githubUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFadeIn } from '@/utils/animationHooks';
import { toast } from 'sonner';
import { Folder, File, Github, RefreshCw, Search, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RepositorySettings() {
  const { toast: uiToast } = useToast();
  const { 
    fetchRepositories, 
    fetchFileStructure, 
    isAuthenticated, 
    authenticateWithGitHub, 
    loadingRepositories, 
    logoutGitHub 
  } = useGithubApi();
  const { 
    selectedRepository, 
    setSelectedRepository, 
    setRepositoryFileStructure,
    updateLastGithubRefresh,
    localRepositoryPath,
    setLocalRepositoryPath,
    setLocalFileStructure,
    localFileStructure
  } = useRepositoryData();
  const [githubRepos, setGithubRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("github");
  const fadeIn = useFadeIn();
  const projectFolderRef = useRef<HTMLInputElement>(null);
  const [fileProcessingStatus, setFileProcessingStatus] = useState<{
    processing: boolean;
    total: number;
    processed: number;
  }>({
    processing: false,
    total: 0,
    processed: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Load repository data when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      handleFetchRepositories();
    }
    
    // Load local repository path
    const savedLocalPath = localStorage.getItem('APL_localRepositoryPath');
    if (savedLocalPath) {
      setLocalRepositoryPath(savedLocalPath);
    }
    
    // Load local file structure
    const savedLocalStructure = localStorage.getItem('APL_localFileStructure');
    if (savedLocalStructure) {
      try {
        setLocalFileStructure(JSON.parse(savedLocalStructure));
      } catch (error) {
        console.error("Error parsing local file structure:", error);
      }
    }
  }, [isAuthenticated]);

  const handleFetchRepositories = async () => {
    if (!isAuthenticated) {
      uiToast({
        title: "Authentication Required",
        description: "Please authenticate with GitHub first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const repos = await fetchRepositories();
      setGithubRepos(repos);
      
      // Pre-select the saved repository if it exists
      const savedRepo = localStorage.getItem('APL_selectedGithubRepo');
      if (savedRepo) {
        const parsedRepo = JSON.parse(savedRepo);
        const foundRepo = repos.find(repo => repo.id === parsedRepo.id);
        if (foundRepo) {
          setSelectedRepository(foundRepo as any);
        }
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      uiToast({
        title: "Error",
        description: "Failed to fetch repositories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = async (repo: Repository) => {
    try {
      // Save selected repository to localStorage
      localStorage.setItem('APL_selectedGithubRepo', JSON.stringify(repo));
      setSelectedRepository(repo as any);
      
      // Fetch file structure for selected repository
      const fileStructure = await fetchFileStructure(repo);
      setRepositoryFileStructure(fileStructure);
      
      // Update last refresh time
      updateLastGithubRefresh();
      
      toast.success("Repository selected successfully");
    } catch (error) {
      console.error('Error selecting repository:', error);
      toast.error("Failed to select repository");
    }
  };

  const handleProjectFolderClick = () => {
    if (projectFolderRef.current) {
      projectFolderRef.current.click();
    }
  };

  const handleProjectFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Get the root directory name
      const rootPath = files[0].webkitRelativePath.split('/')[0];
      
      // Set the local repository path
      setLocalRepositoryPath(rootPath);
      localStorage.setItem('APL_localRepositoryPath', rootPath);
      
      // Set up file processing status
      setFileProcessingStatus({
        processing: true,
        total: files.length,
        processed: 0
      });
      
      // Process files in batches to avoid UI freezing
      const batchSize = 100;
      const fileStructure: FileNode[] = [];
      const directories: Record<string, FileNode> = {};
      
      // Use setTimeout to process files in batches
      const processFileBatch = (startIndex: number) => {
        const endIndex = Math.min(startIndex + batchSize, files.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const file = files[i];
          const path = file.webkitRelativePath;
          const pathParts = path.split('/');
          
          if (pathParts.length <= 1) continue;
          
          let currentPath = '';
          let parentNode: FileNode | null = null;
          
          // Process directory structure
          for (let j = 0; j < pathParts.length - 1; j++) {
            const part = pathParts[j];
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
              
              if (j === 0) {
                fileStructure.push(newNode);
              } else if (parentNode) {
                parentNode.children?.push(newNode);
              }
            }
            
            parentNode = directories[newPath];
          }
          
          // Process file
          const fileName = pathParts[pathParts.length - 1];
          const lowerFileName = fileName.toLowerCase();
          const isDataWeave = lowerFileName.endsWith('.dwl');
          const isRaml = lowerFileName.endsWith('.raml');
          const isXml = lowerFileName.endsWith('.xml');
          const isJson = lowerFileName.endsWith('.json');
          const isCsv = lowerFileName.endsWith('.csv');
          const isYaml = lowerFileName.endsWith('.yaml') || lowerFileName.endsWith('.yml');
          
          const fileNode: FileNode = {
            name: fileName,
            path: path,
            type: 'file',
            isDataWeave,
            isRaml,
            isXml,
            isJson,
            isCsv,
            isYaml
          };
          
          parentNode?.children?.push(fileNode);
        }
        
        // Update processing status
        setFileProcessingStatus(prev => ({
          ...prev,
          processed: endIndex
        }));
        
        // Continue processing if there are more files
        if (endIndex < files.length) {
          setTimeout(() => processFileBatch(endIndex), 0);
        } else {
          // Sort each directory's children (directories first, then files)
          const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
              if (a.type === 'directory' && b.type !== 'directory') return -1;
              if (a.type !== 'directory' && b.type === 'directory') return 1;
              return a.name.localeCompare(b.name);
            });
            
            nodes.forEach(node => {
              if (node.children && node.children.length > 0) {
                sortNodes(node.children);
              }
            });
          };
          
          sortNodes(fileStructure);
          
          // Save the file structure
          setLocalFileStructure(fileStructure);
          localStorage.setItem('APL_localFileStructure', JSON.stringify(fileStructure));
          
          // Complete processing
          setFileProcessingStatus({
            processing: false,
            total: files.length,
            processed: files.length
          });
          
          toast.success(`${files.length} files processed from ${rootPath}`);
        }
      };
      
      // Start processing the first batch
      processFileBatch(0);
    }
  };

  const clearLocalRepository = () => {
    localStorage.removeItem('APL_localRepositoryPath');
    localStorage.removeItem('APL_localFileStructure');
    setLocalRepositoryPath('');
    setLocalFileStructure([]);
    toast.success('Local repository cleared');
  };

  // Filter repositories based on search term
  const filteredRepos = githubRepos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderGithubTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>Connect to your GitHub repositories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <Button 
              onClick={authenticateWithGitHub} 
              disabled={loading}
              className="w-full sm:w-auto flex items-center"
            >
              <Github className="mr-2 h-4 w-4" />
              Connect with GitHub
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connected to GitHub
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={logoutGitHub}
                >
                  Disconnect
                </Button>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search repositories..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleFetchRepositories} 
                  disabled={loadingRepositories}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingRepositories ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isAuthenticated && filteredRepos.length > 0 && (
        <motion.div
          {...fadeIn}
          className="space-y-4"
        >
          <h3 className="text-lg font-medium">Select a Repository</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRepos.map((repo) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelectRepo(repo)}
                className={`border p-3 rounded-md cursor-pointer transition-colors ${
                  selectedRepository && selectedRepository.id === repo.id 
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' 
                    : 'hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="font-medium">{repo.name}</div>
                <div className="text-sm text-gray-500 truncate">{repo.full_name}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {repo.private ? 'Private' : 'Public'}
                  {repo.updated_at && ` • Updated ${new Date(repo.updated_at).toLocaleDateString()}`}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedRepository && (
        <motion.div
          {...fadeIn}
          className="space-y-4"
        >
          <Separator />
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Selected GitHub Repository</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                localStorage.removeItem('APL_selectedGithubRepo');
                localStorage.removeItem('APL_repoFileStructure');
                setSelectedRepository(null);
                setRepositoryFileStructure([]);
                toast.success("Repository selection cleared");
              }}
            >
              Clear Selection
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{selectedRepository.name}</CardTitle>
              <CardDescription>{selectedRepository.full_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Repository URL:</span>
                  <a 
                    href={selectedRepository.html_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {selectedRepository.html_url}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Default Branch:</span>
                  <span className="text-sm">{selectedRepository.default_branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Visibility:</span>
                  <span className="text-sm">{selectedRepository.private ? 'Private' : 'Public'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );

  const renderLocalDeviceTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Local Device Repository</CardTitle>
          <CardDescription>Connect to a folder on your local device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-1">Select a folder from your device</p>
              <p className="text-sm text-gray-500">
                Choose a project folder to use as your local repository
              </p>
            </div>
          </div>
          
          {fileProcessingStatus.processing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing files...</span>
                <span>{fileProcessingStatus.processed} / {fileProcessingStatus.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(fileProcessingStatus.processed / fileProcessingStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {localRepositoryPath && (
        <motion.div
          {...fadeIn}
          className="space-y-4"
        >
          <Separator />
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Connected Local Repository</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearLocalRepository}
            >
              Clear Local Repository
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Local Folder</CardTitle>
              <CardDescription>{localRepositoryPath}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">{localRepositoryPath}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium mb-2">Repository Files:</h4>
                    {localFileStructure && localFileStructure.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search files..."
                          className="pl-8 h-8 text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    <LocalFileStructureView searchTerm={searchTerm} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );

  // Small component to display local file structure
  interface LocalFileStructureViewProps {
    searchTerm?: string;
  }

  const LocalFileStructureView: React.FC<LocalFileStructureViewProps> = ({ searchTerm = '' }) => {
    const { localFileStructure } = useRepositoryData();
    
    // Recursive search function to check if a node or any of its children match the search term
    const nodeMatchesSearch = (node: FileNode, term: string): boolean => {
      if (node.name.toLowerCase().includes(term.toLowerCase())) {
        return true;
      }
      
      if (node.children && node.children.length > 0) {
        return node.children.some(child => nodeMatchesSearch(child, term));
      }
      
      return false;
    };
    
    // Recursive function to filter nodes based on search term
    const filterNodes = (nodes: FileNode[], term: string): FileNode[] => {
      if (!term) return nodes;
      
      return nodes.filter(node => {
        if (nodeMatchesSearch(node, term)) {
          // If this node matches, include it and potentially filter its children
          const filteredNode = { ...node };
          if (node.children && node.children.length > 0) {
            filteredNode.children = filterNodes(node.children, term);
          }
          return true;
        }
        return false;
      });
    };
    
    // Filter nodes based on search term if provided
    const filteredNodes = searchTerm ? filterNodes(localFileStructure || [], searchTerm) : localFileStructure;
    
    if (!filteredNodes || filteredNodes.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          {searchTerm ? 'No matching files found' : 'No files found'}
        </div>
      );
    }
    
    const renderFileNode = (node: FileNode, depth = 0) => {
      const paddingLeft = `${depth * 16}px`;
      
      // Highlight matching text parts if search term exists
      const highlightMatch = (text: string, term: string) => {
        if (!term) return text;
        
        const lowerText = text.toLowerCase();
        const lowerTerm = term.toLowerCase();
        const index = lowerText.indexOf(lowerTerm);
        
        if (index === -1) return text;
        
        return (
          <>
            {text.substring(0, index)}
            <span className="bg-yellow-200 text-black">{text.substring(index, index + term.length)}</span>
            {text.substring(index + term.length)}
          </>
        );
      };
      
      return (
        <div key={node.path}>
          <div 
            className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
            style={{ paddingLeft }}
          >
            {node.type === 'directory' ? (
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <File className="h-4 w-4 mr-2 text-gray-500" />
            )}
            <span className="text-sm truncate">
              {highlightMatch(node.name, searchTerm)}
            </span>
          </div>
          
          {node.children && node.children.length > 0 && (
            <div>
              {node.children.map(child => renderFileNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div>
        {filteredNodes.map(node => renderFileNode(node))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6"
    >
      <Tabs 
        defaultValue="github" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="localDevice">Local Device</TabsTrigger>
        </TabsList>
        
        <TabsContent value="github" className="space-y-4">
          {renderGithubTab()}
        </TabsContent>
        
        <TabsContent value="localDevice" className="space-y-4">
          {renderLocalDeviceTab()}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
