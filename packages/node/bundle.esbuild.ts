import * as esbuild from 'esbuild';

const notExternalPlugin: esbuild.Plugin = {
  name: 'not-external',
  setup(build) {
    build.onResolve({ filter: /^@ironclad\/nodai-(.+)/ }, async (args) => {
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

const inlinePackagesPlugin: esbuild.Plugin = {
  name: 'inline-packages',
  setup(build) {
    build.onResolve({ filter: /^(lodash-es|p-retry|emittery)$/ }, async (args) => {
      return { path: require.resolve(args.path), external: false };
    });
  },
};

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: '../../dist/node/bundle.js',
  format: 'cjs',
  target: 'node16',
  packages: 'external',
  plugins: [notExternalPlugin, inlinePackagesPlugin],
});
