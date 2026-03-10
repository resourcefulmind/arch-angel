/**
 * Core types shared across arch-angel modules.
 */

/** Represents a single file or directory in a scanned repo. */
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[]; 
  extension?: string;
  sizeBytes?: number;
}

/** Result of scanning a repository. */
export interface ScanResult {
  root: string;
  tree: FileNode;
  stats: {
    totalFiles: number;
    totalDirectories: number;
    languages: Record<string, number>;
  };
}
