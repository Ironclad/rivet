import { $ } from 'zx';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { Writable } from 'node:stream';

// Parse command line arguments
const { otp } = yargs(hideBin(process.argv))
  .option('otp', {
    type: 'string',
    description: 'The one-time password for npm publishing',
    demandOption: true,
  })
  .parseSync();

// Define the packages to publish
const packages = ['@ironclad/rivet-core', '@ironclad/rivet-node', '@ironclad/rivet-cli', '@ironclad/trivet'];

// Helper function to check if a workspace exists
async function workspaceExists(workspace: string): Promise<boolean> {
  try {
    await $`yarn workspace ${workspace} info`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main function to publish all packages
 */
async function publishPackages() {
  try {
    // Verify git status is clean
    const gitStatus = await $`git status --porcelain`;
    if (gitStatus.stdout.trim() !== '') {
      console.error(chalk.red('Git working tree is not clean. Please commit or stash changes before publishing.'));
      process.exit(1);
    }

    // Validate that all workspaces exist
    for (const pkg of packages) {
      const exists = await workspaceExists(pkg);
      if (!exists) {
        console.error(chalk.red(`Workspace ${pkg} does not exist. Aborting.`));
        process.exit(1);
      }
    }

    // Publish packages with the provided OTP
    console.log(chalk.blue('Publishing packages...'));

    for (const pkg of packages) {
      try {
        console.log(chalk.green(`Publishing ${pkg}...`));
        await $`yarn workspace ${pkg} npm publish --access public --otp ${otp}`;
        console.log(chalk.green(`Successfully published ${pkg}`));
      } catch (error) {
        console.error(chalk.red(`Failed to publish ${pkg}: ${error}`));
        process.exit(1);
      }
    }

    // Run docker publish for CLI
    console.log(chalk.blue('Running docker publish for CLI...'));
    try {
      await $`cd packages/cli && yarn docker-publish`;
      console.log(chalk.green('Successfully published docker image'));
    } catch (error) {
      console.error(chalk.red(`Failed to publish docker image: ${error}`));
      process.exit(1);
    }

    console.log(chalk.green('All packages published successfully! 🎉'));
  } catch (error) {
    console.error(chalk.red(`An error occurred during publishing: ${error}`));
    process.exit(1);
  }
}

publishPackages();
