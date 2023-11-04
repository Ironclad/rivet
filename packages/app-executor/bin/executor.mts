import {
  startDebuggerServer,
  currentDebuggerState,
  createProcessor,
  NodeRegistration,
  plugins as rivetPlugins,
  registerBuiltInNodes,
  DebuggerDatasetProvider,
} from '@ironclad/rivet-node';
import * as Rivet from '@ironclad/rivet-core';
import { type RivetPluginInitializer } from '@ironclad/rivet-core';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { match } from 'ts-pattern';
import { join } from 'node:path';
import { access, readFile } from 'node:fs/promises';
import { platform, homedir } from 'node:os';

const datasetProvider = new DebuggerDatasetProvider();

// Roughly https://github.com/demurgos/appdata-path/blob/master/lib/index.js but appdata local and .local/share, try to match `dirs` from rust
function getAppDataLocalPath() {
  const identifier = 'com.ironcladapp.rivet';
  return match(platform())
    .with('win32', () => join(homedir(), 'AppData', 'Local', identifier))
    .with('darwin', () => join(homedir(), 'Library', 'Application Support', identifier))
    .with('linux', () => join(homedir(), '.local', 'share', identifier))
    .otherwise(() => {
      if (platform().startsWith('win')) {
        return join(homedir(), 'AppData', 'Local', identifier);
      } else {
        return join(homedir(), '.local', 'share', identifier);
      }
    });
}

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
  datasetProvider,
  dynamicGraphRun: async ({ graphId, inputs, runToNodeIds, contextValues }) => {
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
            const { id } = spec;
            if (id in rivetPlugins) {
              registry.registerPlugin(rivetPlugins[id as keyof typeof rivetPlugins]);
            } else {
              throw new Error(`Unknown built-in plugin ${id}.`);
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
          .with({ type: 'package' }, async (spec) => {
            const localDataDir = getAppDataLocalPath();
            const pluginDir = join(localDataDir, `plugins/${spec.package}-${spec.tag}/package`);

            const packageJsonPath = join(pluginDir, 'package.json');

            try {
              await access(packageJsonPath);
            } catch (err) {
              throw new Error(`Plugin ${spec.id} is not installed, could not access ${packageJsonPath}}`);
            }

            const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

            if (packageJson.name !== spec.package) {
              throw new Error(
                `Plugin ${spec.id} is not installed, found ${packageJson.name} instead of ${spec.package}`,
              );
            }

            const mainPath = join(pluginDir, packageJson.main);

            const plugin = ((await import(`file://${mainPath}`)) as { default: RivetPluginInitializer }).default;

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
        datasetProvider,
        onTrace: (trace) => {
          console.log(trace);
        },
        context: contextValues,
      });

      if (runToNodeIds) {
        processor.processor.runToNodeIds = runToNodeIds;
      }

      await processor.run();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
});

console.log(`Node.js executor started on port ${port}.`);
