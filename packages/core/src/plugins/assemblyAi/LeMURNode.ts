import { nanoid } from 'nanoid';
import { dedent } from 'ts-dedent';
import {
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
  coerceType,
  nodeDefinition,
} from '../../index.js';

export type LeMURNode = ChartNode<'leMUR', LeMURNodeData>;

export type LeMURNodeData = {};

export class LeMURNodeImpl extends NodeImpl<LeMURNode> {
  static create(): LeMURNode {
    const chartNode: LeMURNode = {
      type: 'leMUR',
      title: 'LeMUR',
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
        dataType: 'audio',
        title: 'Audio',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'transcribed' as PortId,
        title: 'Transcribed',
      },
    ];
  }

  getEditors(): EditorDefinition<LeMURNode>[] {
    return [];
  }

  getBody(): string | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use LeMUR to transcribe audio`,
      infoBoxTitle: 'LeMUR Node',
      contextMenuTitle: 'LeMUR',
      group: 'AI',
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const audio = coerceType(inputs['audio' as PortId], 'audio');

    if (!context.settings.assemblyAiApiKey) {
      throw new Error('AssemblyAI API key not set');
    }

    const uploadUrl = await uploadData(context.settings.assemblyAiApiKey, audio);
    const { text } = await transcribeAudio(context.settings.assemblyAiApiKey, uploadUrl);

    return {
      ['transcribed' as PortId]: {
        type: 'string',
        value: text,
      },
    };
  }
}

// Function to upload a local file to the AssemblyAI API
async function uploadData(apiToken: string, data: { data: Uint8Array }) {
  const url = 'https://api.assemblyai.com/v2/upload';

  const blob = new Blob([data.data], { type: 'audio/mp4' });

  // Send a POST request to the API to upload the file, passing in the headers and the file data
  const response = await fetch(url, {
    method: 'POST',
    body: blob,
    headers: {
      'Content-Type': 'application/octet-stream',
      Authorization: apiToken,
    },
  });

  // If the response is successful, return the upload URL
  if (response.status === 200) {
    const responseData = await response.json();
    return responseData.upload_url;
  } else {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }
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

  // Retrieve the ID of the transcript from the response data
  const responseData = await response.json();
  const transcriptId = responseData.id;

  // Construct the polling endpoint URL using the transcript ID
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

  // Poll the transcription API until the transcript is ready
  while (true) {
    // Send a GET request to the polling endpoint to retrieve the status of the transcript
    const pollingResponse = await fetch(pollingEndpoint, { headers });
    const transcriptionResult = await pollingResponse.json();

    // If the transcription is complete, return the transcript object
    if (transcriptionResult.status === 'completed') {
      return transcriptionResult;
    }
    // If the transcription has failed, throw an error with the error message
    else if (transcriptionResult.status === 'error') {
      throw new Error(`Transcription failed: ${transcriptionResult.error}`);
    }
    // If the transcription is still in progress, wait for a few seconds before polling again
    else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export const leMURNode = nodeDefinition(LeMURNodeImpl, 'Autoevals');
