import type { Opaque } from 'type-fest';
import {
  type Settings,
  type NativeApi,
  type Project,
  type DataValue,
  type ExternalFunction,
  type Outputs,
  type GraphId,
  type GraphProcessor,
  type ScalarOrArrayDataValue,
  type DatasetProvider,
  type ChartNode,
  type AttachedNodeData,
  type AudioProvider,
  type StringArrayDataValue,
  type ProjectId,
  type MCPProvider,
} from '../index.js';
import type { Tokenizer } from '../integrations/Tokenizer.js';
import type { CodeRunner } from '../integrations/CodeRunner.js';
import type { ProjectReferenceLoader } from './ProjectReferenceLoader.js';

export type ProcessContext = {
  settings: Settings;
  nativeApi?: NativeApi;

  /** Sets the dataset provider to be used for all dataset node calls. */
  datasetProvider?: DatasetProvider;

  /** Provider for all MCP node functionality */
  mcpProvider?: MCPProvider;

  /** The provider responsible for being able to play audio. Undefined if unsupported in this context. */
  audioProvider?: AudioProvider;

  /** Sets the tokenizer that will be used for all nodes. If unset, the default GptTokenizerTokenizer will be used. */
  tokenizer?: Tokenizer;

  /** The provider for running arbitrary code in the Code Node. */
  codeRunner?: CodeRunner;

  /** The loader for loading project references. */
  projectReferenceLoader?: ProjectReferenceLoader;

  /** The path to the current project. Required if project references are being used. */
  projectPath?: string;

  /**
   * If implemented, chat nodes will first call this to resolve their configured endpoint to a final endpoint.
   * You can use this for adding auth headers, or to load balance between multiple endpoints.
   */
  getChatNodeEndpoint?: (
    configuredEndpoint: string,
    configuredModel: string,
  ) => ChatNodeEndpointInfo | Promise<ChatNodeEndpointInfo>;
};

export type ChatNodeEndpointInfo = {
  endpoint: string;
  headers: Record<string, string>;
};

export type ProcessId = Opaque<string, 'ProcessId'>;

export type InternalProcessContext<T extends ChartNode = ChartNode> = ProcessContext & {
  /** The executor that is running the current processor. */
  executor: 'nodejs' | 'browser';

  /** The project being executed. */
  project: Project;

  /** All referenced (and deep referenced) projects from the current project. */
  referencedProjects: Record<ProjectId, Project>;

  /** A signal that can be used when abort() is called on the GraphProcessor to abort the node's execution. */
  signal: AbortSignal;

  /** A unique ID for this specific execution of the node. */
  processId: ProcessId;

  /** Context values that are accessible on graphs and all subgraphs. */
  contextValues: Record<string, DataValue>;

  /** Inputs that were passed to the curent graph. Used for GraphInputNode. */
  graphInputs: Record<string, DataValue>;

  /** Outputs from the graph. A GraphOutputNode will set these. */
  graphOutputs: Record<string, DataValue>;

  /** Stores the resolved output values of GraphInput nodes during execution, keyed by the node's data.id. */
  graphInputNodeValues: Record<string, DataValue>;

  /** The tokenizer to use to tokenize all strings.s */
  tokenizer: Tokenizer;

  /** The current node being executed. */
  node: T;

  /** For internal and advanced cases, gets the arbitrary data attached to the node during graph execution. */
  attachedData: AttachedNodeData;

  /** Raises a user event that can be listened for on the GraphProcessor. */
  raiseEvent: (eventName: string, data: DataValue | undefined) => void;

  waitEvent: (eventName: string) => Promise<DataValue | undefined>;

  /** External functions that have been defined on the GraphProcessor (or its parent). */
  externalFunctions: Record<string, ExternalFunction>;

  /** Global cache shared by all nodes, is present for the entire execution of a graph (and shared in subgraphs). */
  executionCache: Map<string, unknown>;

  /** Call when the node has partial data but has not finished execution yet. */
  onPartialOutputs?: (outputs: Outputs) => void;

  /** Creates a subprocessor, for executing subgraphs. */
  createSubProcessor: (
    subGraphId: GraphId | undefined,
    options?: { signal?: AbortSignal; project?: Project },
  ) => GraphProcessor;

  /** Like context, but variables that are set during the run of the graph and can be read during the graph. Shared among all graphs and subgraphs. */
  getGlobal: (id: string) => ScalarOrArrayDataValue | undefined;

  /** Like context, but variables that are set during the run of the graph and can be read during the graph. Shared among all graphs and subgraphs. */
  setGlobal: (id: string, value: ScalarOrArrayDataValue) => void;

  waitForGlobal: (id: string) => Promise<ScalarOrArrayDataValue>;

  /** Logs to GraphProcessor's trace event. */
  trace: (message: string) => void;

  /** Aborts the current graph, if there is an error, the graph is error aborted, and if undefined, then it is simply early-exited. */
  abortGraph: (error?: Error | string) => void;

  /** Gets a string plugin config value from the settings, falling back to a specified environment variable if set. */
  getPluginConfig(name: string): string | undefined;

  /** Requests that the user input some text in response to the specified prompt. */
  requestUserInput(inputs: string[], renderingType: 'text' | 'markdown'): Promise<StringArrayDataValue>;

  /** The object used for running arbitrary code with the Code Node. */
  codeRunner: CodeRunner;
};
