import { FC } from 'react';
import { css } from '@emotion/react';
import { RenderDataValue } from '../RenderDataValue';
import { ChatNode, Outputs, PortId, coerceTypeOptional, inferType, isArrayDataValue } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import styled from '@emotion/styled';

type ChatNodeBodyProps = {
  node: ChatNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.multi-message {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

export const ChatNodeBody: FC<ChatNodeBodyProps> = ({ node }) => {
  return (
    <div css={styles}>
      <div>{node.data.useMaxTokensInput ? 'Max Tokens: (Using Input)' : node.data.maxTokens} tokens</div>
      <div>{node.data.useModelInput ? 'Model: (Using Input)' : node.data.model}</div>
      <div>
        {node.data.useTopP ? 'Top P' : 'Temperature'}:{' '}
        {node.data.useTopP
          ? node.data.useTopPInput
            ? '(Using Input)'
            : node.data.top_p
          : node.data.useTemperatureInput
          ? '(Using Input)'
          : node.data.temperature}
      </div>
      {node.data.useStop && <div>Stop: {node.data.useStopInput ? '(Using Input)' : node.data.stop}</div>}
      {(node.data.frequencyPenalty ?? 0) !== 0 && (
        <div>
          Frequency Penalty: {node.data.useFrequencyPenaltyInput ? '(Using Input)' : node.data.frequencyPenalty}
        </div>
      )}
      {(node.data.presencePenalty ?? 0) !== 0 && (
        <div>Presence Penalty: {node.data.usePresencePenaltyInput ? '(Using Input)' : node.data.presencePenalty}</div>
      )}
    </div>
  );
};

export const ChatNodeOutput: FC<{ outputs: Outputs }> = ({ outputs }) => {
  if (isArrayDataValue(outputs['response' as PortId]) || isArrayDataValue(outputs['requestTokens' as PortId])) {
    const outputTextAll = coerceTypeOptional(outputs['response' as PortId], 'string[]') ?? [];

    const requestTokensAll = coerceTypeOptional(outputs['requestTokens' as PortId], 'number[]') ?? [];
    const responseTokensAll = coerceTypeOptional(outputs['responseTokens' as PortId], 'number[]') ?? [];
    const costAll = coerceTypeOptional(outputs['cost' as PortId], 'number[]') ?? [];

    const toolCallOutput = outputs['tool-call' as PortId];
    const toolCallAll =
      toolCallOutput?.type === 'object[]'
        ? toolCallOutput.value.map((v) => JSON.stringify(v))
        : coerceTypeOptional(toolCallOutput, 'string[]');

    return (
      <div className="multi-message" css={styles}>
        {outputTextAll.map((outputText, index) => {
          const requestTokens = requestTokensAll?.[index];
          const responseTokens = responseTokensAll?.[index];
          const cost = costAll?.[index];
          const toolCall = toolCallAll?.[index];

          return (
            <ChatNodeOutputSingle
              key={index}
              outputText={outputText}
              requestTokens={requestTokens}
              responseTokens={responseTokens}
              cost={cost}
              toolCall={toolCall}
            />
          );
        })}
      </div>
    );
  } else {
    const outputText = coerceTypeOptional(outputs['response' as PortId], 'string');

    const requestTokens = coerceTypeOptional(outputs['requestTokens' as PortId], 'number');
    const responseTokens = coerceTypeOptional(outputs['responseTokens' as PortId], 'number');
    const cost = coerceTypeOptional(outputs['cost' as PortId], 'number');

    const toolCallOutput = outputs['tool-call' as PortId];
    const toolCall =
      toolCallOutput?.type === 'object'
        ? JSON.stringify(toolCallOutput.value)
        : coerceTypeOptional(toolCallOutput, 'string');

    return (
      <ChatNodeOutputSingle
        outputText={outputText}
        requestTokens={requestTokens}
        responseTokens={responseTokens}
        cost={cost}
        toolCall={toolCall}
      />
    );
  }
};

const ChatNodeOutputContainer = styled.div`
  .tool-call h4 {
    margin-top: 0;
    margin-bottom: 0;
    text-decoration: none;
    font-size: 12px;
    font-weight: normal;
    color: var(--primary);
  }
`;

export const ChatNodeOutputSingle: FC<{
  outputText: string | undefined;
  toolCall: string | undefined;
  requestTokens: number | undefined;
  responseTokens: number | undefined;
  cost: number | undefined;
}> = ({ outputText, toolCall, requestTokens, responseTokens, cost }) => {
  return (
    <ChatNodeOutputContainer>
      {(responseTokens != null || requestTokens != null || cost != null) && (
        <div style={{ marginBottom: 8 }}>
          {(requestTokens ?? 0) > 0 && (
            <div>
              <em>Request Tokens: {requestTokens}</em>
            </div>
          )}
          {(responseTokens ?? 0) > 0 && (
            <div>
              <em>Response Tokens: {responseTokens}</em>
            </div>
          )}
          {(cost ?? 0) > 0 && (
            <div>
              <em>${cost!.toFixed(3)}</em>
            </div>
          )}
        </div>
      )}
      <div className="pre-wrap">
        <RenderDataValue value={inferType(outputText)} />
      </div>

      {toolCall && (
        <div className="tool-call">
          <h4>Tool Call:</h4>
          <div className="pre-wrap">
            <RenderDataValue value={inferType(toolCall)} />
          </div>
        </div>
      )}
    </ChatNodeOutputContainer>
  );
};

export const chatNodeDescriptor: NodeComponentDescriptor<'chat'> = {
  Body: ChatNodeBody,
  OutputSimple: ChatNodeOutput,
};
