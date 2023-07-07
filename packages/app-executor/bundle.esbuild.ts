import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { dirname, join } from 'node:path';

esbuild.build({
  entryPoints: ['bin/executor.ts'],
  bundle: true,
  platform: 'node',
  outfile: './bin/executor-bundle.js',
  format: 'cjs',
  target: 'node16',
  external: [],
  plugins: [
    copy({
      assets: [
        {
          from: join(dirname(require.resolve('@dqbd/tiktoken')), 'tiktoken_bg.wasm'),
          to: './tiktoken_bg.wasm',
        },
      ],
    }),
  ],
});
