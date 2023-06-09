import { atom } from 'recoil';
import { ChatMessage, ChatNodeConfigData, ChatNodeData, NodeId, ProcessId } from '../../../core/src';

export type PromptDesignerMessagesState = {
  messages: ChatMessage[];
};

export const promptDesignerMessagesState = atom<PromptDesignerMessagesState>({
  key: 'promptDesignerMessagesState',
  default: {
    messages: [],
  },
});

export type PromptDesignerResponseState = {
  response?: string;
};

export const promptDesignerResponseState = atom<PromptDesignerResponseState>({
  key: 'promptDesignerResponseState',
  default: {},
});

export type PromptDesignerConfigurationState = {
  data: ChatNodeConfigData;
};

export const promptDesignerConfigurationState = atom<PromptDesignerConfigurationState>({
  key: 'promptDesignerConfigurationState',
  default: {
    data: {
      model: 'gpt-4',
      maxTokens: 1024,
      temperature: 0.2,
      useTopP: false,
    },
  },
});

export const promptDesignerAttachedChatNodeState = atom<
  | {
      nodeId: NodeId;
      processId: ProcessId;
    }
  | undefined
>({
  key: 'promptDesignerAttachedChatNodeState',
  default: undefined,
});

export type PromptDesignerState = {
  isOpen: boolean;
  samples: number;
};

export const promptDesignerState = atom<PromptDesignerState>({
  key: 'promptDesignerState',
  default: {
    isOpen: false,
    samples: 10,
  },
});

export type PromptDesignerTestGroupResults = {
  response: string;
  groupId: string;
  results: {
    conditionText: string;
    pass: boolean;
  }[];
};

export type PromptDesignerTestGroupResultsByNodeIdState = {
  [nodeId: string]: PromptDesignerTestGroupResults[];
};

export const promptDesignerTestGroupResultsByNodeIdState = atom<PromptDesignerTestGroupResultsByNodeIdState>({
  key: 'promptDesignerTestGroupResultsByNodeIdState',
  default: {},
});
