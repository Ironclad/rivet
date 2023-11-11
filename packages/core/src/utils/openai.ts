import { orderBy } from 'lodash-es';
import { DEFAULT_CHAT_NODE_TIMEOUT } from './defaults.js';
import fetchEventSource from './fetchEventSource.js';

// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285

export type OpenAIModel = {
  maxTokens: number;
  cost: {
    prompt: number;
    completion: number;
  };
  displayName: string;
};

export const openaiModels = {
  'gpt-4': {
    maxTokens: 8192,
    cost: {
      prompt: 0.03,
      completion: 0.06,
    },
    displayName: 'GPT-4',
  },
  'gpt-4-32k': {
    maxTokens: 32768,
    cost: {
      prompt: 0.06,
      completion: 0.12,
    },
    displayName: 'GPT-4 32k',
  },
  'gpt-4-0613': {
    maxTokens: 8192,
    cost: {
      prompt: 0.03,
      completion: 0.06,
    },
    displayName: 'GPT-4 (v0613)',
  },
  'gpt-4-32k-0613': {
    maxTokens: 32768,
    cost: {
      prompt: 0.06,
      completion: 0.12,
    },
    displayName: 'GPT-4 32k (v0613)',
  },
  'gpt-3.5-turbo': {
    maxTokens: 4096,
    cost: {
      prompt: 0.002,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 Turbo',
  },
  'gpt-3.5-turbo-16k': {
    maxTokens: 16384,
    cost: {
      prompt: 0.001,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 16k',
  },
  'gpt-3.5-turbo-0613': {
    maxTokens: 16384,
    cost: {
      prompt: 0.002,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 (v0613)',
  },
  'gpt-3.5-turbo-16k-0613': {
    maxTokens: 16384,
    cost: {
      prompt: 0.001,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 16k (v0613)',
  },
  'gpt-3.5-turbo-0301': {
    maxTokens: 16384,
    cost: {
      prompt: 0.002,
      completion: 0.002,
    },
    displayName: 'GPT-3.5 (v0301)',
  },
  'gpt-4-0314': {
    maxTokens: 8192,
    cost: {
      prompt: 0.03,
      completion: 0.06,
    },
    displayName: 'GPT-4 (v0314)',
  },
  'gpt-4-32k-0314': {
    maxTokens: 32768,
    cost: {
      prompt: 0.06,
      completion: 0.12,
    },
    displayName: 'GPT-4 32k (v0314)',
  },
  'gpt-4-1106-preview': {
    maxTokens: 128000,
    cost: {
      prompt: 0.01,
      completion: 0.03,
    },
    displayName: 'GPT-4 Turbo 128K',
  },
  'gpt-4-vision-preview': {
    maxTokens: 128000,
    cost: {
      prompt: 0.01,
      completion: 0.03,
    },
    displayName: 'GPT-4 Vision',
  },
  'local-model': {
    maxTokens: Number.MAX_SAFE_INTEGER,
    cost: {
      prompt: 0,
      completion: 0,
    },
    displayName: 'Local Model',
  },
} satisfies Record<string, OpenAIModel>;

export const openAiModelOptions = orderBy(
  Object.entries(openaiModels).map(([id, { displayName }]) => ({
    value: id,
    label: displayName,
  })),
  'label',
);

export class OpenAIError extends Error {
  constructor(readonly status: number, readonly responseJson: any) {
    super(`OpenAIError: ${status} ${JSON.stringify(responseJson)}`);
    this.name = 'OpenAIError';
  }
}

export type ChatCompletionRole = ChatCompletionRequestMessage['role'];

export type ChatCompletionRequestMessage =
  | ChatCompletionRequestSystemMessage
  | ChatCompletionRequestUserMessage
  | ChatCompletionRequestAssistantMessage
  | ChatCompletionRequestToolMessage;

export type ChatCompletionRequestSystemMessage = {
  role: 'system';
  content: string | null;
};

export type ChatCompletionRequestUserMessage = {
  role: 'user';
  content: string | ChatCompletionRequestUserMessageContent[];
};

export type ChatCompletionRequestUserMessageContent =
  | ChatCompletionRequestUserMessageTextContent
  | ChatCompletionRequestUserMessageImageContent;

export type ChatCompletionRequestUserMessageTextContent = {
  type: 'text';
  text: string;
};

export type ChatCompletionRequestUserMessageImageContent = {
  type: 'image_url';
  image_url: {
    url: string;
    /**
     * low will disable the “high res” model. The model will receive a low-res 512 x 512 version of the image, and represent the image with a budget of 65 tokens. This allows the API to return faster responses and consume fewer input tokens for use cases that do not require high detail.
     * high will enable “high res” mode, which first allows the model to see the low res image and then creates detailed crops of input images as 512px squares based on the input image size. Each of the detailed crops uses twice the token budget (65 tokens) for a total of 129 tokens.
     */
    detail?: 'low' | 'high';
  };
};

export type ChatCompletionRequestAssistantMessage = {
  role: 'assistant';
  content: string | null;
  tool_calls?: ChatCompletionRequestAssistantMessageToolCall[];
};

export type ChatCompletionRequestAssistantMessageToolCall = {
  type: 'function';
  id: string;
  function: GptFunctionCall;
};

export type ChatCompletionRequestToolMessage = {
  role: 'tool';
  content: string | null;
  tool_call_id: string;
};

// https://platform.openai.com/docs/api-reference/chat/create
export type ChatCompletionOptions = {
  endpoint: string;
  auth: { apiKey: string; organization?: string };
  headers?: Record<string, string>;
  signal?: AbortSignal;

  /** The timeout in milliseconds before an initial response, before retrying. */
  timeout?: number;

  model: string;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  n?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: {
    [key: number]: number;
  };

  /** This feature is in Beta. If specified, our system will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed, and you should refer to the system_fingerprint response parameter to monitor changes in the backend. */
  seed?: number;

  tools?: ChatCompletionTool[];
  tool_choice?:
    | 'none'
    | 'auto'
    | {
        type: 'function';
        function: {
          name: string;
        };
      };

  /** An object specifying the format that the model must output. Used to enable JSON mode. */
  response_format?:
    | {
        type: 'text';
      }
    | {
        /**
         * Setting to json_object enables JSON mode. This guarantees that the message the model generates is valid JSON.
         * Note that your system prompt must still instruct the model to produce JSON, and to help ensure you don't forget, the API will throw an error if the string JSON does not appear in your system message. Also note that the message content may be partial (i.e. cut off) if finish_reason="length", which indicates the generation exceeded max_tokens or the conversation exceeded the max context length.
         * Must be one of text or json_object.
         */
        type: 'json_object';
      };
};

export type ChatCompletionResponse = {
  /** A unique identifier for the chat completion. */
  id: string;

  /** The object type, which is always chat.completion. */
  object: 'text_completion';

  /** The Unix timestamp (in seconds) of when the chat completion was created. */
  created: number;

  /** The model used for the chat completion. */
  model: string;

  /**
   * This fingerprint represents the backend configuration that the model runs with.
   * Can be used in conjunction with the seed request parameter to understand when backend changes have been made that might impact determinism.
   */
  system_fingerprint: string;

  /** Usage statistics for the completion request. */
  usage: {
    /** Number of tokens in the generated completion. */
    completion_tokens: number;

    /** Number of tokens in the prompt. */
    prompt_tokens: number;

    /** Total number of tokens used in the request (prompt + completion). */
    total_tokens: number;
  };

  /** A list of chat completion choices. Can be more than one if n is greater than 1. */
  choices: ChatCompletionResponseChoice[];
};

export type ChatCompletionResponseChoice = {
  /** The index of the choice in the list of choices. */
  index: number;

  /**
   * The reason the model stopped generating tokens. This will be stop if the model hit a natural stop point or a provided stop sequence,
   * length if the maximum number of tokens specified in the request was reached, content_filter if content was omitted due to a flag
   * from our content filters, tool_calls if the model called a tool, or function_call (deprecated) if the model called a function.
   */
  finish_reason: 'stop' | 'length' | 'content_filter' | 'insufficient_tokens' | 'tool_calls';

  /** A chat completion message generated by the model. */
  message: ChatCompletionResponseMessage;
};

export type ChatCompletionResponseMessage = {
  /** The role of the author of this message. */
  role: ChatCompletionRole;

  /** The contents of the message. */
  content: string | null;

  /** The tool calls generated by the model, such as function calls. */
  tool_calls: OpenAIFunctionToolCall[];
};

export type ChatCompletionChunk = {
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices?: ChatCompletionChunkChoice[];
};

export type GptFunctionCall = {
  name: string;
  arguments: string;
};

export type GptFunctionCallDelta = {
  name?: string;
  arguments?: string;
};

export type ChatCompletionChunkChoice = {
  index: number;
  message_index: number;
  delta: {
    role?: 'assistant';
    content?: string;
    tool_calls?: ChatCompletionChunkChoiceToolCall[];
  };
  finish_reason: null | 'stop' | 'length' | 'insufficient_tokens' | 'content_filter' | 'tool_calls';
};

export type ChatCompletionChunkChoiceToolCall = {
  index: number;
  id: string;
  type: 'function';
  function: GptFunctionCall;
};

export type ChatCompletionTool = ChatCompletionFunctionTool;

export type ChatCompletionFunctionTool = {
  type: 'function';
  function: ChatCompletionFunction;
};

export type ChatCompletionFunction = {
  name: string;
  description: string;
  parameters: object;
};

export async function* streamChatCompletions({
  endpoint,
  auth,
  signal,
  headers,
  timeout,
  ...rest
}: ChatCompletionOptions): AsyncGenerator<ChatCompletionChunk> {
  const abortSignal = signal ?? new AbortController().signal;

  const response = await fetchEventSource(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.apiKey}`,
        ...(auth.organization ? { 'OpenAI-Organization': auth.organization } : {}),
        ...headers,
      },
      body: JSON.stringify({
        ...rest,
        stream: true,
      }),
      signal: abortSignal,
    },
    timeout ?? DEFAULT_CHAT_NODE_TIMEOUT,
  );

  let hadChunks = false;

  for await (const chunk of response.events()) {
    hadChunks = true;

    if (chunk === '[DONE]' || abortSignal?.aborted) {
      return;
    }
    let data: ChatCompletionChunk;
    try {
      data = JSON.parse(chunk);
    } catch (err) {
      console.error('JSON parse failed on chunk: ', chunk);
      throw err;
    }

    yield data;
  }

  if (!hadChunks) {
    const responseJson = await response.json();
    throw new OpenAIError(response.status, responseJson);
  }
}

export type OpenAIAssistant = {
  /** The identifier, which can be referenced in API endpoints. */
  id: string;

  /** The object type, which is always assistant. */
  object: 'assistant';

  /** The Unix timestamp (in seconds) for when the assistant was created. */
  created_at: number;

  /** The name of the assistant. The maximum length is 256 characters. */
  name: string | null;

  /** The description of the assistant. The maximum length is 512 characters. */
  description: string | null;

  /** ID of the model to use. You can use the List models API to see all of your available models, or see our Model overview for descriptions of them. */
  model: string;

  /** The system instructions that the assistant uses. The maximum length is 32768 characters. */
  instructions: string | null;

  /** A list of tool enabled on the assistant. There can be a maximum of 128 tools per assistant. Tools can be of types code_interpreter, retrieval, or function. */
  tools: OpenAIAssistantTool[];

  /** A list of file IDs attached to this assistant. There can be a maximum of 20 files attached to the assistant. Files are ordered by their creation date in ascending order. */
  file_ids: string[];

  /** Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format. Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long. */
  metadata: Record<string, string>;
};

export type OpenAIAssistantCodeInterpreterTool = {
  /** The type of tool being defined: code_interpreter */
  type: 'code_interpreter';
};

export type OpenAIAssistantRetrievalTool = {
  /** The type of tool being defined: retrieval */
  type: 'retrieval';
};

export type OpenAIAssistantFunctionTool = {
  /** The type of tool being defined: function */
  type: 'function';

  /** The function definition. */
  function: ChatCompletionFunction;
};

export type OpenAIAssistantTool =
  | OpenAIAssistantCodeInterpreterTool
  | OpenAIAssistantRetrievalTool
  | OpenAIAssistantFunctionTool;

/**
 * POST https://api.openai.com/v1/assistants
 * Create an assistant with a model and instructions.
 */
export type CreateAssistantBody = {
  /** ID of the model to use. You can use the List models API to see all of your available models, or see our Model overview for descriptions of them. */
  model?: string;

  /** The name of the assistant. The maximum length is 256 characters. */
  name?: string | null;

  /** The description of the assistant. The maximum length is 512 characters. */
  description?: string | null;

  /** The system instructions that the assistant uses. The maximum length is 32768 characters. */
  instructions?: string | null;

  /** A list of tool enabled on the assistant. There can be a maximum of 128 tools per assistant. Tools can be of types code_interpreter, retrieval, or function. */
  tools?: OpenAIAssistantTool[];

  /** A list of file IDs attached to this assistant. There can be a maximum of 20 files attached to the assistant. Files are ordered by their creation date in ascending order. */
  file_ids?: string[];

  /** Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format. Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long. */
  metadata?: Record<string, string>;
};

export type CreateAssistantResponse = OpenAIAssistant;

export type OpenAIPaginationQuery = {
  /** A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 20. */
  limit?: string;

  /** Sort order by the created_at timestamp of the objects. asc for ascending order and desc for descending order. */
  order?: string;

  /** A cursor for use in pagination. after is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include after=obj_foo in order to fetch the next page of the list. */
  after?: string;

  /** A cursor for use in pagination. before is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include before=obj_foo in order to fetch the previous page of the list. */
  before?: string;
};

export type OpenAIAssistantFile = {
  /** The identifier, which can be referenced in API endpoints. */
  id: string;

  /** The object type, which is always assistant.file. */
  object: 'assistant.file';

  /** The Unix timestamp (in seconds) for when the assistant file was created. */
  created_at: number;

  /** The assistant ID that the file is attached to. */
  assistant_id: string;
};

export type CreateAssistantFileBody = {
  file_id: string;
};

export type OpenAIFile = {
  /** The file identifier, which can be referenced in the API endpoints. */
  id: string;

  /** The size of the file, in bytes. */
  bytes: number;

  /** The Unix timestamp (in seconds) for when the file was created. */
  created_at: number;

  /** The name of the file. */
  filename: string;

  /** The object type, which is always file. */
  object: 'file';

  /** The intended purpose of the file. Supported values are fine-tune, fine-tune-results, assistants, and assistants_output. */
  purpose: OpenAIFilePurpose;
};

export type OpenAIFilePurpose = 'fine-tune' | 'fine-tune-results' | 'assistants' | 'assistants_output';

export const openAIFilePurposeOptions = [
  { value: 'fine-tune', label: 'Fine-tuning' },
  { value: 'fine-tune-results', label: 'Fine-tuning Results' },
  { value: 'assistants', label: 'Assistants' },
  { value: 'assistants_output', label: 'Assistants Output' },
];

export type OpenAIThread = {
  /** The identifier, which can be referenced in API endpoints. */
  id: string;

  /** The object type, which is always thread. */
  object: 'thread';

  /** The Unix timestamp (in seconds) for when the thread was created. */
  created_at: number;

  /** Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format. Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long. */
  metadata: Record<string, string>;
};

export type OpenAIThreadMessage = {
  /** The identifier, which can be referenced in API endpoints. */
  id: string;

  /** The object type, which is always thread.message. */
  object: 'thread.message';

  /** The Unix timestamp (in seconds) for when the message was created. */
  created_at: number;

  /** The thread ID that this message belongs to. */
  thread_id: string;

  /** The entity that produced the message. One of user or assistant. */
  role: 'user' | 'assistant';

  /** The content of the message in array of text and/or images. */
  content: OpenAIThreadMessageContent[];
};

export type OpenAIThreadMessageContent = OpenAIThreadMessageImageFileContent | OpenAIThreadMessageTextContent;

/** References an image File in the content of a message. */
export type OpenAIThreadMessageImageFileContent = {
  /** Always image_file. */
  type: 'image_file';
  image_file: {
    /** The File ID of the image in the message content. */
    file_id: string;
  };
};

/** The text content that is part of a message. */
export type OpenAIThreadMessageTextContent = {
  /** Always text. */
  type: 'text';
  text: {
    /** The data that makes up the text. */
    value: string;
    annotations: OpenAIThreadMessageContentAnnotation[];
  };
};

export type OpenAIThreadMessageContentAnnotation =
  | OpenAIThreadMessageTextContentFileCitationAnnotation
  | OpenAIThreadMessageTextContentFilePathAnnotation;

/** A citation within the message that points to a specific quote from a specific File associated with the assistant or the message. Generated when the assistant uses the "retrieval" tool to search files. */
export type OpenAIThreadMessageTextContentFileCitationAnnotation = {
  /** Always file_citation. */
  type: 'file_citation';

  /** The text in the message content that needs to be replaced. */
  text: string;

  file_citation: {
    /** The ID of the specific File the citation is from. */
    file_id: string;

    /** The specific quote in the file. */
    quote: string;
  };

  start_index: number;
  end_index: number;
};

/** A URL for the file that's generated when the assistant used the code_interpreter tool to generate a file. */
export type OpenAIThreadMessageTextContentFilePathAnnotation = {
  /** Always file_path. */
  type: 'file_path';

  /** The text in the message content that needs to be replaced. */
  text: string;

  file_path: {
    /** The ID of the file that was generated. */
    file_id: string;
  };

  start_index: number;
  end_index: number;
};

export type CreateMessageBody = {
  /** The role of the entity that is creating the message. Currently only user is supported. */
  role: 'user';

  /** The content of the message. */
  content: string;

  /** A list of File IDs that the message should use. There can be a maximum of 10 files attached to a message. Useful for tools like retrieval and code_interpreter that can access and use files. */
  file_ids?: string[];

  /** Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format. Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long. */
  metadata?: Record<string, string>;
};

export type CreateThreadBody = {
  /** A list of messages to start the thread with. */
  messages: CreateMessageBody[];

  /** Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format. Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long. */
  metadata: Record<string, string>;
};

export type OpenAIRun = {
  /** The identifier, which can be referenced in API endpoints. */
  id: string;

  /** The object type, which is always assistant.run. */
  object: 'assistant.run';

  /** The Unix timestamp (in seconds) for when the run was created. */
  created_at: number;

  /** The ID of the thread that was executed on as a part of this run. */
  thread_id: string;

  /** The ID of the assistant used for execution of this run. */
  assistant_id: string;

  /** The status of the run, which can be either queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired. */
  status:
    | 'queued'
    | 'in_progress'
    | 'requires_action'
    | 'cancelling'
    | 'cancelled'
    | 'failed'
    | 'completed'
    | 'expired';

  /** Details on the action required to continue the run. Will be null if no action is required. */
  required_action: OpenAIRunRequiredAction | null;

  /** The last error associated with this run. Will be null if there are no errors. */
  last_error: {
    /** One of server_error or rate_limit_exceeded. */
    code: string;

    /** A human-readable description of the error. */
    message: string;
  } | null;

  /** The Unix timestamp (in seconds) for when the run will expire. */
  expires_at: number;

  /** The Unix timestamp (in seconds) for when the run was started. */
  started_at: number;

  /** The Unix timestamp (in seconds) for when the run was cancelled. */
  cancelled_at: number;

  /** The Unix timestamp (in seconds) for when the run failed. */
  failed_at: number;

  /** The Unix timestamp (in seconds) for when the run was completed. */
  completed_at: number;

  /** The model that the assistant used for this run. */
  model: string;

  /** The instructions that the assistant used for this run. */
  instructions: string;

  /** The list of tools that the assistant used for this run. */
  tools: OpenAIAssistantTool[];

  /** The list of File IDs the assistant used for this run. */
  file_ids: string[];

  /** Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format. Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long. */
  metadata: Record<string, string>;
};

export type OpenAIRunRequiredAction = OpenAIRunRequiredActionSubmitToolOutputs;

export type OpenAIRunRequiredActionSubmitToolOutputs = {
  /** For now, this is always submit_tool_outputs. */
  type: 'submit_tool_outputs';

  /** Details on the tool outputs needed for this run to continue. */
  submit_tool_outputs: {
    /** A list of the relevant tool calls. */
    tool_calls: OpenAIFunctionToolCall[];
  };
};

export type OpenAIRunToolCall = OpenAIFunctionToolCall | OpenAIRunRetrievalToolCall | OpenAIRunCodeInterpreterToolCall;

export type OpenAIFunctionToolCall = {
  /** The ID of the tool call. This ID must be referenced when you submit the tool outputs in using the Submit tool outputs to run endpoint. */
  id: string;

  /** The type of tool call the output is required for. For now, this is always function. */
  type: 'function';

  /** The function definition. */
  function: OpenAIRunFunctionToolCallFunction;
};

export type OpenAIRunFunctionToolCallFunction = {
  /** The name of the function. */
  name: string;

  /** The arguments that the model expects you to pass to the function. */
  arguments: string;

  /** The output of the function. This will be null if the outputs have not been submitted yet. Ignore when submitting tool calls.  */
  output?: string | null;
};

export type OpenAIRunRetrievalToolCall = {
  /** The ID of the tool call object. */
  id: string;

  /** The type of tool call. This is always going to be retrieval for this type of tool call. */
  type: 'retrieval';

  /** For now, this is always going to be an empty object. */
  retrieval: {};
};

/** Details of the Code Interpreter tool call the run step was involved in. */
export type OpenAIRunCodeInterpreterToolCall = {
  /** The ID of the tool call. */
  id: string;

  /** The type of tool call. This is always going to be code_interpreter for this type of tool call. */
  type: 'code_interpreter';

  /** The Code Interpreter tool call definition. */
  code_interpreter: {
    /**I The input to the Code Interpreter tool call. */
    input: string;

    /** The outputs from the Code Interpreter tool call. Code Interpreter can output one or more items, including text (logs) or images (image). Each of these are represented by a different object type. */
    outputs: OpenAIRunCodeInterpreterToolCallOutput[];
  };
};

export type OpenAIRunCodeInterpreterToolCallOutput =
  | OpenAIRunCodeInterpreterToolCallLogOutput
  | OpenAIRunCodeInterpreterToolCallImageOutput;

/** Text output from the Code Interpreter tool call as part of a run step. */
export type OpenAIRunCodeInterpreterToolCallLogOutput = {
  /** Always logs. */
  type: 'logs';

  /** The text output from the Code Interpreter tool call. */
  logs: string;
};

/** Code interpreter image output */
export type OpenAIRunCodeInterpreterToolCallImageOutput = {
  /** Always image. */
  type: 'image';
  image: {
    /** The file ID of the image. */
    file_id: string;
  };
};

export type ListThreadMessagesQuery = {
  /** A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 20. */
  limit?: number;

  /** Sort order by the created_at timestamp of the objects. asc for ascending order and desc for descending order. */
  order?: string;

  /** A cursor for use in pagination. after is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include after=obj_foo in order to fetch the next page of the list. */
  after?: string;

  /** A cursor for use in pagination. before is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include before=obj_foo in order to fetch the previous page of the list. */
  before?: string;
};

export type CreateRunBody = {
  assistant_id: string;
  model?: string;
  instructions?: string;
  tools?: OpenAIAssistantTool[];
  metadata?: Record<string, string>;
};

export type SubmitToolOutputsBody = {
  tool_outputs: SubmitToolOutputsBodyToolOutput[];
};

export type SubmitToolOutputsBodyToolOutput = {
  // Dunno why these are optional

  /** The ID of the tool call in the required_action object within the run object the output is being submitted for. */
  tool_call_id?: string;

  /** The output of the tool call to be submitted to continue the run. */
  output?: string;
};

/** Represents a step in execution of a run. */
export type OpenAIRunStep = {
  /** The identifier of the run step, which can be referenced in API endpoints. */
  id: string;

  /** The object type, which is always `assistant.run.step``. */
  object: 'thread.run.step';

  /** The Unix timestamp (in seconds) for when the run step was created. */
  created_at: number;

  /** The ID of the assistant associated with the run step. */
  assistant_id: string;

  /** The ID of the thread that was run. */
  thread_id: string;

  /** The ID of the run that this run step is a part of. */
  run_id: string;

  /** The type of run step, which can be either message_creation or tool_calls. */
  type: 'message_creation' | 'tool_calls';

  /** The status of the run, which can be either in_progress, cancelled, failed, completed, or expired. */
  status: 'in_progress' | 'cancelled' | 'failed' | 'completed' | 'expired';

  /** The details of the run step. */
  step_details: OpenAIRunStepDetails;

  /** The last error associated with this run step. Will be null if there are no errors. */
  last_error: OpenAIErrorInfo | null;

  /** The Unix timestamp (in seconds) for when the run step expired. A step is considered expired if the parent run is expired. */
  expired_at: number | null;

  /** The Unix timestamp (in seconds) for when the run step was cancelled. */
  cancelled_at: number | null;

  /** The Unix timestamp (in seconds) for when the run step failed. */
  failed_at: number | null;

  /** The Unix timestamp (in seconds) for when the run step completed. */
  completed_at: number | null;

  /** Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format. Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long. */
  metadata: Record<string, string>;
};

export type OpenAIRunStepDetails = OpenAIMessageCreationRunStepDetails | OpenAIToolCallRunStepDetails;

/** Details of the message creation by the run step. */
export type OpenAIMessageCreationRunStepDetails = {
  /** Always `message_creation``. */
  type: 'message_creation';

  message_creation: {
    /** The ID of the message that was created by this run step. */
    message_id: string;
  };
};

export type OpenAIErrorInfo = {
  /** One of server_error or rate_limit_exceeded. */
  code: 'server_error' | 'rate_limit_exceeded';

  /** A human-readable description of the error. */
  message: string;
};

export type OpenAIToolCallRunStepDetails = {
  type: 'tool_calls';

  /** An array of tool calls the run step was involved in. These can be associated with one of three types of tools: code_interpreter, retrieval, or function. */
  tool_calls: OpenAIRunToolCall[];
};

export type OpenAIListResponse<T> = {
  object: 'list';
  data: T[];
  first_id: string;
  last_id: string;
  has_more: boolean;
};
