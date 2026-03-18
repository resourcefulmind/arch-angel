/**
 * Repository scanner module.
 */
import fs from "fs";
import path from "path";
import { FileNode, ScanResult, ScanOptions, ScanContext } from "../core/types.js";
import { DEFAULT_IGNORED_DIRECTORIES, DEFAULT_MAX_FILE_SIZE_BYTES, BINARY_EXTENSIONS, SENSITIVE_FILE_PATTERNS } from "../core/constants.js"; 
import { shouldIgnoreDirectory, isFileTooLarge, isBinaryFile, isSensitiveFile, isValidUtf8 } from "./filters.js";
import ignore from "ignore";
import { computeStats } from "./stats.js";

//function signature for scanDirectory

export function scanDirectory(dirPath: string, options?: ScanOptions): ScanResult {
    const context: ScanContext ={
        warnings: [], 
        options: {
            ignoredDirectories: options?.ignoredDirectories ?? [... DEFAULT_IGNORED_DIRECTORIES], 
            respectGitignore: options?.respectGitignore ?? true, 
            maxFileSizeBytes: options?.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES, 
        },
        rootPath: dirPath,
    }
    if (context.options.respectGitignore) {
        try {
            const gitignorePath = path.join(dirPath, ".gitignore");
            const fileContents = fs.readFileSync(gitignorePath, "utf-8");
            const ig = ignore().add(fileContents);
            context.gitignore = ig;
        } catch (error) {
            // do nothing if .gitignore doesn't exist
        }
    }
    const tree = walkDirectory(dirPath, context);
    const stats = computeStats(tree);
    return {
        root: dirPath,
        tree: tree,
        stats: stats,
        warnings: context.warnings,
    };
};

function walkDirectory(dirPath: string, context: ScanContext): FileNode {
    //create a node for the current directory
    const node : FileNode = {
        name: path.basename(dirPath), 
        path: dirPath, 
        type: "directory", 
        children: [], 
    }
    //read the directory and get the items
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item); 
        const stat = fs.lstatSync(fullPath);
        if (context.gitignore){
            if (context.gitignore.ignores(path.relative(context.rootPath, fullPath))) {
                continue;
            }
        }
        if (stat.isSymbolicLink()) {
            context.warnings.push({
                type: "symlink_skipped", 
                path: fullPath, 
                message: `Symlink skipped: ${fullPath}`
            });
            continue;
        }
        const isDir = stat.isDirectory(); 
        if (isDir && shouldIgnoreDirectory(item, context.options.ignoredDirectories)) {
            continue;
        }
        //if the node has children, add the item to the children
        if (node.children) {
            if (isDir) {                                                                                                                                       
                const childNode = walkDirectory(fullPath, context);                                                                                                     
                node.children.push(childNode);                                                                                                                 
            } else {  
                if(isBinaryFile(path.extname(fullPath), BINARY_EXTENSIONS)) {
                    continue;
                }
                if (isSensitiveFile(item, SENSITIVE_FILE_PATTERNS)) {
                    continue;
                }
                if (isFileTooLarge(stat.size, context.options.maxFileSizeBytes)) {
                    context.warnings.push({
                        type: "file_too_large", 
                        path: fullPath, 
                        message: `File too large: ${fullPath}`
                    });
                    continue;
                }
                const fd = fs.openSync(fullPath, "r");
                const buffer = Buffer.alloc(8192);
                fs.readSync(fd, buffer, 0, 8192, 0);
                fs.closeSync(fd);
                if (!isValidUtf8(buffer)) {
                    context.warnings.push({
                        type: "non_utf8", 
                        path: fullPath, 
                        message: `Non-UTF-8 file: ${fullPath}`
                    });
                    continue;
                }
                node.children.push({                                                                                                                           
                    name: item,                                                                                                                                
                    path: fullPath,                
                    type: "file",
                    extension: path.extname(fullPath) || undefined,
                    sizeBytes: stat.size
                });
            }
        }
    }
    return node;
}