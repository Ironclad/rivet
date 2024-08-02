import { type FC } from 'react';
import { css } from '@emotion/react';
import { RenderDataValue } from '../RenderDataValue.js';
import {
  type ChatNode,
  type Outputs,
  type PortId,
  coerceTypeOptional,
  inferType,
  isArrayDataValue,
  type DataValue,
} from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import styled from '@emotion/styled';
import clsx from 'clsx';
import { useMarkdown } from '../../hooks/useMarkdown.js';
import { type InputsOrOutputsWithRefs, type DataValueWithRefs } from '../../state/dataFlow';

const bodyStyles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;

  &.multi-message {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

export const ChatNodeOutput: FC<{
  outputs: InputsOrOutputsWithRefs;
  fullscreen?: boolean;
  renderMarkdown?: boolean;
}> = ({ outputs, fullscreen, renderMarkdown }) => {
  if (
    isArrayDataValue(outputs['response' as PortId] as DataValue) ||
    isArrayDataValue(outputs['requestTokens' as PortId] as DataValue)
  ) {
    const outputTextAll = coerceTypeOptional(outputs['response' as PortId] as DataValue, 'string[]') ?? [];

    const requestTokensAll = coerceTypeOptional(outputs['requestTokens' as PortId] as DataValue, 'number[]') ?? [];
    const responseTokensAll = coerceTypeOptional(outputs['responseTokens' as PortId] as DataValue, 'number[]') ?? [];
    const costAll = coerceTypeOptional(outputs['cost' as PortId] as DataValue, 'number[]') ?? [];
    const durationAll = coerceTypeOptional(outputs['duration' as PortId] as DataValue, 'number[]') ?? [];

    const functionCallOutput =
      (outputs['function-call' as PortId] as DataValue) ?? (outputs['function-calls' as PortId] as DataValue);
    const functionCallAll =
      functionCallOutput?.type === 'object[]'
        ? functionCallOutput.value
        : coerceTypeOptional(functionCallOutput, 'string[]');

    return (
      <div className="multi-message" css={bodyStyles}>
        {outputTextAll.map((outputText, index) => {
          const requestTokens = requestTokensAll?.[index];
          const responseTokens = responseTokensAll?.[index];
          const cost = costAll?.[index];
          const duration = durationAll?.[index];
          const functionCall = functionCallAll?.[index];

          return (
            <ChatNodeOutputSingle
              key={index}
              outputText={outputText}
              requestTokens={requestTokens}
              responseTokens={responseTokens}
              cost={cost}
              duration={duration}
              functionCall={functionCall}
              fullscreen={fullscreen}
              renderMarkdown={renderMarkdown}
            />
          );
        })}
      </div>
    );
  } else {
    const outputText = coerceTypeOptional(outputs['response' as PortId] as DataValue, 'string');

    const requestTokens = coerceTypeOptional(outputs['requestTokens' as PortId] as DataValue, 'number');
    const responseTokens = coerceTypeOptional(outputs['responseTokens' as PortId] as DataValue, 'number');
    const cost = coerceTypeOptional(outputs['cost' as PortId] as DataValue, 'number');
    const duration = coerceTypeOptional(outputs['duration' as PortId] as DataValue, 'number');

    const functionCallOutput =
      (outputs['function-call' as PortId] as DataValue) ?? (outputs['function-calls' as PortId] as DataValue);

    return (
      <ChatNodeOutputSingle
        outputText={outputText}
        requestTokens={requestTokens}
        responseTokens={responseTokens}
        cost={cost}
        functionCall={functionCallOutput?.value as object}
        duration={duration}
        fullscreen={fullscreen}
        renderMarkdown={renderMarkdown}
      />
    );
  }
};

const ChatNodeOutputContainer = styled.div`
  position: relative;

  .function-call h4 {
    margin-top: 0;
    margin-bottom: 0;
    text-decoration: none;
    font-size: 12px;
    font-weight: normal;
    color: var(--primary-text);
  }

  .metaInfo {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    min-height: 40px;
    color: var(--grey-lighter);
  }

  &.fullscreen .metaInfo {
    padding: 10px;
    border-bottom: 1px solid var(--grey-darkish);
  }

  &.fullscreen .outputText {
    padding: 10px;
  }
`;

export const ChatNodeOutputSingle: FC<{
  outputText: string | undefined;
  functionCall: string | object | undefined;
  requestTokens: number | undefined;
  responseTokens: number | undefined;
  cost: number | undefined;
  duration: number | undefined;
  fullscreen?: boolean;
  renderMarkdown?: boolean;
}> = ({ outputText, functionCall, requestTokens, responseTokens, cost, duration, fullscreen, renderMarkdown }) => {
  const outputHtml = useMarkdown(outputText);

  return (
    <ChatNodeOutputContainer className={clsx({ fullscreen })}>
      <div className="metaInfo">
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
            {(duration ?? 0) > 0 && (
              <div>
                <em>Duration: {duration}ms</em>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={clsx('outputText', { markdown: renderMarkdown })}>
        {renderMarkdown ? (
          <div dangerouslySetInnerHTML={outputHtml} />
        ) : (
          <div className="pre-wrap">
            <RenderDataValue value={inferType(outputText) as DataValueWithRefs} />
          </div>
        )}
      </div>
      {functionCall && (
        <div className="function-call">
          <h4>{Array.isArray(functionCall) ? 'Function Calls' : 'Function Call'}:</h4>
          <div className="pre-wrap">
            <RenderDataValue value={inferType(functionCall) as DataValueWithRefs} />
          </div>
        </div>
      )}
    </ChatNodeOutputContainer>
  );
};

const ChatNodeFullscreenOutput: FC<{
  outputs: InputsOrOutputsWithRefs;
  renderMarkdown: boolean;
}> = ({ outputs, renderMarkdown }) => {
  return <ChatNodeOutput outputs={outputs} fullscreen renderMarkdown={renderMarkdown} />;
};

export const chatNodeDescriptor: NodeComponentDescriptor<'chat'> = {
  OutputSimple: ChatNodeOutput,
  FullscreenOutputSimple: ChatNodeFullscreenOutput,
  defaultRenderMarkdown: true,
};
