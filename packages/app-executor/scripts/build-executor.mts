import { cp } from 'node:fs/promises';
import { execaCommand } from 'execa';
import chalk from 'chalk';
import * as esbuild from 'esbuild';
import { resolve } from 'node:path';

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

console.log(`Bundling to ${chalk.cyan('bin/executor-bundle.cjs')}...`);

esbuild.build({
  entryPoints: ['bin/executor.mts'],
  bundle: true,
  platform: 'node',
  outfile: './bin/executor-bundle.cjs',
  format: 'cjs',
  target: 'node16',
  external: [],
  plugins: [resolveRivet],
});

console.log(`Compiling to native binary for ${chalk.cyan(process.platform)}...`);

const { platform } = process;

if (platform !== 'darwin' && platform !== 'linux' && platform !== 'win32') {
  console.error(`Unsupported platform ${platform}.`);
  process.exit(1);
}

const target = {
  darwin: 'node18-macos-x64',
  linux: 'node18-linux-x64',
  win32: 'node18-win-x64',
}[platform];

await execaCommand(
  `yarn pkg . --out-path dist --no-bytecode --options experimental-network-imports --targets ${target}`,
  {
    stdio: 'inherit',
  },
);

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
}[platform];

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
