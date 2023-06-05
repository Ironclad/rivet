import { ChartNode } from './NodeBase';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';
import { NodeImpl } from './NodeImpl';
import { TextNode, TextNodeImpl } from './nodes/TextNode';
import { ChatNode, ChatNodeImpl } from './nodes/ChatNode';
import { PromptNode, PromptNodeImpl } from './nodes/PromptNode';
import { ExtractRegexNode, ExtractRegexNodeImpl } from './nodes/ExtractRegexNode';
import { CodeNode, CodeNodeImpl } from './nodes/CodeNode';
import { MatchNode, MatchNodeImpl } from './nodes/MatchNode';
import { IfNode, IfNodeImpl } from './nodes/IfNode';
import { ReadDirectoryNode, ReadDirectoryNodeImpl } from './nodes/ReadDirectoryNode';
import { ReadFileNode, ReadFileNodeImpl } from './nodes/ReadFileNode';
import { IfElseNode, IfElseNodeImpl } from './nodes/IfElseNode';
import { ChunkNode, ChunkNodeImpl } from './nodes/ChunkNode';
import { GraphInputNode, GraphInputNodeImpl } from './nodes/GraphInputNode';
import { GraphOutputNode, GraphOutputNodeImpl } from './nodes/GraphOutputNode';
import { SubGraphNode, SubGraphNodeImpl } from './nodes/SubGraphNode';
import { ArrayNode, ArrayNodeImpl } from './nodes/ArrayNode';
import { ExtractJsonNode, ExtractJsonNodeImpl } from './nodes/ExtractJsonNode';
import { AssemblePromptNode, AssemblePromptNodeImpl } from './nodes/AssemblePromptNode';
import { LoopControllerNode, LoopControllerNodeImpl } from './nodes/LoopControllerNode';
import { TrimChatMessagesNode, TrimChatMessagesNodeImpl } from './nodes/TrimChatMessagesNode';
import { ExtractYamlNode, ExtractYamlNodeImpl } from './nodes/ExtractYamlNode';
import { ExternalCallNode, ExternalCallNodeImpl } from './nodes/ExternalCallNode';
import { ExtractObjectPathNode, ExtractObjectPathNodeImpl } from './nodes/ExtractObjectPathNode';
import { RaiseEventNode, RaiseEventNodeImpl } from './nodes/RaiseEventNode';
import { ContextNode, ContextNodeImpl } from './nodes/ContextNode';
import { CoalesceNode, CoalesceNodeImpl } from './nodes/CoalesceNode';
import { PassthroughNode, PassthroughNodeImpl } from './nodes/PassthroughNode';
import { PopNode, PopNodeImpl } from './nodes/PopNode';
import { SetGlobalNode, SetGlobalNodeImpl } from './nodes/SetGlobalNode';
import { GetGlobalNode, GetGlobalNodeImpl } from './nodes/GetGlobalNode';
import { WaitForEventNode, WaitForEventNodeImpl } from './nodes/WaitForEventNode';

export type Nodes =
  | UserInputNode
  | TextNode
  | ChatNode
  | PromptNode
  | ExtractRegexNode
  | CodeNode
  | MatchNode
  | IfNode
  | ReadDirectoryNode
  | ReadFileNode
  | IfElseNode
  | ChunkNode
  | GraphInputNode
  | GraphOutputNode
  | SubGraphNode
  | ArrayNode
  | ExtractJsonNode
  | ExtractYamlNode
  | ExtractObjectPathNode
  | AssemblePromptNode
  | LoopControllerNode
  | TrimChatMessagesNode
  | ExternalCallNode
  | RaiseEventNode
  | ContextNode
  | CoalesceNode
  | PassthroughNode
  | PopNode
  | SetGlobalNode
  | GetGlobalNode
  | WaitForEventNode;

export * from './nodes/UserInputNode';
export * from './nodes/TextNode';
export * from './nodes/ChatNode';
export * from './nodes/PromptNode';
export * from './nodes/ExtractRegexNode';
export * from './nodes/CodeNode';
export * from './nodes/MatchNode';
export * from './nodes/IfNode';
export * from './nodes/ReadDirectoryNode';
export * from './nodes/ReadFileNode';
export * from './nodes/IfElseNode';
export * from './nodes/ChunkNode';
export * from './nodes/GraphInputNode';
export * from './nodes/GraphOutputNode';
export * from './nodes/SubGraphNode';
export * from './nodes/ArrayNode';
export * from './nodes/ExtractJsonNode';
export * from './nodes/ExtractYamlNode';
export * from './nodes/AssemblePromptNode';
export * from './nodes/LoopControllerNode';
export * from './nodes/TrimChatMessagesNode';
export * from './nodes/ExternalCallNode';
export * from './nodes/ExtractObjectPathNode';
export * from './nodes/RaiseEventNode';
export * from './nodes/ContextNode';
export * from './nodes/CoalesceNode';
export * from './nodes/PassthroughNode';
export * from './nodes/PopNode';
export * from './nodes/SetGlobalNode';
export * from './nodes/GetGlobalNode';
export * from './nodes/WaitForEventNode';

export type NodeType = Nodes['type'];

const nodeImpls: Record<NodeType, { new (node: any): NodeImpl<ChartNode> }> = {
  userInput: UserInputNodeImpl,
  text: TextNodeImpl,
  chat: ChatNodeImpl,
  prompt: PromptNodeImpl,
  extractRegex: ExtractRegexNodeImpl,
  code: CodeNodeImpl,
  match: MatchNodeImpl,
  if: IfNodeImpl,
  readDirectory: ReadDirectoryNodeImpl,
  readFile: ReadFileNodeImpl,
  ifElse: IfElseNodeImpl,
  chunk: ChunkNodeImpl,
  graphInput: GraphInputNodeImpl,
  graphOutput: GraphOutputNodeImpl,
  subGraph: SubGraphNodeImpl,
  array: ArrayNodeImpl,
  extractJson: ExtractJsonNodeImpl,
  extractYaml: ExtractYamlNodeImpl,
  extractObjectPath: ExtractObjectPathNodeImpl,
  assemblePrompt: AssemblePromptNodeImpl,
  loopController: LoopControllerNodeImpl,
  trimChatMessages: TrimChatMessagesNodeImpl,
  externalCall: ExternalCallNodeImpl,
  raiseEvent: RaiseEventNodeImpl,
  context: ContextNodeImpl,
  coalesce: CoalesceNodeImpl,
  passthrough: PassthroughNodeImpl,
  pop: PopNodeImpl,
  setGlobal: SetGlobalNodeImpl,
  getGlobal: GetGlobalNodeImpl,
  waitForEvent: WaitForEventNodeImpl,
};

export const createNodeInstance = <T extends Nodes>(node: T): NodeImpl<ChartNode> => {
  return new nodeImpls[node.type](node);
};

export function createUnknownNodeInstance(node: ChartNode): NodeImpl<ChartNode> {
  return createNodeInstance(node as Nodes);
}

const nodeFactories: Record<NodeType, () => Nodes> = {
  userInput: () => UserInputNodeImpl.create(),
  text: () => TextNodeImpl.create(),
  chat: () => ChatNodeImpl.create(),
  prompt: () => PromptNodeImpl.create(),
  extractRegex: () => ExtractRegexNodeImpl.create(),
  code: () => CodeNodeImpl.create(),
  match: () => MatchNodeImpl.create(),
  if: () => IfNodeImpl.create(),
  readDirectory: () => ReadDirectoryNodeImpl.create(),
  readFile: () => ReadFileNodeImpl.create(),
  ifElse: () => IfElseNodeImpl.create(),
  chunk: () => ChunkNodeImpl.create(),
  graphInput: () => GraphInputNodeImpl.create(),
  graphOutput: () => GraphOutputNodeImpl.create(),
  subGraph: () => SubGraphNodeImpl.create(),
  array: () => ArrayNodeImpl.create(),
  extractJson: () => ExtractJsonNodeImpl.create(),
  extractYaml: () => ExtractYamlNodeImpl.create(),
  extractObjectPath: () => ExtractObjectPathNodeImpl.create(),
  assemblePrompt: () => AssemblePromptNodeImpl.create(),
  loopController: () => LoopControllerNodeImpl.create(),
  trimChatMessages: () => TrimChatMessagesNodeImpl.create(),
  externalCall: () => ExternalCallNodeImpl.create(),
  raiseEvent: () => RaiseEventNodeImpl.create(),
  context: () => ContextNodeImpl.create(),
  coalesce: () => CoalesceNodeImpl.create(),
  passthrough: () => PassthroughNodeImpl.create(),
  pop: () => PopNodeImpl.create(),
  setGlobal: () => SetGlobalNodeImpl.create(),
  getGlobal: () => GetGlobalNodeImpl.create(),
  waitForEvent: () => WaitForEventNodeImpl.create(),
};

export function nodeFactory(type: NodeType): Nodes {
  return nodeFactories[type]();
}

export const nodeDisplayName: Record<NodeType, string> = {
  userInput: 'User Input',
  text: 'Text',
  chat: 'Chat',
  prompt: 'Prompt',
  assemblePrompt: 'Assemble Prompt',
  extractRegex: 'Extract With Regex',
  extractJson: 'Extract JSON',
  code: 'Code',
  match: 'Match',
  if: 'If',
  ifElse: 'If/Else',
  loopController: 'Loop Controller',
  readDirectory: 'Read Directory',
  readFile: 'Read File',
  chunk: 'Chunk',
  graphInput: 'Graph Input',
  graphOutput: 'Graph Output',
  subGraph: 'Subgraph',
  array: 'Array',
  trimChatMessages: 'Trim Chat Messages',
  extractYaml: 'Extract YAML',
  externalCall: 'External Call',
  extractObjectPath: 'Extract Object Path',
  raiseEvent: 'Raise Event',
  context: 'Context',
  coalesce: 'Coalesce',
  passthrough: 'Passthrough',
  pop: 'Pop',
  setGlobal: 'Set Global',
  getGlobal: 'Get Global',
  waitForEvent: 'Wait For Event',
};

export type NodeOfType<T extends NodeType> = Extract<Nodes, { type: T }>;
