import { GraphProcessor, RecordedEvents, Recording, RecordingId } from '..';
import Emittery from 'emittery';
export type ExecutionRecorderEvents = {
    finish: {
        recording: Recording;
    };
};
export declare class ExecutionRecorder {
    #private;
    recordingId: RecordingId | undefined;
    constructor();
    on: Emittery<ExecutionRecorderEvents>['on'];
    off: Emittery<ExecutionRecorderEvents>['off'];
    once: Emittery<ExecutionRecorderEvents>['once'];
    record(processor: GraphProcessor): void;
    getRecording(): Recording;
    get events(): RecordedEvents[];
    static deserializeFromString(serialized: string): ExecutionRecorder;
    serialize(): string;
}
