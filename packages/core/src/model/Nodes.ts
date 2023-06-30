import { ChartNode } from './NodeBase';
import { NodeRegistration } from './NodeRegistration';
import { NodeImpl } from './NodeImpl';

import { userInputNode } from './nodes/UserInputNode';
export * from './nodes/UserInputNode';

import { textNode } from './nodes/TextNode';
export * from './nodes/TextNode';

import { chatNode } from './nodes/ChatNode';
export * from './nodes/ChatNode';

import { promptNode } from './nodes/PromptNode';
export * from './nodes/PromptNode';

import { extractRegexNode } from './nodes/ExtractRegexNode';
export * from './nodes/ExtractRegexNode';

import { codeNode } from './nodes/CodeNode';
export * from './nodes/CodeNode';

import { matchNode } from './nodes/MatchNode';
export * from './nodes/MatchNode';

import { ifNode } from './nodes/IfNode';
export * from './nodes/IfNode';

import { readDirectoryNode } from './nodes/ReadDirectoryNode';
export * from './nodes/ReadDirectoryNode';

import { readFileNode } from './nodes/ReadFileNode';
export * from './nodes/ReadFileNode';

import { ifElseNode } from './nodes/IfElseNode';
export * from './nodes/IfElseNode';

import { chunkNode } from './nodes/ChunkNode';
export * from './nodes/ChunkNode';

import { graphInputNode } from './nodes/GraphInputNode';
export * from './nodes/GraphInputNode';

import { graphOutputNode } from './nodes/GraphOutputNode';
export * from './nodes/GraphOutputNode';

import { subGraphNode } from './nodes/SubGraphNode';
export * from './nodes/SubGraphNode';

import { arrayNode } from './nodes/ArrayNode';
export * from './nodes/ArrayNode';

import { extractJsonNode } from './nodes/ExtractJsonNode';
export * from './nodes/ExtractJsonNode';

import { assemblePromptNode } from './nodes/AssemblePromptNode';
export * from './nodes/ExtractYamlNode';

import { loopControllerNode } from './nodes/LoopControllerNode';
export * from './nodes/AssemblePromptNode';

import { trimChatMessagesNode } from './nodes/TrimChatMessagesNode';
export * from './nodes/LoopControllerNode';

import { extractYamlNode } from './nodes/ExtractYamlNode';
export * from './nodes/TrimChatMessagesNode';

import { externalCallNode } from './nodes/ExternalCallNode';
export * from './nodes/ExternalCallNode';

import { extractObjectPathNode } from './nodes/ExtractObjectPathNode';
export * from './nodes/ExtractObjectPathNode';

import { raiseEventNode } from './nodes/RaiseEventNode';
export * from './nodes/RaiseEventNode';

import { contextNode } from './nodes/ContextNode';
export * from './nodes/ContextNode';

import { coalesceNode } from './nodes/CoalesceNode';
export * from './nodes/CoalesceNode';

import { passthroughNode } from './nodes/PassthroughNode';
export * from './nodes/PassthroughNode';

import { popNode } from './nodes/PopNode';
export * from './nodes/PopNode';

import { setGlobalNode } from './nodes/SetGlobalNode';
export * from './nodes/SetGlobalNode';

import { getGlobalNode } from './nodes/GetGlobalNode';
export * from './nodes/GetGlobalNode';

import { waitForEventNode } from './nodes/WaitForEventNode';
export * from './nodes/WaitForEventNode';

import { gptFunctionNode } from './nodes/GptFunctionNode';
export * from './nodes/GptFunctionNode';

import { toYamlNode } from './nodes/ToYamlNode';
export * from './nodes/ToYamlNode';

import { getEmbeddingNode } from './nodes/GetEmbeddingNode';
export * from './nodes/GetEmbeddingNode';

import { vectorStoreNode } from './nodes/VectorStoreNode';
export * from './nodes/VectorStoreNode';

import { vectorNearestNeighborsNode } from './nodes/VectorNearestNeighborsNode';
export * from './nodes/VectorNearestNeighborsNode';

import { hashNode } from './nodes/HashNode';
export * from './nodes/HashNode';

import { abortGraphNode } from './nodes/AbortGraphNode';
export * from './nodes/AbortGraphNode';

import { raceInputsNode } from './nodes/RaceInputsNode';
export * from './nodes/RaceInputsNode';

import { toJsonNode } from './nodes/ToJsonNode';
export * from './nodes/ToJsonNode';

import { joinNode } from './nodes/JoinNode';
export * from './nodes/JoinNode';

const register = new NodeRegistration()
  .register(toYamlNode)
  .register(userInputNode)
  .register(textNode)
  .register(chatNode)
  .register(promptNode)
  .register(extractRegexNode)
  .register(codeNode)
  .register(matchNode)
  .register(ifNode)
  .register(readDirectoryNode)
  .register(readFileNode)
  .register(ifElseNode)
  .register(chunkNode)
  .register(graphInputNode)
  .register(graphOutputNode)
  .register(subGraphNode)
  .register(arrayNode)
  .register(extractJsonNode)
  .register(assemblePromptNode)
  .register(loopControllerNode)
  .register(trimChatMessagesNode)
  .register(extractYamlNode)
  .register(externalCallNode)
  .register(extractObjectPathNode)
  .register(raiseEventNode)
  .register(contextNode)
  .register(coalesceNode)
  .register(passthroughNode)
  .register(popNode)
  .register(setGlobalNode)
  .register(getGlobalNode)
  .register(waitForEventNode)
  .register(gptFunctionNode)
  .register(getEmbeddingNode)
  .register(vectorStoreNode)
  .register(vectorNearestNeighborsNode)
  .register(hashNode)
  .register(abortGraphNode)
  .register(raceInputsNode)
  .register(toJsonNode)
  .register(joinNode);

export type Nodes = typeof register.NodesType;

export type NodeType = typeof register.NodeTypesType;

export const createNodeInstance = <T extends Nodes>(node: T): NodeImpl<T> => {
  return register.createImpl(node);
};

export function createUnknownNodeInstance(node: ChartNode): NodeImpl<ChartNode> {
  return createNodeInstance(node as Nodes) as NodeImpl<ChartNode>;
}

export function nodeFactory<T extends NodeType>(type: T): Extract<Nodes, { type: T }> {
  return register.create(type);
}

export type NodeOfType<T extends NodeType> = Extract<Nodes, { type: T }>;

export function getNodeDisplayName<T extends NodeType>(type: T): string {
  return register.getDisplayName(type);
}

export function isRegisteredNodeType(type: NodeType): boolean {
  return register.isRegistered(type);
}
