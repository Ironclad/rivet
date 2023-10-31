import { createProcessor, loadProjectFromFile, type LooseDataValue } from '@ironclad/rivet-node';
import { resolve } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

await yargs(hideBin(process.argv))
  .command(
    'run <projectFile> [graphName]',
    'Run a graph in a project file, or the main graph if graphName is not specified.',
    (y) =>
      y
        .positional('projectFile', {
          describe: 'The project file to run',
          type: 'string',
          demandOption: true,
        })
        .positional('graphName', {
          describe: 'The name of the graph to run',
          type: 'string',
        })
        .option('inputs-stdin', {
          describe: 'Read inputs from stdin as JSON',
          type: 'boolean',
          default: false,
        })
        .option('include-cost', {
          describe: 'Include the total cost in the output',
          type: 'boolean',
          default: false,
        })
        .option('context', {
          describe: 'Adds a context value to the graph run',
          type: 'string',
          array: true,
          default: [],
        })
        .option('input', {
          describe: 'Adds an input to the graph run',
          type: 'string',
          array: true,
          default: [],
        }),
    (args) => run(args),
  )
  .demandCommand()
  .parseAsync();

async function run(args: {
  projectFile: string;
  graphName: string | undefined;
  inputsStdin: boolean;
  includeCost: boolean;
  context: string[];
  input: string[];
}) {
  try {
    const projectPath = resolve(process.cwd(), args.projectFile);

    const project = await loadProjectFromFile(projectPath);

    if (!args.graphName && !project.metadata.mainGraphId) {
      const validGraphs = Object.values(project.graphs).map((graph) => [graph.metadata!.id!, graph.metadata!.name!]);
      const validGraphNames = validGraphs.map(([id, name]) => `• "${name}" (${id})`);

      console.error(
        `No graph name provided, and project does not specify a main graph. Valid graphs are: \n${validGraphNames.join(
          '\n',
        )}\n\n Use either the graph's name or its ID. For example, \`rivet run my-project.rivet-project my-graph\` or \`rivet run my-project.rivet-project 1234abcd\``,
      );
      process.exit(1);
    }

    let inputs: Record<string, LooseDataValue> = {};
    if (args.inputsStdin) {
      // Read json from stdin
      const stdin = process.stdin;
      stdin.setEncoding('utf8');

      let input = '';
      for await (const chunk of stdin) {
        input += chunk;
      }

      try {
        inputs = JSON.parse(input);
      } catch (err) {
        console.error('Failed to parse input JSON');
        console.error(err);
        process.exit(1);
      }
    } else {
      inputs = Object.fromEntries(
        args.input.map((input) => {
          const [key, value] = input.split('=');
          if (!key || !value) {
            console.error(`Invalid input value: ${input}`);
            process.exit(1);
          }
          return [key, value];
        }),
      );
    }

    const contextValues = Object.fromEntries(
      args.context.map((context) => {
        const [key, value] = context.split('=');
        if (!key || !value) {
          console.error(`Invalid context value: ${context}`);
          process.exit(1);
        }
        return [key, value];
      }),
    );

    const { run } = createProcessor(project, {
      graph: args.graphName,
      inputs,
      context: contextValues,
    });

    const outputs = await run();

    if (!args.includeCost) {
      delete outputs.cost;
    }

    console.log(outputs);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
