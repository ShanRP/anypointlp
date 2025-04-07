
import { toast } from "sonner";

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isDataWeave?: boolean;
  isRaml?: boolean;  
  isXml?: boolean;   // This property was added
  selected?: boolean;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string;
  default_branch: string;
  html_url?: string;
  private?: boolean;
  updated_at?: string;
  selected?: boolean;
  fileStructure?: FileNode[];
}

export interface GithubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

/**
 * Builds a file tree structure from GitHub API response
 */
export function buildFileTree(items: GithubTreeItem[]): FileNode[] {
  // Create a map to store directories
  const dirMap: Record<string, FileNode> = {};
  const rootNodes: FileNode[] = [];

  // Sort items so directories come first
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === 'tree' && b.type !== 'tree') return -1;
    if (a.type !== 'tree' && b.type === 'tree') return 1;
    return a.path.localeCompare(b.path);
  });

  // First pass: create all directories
  sortedItems.forEach(item => {
    if (item.type === 'tree') {
      const name = item.path.split('/').pop() || '';
      dirMap[item.path] = {
        name,
        path: item.path,
        type: 'directory',
        children: []
      };
    }
  });

  // Second pass: create all files and build hierarchy
  sortedItems.forEach(item => {
    if (item.type === 'blob') {
      const pathParts = item.path.split('/');
      const fileName = pathParts.pop() || '';
      const parentPath = pathParts.join('/');
      const isDataWeave = fileName.toLowerCase().endsWith('.dwl');
      const isRaml = fileName.toLowerCase().endsWith('.raml');
      const isXml = fileName.toLowerCase().endsWith('.xml'); // Add XML detection

      const fileNode: FileNode = {
        name: fileName,
        path: item.path,
        type: 'file',
        isDataWeave,
        isRaml,
        isXml
      };

      if (parentPath === '') {
        // This is a root-level file
        rootNodes.push(fileNode);
      } else if (dirMap[parentPath]) {
        // Add to parent directory's children
        dirMap[parentPath].children?.push(fileNode);
      }
    }
  });

  // Final pass: build directory hierarchy
  Object.keys(dirMap).forEach(path => {
    const pathParts = path.split('/');
    const dirName = pathParts.pop();
    const parentPath = pathParts.join('/');

    if (parentPath === '') {
      // This is a root-level directory
      rootNodes.push(dirMap[path]);
    } else if (dirMap[parentPath]) {
      // Add to parent directory's children
      dirMap[parentPath].children?.push(dirMap[path]);
    }
  });

  // Sort root nodes (directories first, then alphabetically)
  rootNodes.sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  return rootNodes;
}

/**
 * Fetches file content from GitHub repository
 */
export const fetchFileContent = async (repo: Repository, filePath: string): Promise<string | null> => {
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
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching file content:', error);
    toast.error('Failed to fetch file content');
    return null;
  }
};

/**
 * Finds all DataWeave files in a file structure
 */
export const findDataWeaveFiles = (nodes: FileNode[]): FileNode[] => {
  const result: FileNode[] = [];
  
  const traverse = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file' && node.isDataWeave) {
        result.push(node);
      }
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };
  
  traverse(nodes);
  return result;
};

/**
 * Finds all RAML files in a file structure
 */
export const findRamlFiles = (nodes: FileNode[]): FileNode[] => {
  const result: FileNode[] = [];
  
  const traverse = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file' && node.isRaml) {
        result.push(node);
      }
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };
  
  traverse(nodes);
  return result;
};
