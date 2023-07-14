import { startDebuggerServer, currentDebuggerState, createProcessor } from '@ironclad/rivet-node';

const rivetDebugger = startDebuggerServer({
  port: 21889,
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

console.log('Node.js executor started on port 21889.');
