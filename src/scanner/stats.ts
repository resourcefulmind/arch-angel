import { FileNode, ScanResult } from "../core/types.js";

export function computeStats(tree: FileNode): ScanResult["stats"] {
    let totalFiles = 0; 
    let totalDirectories = 0; 
    let totalSizeBytes = 0;
    const languages: Record<string, number> = {};

    function walk(node: FileNode) {
        if (node.type === "file") {
            totalFiles++;
            totalSizeBytes += node.sizeBytes ?? 0;
            const extension = node.extension ?? node.name;
            languages[extension] = (languages[extension] ?? 0) + 1;
        } else if (node.type === "directory") {
            totalDirectories++;
            for (const child of node.children ?? []) {
                walk(child);
            }
        }
    }
    walk(tree);
    return {
        totalFiles,
        totalDirectories,
        totalSizeBytes,
        languages,
    };
}