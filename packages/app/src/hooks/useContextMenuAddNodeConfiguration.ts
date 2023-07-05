import { NodeType } from '@ironclad/rivet-core';
import { ContextMenuItem } from './useContextMenuConfiguration';
import dedent from 'ts-dedent';

import textNodeImage from '../../public/node_images/text_node.png';
import chatNodeImage from '../../public/node_images/chat_node.png';

const textNode = {
  label: 'Text',
  data: 'text',
  id: 'add-node:text',
  infoBox: {
    title: 'Text Node',
    image: textNodeImage,
    description: dedent`
      Outputs a string of text. It can also interpolate values using <span style="color: var(--primary)">{{tags}}</span>.

      The inputs are dynamic based on the interpolation tags.
    `,
  },
} as const satisfies ContextMenuItem;
const chatNode = {
  label: 'Chat',
  data: 'chat',
  id: 'add-node:chat',
  infoBox: {
    title: 'Chat Node',
    image: chatNodeImage,
    description: dedent`
      Makes a call to an LLM chat model. Currently only supports GPT. The settings contains many options for tweaking the model's behavior.

      The \`System Prompt\` input specifies a system prompt as the first message to the model. This is useful for providing context to the model.

      The \`Prompt\` input takes one or more strings or chat-messages (from a Prompt node) to send to the model.
    `,
  },
} as const satisfies ContextMenuItem;

export const addContextMenuGroups = [
  {
    id: 'add-node-group:common',
    label: 'Common',
    items: [textNode, chatNode],
  },
  {
    id: 'add-node-group:text',
    label: 'Text',
    items: [
      textNode,
      { label: 'Prompt', data: 'prompt', id: 'add-node:prompt' },
      { label: 'Chunk', data: 'chunk', id: 'add-node:chunk' },
      { label: 'To YAML', data: 'toYaml', id: 'add-node:toYaml' },
      { label: 'To JSON', data: 'toJson', id: 'add-node:toJson' },
      { label: 'Join', data: 'join', id: 'add-node:join' },
    ],
  },
  {
    id: 'add-node-group:ai',
    label: 'AI',
    items: [
      chatNode,
      { label: 'Assemble Prompt', data: 'assemblePrompt', id: 'add-node:assemblePrompt' },
      { label: 'Trim Chat Messages', data: 'trimChatMessages', id: 'add-node:trimChatMessages' },
      { label: 'GPT Function', data: 'gptFunction', id: 'add-node:gptFunction' },
      { label: 'Get Embedding', data: 'getEmbedding', id: 'add-node:getEmbedding' },
    ],
  },
  {
    id: 'add-node-group:data',
    label: 'Data',
    items: [
      { label: 'Extract With Regex', data: 'extractRegex', id: 'add-node:extractRegex' },
      { label: 'Extract JSON', data: 'extractJson', id: 'add-node:extractJson' },
      { label: 'Extract YAML', data: 'extractYaml', id: 'add-node:extractYaml' },
      { label: 'Extract Object Path', data: 'extractObjectPath', id: 'add-node:extractObjectPath' },
      { label: 'Array', data: 'array', id: 'add-node:array' },
      { label: 'Pop', data: 'pop', id: 'add-node:pop' },
      { label: 'Hash', data: 'hash', id: 'add-node:hash' },
      { label: 'Filter', data: 'filter', id: 'add-node:filter' },
    ],
  },
  {
    id: 'add-node-group:logic',
    label: 'Logic',
    items: [
      { label: 'Match', data: 'match', id: 'add-node:match' },
      { label: 'If', data: 'if', id: 'add-node:if' },
      { label: 'If/Else', data: 'ifElse', id: 'add-node:ifElse' },
      { label: 'Loop Controller', data: 'loopController', id: 'add-node:loopController' },
      { label: 'Coalesce', data: 'coalesce', id: 'add-node:coalesce' },
      { label: 'Passthrough', data: 'passthrough', id: 'add-node:passthrough' },
      { label: 'Abort Graph', data: 'abortGraph', id: 'add-node:abortGraph' },
      { label: 'Race Inputs', data: 'raceInputs', id: 'add-node:raceInputs' },
    ],
  },
  {
    id: 'add-node-group:input-output',
    label: 'Input/Output',
    items: [
      { label: 'Graph Output', data: 'graphOutput', id: 'add-node:graphOutput' },
      { label: 'Graph Input', data: 'graphInput', id: 'add-node:graphInput' },
      { label: 'User Input', data: 'userInput', id: 'add-node:userInput' },
      { label: 'Read Directory', data: 'readDirectory', id: 'add-node:readDirectory' },
      { label: 'Read File', data: 'readFile', id: 'add-node:readFile' },
      { label: 'Vector Store', data: 'vectorStore', id: 'add-node:vectorStore' },
      { label: 'Vector KNN', data: 'vectorNearestNeighbors', id: 'add-node:vectorNearestNeighbors' },
    ],
  },
  {
    id: 'add-node-group:advanced',
    label: 'Advanced',
    items: [
      { label: 'Subgraph', data: 'subGraph', id: 'add-node:subGraph' },
      { label: 'External Call', data: 'externalCall', id: 'add-node:externalCall' },
      { label: 'Raise Event', data: 'raiseEvent', id: 'add-node:raiseEvent' },
      { label: 'Wait For Event', data: 'waitForEvent', id: 'add-node:waitForEvent' },
      { label: 'Code', data: 'code', id: 'add-node:code' },
      { label: 'Context', data: 'context', id: 'add-node:context' },
      { label: 'Get Global', data: 'getGlobal', id: 'add-node:getGlobal' },
      { label: 'Set Global', data: 'setGlobal', id: 'add-node:setGlobal' },
    ],
  },
] as const satisfies readonly ContextMenuItem[] & {
  items?: readonly ContextMenuItem<NodeType>[];
};

export function useContextMenuAddNodeConfiguration() {
  return addContextMenuGroups;
}
