import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { dirname, join, resolve } from 'node:path';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const resolveRivet: esbuild.Plugin = {
  name: 'resolve-rivet',
  setup(build) {
    build.onResolve({ filter: /^@ironclad\/rivet-/ }, (args) => {
      const rivetPackage = args.path.replace(/^@ironclad\/rivet-/, '');
      return {
        path: resolve(`../${rivetPackage}/src/index.ts`),
      };
    });
  },
};

esbuild.build({
  entryPoints: ['bin/executor.ts'],
  bundle: true,
  platform: 'node',
  outfile: './bin/executor-bundle.js',
  format: 'cjs',
  target: 'node16',
  external: [],
  plugins: [
    resolveRivet,
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
