import {
  startDebuggerServer,
  currentDebuggerState,
  createProcessor,
  NodeRegistration,
  plugins as rivetPlugins,
  registerBuiltInNodes,
} from '@ironclad/rivet-node';
import * as Rivet from '@ironclad/rivet-core';
import { RivetPluginInitializer } from '@ironclad/rivet-core';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { P, match } from 'ts-pattern';

const { port } = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Port to run the executor on.',
    default: 21889,
  })
  .parseSync();

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
      try {
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
            const plugin = ((await import(spec.uri)) as { default: RivetPluginInitializer }).default;

            if (typeof plugin !== 'function') {
              throw new Error(`Plugin ${spec.id} is not a function`);
            }

            const initializedPlugin = plugin(Rivet);

            if (!initializedPlugin?.id) {
              throw new Error(`Plugin ${spec.id} does not have an id`);
            }
            registry.registerPlugin(initializedPlugin);
          })
          .exhaustive();
        console.log(`Enabled plugin ${spec.id}.`);
      } catch (err) {
        console.error(`Failed to enable plugin ${spec.id}.`, err);
      }
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
