
import { toast } from "sonner";

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isDataWeave?: boolean;
  isRaml?: boolean;  
  isXml?: boolean;   
  isJson?: boolean;  // Added for JSON files
  isCsv?: boolean;   // Added for CSV files
  isYaml?: boolean;  // Added for YAML files
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
      const lowerFileName = fileName.toLowerCase();
      
      // Check file types
      const isDataWeave = lowerFileName.endsWith('.dwl');
      const isRaml = lowerFileName.endsWith('.raml');
      const isXml = lowerFileName.endsWith('.xml');
      const isJson = lowerFileName.endsWith('.json');
      const isCsv = lowerFileName.endsWith('.csv');
      const isYaml = lowerFileName.endsWith('.yaml') || lowerFileName.endsWith('.yml');

      const fileNode: FileNode = {
        name: fileName,
        path: item.path,
        type: 'file',
        isDataWeave,
        isRaml,
        isXml,
        isJson,
        isCsv,
        isYaml
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
export const fetchFileContent = async (repo: Repository, filePath: string, retryCount = 0): Promise<string | null> => {
  try {
    const token = localStorage.getItem('APL_githubToken');
    if (!token) {
      throw new Error('GitHub token not found');
    }

    // Encoding filePath for special characters
    const encodedFilePath = filePath.split('/').map(part => encodeURIComponent(part)).join('/');
    
    const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${encodedFilePath}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    if (response.status === 404) {
      throw new Error(`File not found: ${filePath}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch file (${response.status}): ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching file content:', error);
    
    // Implement retry mechanism for network errors
    if (retryCount < 2 && error instanceof Error && (
      error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('rate limit')
    )) {
      console.log(`Retrying file fetch (${retryCount + 1}/2): ${filePath}`);
      return fetchFileContent(repo, filePath, retryCount + 1);
    }
    
    toast.error(`Failed to fetch file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

/**
 * Checks if a file is of a specific format
 */
export const isFileOfType = (fileName: string, format: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch(format.toLowerCase()) {
    case 'json':
      return extension === 'json';
    case 'xml':
      return extension === 'xml';
    case 'csv':
      return extension === 'csv';
    case 'yaml':
      return extension === 'yaml' || extension === 'yml';
    case 'dataweave':
    case 'dwl':
      return extension === 'dwl';
    case 'raml':
      return extension === 'raml';
    default:
      return false;
  }
};

/**
 * Finds all files of a specific format in a file structure
 */
export const findFilesByFormat = (nodes: FileNode[], format: string): FileNode[] => {
  const result: FileNode[] = [];
  
  const traverse = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file' && isFileOfType(node.name, format)) {
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
