import { nanoid } from 'nanoid';
import { dedent } from 'ts-dedent';
import {
  AnyDataValue,
  AudioDataValue,
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeId,
  NodeImpl,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PortId,
  StringDataValue,
  coerceType,
  nodeDefinition,
} from '../../index.js';

export type TranscribeAudioNode = ChartNode<'assemblyAiTranscribeAudio', TranscribeAudioNodeData>;

export type TranscribeAudioNodeData = {};

export class TranscribeAudioNodeImpl extends NodeImpl<TranscribeAudioNode> {
  static create(): TranscribeAudioNode {
    const chartNode: TranscribeAudioNode = {
      type: 'assemblyAiTranscribeAudio',
      title: 'Transcribe Audio',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {},
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'audio' as PortId,
        dataType: ['audio', 'string'],
        title: 'Audio',
      }
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'text' as PortId,
        title: 'Transcript text',
      },
      {
        dataType: 'object',
        id: 'transcript' as PortId,
        title: 'Transcript object',
      }
    ];
  }

  getEditors(): EditorDefinition<TranscribeAudioNode>[] {
    return [];
  }

  getBody(): string | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI to transcribe audio`,
      infoBoxTitle: 'Transcribe Audio Node',
      contextMenuTitle: 'Transcribe Audio',
      group: ['AI', 'AssemblyAI'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const input = inputs['audio' as PortId] as AudioDataValue | StringDataValue | AnyDataValue;
    if (!input) throw new Error('Audio input is required.');

    const apiKey = context.getPluginConfig('assemblyAiApiKey');

    if (!apiKey) {
      throw new Error('AssemblyAI API key not set.');
    }

    let audioUrl: string;
    if (input.type === 'audio') {
      const audio = coerceType(inputs['audio' as PortId], 'audio');
      audioUrl = await uploadData(apiKey, audio as { data: Uint8Array });
    } else if (input.type === 'string' || input.type === 'any') {
      audioUrl = coerceType(inputs['audio' as PortId], 'string');
    } else {
      throw new Error('Audio input must be audio or string containing the audio URL.');
    }

    validateUrl(audioUrl);

    const transcript = await transcribeAudio(apiKey, audioUrl);

    return {
      ['text' as PortId]: {
        type: 'string',
        value: transcript.text,
      },
      ['transcript' as PortId]: {
        type: 'object',
        value: transcript,
      },
    };
  }
}

// Function to upload a local file to the AssemblyAI API
async function uploadData(apiToken: string, data: { data: Uint8Array }) {
  const url = 'https://api.assemblyai.com/v2/upload';

  // Send a POST request to the API to upload the file, passing in the headers and the file data
  const response = await fetch(url, {
    method: 'POST',
    body: new Blob([data.data]),
    headers: {
      'Content-Type': 'application/octet-stream',
      Authorization: apiToken,
    },
  });
  const body = await response.json();

  if (response.status !== 200) {
    if ('error' in body) throw new Error(body.error);
    throw new Error(`Upload failed with status ${response.status} - ${response.statusText}`);
  }

  return body.upload_url;
}

// Async function that sends a request to the AssemblyAI transcription API and retrieves the transcript
async function transcribeAudio(apiToken: string, audioUrl: string) {
  // Set the headers for the request, including the API token and content type
  const headers = {
    authorization: apiToken,
    'content-type': 'application/json',
  };

  // Send a POST request to the transcription API with the audio URL in the request body
  const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    body: JSON.stringify({ audio_url: audioUrl }),
    headers,
  });
  const body = await response.json();

  if (response.status !== 200) {
    if ('error' in body) throw new Error(body.error);
    throw new Error(`Create transcript failed with status ${response.status} - ${response.statusText}}`);
  }

  const transcriptId = body.id;

  // Construct the polling endpoint URL using the transcript ID
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

  // Poll the transcription API until the transcript is ready
  while (true) {
    // Send a GET request to the polling endpoint to retrieve the status of the transcript
    const pollingResponse = await fetch(pollingEndpoint, { method: 'GET', headers });
    const pollingBody = await pollingResponse.json();

    if (pollingResponse.status !== 200) {
      if ('error' in pollingBody) throw new Error(pollingBody.error);
      throw new Error(`Get transcript failed with status ${pollingResponse.status}`);
    }

    // If the transcription is complete, return the transcript object
    if (pollingBody.status === 'completed') {
      return pollingBody;
    } else if (pollingBody.status === 'error') {
      // If the transcription has failed, throw an error with the error message
      throw new Error(`Transcription failed: ${pollingBody.error}`);
    } else {
      // If the transcription is still in progress, wait for a few seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function validateUrl(audioUrl: string) {
  if (audioUrl === null) throw new Error('Audio URL cannot be null.');
  if (audioUrl === undefined) throw new Error('Audio URL cannot be undefined.');
  if (audioUrl === '') throw new Error('Audio URL is cannot be empty.');
  try {
    const url = new URL(audioUrl);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return true;
    } else {
      throw new Error('Audio URL must start with http:// or https://');
    }
  } catch {
    throw new Error('Audio URL is invalid.');
  }
}

export const transcribeAudioNode = nodeDefinition(TranscribeAudioNodeImpl, 'Transcribe Audio');
