import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { dirname, join } from 'node:path';

const notExternalPlugin: esbuild.Plugin = {
  name: 'not-external',
  setup(build) {
    build.onResolve({ filter: /^@ironclad\/rivet-(.+)/ }, async (args) => {
      const p = args.path.split('/')[1].split('-').slice(1).join('-');

      const result = await build.resolve(`../${p}/src/index.ts`, {
        kind: args.kind,
        resolveDir: '.',
      });

      if (result.errors.length > 0) {
        return { errors: result.errors };
      }

      return { path: result.path, external: false };
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
    notExternalPlugin,
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
