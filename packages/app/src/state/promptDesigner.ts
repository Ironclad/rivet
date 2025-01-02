import { atom } from 'jotai';
import { type ChatMessage, type ChatNodeConfigData, type NodeId, type ProcessId } from '@ironclad/rivet-core';

export type PromptDesignerMessagesState = {
  messages: ChatMessage[];
};

export const promptDesignerMessagesState = atom<PromptDesignerMessagesState>({
  messages: [],
});

export type PromptDesignerResponseState = {
  response?: string;
};

export const promptDesignerResponseState = atom<PromptDesignerResponseState>({});

export type PromptDesignerConfigurationState = {
  data: ChatNodeConfigData;
};

export const promptDesignerConfigurationState = atom<PromptDesignerConfigurationState>({
  data: {
    model: 'gpt-4',
    maxTokens: 1024,
    temperature: 0.2,
    useTopP: false,
  },
});

export const promptDesignerAttachedChatNodeState = atom<
  | {
      nodeId: NodeId;
      processId: ProcessId;
    }
  | undefined
>(undefined);

export type PromptDesignerState = {
  samples: number;
};

export const promptDesignerState = atom<PromptDesignerState>({
  samples: 10,
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

export const promptDesignerTestGroupResultsByNodeIdState = atom<PromptDesignerTestGroupResultsByNodeIdState>({});
