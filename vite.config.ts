import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
    monacoEditorPlugin({}),
  ],
});
