import Emittery from 'emittery';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import type { GraphId, NodeGraph } from '../../src/model/NodeGraph.js';
import type { GraphProcessor, ProcessEvents } from '../../src/model/GraphProcessor.js';
import { ExecutionRecorder } from '../../src/recording/ExecutionRecorder.js';
import type { ChartNode, NodeId, PortId } from '../../src/model/NodeBase.js';
import type { ProcessId } from '../../src/model/ProcessContext.js';
import { text } from 'node:stream/consumers';
import { Readable } from 'node:stream';

const userInputPort = 'user-input-a' as PortId;

const graph: NodeGraph = {
  metadata: { id: 'graph-id' as GraphId },
  nodes: [],
  connections: [],
};

async function addEvents(recorder: ExecutionRecorder) {
  const emitter = new Emittery<ProcessEvents>();
  recorder.record(emitter as unknown as GraphProcessor);
  await emitter.emit('graphStart', {
    graph,
    inputs: { [userInputPort]: { type: 'string', value: 'asdf' } },
  });

  await emitter.emit('nodeStart', {
    node: {
      id: ' node-id' as NodeId,
    } as ChartNode,
    inputs: { [userInputPort]: { type: 'string', value: 'asdf' } },
    processId: 'process-id' as ProcessId,
  });

  await emitter.emit('done', {
    results: {
      output: { type: 'string', value: 'output' },
    },
  });
}

describe('ExecutionRecorder', () => {
  it('should serialize an instance of ExecutionRecorder', async () => {
    // Simulate storage in string form
    const recordingToString = (recorder: ExecutionRecorder) => recorder.serialize();
    const recordingStreamToString = async (recorder: ExecutionRecorder) =>
      text(Readable.fromWeb(recorder.serializeStream() as any)); // cast needed due to incompatible Readable version types

    const stringToRecording = ExecutionRecorder.deserializeFromString;
    const streamToRecording = (str: string) =>
      ExecutionRecorder.deserializeFromStream(Readable.toWeb(Readable.from([str]))); // ReadableStream.from is only added in Node v20.6.0

    // Test each pair of string/stream serializer and deserializer
    for (const [serialize, deserialize] of [
      [recordingToString, stringToRecording],
      [recordingToString, streamToRecording],
      [recordingStreamToString, stringToRecording],
      [recordingStreamToString, streamToRecording],
    ] as const) {
      const recorder = new ExecutionRecorder();
      await addEvents(recorder);

      const originalEvents = recorder.events;
      assert.notEqual(originalEvents.length, 0);
      const serialized = await serialize(recorder);
      const deserialized = await deserialize(serialized);
      assert.deepEqual(deserialized.events, originalEvents);
    }
  });
});
