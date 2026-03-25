import type { PluginCreator } from 'postcss';
import type { PluginOptions } from './declarations.js';
import { DEFAULT_DIRS, DEFAULT_EXTENSIONS } from './declarations.js';
import {
  collectVarsFromFiles,
  collectVarsFromCSS,
  resolveDependencyChains,
  removeUnusedVars,
  removeEmptyNodes,
} from './utils.js';

export type { PluginOptions } from './declarations.js';

const plugin: PluginCreator<PluginOptions> = (opts = {}) => {
  const dirs = opts.dirs ?? DEFAULT_DIRS;
  const extensions = new Set(opts.extensions ?? DEFAULT_EXTENSIONS);

  return {
    postcssPlugin: 'postcss-prune-vars',
    Once(root) {
      const usedVars = collectVarsFromFiles(dirs, extensions);
      const cssVars = collectVarsFromCSS(root);

      for (const v of cssVars) {
        usedVars.add(v);
      }

      resolveDependencyChains(root, usedVars);
      removeUnusedVars(root, usedVars);
      removeEmptyNodes(root);
    },
  };
};

plugin.postcss = true;

export default plugin;