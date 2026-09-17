import { defineConfig, splitVendorChunkPlugin } from 'vite';
import type { PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import topLevelAwait from 'vite-plugin-top-level-await';
import { resolve } from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

const reactDevTools = (): PluginOption => {
  return {
    name: 'react-devtools',
    apply: 'serve', // Only apply this plugin during development
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: {
              src: 'http://localhost:8097',
            },
            injectTo: 'head',
          },
        ],
      };
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['@ironclad/rivet-core', '@ironclad/trivet'],
    // tealtiger ships a self-contained ESM bundle (dist/index.mjs) and a CJS entry that
    // requires node stream/provider-SDK deps. Force the ESM `import` condition so the
    // browser prebundle never pulls safe-buffer/readable-stream (externalized `buffer` crash).
    esbuildOptions: {
      conditions: ['import'],
    },
  },
  resolve: {
    preserveSymlinks: true,
    // Prefer the `import` export condition (see tealtiger note above)
    conditions: ['import', 'module', 'browser', 'default'],

    alias: [
      { find: /^@ironclad\/rivet-core$/, replacement: resolve('../core/src/index.ts') },
      { find: /^@ironclad\/trivet$/, replacement: resolve('../trivet/src/index.ts') },
      // tealtiger imports node builtins at the top level of its ESM bundle
      // (fs.watch, fs/promises.readFile, crypto.createHash/createHmac/randomUUID/
      // timingSafeEqual). Vite's empty browser stub can't satisfy the named imports,
      // so map them to real browser shims (src/shims/nodeBuiltins.ts).
      { find: /^(node:)?fs$/, replacement: resolve('./src/shims/nodeBuiltins.ts') },
      { find: /^(node:)?fs\/promises$/, replacement: resolve('./src/shims/nodeBuiltins.ts') },
      { find: /^(node:)?crypto$/, replacement: resolve('./src/shims/nodeBuiltins.ts') },
      // Provider SDKs that tealtiger imports statically but the governance node
      // never uses — their transitive trees are Node-only. Stubbed so they don't
      // enter the browser bundle (see src/shims/nodeBuiltins.ts for the stubs).
      { find: /^@aws-sdk\/client-bedrock-runtime$/, replacement: resolve('./src/shims/nodeBuiltins.ts') },
      { find: /^@google\/generative-ai$/, replacement: resolve('./src/shims/nodeBuiltins.ts') },
      // cohere-ai transitively depends on @aws-sdk/credential-providers (Node-only)
      { find: /^cohere-ai$/, replacement: resolve('./src/shims/nodeBuiltins.ts') },
    ],
  },
  build: {
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('gpt-tokenizer')) {
            return 'gpt-tokenizer';
          }
        },
      },
      plugins: [visualizer()],
    },
  },
  plugins: [
    reactDevTools(),
    react(),
    viteTsconfigPaths(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
    // Bad ESM
    (monacoEditorPlugin as any).default({}),
    topLevelAwait(),
    splitVendorChunkPlugin(),
  ],
  worker: {
    format: 'es',
  },
});
