import { NodeOfType, NodeType, Outputs, getNodeTypes } from '@ironclad/rivet-core';
import { FC } from 'react';
import { ChartNode } from '@ironclad/rivet-core';
import { chatNodeDescriptor } from '../components/nodes/ChatNode.js';
import { loopControllerNodeDescriptor } from '../components/nodes/LoopControllerNode.js';
import { matchNodeDescriptor } from '../components/nodes/MatchNode.js';
import { readDirectoryNodeDescriptor } from '../components/nodes/ReadDirectoryNode.js';
import { readFileNodeDescriptor } from '../components/nodes/ReadFileNode.js';
import { subgraphNodeDescriptor } from '../components/nodes/SubGraphNode.js';
import { userInputNodeDescriptor } from '../components/nodes/UserInputNode.js';
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

const overriddenDescriptors: Partial<NodeComponentDescriptors> = {
  chat: chatNodeDescriptor,
  loopController: loopControllerNodeDescriptor,
  match: matchNodeDescriptor,
  readDirectory: readDirectoryNodeDescriptor,
  readFile: readFileNodeDescriptor,
  subGraph: subgraphNodeDescriptor,
  userInput: userInputNodeDescriptor,
  object: ObjectNodeDescriptor,
};

export function useNodeTypes(): NodeComponentDescriptors {
  const allNodeTypes = getNodeTypes();

  return Object.fromEntries(
    allNodeTypes.map((nodeType) => {
      const descriptor = overriddenDescriptors[nodeType] ?? {};
      return [nodeType, descriptor];
    }),
  ) as NodeComponentDescriptors;
}

export function useUnknownNodeComponentDescriptorFor(node: ChartNode) {
  const descriptors = useNodeTypes();

  return (descriptors[node.type as NodeType] ?? {}) as UnknownNodeComponentDescriptor;
}
