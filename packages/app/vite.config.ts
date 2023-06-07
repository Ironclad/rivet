import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { dirname } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['@ironclad/rivet-core'],
  },
  resolve: {
    preserveSymlinks: true,

    alias: {
      '@ironclad/rivet-core': dirname(require.resolve('@ironclad/rivet-core/src/index.ts')),
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
    monacoEditorPlugin({}),
    wasm(),
    topLevelAwait(),
  ],
});
