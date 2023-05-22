#!/usr/bin/env zx

import { access, readFile, writeFile, rm } from 'node:fs/promises';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { $ } from 'zx';

try {
  // Check if the working directory is clean
  const gitStatus = (await $`git status --porcelain`).stdout.trim();
  if (gitStatus.length > 0) {
    throw new Error('Working directory is not clean. Commit or stash your changes before running this script.');
  }

  // Parse command-line arguments
  const argv = await yargs(hideBin(process.argv))
    .version(false)
    .option('major', {
      alias: 'M',
      type: 'boolean',
      description: 'Increment the major version',
    })
    .option('patch', {
      alias: 'p',
      type: 'boolean',
      description: 'Increment the patch version',
    })
    .option('version', {
      alias: 'v',
      type: 'string',
      description: 'Version name for the new tag',
    })
    .parseAsync();

  // Get the latest tag
  let defaultVersion: string;
  try {
    const latestTag = (await $`git tag --sort=-creatordate --list 'node-v*'`).stdout.trim().split('\n')[0];
    if (!latestTag) {
      throw new Error();
    }
    defaultVersion = incrementVersion(latestTag, argv);
  } catch (err) {
    defaultVersion = 'node-v0.1.0';
  }

  argv.version ??= defaultVersion;

  // Bundle the project
  await rm('packages/core/tsconfig.tsbuildinfo', { force: true });
  await rm('packages/node/tsconfig.tsbuildinfo', { force: true });
  await $`yarn build-lib`;

  // Check if the build was successful
  if (!(await exists(`./dist/node/bundle.js`))) {
    console.error('Build failed. Exiting.');
    process.exit(1);
  }

  // Combine all dependencies since we bundled the two packages
  const nodePackageJSON = JSON.parse(await readFile('packages/node/package.json', 'utf8'));
  const corePackageJSON = JSON.parse(await readFile('packages/core/package.json', 'utf8'));
  const combinedDependencies = {
    ...nodePackageJSON.dependencies,
    ...corePackageJSON.dependencies,
    '@ironclad/nodai-core': undefined,
  };

  const newPackageJSON = {
    name: '@ironclad/nodai-node',
    main: 'bundle.js',
    types: 'packages/node/dist/index.d.ts',
    dependencies: combinedDependencies,
  };

  await writeFile('dist/node/package.json', JSON.stringify(newPackageJSON, null, 2));

  // Store the current branch name
  const currentBranch = (await $`git branch --show-current`).stdout.trim();

  // Create a temporary branch without any history
  const tempBranch = 'temp-' + argv.version;
  await $`git checkout --orphan ${tempBranch}`;
  await $`git rm -rf --cached .`;

  // Copy the contents of the dist/node folder and packages directory to the new branch
  await $`cp -r dist/node/* .`;
  await $`git add package.json bundle.js`;
  await $`git add -f packages/*/dist`;

  // Commit the changes
  await $`git commit -m "Exported node ${argv.version}"`;

  // Create a tag with the version name
  await $`git tag ${argv.version}`;

  // Switch back to the original branch
  await $`git checkout --force ${currentBranch}`;

  // Delete the temporary branch
  await $`git branch -D ${tempBranch}`;

  console.log(`New tag '${argv.version}' created with the contents of the dist/node folder and packages directory.`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err?.toString());
  process.exit(1);
}

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function incrementVersion(version: string, argv: any) {
  version = version.slice(version.indexOf('node-v') + 6);

  const versionParts = version.split('.');
  if (argv.major) {
    versionParts[0] = (parseInt(versionParts[0], 10) + 1).toString();
    versionParts[1] = '0';
    versionParts[2] = '0';
  } else if (argv.patch) {
    versionParts[2] = (parseInt(versionParts[2], 10) + 1).toString();
  } else {
    // Default to minor version increment
    versionParts[1] = (parseInt(versionParts[1], 10) + 1).toString();
    versionParts[2] = '0';
  }
  return versionParts.join('.');
}
