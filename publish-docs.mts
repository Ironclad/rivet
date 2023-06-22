// publishDocs.ts
import { $ } from 'zx';
import { cp, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

const argv = yargs(hideBin(process.argv)).parseSync();

let currentBranch: string;

try {
  // Check if the git working tree is clean
  const gitStatus = await $`git status --porcelain`;
  if (gitStatus.stdout.trim() !== '') {
    console.error(chalk.red('Git working tree is not clean. Aborting.'));
    process.exit(1);
  }

  // Get the current branch
  currentBranch = (await $`git symbolic-ref --short HEAD`).stdout.trim();

  // Run yarn build in the docs directory
  console.log(chalk.blue('Building docs...'));
  await $`cd packages/docs && yarn build`;

  // Copy the build folder to a temp directory
  const tempDir = join(tmpdir(), 'docs-build');
  await cp('packages/docs/build', tempDir, { recursive: true });

  // Check out the docs branch
  await $`git checkout docs`;

  // Delete files in the docs branch (excluding .git, CNAME, and README)
  const filesToDelete = (await $`git ls-files`).stdout.trim().split('\n');
  const ignoreDelete = ['.git', 'CNAME', 'README.md', '.gitignore'];
  for (const file of filesToDelete.filter((file) => !ignoreDelete.includes(file))) {
    await unlink(file);
  }

  // Copy the files from the temp directory
  await cp(tempDir, '.', { recursive: true });

  // Commit the changes
  await $`git add .`;
  await $`git commit -m "Docs publish"`;
} catch (error) {
  console.error(chalk.red('An error occurred:', error.message));
} finally {
  // Check out the previous branch using -f
  if (currentBranch) {
    await $`git checkout -f ${currentBranch}`;
    await $`git reset --hard HEAD`;
  }

  console.log(chalk.green('Docs published successfully.'));
}
