import { nanoid } from 'nanoid/non-secure';
import {
  type GraphProcessor,
  type ProcessEvents,
  type RecordedEvent,
  type RecordedEvents,
  type Recording,
  type RecordingId,
  type SerializedRecording,
} from '../index.js';
import Emittery from 'emittery';

export type ExecutionRecorderEvents = {
  finish: { recording: Recording };
};

type ProcessEventsUnion = Pick<
  {
    [P in keyof ProcessEvents]: {
      type: P;
      data: ProcessEvents[P];
    };
  },
  keyof ProcessEvents
>[keyof ProcessEvents];

const toRecordedEventMap: {
  [P in keyof ProcessEvents]: (data: ProcessEvents[P]) => RecordedEvent<P>['data'];
} = {
  graphStart: ({ graph, inputs }) => ({ graphId: graph.metadata!.id!, inputs }),
  graphFinish: ({ graph, outputs }) => ({ graphId: graph.metadata!.id!, outputs }),
  graphError: ({ graph, error }) => ({
    graphId: graph.metadata!.id!,
    error: typeof error === 'string' ? error : error.stack!,
  }),
  nodeStart: ({ node, inputs, processId }) => ({
    nodeId: node.id,
    inputs,
    processId,
  }),
  nodeFinish: ({ node, outputs, processId }) => ({
    nodeId: node.id,
    outputs,
    processId,
  }),
  nodeError: ({ node, error, processId }) => ({
    nodeId: node.id,
    error: typeof error === 'string' ? error : error.stack!,
    processId,
  }),
  abort: ({ successful, error }) => ({ successful, error: typeof error === 'string' ? error : error?.stack }),
  graphAbort: ({ successful, error, graph }) => ({
    successful,
    error: typeof error === 'string' ? error : error?.stack,
    graphId: graph.metadata!.id!,
  }),
  nodeExcluded: ({ node, processId, inputs, outputs, reason }) => ({
    nodeId: node.id,
    processId,
    inputs,
    outputs,
    reason,
  }),
  userInput: ({ node, inputs, callback, processId }) => ({
    nodeId: node.id,
    inputs,
    callback,
    processId,
  }),
  partialOutput: ({ node, outputs, index, processId }) => ({
    nodeId: node.id,
    outputs,
    index,
    processId,
  }),
  nodeOutputsCleared: ({ node, processId }) => ({
    nodeId: node.id,
    processId,
  }),
  error: ({ error }) => ({
    error: typeof error === 'string' ? error : error.stack!,
  }),
  done: ({ results }) => ({ results }),
  globalSet: ({ id, processId, value }) => ({ id, processId, value }),
  pause: () => void 0,
  resume: () => void 0,
  start: ({ contextValues, inputs, project, startGraph }) => ({
    contextValues,
    inputs,
    projectId: project.metadata!.id!,
    startGraph: startGraph.metadata!.id!,
  }),
  trace: (message) => message,
  newAbortController: () => {},
  finish: () => void 0,
};

const isPrefix = <const T extends string>(s: string, prefix: T): s is `${T}${string}` => s.startsWith(prefix);

function toRecordedEvent<T extends keyof ProcessEvents>(event: T, data: ProcessEvents[T]): RecordedEvents {
  if (isPrefix(event, 'globalSet:')) {
    return {
      type: event,
      data: data as ProcessEvents[`globalSet:${string}`],
      ts: Date.now(),
    };
  }

  if (isPrefix(event, 'userEvent:')) {
    return {
      type: event,
      data: data as ProcessEvents[`userEvent:${string}`],
      ts: Date.now(),
    };
  }

  return {
    type: event,
    data: (toRecordedEventMap[event] as any)(data),
    ts: Date.now(),
  };
}

export type ExecutionRecorderOptions = {
  includePartialOutputs?: boolean;
  includeTrace?: boolean;
};

export class ExecutionRecorder {
  #events: RecordedEvents[] = [];
  recordingId: RecordingId | undefined;
  readonly #emitter: Emittery<ExecutionRecorderEvents>;

  readonly #includePartialOutputs: boolean;
  readonly #includeTrace: boolean;

  constructor(options: ExecutionRecorderOptions = {}) {
    this.#emitter = new Emittery();
    this.#emitter.bindMethods(this as any, ['on', 'off', 'once']);
    this.#includePartialOutputs = options.includePartialOutputs ?? false;
    this.#includeTrace = options.includeTrace ?? false;
  }

  on: Emittery<ExecutionRecorderEvents>['on'] = undefined!;
  off: Emittery<ExecutionRecorderEvents>['off'] = undefined!;
  once: Emittery<ExecutionRecorderEvents>['once'] = undefined!;

  recordSocket(channel: WebSocket) {
    return new Promise<void>((resolve, reject) => {
      this.recordingId = nanoid() as RecordingId;

      const listener = (event: MessageEvent) => {
        const { message, data } = JSON.parse(event.data);

        if (this.#includePartialOutputs === false && message === 'partialOutput') {
          return;
        }

        if (this.#includeTrace === false && message === 'trace') {
          return;
        }

        this.#events.push(toRecordedEvent(message, data) as RecordedEvents);

        if (message === 'done' || message === 'abort' || message === 'error') {
          this.#emitter.emit('finish', {
            recording: this.getRecording(),
          });

          channel.removeEventListener('message', listener);

          resolve();
        }
      };

      channel.addEventListener('message', listener);
    });
  }

  record(processor: GraphProcessor) {
    this.recordingId = nanoid() as RecordingId;
    processor.onAny((event, data) => {
      if (this.#includePartialOutputs === false && event === 'partialOutput') {
        return;
      }

      if (this.#includeTrace === false && event === 'trace') {
        return;
      }

      this.#events.push(toRecordedEvent(event, data) as RecordedEvents);

      if (event === 'done' || event === 'abort' || event === 'error') {
        this.#emitter.emit('finish', {
          recording: this.getRecording(),
        });
      }
    });
  }

  getRecording(): Recording {
    return {
      recordingId: this.recordingId!,
      events: this.#events,
      startTs: this.#events[0]?.ts ?? 0,
      finishTs: this.#events[this.#events.length - 1]?.ts ?? 0,
    };
  }

  get events() {
    return this.#events;
  }

  static deserializeFromString(serialized: string) {
    const recorder = new ExecutionRecorder();
    const serializedRecording = JSON.parse(serialized) as SerializedRecording;

    if (serializedRecording.version !== 1) {
      throw new Error('Unsupported serialized events version');
    }

    recorder.recordingId = serializedRecording.recording.recordingId;
    recorder.#events = serializedRecording.recording.events;
    return recorder;
  }

  serialize() {
    const serialized: SerializedRecording = {
      version: 1,
      recording: this.getRecording(),
    };

    return JSON.stringify(serialized);
  }
}
