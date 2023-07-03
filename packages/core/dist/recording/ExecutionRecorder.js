import { nanoid } from 'nanoid';
import Emittery from 'emittery';
const toRecordedEventMap = {
    graphStart: ({ graph, inputs }) => ({ graphId: graph.metadata.id, inputs }),
    graphFinish: ({ graph, outputs }) => ({ graphId: graph.metadata.id, outputs }),
    graphError: ({ graph, error }) => ({
        graphId: graph.metadata.id,
        error: typeof error === 'string' ? error : error.stack,
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
        error: typeof error === 'string' ? error : error.stack,
        processId,
    }),
    abort: ({ successful, error }) => ({ successful, error: typeof error === 'string' ? error : error?.stack }),
    nodeExcluded: ({ node, processId }) => ({
        nodeId: node.id,
        processId,
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
        error: typeof error === 'string' ? error : error.stack,
    }),
    done: ({ results }) => ({ results }),
    globalSet: ({ id, processId, value }) => ({ id, processId, value }),
    pause: () => void 0,
    resume: () => void 0,
    start: ({ contextValues, inputs, project }) => ({
        contextValues,
        inputs,
        projectId: project.metadata.id,
    }),
    trace: (message) => message,
};
const isPrefix = (s, prefix) => s.startsWith(prefix);
function toRecordedEvent(event, data) {
    if (isPrefix(event, 'globalSet:')) {
        return {
            type: event,
            data: data,
            ts: Date.now(),
        };
    }
    if (isPrefix(event, 'userEvent:')) {
        return {
            type: event,
            data: data,
            ts: Date.now(),
        };
    }
    return {
        type: event,
        data: toRecordedEventMap[event](data),
        ts: Date.now(),
    };
}
export class ExecutionRecorder {
    #events = [];
    recordingId;
    #emitter;
    constructor() {
        this.#emitter = new Emittery();
        this.#emitter.bindMethods(this, ['on', 'off', 'once']);
    }
    on = undefined;
    off = undefined;
    once = undefined;
    record(processor) {
        this.recordingId = nanoid();
        processor.onAny((event, data) => {
            this.#events.push(toRecordedEvent(event, data));
            if (event === 'done' || event === 'abort' || event === 'error') {
                this.#emitter.emit('finish', {
                    recording: this.getRecording(),
                });
            }
        });
    }
    getRecording() {
        return {
            recordingId: this.recordingId,
            events: this.#events,
            startTs: this.#events[0]?.ts ?? 0,
            finishTs: this.#events[this.#events.length - 1]?.ts ?? 0,
        };
    }
    get events() {
        return this.#events;
    }
    static deserializeFromString(serialized) {
        const recorder = new ExecutionRecorder();
        const serializedRecording = JSON.parse(serialized);
        if (serializedRecording.version !== 1) {
            throw new Error('Unsupported serialized events version');
        }
        recorder.recordingId = serializedRecording.recording.recordingId;
        recorder.#events = serializedRecording.recording.events;
        return recorder;
    }
    serialize() {
        const serialized = {
            version: 1,
            recording: this.getRecording(),
        };
        return JSON.stringify(serialized);
    }
}
