
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileNode as GithubFileNode, Repository as GithubRepository } from '@/utils/githubUtils';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isDataWeave?: boolean;
  isRaml?: boolean;
  isXml?: boolean;  // Added this property
  selected?: boolean;
}

export interface Repository {
  id: string;  // Changed from number to string to match githubUtils
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  default_branch: string;  // Added this field
  updated_at: string;
}

export function useRepositoryData() {
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [repositoryFileStructure, setRepositoryFileStructure] = useState<FileNode[]>([]);
  const [localRepositoryPath, setLocalRepositoryPath] = useState<string>('');
  const [localFileStructure, setLocalFileStructure] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([]);
  const [lastGithubRefresh, setLastGithubRefresh] = useState<Date | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  useEffect(() => {
    // Load repository data from localStorage
    const loadRepositoryData = () => {
      try {
        setIsLoading(true);
        
        // Load selected GitHub repository
        const savedRepo = localStorage.getItem('APL_selectedGithubRepo');
        if (savedRepo) {
          setSelectedRepository(JSON.parse(savedRepo));
        }
        
        // Load repository file structure
        const savedFileStructure = localStorage.getItem('APL_repoFileStructure');
        if (savedFileStructure) {
          setRepositoryFileStructure(JSON.parse(savedFileStructure));
        }
        
        // Load local repository path
        const savedLocalPath = localStorage.getItem('APL_localRepositoryPath');
        if (savedLocalPath) {
          setLocalRepositoryPath(savedLocalPath);
        }
        
        // Load local file structure
        const savedLocalStructure = localStorage.getItem('APL_localFileStructure');
        if (savedLocalStructure) {
          setLocalFileStructure(JSON.parse(savedLocalStructure));
        }

        // Load selected files
        const savedSelectedFiles = localStorage.getItem('APL_selectedFiles');
        if (savedSelectedFiles) {
          setSelectedFiles(JSON.parse(savedSelectedFiles));
        }
        
        // Load github error state
        const savedGithubError = localStorage.getItem('APL_githubError');
        if (savedGithubError) {
          setGithubError(savedGithubError);
        }
        
        // Load last github refresh time
        const savedLastRefresh = localStorage.getItem('APL_lastGithubRefresh');
        if (savedLastRefresh) {
          setLastGithubRefresh(new Date(savedLastRefresh));
        }
      } catch (error) {
        console.error('Error loading repository data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRepositoryData();
    
    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'APL_selectedGithubRepo' || 
          e.key === 'APL_repoFileStructure' || 
          e.key === 'APL_localRepositoryPath' ||
          e.key === 'APL_localFileStructure' ||
          e.key === 'APL_selectedFiles' ||
          e.key === 'APL_githubError' ||
          e.key === 'APL_lastGithubRefresh') {
        loadRepositoryData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to toggle file selection
  const toggleFileSelection = (filePath: string, source: 'github' | 'local') => {
    const fileStructure = source === 'github' ? repositoryFileStructure : localFileStructure;
    
    // Helper function to recursively update the file structure
    const updateFileNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === filePath) {
          // Toggle selection for this file
          const isSelected = !node.selected;
          
          // Update selected files array
          if (isSelected) {
            const updatedSelectedFiles = [...selectedFiles.filter(f => f.path !== node.path), { ...node, selected: true }];
            setSelectedFiles(updatedSelectedFiles);
            localStorage.setItem('APL_selectedFiles', JSON.stringify(updatedSelectedFiles));
          } else {
            const updatedSelectedFiles = selectedFiles.filter(f => f.path !== node.path);
            setSelectedFiles(updatedSelectedFiles);
            localStorage.setItem('APL_selectedFiles', JSON.stringify(updatedSelectedFiles));
          }
          
          return { ...node, selected: isSelected };
        } else if (node.children) {
          // Recursively update children
          return { ...node, children: updateFileNodes(node.children) };
        }
        return node;
      });
    };
    
    // Update the file structure
    if (source === 'github') {
      const updatedStructure = updateFileNodes(fileStructure);
      setRepositoryFileStructure(updatedStructure);
      localStorage.setItem('APL_repoFileStructure', JSON.stringify(updatedStructure));
    } else {
      const updatedStructure = updateFileNodes(fileStructure);
      setLocalFileStructure(updatedStructure);
      localStorage.setItem('APL_localFileStructure', JSON.stringify(updatedStructure));
    }
  };

  // Clear selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    localStorage.removeItem('APL_selectedFiles');
    
    // Helper function to recursively update the file structure
    const clearFileSelections = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.selected) {
          return { ...node, selected: false };
        } else if (node.children) {
          return { ...node, children: clearFileSelections(node.children) };
        }
        return node;
      });
    };
    
    // Update both file structures
    const updatedGithubStructure = clearFileSelections(repositoryFileStructure);
    setRepositoryFileStructure(updatedGithubStructure);
    localStorage.setItem('APL_repoFileStructure', JSON.stringify(updatedGithubStructure));
    
    const updatedLocalStructure = clearFileSelections(localFileStructure);
    setLocalFileStructure(updatedLocalStructure);
    localStorage.setItem('APL_localFileStructure', JSON.stringify(updatedLocalStructure));
  };
  
  // Set Github error state
  const setGithubErrorState = (error: string | null) => {
    setGithubError(error);
    if (error) {
      localStorage.setItem('APL_githubError', error);
    } else {
      localStorage.removeItem('APL_githubError');
    }
  };
  
  // Update last GitHub refresh time
  const updateLastGithubRefresh = () => {
    const now = new Date();
    setLastGithubRefresh(now);
    localStorage.setItem('APL_lastGithubRefresh', now.toISOString());
  };

  return {
    selectedRepository,
    repositoryFileStructure,
    localRepositoryPath,
    localFileStructure,
    selectedFiles,
    isLoading,
    githubError,
    lastGithubRefresh,
    // Add setters so components can update the state
    setSelectedRepository,
    setRepositoryFileStructure,
    setLocalRepositoryPath,
    setLocalFileStructure,
    toggleFileSelection,
    clearSelectedFiles,
    setGithubErrorState,
    updateLastGithubRefresh
  };
}
