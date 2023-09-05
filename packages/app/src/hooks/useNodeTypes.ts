import { NodeOfType, BuiltInNodeType, Outputs, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { FC, useMemo } from 'react';
import { ChartNode } from '@ironclad/rivet-core';
import { chatNodeDescriptor } from '../components/nodes/ChatNode.js';
import { loopControllerNodeDescriptor } from '../components/nodes/LoopControllerNode.js';
import { matchNodeDescriptor } from '../components/nodes/MatchNode.js';
import { readDirectoryNodeDescriptor } from '../components/nodes/ReadDirectoryNode.js';
import { readFileNodeDescriptor } from '../components/nodes/ReadFileNode.js';
import { subgraphNodeDescriptor } from '../components/nodes/SubGraphNode.js';
import { userInputNodeDescriptor } from '../components/nodes/UserInputNode.js';
import { ObjectNodeDescriptor } from '../components/nodes/ObjectNode.js';
import { commentNodeDescriptor } from '../components/nodes/CommentNode';
import { imageNodeDescriptor } from '../components/nodes/ImageNode';
import { audioNodeDescriptor } from '../components/nodes/AudioNode';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { useRecoilValue } from 'recoil';
import { pluginRefreshCounterState } from '../state/plugins';

export type UnknownNodeComponentDescriptor = {
  Body?: FC<{ node: ChartNode }>;
  Output?: FC<{ node: ChartNode }>;
  Editor?: FC<{ node: ChartNode; onChange?: (node: ChartNode) => void }>;
  FullscreenOutput?: FC<{ node: ChartNode }>;
  OutputSimple?: FC<{ outputs: Outputs }>;
  FullscreenOutputSimple?: FC<{ outputs: Outputs; renderMarkdown: boolean }>;
  defaultRenderMarkdown?: boolean;
};

export type NodeComponentDescriptor<T extends BuiltInNodeType> = {
  Body?: FC<{ node: NodeOfType<T> }>;
  Output?: FC<{ node: NodeOfType<T> }>;
  Editor?: FC<{ node: NodeOfType<T>; onChange?: (node: NodeOfType<T>) => void }>;
  FullscreenOutput?: FC<{ node: NodeOfType<T> }>;
  OutputSimple?: FC<{ outputs: Outputs }>;
  FullscreenOutputSimple?: FC<{ outputs: Outputs; renderMarkdown: boolean }>;
  defaultRenderMarkdown?: boolean;
};

export type NodeComponentDescriptors = {
  [P in BuiltInNodeType]: NodeComponentDescriptor<P>;
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
  comment: commentNodeDescriptor,
  image: imageNodeDescriptor,
  audio: audioNodeDescriptor,
};

export function useNodeTypes(): NodeComponentDescriptors {
  const counter = useRecoilValue(pluginRefreshCounterState);

  return useMemo(() => {
    const allNodeTypes = globalRivetNodeRegistry.getNodeTypes();

    return Object.fromEntries(
      allNodeTypes.map((nodeType) => {
        const descriptor = overriddenDescriptors[nodeType] ?? {};
        return [nodeType, descriptor];
      }),
    ) as NodeComponentDescriptors;
  }, [counter]);
}

export function useUnknownNodeComponentDescriptorFor(node: ChartNode) {
  const descriptors = useNodeTypes();

  return (descriptors[node.type as BuiltInNodeType] ?? {}) as UnknownNodeComponentDescriptor;
}
