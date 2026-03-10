/**
 * Repository scanner module.
 */
import fs from "fs";
import path from "path";
import { FileNode } from "../core/types.js";

//function signature for scanDirectory

export function scanDirectory(dirPath: string): FileNode {
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
        const stat = fs.statSync(fullPath);
        const isDir = stat.isDirectory(); 
        //if the node has children, add the item to the children
        if (node.children) {
            if (isDir) {                                                                                                                                       
                const childNode = scanDirectory(fullPath);                                                                                                     
                node.children.push(childNode);                                                                                                                 
            } else {                                                                                                                                           
                node.children.push({                                                                                                                           
                    name: item,                                                                                                                                
                    path: fullPath,                
                    type: "file",
                    extension: path.extname(fullPath),
                    sizeBytes: stat.size
                });
            }
        }
    }
    return node;
};
