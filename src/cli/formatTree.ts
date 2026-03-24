import { FileNode } from "../core/types.js";

export function formatTree(tree: FileNode): string {                                                                                                                                                                                          
    let result = tree.name + "\n";
    const children = tree.children ?? [];                                                                                                                                                                                                     

    function sortNodes(a: FileNode, b: FileNode): number {
        if (a.type === "directory" && b.type !== "directory") return -1;
        if (a.type !== "directory" && b.type === "directory") return 1;
        return a.name.localeCompare(b.name);
    }
    function drawNode(node: FileNode, prefix: string, isLast: boolean): void {                                                                                                                                                                
        const connector = isLast ? "└── " : "├── ";
        result += prefix + connector + node.name + "\n";                                                                                                                                                                                      
        const nodeChildren = node.children ?? [];
        nodeChildren.sort(sortNodes); 
        for (let i = 0; i < nodeChildren.length; i++) {                                                                                                                                                                                       
            const childPrefix = prefix + (isLast ? "    " : "│   ");
            drawNode(nodeChildren[i], childPrefix, i === nodeChildren.length - 1);                                                                                                                                                            
        }       
    }                                                                                                                                                                                                                                         
    children.sort(sortNodes);           
    for (let i = 0; i < children.length; i++) {
        drawNode(children[i], "", i === children.length - 1);
    }                                                                                                                                                                                                                                         

    return result;                                                                                                                                                                                                                            
}               
