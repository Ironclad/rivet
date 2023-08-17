import {
  startDebuggerServer,
  currentDebuggerState,
  createProcessor,
  NodeRegistration,
  plugins as rivetPlugins,
  RivetPlugin,
  registerBuiltInNodes,
  runGraphInFile,
  LooseDataValue,
  loadProjectFromFile,
  runGraph,
} from '@ironclad/rivet-node';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { P, match } from 'ts-pattern';

const parser = yargs(hideBin(process.argv))
  .command(
    '$0 <project-file>',
    'Runs a graph',
    (y) =>
      y
        .positional('project-file', {
          type: 'string',
          demandOption: true,
          description: 'Path to the project file to run.',
        })
        .option('graph', {
          alias: 'g',
          type: 'string',
          description: 'Graph to run. If omitted, the first graph (alphabetically) will be ran.',
        })
        .option('wait-debugger', {
          type: 'boolean',
          description: 'Wait for a debugger to connect before running the graph.',
        })
        .option('input', {
          type: 'array',
          description: 'Input to the graph. Can be specified multiple times. The syntax is <id>=<value>.',
        })
        .option('context', {
          type: 'array',
          description: 'Context to the graph. Can be specified multiple times. The syntax is <id>=<value>.',
        })
        .option('openai-key', {
          type: 'string',
          description:
            'OpenAI API key to use for OpenAI calls. Uses the OPENAI_API_KEY environment variable if not specified.',
        })
        .option('openai-organization-id', {
          type: 'string',
          description:
            'OpenAI organization ID to use for OpenAI calls. Uses the OPENAI_ORGANIZATION_ID environment variable if not specified.',
        }),
    ({ projectFile, graph, input, context, openaiKey, openaiOrganizationId }) =>
      runGraphCli({
        projectFile,
        graph,
        inputs: (input as string[] | undefined) ?? [],
        context: (context as string[] | undefined) ?? [],
        openaiKey,
        openaiOrganizationId,
      }),
  )
  .command(
    'start',
    'Starts an executor that can run graphs dynamically',
    (y) =>
      y.option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the executor on.',
        default: 21889,
      }),
    (argv) => startExecutor(argv.port),
  );

async function main() {
  await parser.parseAsync();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

function parseInputs(inputs: string[]): Record<string, LooseDataValue> {
  let inputsMap: Record<string, LooseDataValue> = {};
  for (const input of inputs) {
    const equalsPos = input.indexOf('=');
    if (equalsPos === -1) {
      throw new Error(`Invalid context value ${input}.`);
    }

    const id = input.slice(0, equalsPos);
    const value = input.slice(equalsPos + 1);

    try {
      const parsed = JSON.parse(value);
      inputsMap[id] = parsed; // foo=1, foo="bar", foo=true, foo=null
    } catch (err) {
      inputsMap[id] = value; // foo=bar
    }
  }
  return inputsMap;
}

async function runGraphCli(options: {
  projectFile: string;
  graph?: string;
  inputs: string[];
  context: string[];
  openaiKey?: string;
  openaiOrganizationId?: string;
}) {
  const openAiKey = options.openaiKey ?? process.env.OPENAI_API_KEY;
  const openAiOrganization = options.openaiOrganizationId ?? process.env.OPENAI_ORGANIZATION_ID;

  if (!openAiKey) {
    throw new Error('--openai-key or OPENAI_API_KEY environment variable must be specified.');
  }

  const inputs = parseInputs(options.inputs);
  const context = parseInputs(options.context);

  const project = await loadProjectFromFile(options.projectFile);

  let graph = options.graph;
  if (!graph) {
    const allGraphNames = Object.values(project.graphs)
      .map((g) => g.metadata!.name!)
      .sort();
    if (allGraphNames.length === 0) {
      throw new Error(`No graphs found in project ${options.projectFile}.`);
    }

    graph = allGraphNames[0];
  }

  const outputs = await runGraph(project, {
    graph,
    openAiKey,
    openAiOrganization,
    inputs,
    context,
  });

  console.log(JSON.stringify(outputs, null, 2));
}

async function startExecutor(port: number) {
  const rivetDebugger = startDebuggerServer({
    port,
    allowGraphUpload: true,
    dynamicGraphRun: async ({ graphId, inputs }) => {
      console.log(`Running graph ${graphId} with inputs:`, inputs);

      const project = currentDebuggerState.uploadedProject;

      if (project === undefined) {
        console.warn(`Cannot run graph ${graphId} because no project is uploaded.`);
        return;
      }

      const registry = new NodeRegistration();
      registerBuiltInNodes(registry);

      for (const spec of project.plugins ?? []) {
        await match(spec)
          .with({ type: 'built-in' }, async (spec) => {
            const { name } = spec;
            if (name in rivetPlugins) {
              registry.registerPlugin(rivetPlugins[name as keyof typeof rivetPlugins]);
            } else {
              throw new Error(`Unknown built-in plugin ${name}.`);
            }
          })
          .with({ type: 'uri' }, async (spec) => {
            const plugin = ((await import(spec.uri)) as { default: RivetPlugin }).default;
            if (!plugin?.id) {
              throw new Error(`Plugin ${spec.id} does not have an id`);
            }
            registry.registerPlugin(plugin);
          })
          .exhaustive();
        console.log(`Enabled plugin ${spec.id}.`);
      }

      try {
        const processor = createProcessor(project, {
          graph: graphId,
          inputs,
          ...currentDebuggerState.settings!,
          remoteDebugger: rivetDebugger,
          registry,
          onTrace: (trace) => {
            console.log(trace);
          },
        });

        await processor.run();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
  });

  console.log(`Node.js executor started on port ${port}.`);
}
