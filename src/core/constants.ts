//define readonly constants, centralized scanner filter data so filter logic and configuration stay separate

export const DEFAULT_IGNORED_DIRECTORIES = [
    "node_modules", 
    ".git", 
    "dist", 
    "build", 
    "coverage", 
    ".next", 
    ".arch-angel", 
] as const; 

export const BINARY_EXTENSIONS = [
    ".png", 
    ".jpg", 
    ".jpeg", 
    ".gif", 
    ".svg", 
    ".ico", 
    ".woff", 
    ".woff2", 
    ".ttf", 
    ".eot", 
    ".zip", 
    ".tar", 
    ".gz", 
    ".rar", 
    ".7z", 
    ".exe", 
    ".dll", 
    ".so", 
    ".dylib", 
    ".pdf", 
    ".doc", 
    ".docx", 
    ".xls", 
    ".xlsx", 
    ".mp3", 
    ".mp4", 
    ".avi", 
    ".mov", 
    ".sqlite", 
    ".db", 
] as const; 

export const SENSITIVE_FILE_PATTERNS = [
    ".env", 
    ".env.*", 
    "*.pem", 
    "*.key", 
    "*.cert", 
    "*.secret", 
    "credentials.json", 
    "secrets.json", 
    "service-account.json", 
    "id_rsa", 
    "id_ed25519", 
    "*.pub", 
] as const; 

export const DEFAULT_MAX_FILE_SIZE_BYTES = 1_048_576 as const; // 1MB 

