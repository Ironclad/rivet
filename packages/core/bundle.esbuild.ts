import * as esbuild from 'esbuild';

const aliasModule = (moduleFrom: string, moduleTo: string): esbuild.Plugin => ({
  name: 'alias-module',
  setup(build) {
    build.onResolve({ filter: new RegExp(`^${moduleFrom}$`) }, async (args) => {
      const resolved = await build.resolve(moduleTo, {
        importer: args.importer,
        kind: 'import-statement',
        resolveDir: args.resolveDir,
      });

      if (resolved.errors.length > 0) {
        return { errors: resolved.errors };
      }

      return { path: resolved.path, namespace: 'alias-module', external: true };
    });
  },
});

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/cjs/bundle.cjs',
  format: 'cjs',
  target: 'node16',
  packages: 'external',
  plugins: [
    aliasModule('lodash-es', 'lodash'),
    aliasModule('p-queue', 'p-queue-6'),
    aliasModule('emittery', 'emittery-0-13'),
    aliasModule('p-retry', 'p-retry-4'),
  ],
});
