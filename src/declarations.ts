export interface PluginOptions {
  /** Directories to scan for content files containing var() references */
  dirs?: string[];
  /** File extensions to scan in content directories */
  extensions?: string[];
}

/** Directories excluded from recursive file scanning */
export const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git']);

/** Default file extensions to scan for var() references */
export const DEFAULT_EXTENSIONS = ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html'];

/** Default directories to scan */
export const DEFAULT_DIRS = ['./src'];

/** Pattern to match var(--name) references in content (supports optional spaces) */
export const VAR_PATTERN = /var\(\s*--([\w-]+)/g;