import type { ChartNode, PortId } from '../NodeBase.js';

export interface LLMRequestResponseNodeData {
  isLlmRequestResponse: true;
  llmResponseOutput?: PortId;
}

export function isLlmRequestResponseNodeData(subj: unknown): subj is LLMRequestResponseNodeData {
  return (subj as LLMRequestResponseNodeData).isLlmRequestResponse;
}

export function isLlmRequestResponseNode<Type extends string>(
    subj: ChartNode,
): subj is ChartNode<Type, LLMRequestResponseNodeData> {
    return isLlmRequestResponseNodeData(subj.data) || subj.type === 'chat';
}
