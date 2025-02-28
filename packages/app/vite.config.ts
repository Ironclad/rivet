import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import topLevelAwait from 'vite-plugin-top-level-await';
import { resolve } from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { splitVendorChunkPlugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['@ironclad/rivet-core', '@ironclad/trivet'],
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@ironclad/rivet-core': resolve('../core/src/index.ts'),
      '@ironclad/trivet': resolve('../trivet/src/index.ts'),
      'node:child_process': resolve('./src/mocks/node-polyfills.ts'),
      'node:process': resolve('./src/mocks/node-polyfills.ts'),
      'child_process': resolve('./src/mocks/node-polyfills.ts'),
      'process': resolve('./src/mocks/node-polyfills.ts'),
      'fs': resolve('./src/mocks/node-polyfills.ts'),
      'path': resolve('./src/mocks/node-polyfills.ts'),
      'os': resolve('./src/mocks/node-polyfills.ts'),
      'stream': resolve('./src/mocks/node-polyfills.ts'),
      'util': resolve('./src/mocks/node-polyfills.ts'),
      'events': resolve('./src/mocks/node-polyfills.ts'),
      'buffer': resolve('./src/mocks/node-polyfills.ts'),
      'crypto': resolve('./src/mocks/node-polyfills.ts'),
      'querystring': resolve('./src/mocks/node-polyfills.ts'),
      'url': resolve('./src/mocks/node-polyfills.ts'),
      'http': resolve('./src/mocks/node-polyfills.ts'),
      'https': resolve('./src/mocks/node-polyfills.ts'),
      'net': resolve('./src/mocks/node-polyfills.ts'),
      'tls': resolve('./src/mocks/node-polyfills.ts'),
      'assert': resolve('./src/mocks/node-polyfills.ts'),
    },
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
});
