import { ChartNode } from './NodeBase';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';
import { NodeImpl } from './NodeImpl';
import { TextNode, TextNodeImpl } from './nodes/TextNode';
import { ChatNode, ChatNodeImpl } from './nodes/ChatNode';
import { PromptNode, PromptNodeImpl } from './nodes/PromptNode';
import { match } from 'ts-pattern';
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
  | PopNode;

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
};

export const createNodeInstance = <T extends Nodes>(node: T): NodeImpl<ChartNode> => {
  return new nodeImpls[node.type](node);
};

export function createUnknownNodeInstance(node: ChartNode): NodeImpl<ChartNode> {
  return createNodeInstance(node as Nodes);
}

export function nodeFactory(type: NodeType): Nodes {
  return match(type)
    .with('userInput', () => UserInputNodeImpl.create())
    .with('text', () => TextNodeImpl.create())
    .with('chat', () => ChatNodeImpl.create())
    .with('prompt', () => PromptNodeImpl.create())
    .with('extractRegex', () => ExtractRegexNodeImpl.create())
    .with('code', () => CodeNodeImpl.create())
    .with('match', () => MatchNodeImpl.create())
    .with('if', () => IfNodeImpl.create())
    .with('readDirectory', () => ReadDirectoryNodeImpl.create())
    .with('readFile', () => ReadFileNodeImpl.create())
    .with('ifElse', () => IfElseNodeImpl.create())
    .with('chunk', () => ChunkNodeImpl.create())
    .with('graphInput', () => GraphInputNodeImpl.create())
    .with('graphOutput', () => GraphOutputNodeImpl.create())
    .with('subGraph', () => SubGraphNodeImpl.create())
    .with('array', () => ArrayNodeImpl.create())
    .with('extractJson', () => ExtractJsonNodeImpl.create())
    .with('assemblePrompt', () => AssemblePromptNodeImpl.create())
    .with('loopController', () => LoopControllerNodeImpl.create())
    .with('trimChatMessages', () => TrimChatMessagesNodeImpl.create())
    .with('extractYaml', () => ExtractYamlNodeImpl.create())
    .with('externalCall', () => ExternalCallNodeImpl.create())
    .with('extractObjectPath', () => ExtractObjectPathNodeImpl.create())
    .with('raiseEvent', () => RaiseEventNodeImpl.create())
    .with('context', () => ContextNodeImpl.create())
    .with('coalesce', () => CoalesceNodeImpl.create())
    .with('passthrough', () => PassthroughNodeImpl.create())
    .with('pop', () => PopNodeImpl.create())
    .exhaustive();
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
};

export type NodeOfType<T extends NodeType> = Extract<Nodes, { type: T }>;
