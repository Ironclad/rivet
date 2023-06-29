import { NodeType } from '@ironclad/rivet-core';

export const addContextMenuGroups = [
  {
    label: 'Common',
    items: [
      { label: 'Text', nodeType: 'text' },
      { label: 'Chat', nodeType: 'chat' },
    ],
  },
  {
    label: 'Text',
    items: [
      { label: 'Text', nodeType: 'text' },
      { label: 'Prompt', nodeType: 'prompt' },
      { label: 'Chunk', nodeType: 'chunk' },
      { label: 'To YAML', nodeType: 'toYaml' },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'Chat', nodeType: 'chat' },
      { label: 'Assemble Prompt', nodeType: 'assemblePrompt' },
      { label: 'Trim Chat Messages', nodeType: 'trimChatMessages' },
      { label: 'GPT Function', nodeType: 'gptFunction' },
      { label: 'Get Embedding', nodeType: 'getEmbedding' },
    ],
  },
  {
    label: 'Data',
    items: [
      { label: 'Extract With Regex', nodeType: 'extractRegex' },
      { label: 'Extract JSON', nodeType: 'extractJson' },
      { label: 'Extract YAML', nodeType: 'extractYaml' },
      { label: 'Extract Object Path', nodeType: 'extractObjectPath' },
      { label: 'Array', nodeType: 'array' },
      { label: 'Pop', nodeType: 'pop' },
      { label: 'Hash', nodeType: 'hash' },
    ],
  },
  {
    label: 'Logic',
    items: [
      { label: 'Match', nodeType: 'match' },
      { label: 'If', nodeType: 'if' },
      { label: 'If/Else', nodeType: 'ifElse' },
      { label: 'Loop Controller', nodeType: 'loopController' },
      { label: 'Coalesce', nodeType: 'coalesce' },
      { label: 'Passthrough', nodeType: 'passthrough' },
      { label: 'Abort Graph', nodeType: 'abortGraph' },
      { label: 'Race Inputs', nodeType: 'raceInputs' },
    ],
  },
  {
    label: 'Input/Output',
    items: [
      { label: 'Graph Output', nodeType: 'graphOutput' },
      { label: 'Graph Input', nodeType: 'graphInput' },
      { label: 'User Input', nodeType: 'userInput' },
      { label: 'Read Directory', nodeType: 'readDirectory' },
      { label: 'Read File', nodeType: 'readFile' },
      { label: 'Vector Store', nodeType: 'vectorStore' },
      { label: 'Vector KNN', nodeType: 'vectorNearestNeighbors' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { label: 'Subgraph', nodeType: 'subGraph' },
      { label: 'External Call', nodeType: 'externalCall' },
      { label: 'Raise Event', nodeType: 'raiseEvent' },
      { label: 'Wait For Event', nodeType: 'waitForEvent' },
      { label: 'Code', nodeType: 'code' },
      { label: 'Context', nodeType: 'context' },
      { label: 'Get Global', nodeType: 'getGlobal' },
      { label: 'Set Global', nodeType: 'setGlobal' },
    ],
  },
] satisfies {
  label: string;
  items: {
    label: string;
    nodeType: NodeType;
  }[];
}[];

export function useAddContextMenuGroups() {
  return addContextMenuGroups;
}
