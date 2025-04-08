
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGithubApi } from '@/hooks/useGithubApi';
import { Repository } from '@/utils/githubUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useRepositoryData } from '@/hooks/useRepositoryData';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFadeIn } from '@/utils/animationHooks';
import { toast } from 'sonner';
import { Folder, File } from 'lucide-react';
import { FileNode } from '@/utils/githubUtils';

export default function RepositorySettings() {
  const { toast: uiToast } = useToast();
  const { fetchRepositories, fetchFileStructure } = useGithubApi();
  const { 
    selectedRepository, 
    setSelectedRepository, 
    setRepositoryFileStructure,
    updateLastGithubRefresh,
    localRepositoryPath,
    setLocalRepositoryPath,
    setLocalFileStructure
  } = useRepositoryData();
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('APL_githubToken') || '');
  const [githubRepos, setGithubRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>(githubToken);
  const [activeTab, setActiveTab] = useState<string>("github");
  const fadeIn = useFadeIn();
  const projectFolderRef = useRef<HTMLInputElement>(null);

  // Load github token from localStorage when component mounts
  useEffect(() => {
    const savedToken = localStorage.getItem('APL_githubToken');
    if (savedToken) {
      setGithubToken(savedToken);
      setTokenInput(savedToken);
    }

    // Load local repository path
    const savedLocalPath = localStorage.getItem('APL_localRepositoryPath');
    if (savedLocalPath) {
      setLocalRepositoryPath(savedLocalPath);
    }
  }, []);

  // Fetch repositories when token changes
  useEffect(() => {
    if (githubToken) {
      handleFetchRepositories();
    }
  }, [githubToken]); 

  const handleTokenSubmit = () => {
    if (!tokenInput.trim()) {
      uiToast({
        title: "Token Required",
        description: "Please enter a GitHub token",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('APL_githubToken', tokenInput.trim());
    setGithubToken(tokenInput.trim());
    uiToast({
      title: "Token Saved",
      description: "GitHub token saved successfully"
    });
  };

  const handleTokenClear = () => {
    localStorage.removeItem('APL_githubToken');
    setGithubToken('');
    setTokenInput('');
    setGithubRepos([]);
    localStorage.removeItem('APL_selectedGithubRepo');
    setSelectedRepository(null);
    uiToast({
      title: "Token Cleared",
      description: "GitHub token has been removed"
    });
  };

  const handleFetchRepositories = async () => {
    if (!githubToken) {
      uiToast({
        title: "Token Required",
        description: "Please enter a GitHub token",
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
      
      const fileStructure: FileNode[] = [];
      const directories: Record<string, FileNode> = {};
      
      files.forEach(file => {
        const path = file.webkitRelativePath;
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
        const isDataWeave = fileName.endsWith('.dwl');
        
        const fileNode: FileNode = {
          name: fileName,
          path: path,
          type: 'file',
          isDataWeave
        };
        
        parentNode?.children?.push(fileNode);
      });
      
      // Save the file structure
      setLocalFileStructure(fileStructure);
      localStorage.setItem('APL_localFileStructure', JSON.stringify(fileStructure));
      
      toast.success('Local folder loaded successfully');
    }
  };

  const clearLocalRepository = () => {
    localStorage.removeItem('APL_localRepositoryPath');
    localStorage.removeItem('APL_localFileStructure');
    setLocalRepositoryPath('');
    setLocalFileStructure([]);
    toast.success('Local repository cleared');
  };

  const renderGithubTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>Connect to your GitHub repositories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="github-token" className="text-sm font-medium">
              GitHub Personal Access Token
            </label>
            <div className="flex gap-2">
              <Input
                id="github-token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                type="password"
                placeholder="ghp_..."
                className="flex-1"
              />
              <Button onClick={handleTokenSubmit} disabled={!tokenInput.trim()}>
                Save Token
              </Button>
              {githubToken && (
                <Button variant="outline" onClick={handleTokenClear}>
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Token requires repo scope. <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Generate token</a>
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleFetchRepositories} 
            disabled={!githubToken || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Loading..." : "Fetch Repositories"}
          </Button>
        </CardFooter>
      </Card>

      {githubRepos.length > 0 && (
        <motion.div
          {...fadeIn}
          className="space-y-4"
        >
          <h3 className="text-lg font-medium">Select a Repository</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {githubRepos.map((repo) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelectRepo(repo)}
                className={`border p-3 rounded-md cursor-pointer transition-colors ${
                  selectedRepository && selectedRepository.id === repo.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-gray-300 hover:bg-gray-50'
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
              <Folder className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-1">Select a folder from your device</p>
              <p className="text-sm text-gray-500">
                Choose a project folder to use as your local repository
              </p>
            </div>
          </div>
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
                <div>
                  <h4 className="text-sm font-medium mb-2">Selected Files (Click to select files):</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    {/* Display local file structure here */}
                    <LocalFileStructureView />
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
  const LocalFileStructureView = () => {
    const { localFileStructure } = useRepositoryData();
    
    if (!localFileStructure || localFileStructure.length === 0) {
      return <div className="text-center py-4 text-gray-500">No files found</div>;
    }
    
    const renderFileNode = (node: FileNode, depth = 0) => {
      const paddingLeft = `${depth * 16}px`;
      
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
            <span className="text-sm truncate">{node.name}</span>
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
        {localFileStructure.map(node => renderFileNode(node))}
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
