import { NodeType } from '../../../core/src';

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
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'Chat', nodeType: 'chat' },
      { label: 'Assemble Prompt', nodeType: 'assemblePrompt' },
      { label: 'Trim Chat Messages', nodeType: 'trimChatMessages' },
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
    ],
  },
  {
    label: 'Logic',
    items: [
      { label: 'Match', nodeType: 'match' },
      { label: 'If', nodeType: 'if' },
      { label: 'If/Else', nodeType: 'ifElse' },
      { label: 'Loop Controller', nodeType: 'loopController' },
    ],
  },
  {
    label: 'Input/Output',
    items: [
      { label: 'Graph Output', nodeType: 'graphOutput' },
      { label: 'Graph Input', nodeType: 'graphInput' },
      { label: 'User Input', nodeType: 'userInput' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { label: 'Subgraph', nodeType: 'subGraph' },
      { label: 'External Call', nodeType: 'externalCall' },
      { label: 'Raise Event', nodeType: 'raiseEvent' },
      { label: 'Code', nodeType: 'code' },
      { label: 'Read Directory', nodeType: 'readDirectory' },
      { label: 'Read File', nodeType: 'readFile' },
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
