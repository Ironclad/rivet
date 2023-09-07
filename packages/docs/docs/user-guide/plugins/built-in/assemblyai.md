---
sidebar_label: AssemblyAI
---

# AssemblyAI Plugin

:::info

At the moment you must use the [node executor](../../executors.md) to use the AssemblyAI plugin in the Rivet UI. You may also use the plugin when embedding Rivet in your own application.

:::

## Nodes

### Transcribe Audio Node

The Transcribe Audio node transcribes audio using the [AssemblyAI](https://www.assemblyai.com/) API. It will return a transcript of the given audio source.

![Transcribe Audio Node](./assets/transcribe-audio-node.png)

### LeMUR Summary Node

The LeMUR Summary node uses LeMUR to summarize a transcript of a given audio source. It will return a summary of the given transcript.

### LeMUR Q&A

Given a transcript, LeMUR can answer questions about the transcript.

### LeMUR Custom Task

Given a transcript, LeMUR can be instructed to do a custom task to the transcript.

### LeMUR Action Items

Given a transcript of a meeting, the LeMUR Action Items node will return a list of action items from the meeting.
