import { cp } from 'node:fs/promises';
import { execaCommand } from 'execa';
import chalk from 'chalk';
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

console.log(`Bundling to ${chalk.cyan('bin/executor-bundle.js')}...`);

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

console.log(`Compiling to native binary for ${chalk.cyan(process.platform)}...`);

const target = {
  darwin: 'node18-macos-x64',
  linux: 'node18-linux-x64',
  win32: 'node18-win-x64',
}[process.platform];

await execaCommand(`yarn pkg . --out-path dist --targets ${target}`, {
  stdio: 'inherit',
});

let { from: sourceFrom, to } = {
  darwin: {
    from: 'dist/rivet-app-executor',
    to: [
      'dist/app-executor-x86_64-apple-darwin',
      'dist/app-executor-aarch64-apple-darwin',
      'dist/app-executor-universal-apple-darwin',
    ],
  },
  linux: {
    from: 'dist/rivet-app-executor',
    to: undefined,
  },
  win32: {
    from: 'dist/rivet-app-executor.exe',
    to: ['dist/app-executor-x86_64-pc-windows-msvc.exe'],
  },
}[process.platform];

const { stdout } = await execaCommand('rustc -Vv');
const host = stdout
  .split('\n')
  .find((line) => line.startsWith('host:'))!
  .split(' ')[1];

// Copy the file

if (to === undefined) {
  to = [`dist/app-executor-${host}`];
}

for (const toPath of to) {
  await cp(sourceFrom, toPath);
}

console.log(`Copied ${chalk.cyan(sourceFrom)} to ${chalk.cyan(to.join(', '))} for tauri sidecar`);
