/**
 * Repository scanner module.
 */
import fs from "fs";
import path from "path";

//define types
export type ScanResult = {
    path: string;
    type: "file" | "directory";
};

//function signature for scanDirectory

export function scanDirectory(dirPath: string): ScanResult[] {
    const results: ScanResult[] = [];
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item); 
        const stat = fs.statSync(fullPath);
        const isDir = stat.isDirectory();
        results.push({
            path: fullPath, 
            type: isDir ? "directory" : "file"
        });
        if (isDir) {
            const children = scanDirectory(fullPath);
            results.push(...children);
        }
    }
    return results;
};
