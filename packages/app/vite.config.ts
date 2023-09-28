import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { dirname, resolve } from 'node:path';

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
    },
  },
  build: {
    chunkSizeWarningLimit: 10000,
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
    wasm(),
    topLevelAwait(),
  ],
});
