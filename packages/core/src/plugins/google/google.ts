import type { Content, InlineDataPart, Part, TextPart } from '@google/generative-ai';
import { P, match } from 'ts-pattern';

export type GoogleModelDeprecated = {
  maxTokens: number;
  cost: {
    prompt: number;
    completion: number;
  };
  displayName: string;
};

export const googleModelsDeprecated = {
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
} satisfies Record<string, GoogleModelDeprecated>;

export type GoogleModelsDeprecated = keyof typeof googleModelsDeprecated;

export const generativeAiGoogleModels = {
  'gemini-2.0-flash-001': {
    maxTokens: 1048576,
    cost: {
      prompt: 0.15 / 1000,
      completion: 0.6 / 1000,
    },
    displayName: 'Gemini 2.0 Flash',
  },
  'gemini-2.0-pro-exp-02-05': {
    maxTokens: 2097152,
    cost: {
      prompt: 0, // Unknown
      completion: 0, // Unknown
    },
    displayName: 'Gemini 2.0 Pro',
  },
  'gemini-2.0-flash-lite-preview-02-05': {
    maxTokens: 1048576,
    cost: {
      prompt: 0.075 / 1000,
      completion: 0.3 / 1000,
    },
    displayName: 'Gemini 2.0 Flash Lite',
  },
  'gemini-2.0-flash-thinking-exp-01-21': {
    maxTokens: 1048576,
    cost: {
      prompt: 0, // Unknown
      completion: 0, // Unknown
    },
    displayName: 'Gemini 2.0 Flash Thinking',
  },
  'gemini-1.5-flash': {
    maxTokens: 1048576,
    cost: {
      prompt: 0, // It's per-character wtf
      completion: 0, // It's per-character
    },
    displayName: 'Gemini 1.5 Flash',
  },
  'gemini-1.5-pro': {
    maxTokens: 2097152,
    cost: {
      prompt: 0, // It's per-character wtf
      completion: 0, // It's per-character
    },
    displayName: 'Gemini 1.5 Pro',
  },
  'gemini-1.0-pro': {
    maxTokens: 32760,
    cost: {
      prompt: 0, // It's per-character wtf
      completion: 0, // 1It's per-character
    },
    displayName: 'Gemini 1.0 Pro',
  },
  'gemini-1.0-pro-vision': {
    maxTokens: 16384,
    cost: {
      prompt: 0, // It's per-character wtf
      completion: 0, // It's per-character
    },
    displayName: 'Gemini 1.0 Pro Vision',
  },
};

export type GenerativeAiGoogleModel = keyof typeof generativeAiGoogleModels;

export const googleModelOptionsDeprecated = Object.entries(googleModelsDeprecated).map(([id, { displayName }]) => ({
  value: id,
  label: displayName,
}));

export const generativeAiOptions = Object.entries(generativeAiGoogleModels).map(([id, { displayName }]) => ({
  value: id,
  label: displayName,
}));

export interface GoogleChatMessage {
  role: 'user' | 'assistant';
  parts: (
    | {
        text: string;
      }
    | {
        inline_data: {
          mime_type: string;
          data: string;
        };
      }
  )[];
}

export type ChatCompletionOptions = {
  project: string;
  location: string;
  applicationCredentials: string;
  model: GoogleModelsDeprecated;
  prompt: GoogleChatMessage[];
  max_output_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  signal?: AbortSignal;
};

export type ChatCompletionChunk = {
  completion: string;
  finish_reason:
    | 'FINISH_REASON_UNSPECIFIED'
    | 'FINISH_REASON_STOP'
    | 'FINISH_REASON_MAX_TOKENS'
    | 'FINISH_REASON_SAFETY'
    | 'FINISH_REASON_RECITATION'
    | 'FINISH_REASON_OTHER'
    | undefined;
  model: string;
};

export type StreamGenerativeAiOptions = {
  apiKey: string;
  model: GenerativeAiGoogleModel;
  systemPrompt: string | undefined;
  prompt: GoogleChatMessage[];
  maxOutputTokens: number;
  temperature: number | undefined;
  topP: number | undefined;
  topK: number | undefined;
  signal?: AbortSignal;
};

export async function* streamGenerativeAi({
  apiKey,
  model,
  systemPrompt,
  prompt,
  maxOutputTokens,
  temperature,
  topP,
  topK,
  signal,
}: StreamGenerativeAiOptions): AsyncGenerator<ChatCompletionChunk> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAi = new GoogleGenerativeAI(apiKey);

  const genaiModel = genAi.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens,
      temperature,
      topP,
      topK,
    },
  });

  const contentParts = prompt.map(({ role, parts }): Content => {
    return {
      role,
      parts: parts.map((part): Part => {
        return match(part)
          .with({ text: P.string }, ({ text }): TextPart => {
            return { text };
          })
          .with({ inline_data: P.any }, ({ inline_data: inlineData }): InlineDataPart => {
            return {
              inlineData: {
                data: inlineData.data,
                mimeType: inlineData.mime_type,
              },
            };
          })
          .exhaustive();
      }),
    };
  });

  const result = await genaiModel.generateContentStream(
    {
      contents: contentParts,
    },
    { signal },
  );

  for await (const chunk of result.stream) {
    if (chunk.candidates) {
      yield {
        completion: chunk.candidates[0]?.content.parts[0]?.text ?? '',
        finish_reason: chunk.candidates[0]?.finishReason as any,
        model,
      };
    }
  }
}

/* eslint-disable @typescript-eslint/naming-convention */
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
  process.env.GOOGLE_APPLICATION_CREDENTIALS = applicationCredentials;
  const vertexAi = new VertexAI({ project, location });
  const generativeModel = vertexAi.preview.getGenerativeModel({
    model,
    generation_config: {
      max_output_tokens,
      temperature,
      top_p,
      top_k,
    },
  });
  const response = await generativeModel.generateContentStream({
    contents: prompt,
  });

  let hadChunks = false;

  for await (const chunk of response.stream) {
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
