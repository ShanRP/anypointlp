
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Repository, FileNode, buildFileTree, GithubTreeItem } from "@/utils/githubUtils";

interface UseGithubApiReturn {
  repositories: Repository[];
  loadingRepositories: boolean;
  fetchRepositories: () => Promise<Repository[]>;
  fileStructure: FileNode[];
  loadingFileStructure: boolean;
  fetchFileStructure: (repo: Repository) => Promise<FileNode[]>;
  fetchFileContent: (repo: Repository, filePath: string) => Promise<string | null>;
}

export function useGithubApi(): UseGithubApiReturn {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [loadingFileStructure, setLoadingFileStructure] = useState(false);

  const fetchRepositories = useCallback(async (): Promise<Repository[]> => {
    setLoadingRepositories(true);
    try {
      const token = localStorage.getItem('APL_githubToken');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      const repos = data.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || 'No description available',
        default_branch: repo.default_branch,
        html_url: repo.html_url,
        private: repo.private,
        updated_at: repo.updated_at
      }));

      // Find the selected repository from localStorage and mark it as selected
      const selectedRepo = localStorage.getItem('APL_selectedGithubRepo');
      if (selectedRepo) {
        try {
          const parsedRepo = JSON.parse(selectedRepo);
          repos.forEach(repo => {
            if (repo.id === parsedRepo.id) {
              repo.selected = true;
            }
          });
        } catch (error) {
          console.error('Error parsing selected repository:', error);
        }
      }

      setRepositories(repos);
      return repos;
    } catch (error: any) {
      console.error('Error fetching repositories:', error);
      toast.error(`Failed to load repositories: ${error.message}`);
      return [];
    } finally {
      setLoadingRepositories(false);
    }
  }, []);

  const fetchFileStructure = useCallback(async (repo: Repository): Promise<FileNode[]> => {
    setLoadingFileStructure(true);
    try {
      const token = localStorage.getItem('APL_githubToken');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.truncated) {
        toast.warning('Repository is too large, not all files may be displayed');
      }
      
      const structure = buildFileTree(data.tree as GithubTreeItem[]);
      setFileStructure(structure);
      return structure;
    } catch (error: any) {
      console.error('Error fetching file structure:', error);
      toast.error(`Failed to load repository structure: ${error.message}`);
      return [];
    } finally {
      setLoadingFileStructure(false);
    }
  }, []);

  const fetchFileContent = useCallback(async (repo: Repository, filePath: string): Promise<string | null> => {
    try {
      const token = localStorage.getItem('APL_githubToken');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${filePath}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      console.error('Error fetching file content:', error);
      toast.error(`Failed to fetch file content: ${error.message}`);
      return null;
    }
  }, []);

  return {
    repositories,
    loadingRepositories,
    fetchRepositories,
    fileStructure,
    loadingFileStructure,
    fetchFileStructure,
    fetchFileContent
  };
}
