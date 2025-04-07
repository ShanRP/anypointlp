
import { useState, useEffect } from 'react';
import { useGithubApi } from './useGithubApi';
import { Repository, FileNode } from '@/utils/githubUtils';
import { toast } from 'sonner';

export function useMUnitRepositoryData() {
  const {
    repositories,
    loadingRepositories,
    fetchRepositories,
    fetchFileStructure,
    fetchFileContent
  } = useGithubApi();
  
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [branches, setBranches] = useState<string[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch repositories if needed
  useEffect(() => {
    if (repositories.length === 0) {
      fetchRepositories();
    }
  }, [repositories, fetchRepositories]);

  // Fetch branches when repository changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedRepository) return;
      
      setLoading(true);
      try {
        const repo = repositories.find(r => r.id === selectedRepository);
        if (!repo) {
          throw new Error('Repository not found');
        }
        
        // For now, just use the default branch
        setBranches([repo.default_branch]);
        setSelectedBranch(repo.default_branch);
        
        // Fetch file structure for the repository
        const fileStructure = await fetchFileStructure(repo);
        setFiles(fileStructure);
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to fetch repository branches');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranches();
  }, [selectedRepository, repositories, fetchFileStructure]);

  // Fetch file content when file path changes
  useEffect(() => {
    const getFileContent = async () => {
      if (!selectedRepository || !selectedFilePath) return;
      
      setLoading(true);
      try {
        const repo = repositories.find(r => r.id === selectedRepository);
        if (!repo) {
          throw new Error('Repository not found');
        }
        
        const content = await fetchFileContent(repo, selectedFilePath);
        if (content) {
          setFileContent(content);
        }
      } catch (error) {
        console.error('Error fetching file content:', error);
        toast.error('Failed to fetch file content');
      } finally {
        setLoading(false);
      }
    };
    
    getFileContent();
  }, [selectedRepository, selectedFilePath, repositories, fetchFileContent]);

  const selectRepository = (repoId: string) => {
    setSelectedRepository(repoId);
    setSelectedFilePath('');
    setFileContent('');
  };

  const selectBranch = (branch: string) => {
    setSelectedBranch(branch);
  };

  const selectFile = (filePath: string) => {
    setSelectedFilePath(filePath);
  };

  return {
    repositories,
    selectedRepository,
    selectRepository,
    branches,
    selectedBranch,
    selectBranch,
    files,
    selectedFilePath,
    selectFile,
    fileContent,
    loading
  };
}
