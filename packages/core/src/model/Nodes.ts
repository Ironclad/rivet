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
  | ArrayNode;

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

export type NodeType = Nodes['type'];

export const createNodeInstance = <T extends Nodes>(node: T): NodeImpl<ChartNode> => {
  return match(node as Nodes)
    .with({ type: 'userInput' }, (node) => new UserInputNodeImpl(node))
    .with({ type: 'text' }, (node) => new TextNodeImpl(node))
    .with({ type: 'chat' }, (node) => new ChatNodeImpl(node))
    .with({ type: 'prompt' }, (node) => new PromptNodeImpl(node))
    .with({ type: 'extractRegex' }, (node) => new ExtractRegexNodeImpl(node))
    .with({ type: 'code' }, (node) => new CodeNodeImpl(node))
    .with({ type: 'match' }, (node) => new MatchNodeImpl(node))
    .with({ type: 'if' }, (node) => new IfNodeImpl(node))
    .with({ type: 'readDirectory' }, (node) => new ReadDirectoryNodeImpl(node))
    .with({ type: 'readFile' }, (node) => new ReadFileNodeImpl(node))
    .with({ type: 'ifElse' }, (node) => new IfElseNodeImpl(node))
    .with({ type: 'chunk' }, (node) => new ChunkNodeImpl(node))
    .with({ type: 'graphInput' }, (node) => new GraphInputNodeImpl(node))
    .with({ type: 'graphOutput' }, (node) => new GraphOutputNodeImpl(node))
    .with({ type: 'subGraph' }, (node) => new SubGraphNodeImpl(node))
    .with({ type: 'array' }, (node) => new ArrayNodeImpl(node))
    .exhaustive();
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
    .exhaustive();
}

export const nodeDisplayName: Record<NodeType, string> = {
  userInput: 'User Input',
  text: 'Text',
  chat: 'Chat',
  prompt: 'Prompt',
  extractRegex: 'Extract With Regex',
  code: 'Code',
  match: 'Match',
  if: 'If',
  ifElse: 'If/Else',
  readDirectory: 'Read Directory',
  readFile: 'Read File',
  chunk: 'Chunk',
  graphInput: 'Graph Input',
  graphOutput: 'Graph Output',
  subGraph: 'Subgraph',
  array: 'Array',
};
