import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { dirname, join } from 'node:path';

const resolveRivet: esbuild.Plugin = {
  name: 'resolve-rivet',
  setup(build) {
    build.onResolve({ filter: /rivet/ }, (args) => {
      const [, pkg] = args.path.split('/');
      console.dir({ pkg });
      return {
        path: '',
      };
    });
  },
};

// esbuild.build({
//   entryPoints: ['bin/executor.ts'],
//   bundle: true,
//   platform: 'node',
//   outfile: './bin/executor-bundle.js',
//   format: 'cjs',
//   target: 'node16',
//   external: ['@ironclad/rivet-node'],
//   plugins: [
//     resolveRivet,
//     copy({
//       assets: [
//         {
//           from: join(dirname(require.resolve('@dqbd/tiktoken')), 'tiktoken_bg.wasm'),
//           to: './tiktoken_bg.wasm',
//         },
//       ],
//     }),
//   ],
// });
