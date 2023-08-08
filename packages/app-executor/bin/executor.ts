import { startDebuggerServer, currentDebuggerState, createProcessor } from '@ironclad/rivet-node';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
    if (currentDebuggerState.uploadedProject === undefined) {
      return;
    }

    const processor = createProcessor(currentDebuggerState.uploadedProject, {
      graph: graphId,
      inputs,
      ...currentDebuggerState.settings!,
      remoteDebugger: rivetDebugger,
      onTrace: (trace) => {
        console.log(trace);
      },
    });

    await processor.run();
  },
});

console.log(`Node.js executor started on port ${port}.`);
