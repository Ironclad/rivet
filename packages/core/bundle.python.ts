import * as esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { resolve } from 'path';

const stubModulePlugin = {
  name: 'stub-module',
  setup(build) {
    build.onResolve({ filter: /^@dqbd\/tiktoken$/ }, () => {
      return { path: resolve('stub.js'), namespace: 'stub-namespace' };
    });

    build.onLoad({ filter: /.*/, namespace: 'stub-namespace' }, (args) => {
      return {
        contents: `
          export function encoding_for_model() {};
          export default {};
        `,
        loader: 'ts',
      };
    });
  },
};
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'browser',
  outfile: '../python/rivet.bundle.cjs',
  format: 'cjs',
  plugins: [stubModulePlugin],
});
