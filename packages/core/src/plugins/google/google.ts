export type GoogleModel = {
  maxTokens: number;
  cost: {
    prompt: number;
    completion: number;
  };
  displayName: string;
};

export const googleModels = {
  'gemini-pro': {
    maxTokens: 32760,
    cost: {
      prompt: NaN,
      completion: NaN,
    },
    displayName: 'Gemini Pro',
  },
  'gemini-pro-vision': {
    maxTokens: 16384,
    cost: {
      prompt: NaN,
      completion: NaN,
    },
    displayName: 'Gemini Pro Vision',
  },
} satisfies Record<string, GoogleModel>;

export type GoogleModels = keyof typeof googleModels;

export const googleModelOptions = Object.entries(googleModels).map(([id, { displayName }]) => ({
  value: id,
  label: displayName,
}));

export interface GoogleChatMessage {
  role: 'user' | 'assistant';
  parts: ({
    text: string;
  } | {
    inline_data: {
      mime_type: string;
      data: string;
    };
  })[]
}

export type ChatCompletionOptions = {
  project: string;
  location: string;
  applicationCredentials: string;
  model: GoogleModels;
  prompt: GoogleChatMessage[];
  max_output_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  signal?: AbortSignal;
};

export type ChatCompletionChunk = {
  completion: string;
  finish_reason: 'FINISH_REASON_UNSPECIFIED' | 'FINISH_REASON_STOP' | 'FINISH_REASON_MAX_TOKENS' | 'FINISH_REASON_SAFETY' | 'FINISH_REASON_RECITATION' | 'FINISH_REASON_OTHER' | undefined;
  model: string;
};

export async function* streamChatCompletions({
  project,
  location,
  applicationCredentials,
  model,
  signal,
  max_output_tokens,
  temperature,
  top_p,
  top_k,
  prompt,
}: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk> {
  const defaultSignal = new AbortController().signal;

  // If you import normally, the Google auth library throws a fit.
  const { VertexAI } = await import('@google-cloud/vertexai');

  // Can't find a way to pass the credentials path in
  process.env['GOOGLE_APPLICATION_CREDENTIALS'] = applicationCredentials;
  const vertexAi = new VertexAI({ project, location });
  const generativeModel = vertexAi.preview.getGenerativeModel({
    model,
    generation_config: {
      max_output_tokens,
      temperature,
      top_p,
      top_k,
    }
  });
  const response = await generativeModel.generateContentStream({
    contents: prompt,
  });

  let hadChunks = false;

  for await (const chunk of response.stream) {
    console.log('streaming google responses')
    hadChunks = true;

    if (!signal?.aborted && chunk.candidates[0]?.content.parts[0]?.text) {
      yield {
        completion: chunk.candidates[0]?.content.parts[0]?.text,
        finish_reason: chunk.candidates[0]?.finishReason as any,
        model,
      };
    } else {
      return;
    }
  }

  if (!hadChunks) {
    throw new Error(`No chunks received.`);
  }
}
