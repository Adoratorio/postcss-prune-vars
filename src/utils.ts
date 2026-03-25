import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { Root } from 'postcss';
import { IGNORED_DIRS, VAR_PATTERN } from './declarations.js';

/** Recursively walk a directory and return files matching the given extensions */
export function walkDir(dir: string, extensions: Set<string>, results: string[] = []): string[] {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walkDir(full, extensions, results);
      } else if (extensions.has(extname(entry.name))) {
        results.push(full);
      }
    }
  } catch (error) {
    // Ignora silenziosamente le directory non trovate
  }

  return results;
}

/** Scan content files for var(--name) references */
export function collectVarsFromFiles(dirs: string[], extensions: Set<string>): Set<string> {
  const vars = new Set<string>();

  for (const dir of dirs) {
    const files = walkDir(dir, extensions);

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        for (const match of content.matchAll(VAR_PATTERN)) {
          vars.add(`--${match[1]}`);
        }
      } catch (error) {
        // Ignora gli errori di lettura del singolo file
      }
    }
  }

  return vars;
}

/** Collect var(--name) references from non-custom-property CSS declarations */
export function collectVarsFromCSS(root: Root): Set<string> {
  const vars = new Set<string>();

  root.walkDecls((decl) => {
    if (!decl.prop.startsWith('--')) {
      for (const match of decl.value.matchAll(VAR_PATTERN)) {
        vars.add(`--${match[1]}`);
      }
    }
  });

  return vars;
}

/** Resolve dependency chains using a graph / BFS approach for O(N) performance */
export function resolveDependencyChains(root: Root, usedVars: Set<string>): void {
  const graph = new Map<string, string[]>();

  // 1. Costruzione del grafo delle dipendenze
  root.walkDecls(/^--/, (decl) => {
    const deps: string[] = [];
    for (const match of decl.value.matchAll(VAR_PATTERN)) {
      deps.push(`--${match[1]}`);
    }
    if (deps.length > 0) {
      graph.set(decl.prop, deps);
    }
  });

  // 2. Risoluzione BFS
  const queue = Array.from(usedVars);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const deps = graph.get(current);

    if (deps) {
      for (const dep of deps) {
        if (!usedVars.has(dep)) {
          usedVars.add(dep);
          queue.push(dep);
        }
      }
    }
  }
}

/** Remove custom property declarations not present in usedVars */
export function removeUnusedVars(root: Root, usedVars: Set<string>): void {
  root.walkDecls(/^--/, (decl) => {
    if (!usedVars.has(decl.prop)) {
      decl.remove();
    }
  });
}

/** Remove empty rules, @layer and @media blocks left after pruning (handles nesting) */
export function removeEmptyNodes(root: Root): void {
  let changed = true;

  while (changed) {
    changed = false;

    root.walk((node) => {
      if (
        (node.type === 'rule' || node.type === 'atrule') &&
        node.nodes !== undefined &&
        node.nodes.length === 0
      ) {
        node.remove();
        changed = true;
      }
    });
  }
}