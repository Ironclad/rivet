# Recording

Enabling recording of your rivet graph executions is simple and straightforward.

First, instantiate a new `ExecutionRecorder` instance:

```ts
const recorder = new ExecutionRecorder(options);
```

You can optionally pass in an options object to choose whether to include partial outputs (streaming responses, default true), and whether to include debugging "trace" events (default true). Both options will increase the file size of your recordings.

```ts
export type ExecutionRecorderOptions = {
  includePartialOutputs?: boolean;
  includeTrace?: boolean;
};
```

Next, call `recorder.record()` on your `GraphProcessor` instance. You will have to use [createProcessor](./node/createProcessor.mdx) rather than [runGraph](./node/runGraph.mdx) to get a `GraphProcessor` instance.

```ts
const processor = createProcessor({ etc });
recorder.record(processor);
```

Once the processor has finished executing, you can call `recorder.getRecording()` to get a `Recording` object, or more simply, you can call `recorder.serialize()` to get a string serialized recording. You can then save your recording to a file, or any other storage medium:

```ts
const serializedRecording = recorder.serialize();
await writeFile('my-recording.rivet-recording', serializedRecording, { encoding: 'utf8' });
```

## Recording Format

The recording format is subject to change. However, at the moment the recording format is a JSONL file, where each line is a JSON object representing a single event in the recording.

When replaying a recording, a `GraphProcessor` simply replays every event in the recording as if it were running and emitting events itself.
