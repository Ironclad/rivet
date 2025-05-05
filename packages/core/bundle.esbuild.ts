import * as esbuild from 'esbuild';

// Modified aliasModule function
const aliasModule = (moduleFrom: string, moduleTo: string): esbuild.Plugin => ({
  name: 'alias-module',
  setup(build) {
    // Modified filter to catch moduleFrom or moduleFrom/subpath
    const filter = new RegExp(`^${moduleFrom}($|\\/)`);

    build.onResolve({ filter }, async (args) => {
      // args.path will be like 'lodash-es' or 'lodash-es/get'
      // Calculate the path relative to the module root (e.g., '' or '/get')
      const subPath = args.path.substring(moduleFrom.length);
      const targetPath = moduleTo + subPath; // Construct the target path (e.g., 'lodash' or 'lodash/get')

      // Resolve the new target path
      const resolved = await build.resolve(targetPath, {
        importer: args.importer,
        kind: args.kind, // Pass original kind
        resolveDir: args.resolveDir,
      });

      if (resolved.errors.length > 0) {
        return { errors: resolved.errors };
      }

      // Return the resolved path and mark it as external so it's not bundled,
      // resulting in require('lodash/get') in the CJS output.
      return { path: resolved.path, external: true };
    });
  },
});

const options: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/cjs/bundle.cjs',
  format: 'cjs',
  target: 'node16',
  packages: 'external',
  sourcemap: true,
  plugins: [
    aliasModule('lodash-es', 'lodash'),
    aliasModule('p-queue', 'p-queue-6'),
    aliasModule('emittery', 'emittery-0-13'),
    aliasModule('p-retry', 'p-retry-4'),
  ],
};

if (process.argv.includes('--watch')) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
