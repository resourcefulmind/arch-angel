/** Filtering logic for the scanner. */

export function shouldIgnoreDirectory(
    dirName: string, 
    ignoredDirs: readonly string[], 
): boolean {
    return ignoredDirs.includes(dirName);
}

/** Determine if a file should be skipped based on its size. */
export function isFileTooLarge(
    sizeBytes: number, 
    maxFileSizeBytes: number, 
): boolean {
    return sizeBytes > maxFileSizeBytes;
}
// skipping images, compiled outputs, archives, etc.
export function isBinaryFile(
    extension: string, 
    binaryExtensions: readonly string[], 
): boolean {
    return binaryExtensions.includes(extension.toLowerCase());
}

// sensitive files security safety net
export function isSensitiveFile(
    filename: string, 
    patterns: readonly string[], 
): boolean {
    for (const pattern of patterns) {
        if(pattern.startsWith("*")) {
            const suffix = pattern.slice(1)
            if(filename.endsWith(suffix)) {
                return true;
            }
        } else if (pattern.endsWith("*")) {
            const prefix = pattern.slice(0, -1) 
            if(filename.startsWith(prefix)) {
                return true;
            }
        } else {
            if (filename === pattern) {
                return true;
            }
        }
    }
    return false;
};

//utf-8 encoding check
export function isValidUtf8(
    buffer: Buffer, 
): boolean {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    try {
        decoder.decode(buffer);
        return true;
    } catch (error) {
        return false; //not a valid utf-8 string
    }
}