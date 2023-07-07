import { Builtins, Cli, Command, Option } from 'clipanion';
import { runTrivet } from './index.js';
import { env } from 'process';
import { readFile } from 'node:fs/promises';
import { deserializeProject } from '@ironclad/rivet-core';

const args = process.argv.slice(2);

class RunTest extends Command {
  globForTestGraphs = Option.String('', '**/TEST*');
  projectToTest = Option.String('--project', {
    required: true,
    description: 'Rivet project to test.',
  });
  async execute() {
    this.context.stdout.write('Running tests\n');

    const content = await readFile(this.projectToTest, { encoding: 'utf8' });
    const project = deserializeProject(content);

    const results = await runTrivet({
      project,
      testGlobs: [this.globForTestGraphs],
      openAiKey: env.OPENAI_API_KEY ?? '',
    });

    this.context.stdout.write(JSON.stringify(results, null, 2));
  }
}

async function main() {
  const cli = new Cli({
    binaryLabel: 'Document CLI',
    binaryName: 'dcli',
  });

  cli.register(Builtins.HelpCommand);
  cli.register(RunTest);

  try {
    const command = cli.process(args);
    await cli.runExit(command, {
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
    });
  } catch (error) {
    process.stdout.write(cli.error(error));
    process.exitCode = 1;
  }
}

main();
