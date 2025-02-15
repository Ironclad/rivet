interface TreeNode {
  path: string;
  name: string;
  isDirectory: boolean;
  children: TreeNode[];
}

export function createTreeFromPaths(paths: string[], rootPath: string): TreeNode {
  // Helper to get all parent paths of a given path
  const getParentPaths = (path: string): string[] => {
    const parts = path.split('/').filter((p) => p);
    return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'));
  };

  // First, create a unique set of all directories
  const directories = new Set<string>();
  paths.forEach((path) => {
    // Add all parent directories of this path
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    getParentPaths(cleanPath).forEach((dir) => directories.add(dir));

    // If the path itself ends with /, it's a directory
    if (path.endsWith('/')) {
      directories.add(cleanPath);
    }
  });

  // Create the root node
  const root: TreeNode = {
    path: rootPath,
    name: rootPath || 'root',
    isDirectory: true,
    children: [],
  };

  // Create a map for quick node lookups - use full paths as keys
  const nodeMap = new Map<string, TreeNode>();
  nodeMap.set(rootPath, root);

  // Helper to get or create a node for a path
  const getOrCreateNode = (fullPath: string): TreeNode => {
    const cleanPath = fullPath.replace(/^\/+|\/+$/g, '');

    if (nodeMap.has(cleanPath)) {
      return nodeMap.get(cleanPath)!;
    }

    const parts = cleanPath.split('/').filter((p) => p);
    const name = parts[parts.length - 1] || cleanPath;
    const node: TreeNode = {
      path: name, // Just use the name as the path
      name,
      isDirectory: directories.has(cleanPath),
      children: [],
    };
    nodeMap.set(cleanPath, node); // Still use full path for lookup

    // Important: Create parent-child relationship immediately
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = getOrCreateNode(parentPath);
      if (!parent.children.some((child) => child.name === name)) {
        parent.children.push(node);
      }
    } else if (cleanPath && rootPath !== cleanPath) {
      // Top-level node
      if (!root.children.some((child) => child.name === name)) {
        root.children.push(node);
      }
    }

    return node;
  };

  // Process all paths to build the tree
  paths
    .filter((path) => path.trim())
    .forEach((path) => {
      const cleanPath = path.replace(/^\/+|\/+$/g, '');
      if (cleanPath) {
        getOrCreateNode(cleanPath);
      }
    });

  // Sort children of all nodes
  const sortNode = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  };
  sortNode(root);

  return root;
}
