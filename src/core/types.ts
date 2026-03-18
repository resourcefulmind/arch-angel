/** Core types shared across arch-angel modules. */

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
    totalSizeBytes: number;
  };
  warnings: readonly ScanWarning[];
}

/** Caller-provided overrides for scanner behavior. All fields optional and defaults applied at scan time. */
export interface ScanOptions {
  ignoredDirectories?: readonly string[]; 
  respectGitignore?: boolean; 
  maxFileSizeBytes?: number; 
}

/** Non-fatal issue encountered during scanning. The scan continues, but the caller may want to surface these. */
export interface ScanWarning {
  type: "symlink_skipped" | "file_too_large" | "non_utf8" | "permission_denied" ;
  path: string; 
  message: string; 

}

/** Internal state threaded through recursive scanning, resolved options plus accumulated warnings. */
export interface ScanContext {
  options: Required<ScanOptions>; 
  warnings: ScanWarning[];
  gitignore?: { ignores(pathname: string): boolean };
  rootPath: string;
}