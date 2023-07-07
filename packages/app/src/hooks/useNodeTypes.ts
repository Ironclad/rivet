import { NodeOfType, NodeType, Outputs } from '@ironclad/rivet-core';
import { FC } from 'react';
import { ChartNode } from '@ironclad/rivet-core';
import { assemblePromptNodeDescriptor } from '../components/nodes/AssemblePromptNode.js';
import { chatNodeDescriptor } from '../components/nodes/ChatNode.js';
import { chunkNodeDescriptor } from '../components/nodes/ChunkNode.js';
import { codeNodeDescriptor } from '../components/nodes/CodeNode.js';
import { externalCallNodeDescriptor } from '../components/nodes/ExternalCallNode.js';
import { extractJsonNodeDescriptor } from '../components/nodes/ExtractJsonNode.js';
import { extractObjectPathNodeDescriptor } from '../components/nodes/ExtractObjectPathNode.js';
import { extractRegexNodeDescriptor } from '../components/nodes/ExtractRegexNode.js';
import { extractYamlNodeDescriptor } from '../components/nodes/ExtractYamlNode.js';
import { graphInputNodeDescriptor } from '../components/nodes/GraphInputNode.js';
import { graphOutputNodeDescriptor } from '../components/nodes/GraphOutputNode.js';
import { ifNodeDescriptor } from '../components/nodes/IfNode.js';
import { ifElseNodeDescriptor } from '../components/nodes/IfElseNode.js';
import { loopControllerNodeDescriptor } from '../components/nodes/LoopControllerNode.js';
import { matchNodeDescriptor } from '../components/nodes/MatchNode.js';
import { promptNodeDescriptor } from '../components/nodes/PromptNode.js';
import { readDirectoryNodeDescriptor } from '../components/nodes/ReadDirectoryNode.js';
import { readFileNodeDescriptor } from '../components/nodes/ReadFileNode.js';
import { subgraphNodeDescriptor } from '../components/nodes/SubGraphNode.js';
import { textNodeDescriptor } from '../components/nodes/TextNode.js';
import { trimChatMessagesNodeDescriptor } from '../components/nodes/TrimChatMessagesNode.js';
import { arrayNodeDescriptor } from '../components/nodes/ArrayNode.js';
import { userInputNodeDescriptor } from '../components/nodes/UserInputNode.js';
import { RaiseEventNodeDescriptor } from '../components/nodes/RaiseEventNode.js';
import { contextNodeDescriptor } from '../components/nodes/ContextNode.js';
import { coalesceNodeDescriptor } from '../components/nodes/CoalesceNode.js';
import { passthroughNodeDescriptor } from '../components/nodes/PassthroughNode.js';
import { popNodeDescriptor } from '../components/nodes/PopNode.js';
import { getGlobalNodeDescriptor } from '../components/nodes/GetGlobalNode.js';
import { setGlobalNodeDescriptor } from '../components/nodes/SetGlobalNode.js';
import { waitForEventNodeDescriptor } from '../components/nodes/WaitForEventNode.js';
import { gptFunctionNodeDescriptor } from '../components/nodes/GptFunctionNode.js';
import { toYamlNodeDescriptor } from '../components/nodes/ToYamlNode.js';
import { ObjectNodeDescriptor } from '../components/nodes/ObjectNode.js';

export type UnknownNodeComponentDescriptor = {
  Body?: FC<{ node: ChartNode }>;
  Output?: FC<{ node: ChartNode }>;
  Editor?: FC<{ node: ChartNode; onChange?: (node: ChartNode) => void }>;
  FullscreenOutput?: FC<{ node: ChartNode }>;
  OutputSimple?: FC<{ outputs: Outputs }>;
  FullscreenOutputSimple?: FC<{ outputs: Outputs }>;
};

export type NodeComponentDescriptor<T extends NodeType> = {
  Body?: FC<{ node: NodeOfType<T> }>;
  Output?: FC<{ node: NodeOfType<T> }>;
  Editor?: FC<{ node: NodeOfType<T>; onChange?: (node: NodeOfType<T>) => void }>;
  FullscreenOutput?: FC<{ node: NodeOfType<T> }>;
  OutputSimple?: FC<{ outputs: Outputs }>;
  FullscreenOutputSimple?: FC<{ outputs: Outputs }>;
};

export type NodeComponentDescriptors = {
  [P in NodeType]: NodeComponentDescriptor<P>;
};

const descriptors: NodeComponentDescriptors = {
  array: arrayNodeDescriptor,
  assemblePrompt: assemblePromptNodeDescriptor,
  chat: chatNodeDescriptor,
  chunk: chunkNodeDescriptor,
  code: codeNodeDescriptor,
  externalCall: externalCallNodeDescriptor,
  extractJson: extractJsonNodeDescriptor,
  extractObjectPath: extractObjectPathNodeDescriptor,
  extractRegex: extractRegexNodeDescriptor,
  extractYaml: extractYamlNodeDescriptor,
  graphInput: graphInputNodeDescriptor,
  graphOutput: graphOutputNodeDescriptor,
  if: ifNodeDescriptor,
  ifElse: ifElseNodeDescriptor,
  loopController: loopControllerNodeDescriptor,
  match: matchNodeDescriptor,
  prompt: promptNodeDescriptor,
  readDirectory: readDirectoryNodeDescriptor,
  readFile: readFileNodeDescriptor,
  subGraph: subgraphNodeDescriptor,
  text: textNodeDescriptor,
  trimChatMessages: trimChatMessagesNodeDescriptor,
  userInput: userInputNodeDescriptor,
  raiseEvent: RaiseEventNodeDescriptor,
  context: contextNodeDescriptor,
  coalesce: coalesceNodeDescriptor,
  passthrough: passthroughNodeDescriptor,
  pop: popNodeDescriptor,
  getGlobal: getGlobalNodeDescriptor,
  setGlobal: setGlobalNodeDescriptor,
  waitForEvent: waitForEventNodeDescriptor,
  gptFunction: gptFunctionNodeDescriptor,
  toYaml: toYamlNodeDescriptor,
  getEmbedding: {},
  vectorNearestNeighbors: {},
  vectorStore: {},
  hash: {},
  abortGraph: {},
  raceInputs: {},
  toJson: {},
  join: {},
  filter: {},
  object: ObjectNodeDescriptor,
};

export function useNodeTypes() {
  return {
    descriptors,
  };
}

export function useUnknownNodeComponentDescriptorFor(node: ChartNode) {
  const { descriptors } = useNodeTypes();

  return (descriptors[node.type as NodeType] ?? {}) as UnknownNodeComponentDescriptor;
}
