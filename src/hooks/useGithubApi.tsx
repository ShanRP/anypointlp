
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Repository, FileNode, buildFileTree, GithubTreeItem, fetchFileContent as fetchContent } from "@/utils/githubUtils";
import { supabase } from "@/integrations/supabase/client";

interface UseGithubApiReturn {
  repositories: Repository[];
  loadingRepositories: boolean;
  fetchRepositories: () => Promise<Repository[]>;
  fileStructure: FileNode[];
  loadingFileStructure: boolean;
  fetchFileStructure: (repo: Repository) => Promise<FileNode[]>;
  fetchFileContent: (repo: Repository, filePath: string) => Promise<string | null>;
  authenticateWithGitHub: () => Promise<void>;
  isAuthenticated: boolean;
  logoutGitHub: () => Promise<void>;
  authInProgress: boolean;
}

export function useGithubApi(): UseGithubApiReturn {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [loadingFileStructure, setLoadingFileStructure] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('APL_githubToken'));
  const [authInProgress, setAuthInProgress] = useState(false);

  // Authenticate with GitHub through Supabase
  const authenticateWithGitHub = async () => {
    try {
      setAuthInProgress(true);
      // You would typically use supabase.auth.signInWithOAuth here
      // For this implementation, we'll use a popup window approach
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const popup = window.open(
        "https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&scope=repo&redirect_uri=YOUR_REDIRECT_URI",
        "github-oauth",
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // This is a simplified implementation
      // In a real app, you'd need to handle the OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'github-oauth-success') {
          const token = event.data.token;
          localStorage.setItem('APL_githubToken', token);
          setIsAuthenticated(true);
          toast.success("Successfully authenticated with GitHub");
          fetchRepositories();
          window.removeEventListener('message', handleMessage);
          setAuthInProgress(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // For now, let's simulate the OAuth flow for prototyping
      // In a real app, remove this and implement proper OAuth
      setTimeout(() => {
        try {
          const mockToken = "github_mock_token_" + Math.random().toString(36).substring(2);
          localStorage.setItem('APL_githubToken', mockToken);
          setIsAuthenticated(true);
          toast.success("Successfully authenticated with GitHub");
          fetchRepositories().catch(err => {
            console.error("Error fetching repositories after auth:", err);
            toast.error("Failed to load repositories after authentication");
          });
        } catch (error) {
          console.error("Error in mock authentication:", error);
        } finally {
          setAuthInProgress(false);
        }
      }, 1500);
      
    } catch (error: any) {
      console.error('Error authenticating with GitHub:', error);
      toast.error(`Authentication failed: ${error.message}`);
      setAuthInProgress(false);
    }
  };
  
  const logoutGitHub = async () => {
    try {
      localStorage.removeItem('APL_githubToken');
      localStorage.removeItem('APL_selectedGithubRepo');
      localStorage.removeItem('APL_repoFileStructure');
      setRepositories([]);
      setFileStructure([]);
      setIsAuthenticated(false);
      toast.success("Logged out from GitHub");
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error("Failed to log out completely");
    }
  };

  const fetchRepositories = useCallback(async (): Promise<Repository[]> => {
    setLoadingRepositories(true);
    try {
      const token = localStorage.getItem('APL_githubToken');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      // Use a timeout to simulate API call for easier debugging
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
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
            setLoadingRepositories(false);
            resolve(repos);
          } catch (error: any) {
            console.error('Error fetching repositories:', error);
            setLoadingRepositories(false);
            resolve([]);
          }
        }, 800);
      });
    } catch (error: any) {
      console.error('Error fetching repositories:', error);
      // toast.error(`Failed to load repositories: ${error.message}`);
      setLoadingRepositories(false);
      return [];
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
      // toast.error(`Failed to load repository structure: ${error.message}`);
      return [];
    } finally {
      setLoadingFileStructure(false);
    }
  }, []);

  const fileContentCache = new Map();

  const fetchFileContent = useCallback(async (repo: Repository, filePath: string): Promise<string | null> => {
    const cacheKey = `${repo.id}-${filePath}`;
    if (fileContentCache.has(cacheKey)) {
      return fileContentCache.get(cacheKey);
    }
    try {
      const content = await fetchContent(repo, filePath);
      fileContentCache.set(cacheKey, content);
      return content;
    } catch (error: any) {
      console.error('Error fetching file content:', error);
      // toast.error(`Failed to fetch file content: ${error.message}`);
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
    fetchFileContent,
    authenticateWithGitHub,
    isAuthenticated,
    logoutGitHub,
    authInProgress
  };
}
