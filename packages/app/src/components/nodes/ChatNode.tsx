import { FC, useLayoutEffect, useRef } from 'react';
import { css } from '@emotion/react';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { RenderDataValue } from '../RenderDataValue';
import Toggle from '@atlaskit/toggle';
import * as monaco from 'monaco-editor';
import { ChartNode, ChatNode, ChatNodeData, PortId, expectType, expectTypeOptional } from '@ironclad/nodai-core';
import { values } from '../../utils/typeSafety';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

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
      <div>{node.data.maxTokens} tokens</div>
      <div>{node.data.model}</div>
      <div>
        {node.data.useTopP ? 'Top P' : 'Temperature'}: {node.data.useTopP ? node.data.top_p : node.data.temperature}
      </div>
      {node.data.useStop && <div>Stop: {node.data.stop}</div>}
      {(node.data.frequencyPenalty ?? 0) !== 0 && <div>Frequency Penalty: {node.data.frequencyPenalty}</div>}
      {(node.data.presencePenalty ?? 0) !== 0 && <div>Presence Penalty: {node.data.presencePenalty}</div>}
    </div>
  );
};

export const ChatNodeOutput: FC<ChatNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (output.splitOutputData && !output.outputData) {
    return (
      <div className="multi-message" css={styles}>
        {values(output.splitOutputData).map((outputs, index) => {
          const outputPart = expectType(outputs['response' as PortId], 'string');
          return (
            <div className="pre-wrap" key={index}>
              {outputPart}
            </div>
          );
        })}
      </div>
    );
  }

  if (!output.outputData) {
    return null;
  }

  const outputText = output.outputData['response' as PortId];

  if (outputText?.type === 'string[]') {
    const requestTokensArray = expectTypeOptional(output.outputData!['requestTokens' as PortId], 'number[]');
    const responseTokensArray = expectTypeOptional(output.outputData!['responseTokens' as PortId], 'number[]');
    const costArray = expectTypeOptional(output.outputData!['cost' as PortId], 'number[]');

    const totalRequestTokens = requestTokensArray?.reduce((a, b) => a + b, 0) ?? 0;
    const totalResponseTokens = responseTokensArray?.reduce((a, b) => a + b, 0) ?? 0;
    const totalCost = costArray?.reduce((a, b) => a + b, 0) ?? 0;

    return (
      <div>
        {(totalResponseTokens > 0 || totalRequestTokens > 0 || totalCost > 0) && (
          <div style={{ marginBottom: 8 }}>
            {totalRequestTokens > 0 && (
              <div>
                <em>Request Tokens: {totalRequestTokens}</em>
              </div>
            )}
            {totalResponseTokens > 0 && (
              <div>
                <em>Response Tokens: {totalResponseTokens}</em>
              </div>
            )}
            {totalCost > 0 && (
              <div>
                <em>${totalCost.toFixed(3)}</em>
              </div>
            )}
          </div>
        )}
        <div className="multi-message" css={styles}>
          {outputText.value.map((text, index) => {
            return (
              <div className="pre-wrap" key={index}>
                {text}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const requestTokens = expectTypeOptional(output.outputData['requestTokens' as PortId], 'number');
  const responseTokens = expectTypeOptional(output.outputData['responseTokens' as PortId], 'number');
  const cost = expectTypeOptional(output.outputData['cost' as PortId], 'number');

  return (
    <div>
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
        <RenderDataValue value={outputText} />
      </div>
    </div>
  );
};

export const FullscreenChatNodeOutput: FC<ChatNodeBodyProps> = ({ node }) => {
  const outputRef = useRef<HTMLPreElement>(null);
  const output = useRecoilValue(lastRunData(node.id));

  useLayoutEffect(() => {
    if (outputRef.current) {
      monaco.editor.colorizeElement(outputRef.current!, {
        theme: 'vs-dark',
      });
    }
  }, [output]);

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (output.splitOutputData) {
    return (
      <div className="multi-message" css={styles}>
        {Object.values(output.splitOutputData).map((outputs, index) => {
          const outputPart = expectType(outputs['response' as PortId], 'string');
          return (
            <div className="pre-wrap" key={index}>
              {outputPart}
            </div>
          );
        })}
      </div>
    );
  }

  if (!output.outputData) {
    return null;
  }

  const outputText = output.outputData['response' as PortId];

  if (outputText?.type === 'string[]') {
    return (
      <div className="multi-message" css={styles}>
        {outputText.value.map((text, index) => (
          <div className="pre-wrap" key={index}>
            {text}
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre ref={outputRef} className="pre-wrap" data-language="markdown">
      <RenderDataValue value={outputText} />
    </pre>
  );
};

export type ChatNodeEditorProps = {
  node: ChatNode;
  onChange?: (node: ChatNode) => void;
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: grid;
  grid-template-columns: auto 1fr auto;
  row-gap: 16px;
  column-gap: 32px;
  align-items: center;
  grid-auto-rows: 40px;

  .row {
    display: contents;
  }

  .label {
    font-weight: 500;
    color: var(--foreground);
  }

  .select,
  .number-input {
    padding: 6px 12px;
    background-color: var(--grey-darkish);
    border: 1px solid var(--grey);
    border-radius: 4px;
    color: var(--foreground);
    outline: none;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--primary);
    }

    &:disabled {
      background-color: var(--grey-dark);
      border-color: var(--grey);
      color: var(--foreground-dark);
    }
  }

  .select {
    justify-self: start;
    width: 150px;
  }

  .number-input {
    justify-self: start;
    min-width: 0;
    width: 100px;
  }

  .checkbox-input {
    margin-left: 8px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

export const ChatNodeEditor: FC<ChatNodeEditorProps> = ({ node, onChange }) => {
  const chatNode = node as ChatNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="model">
          Model
        </label>
        <select
          id="model"
          className="select"
          value={chatNode.data.model}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, model: e.target.value } })}
        >
          {/* Add your model options here */}
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-32k">GPT-4 32K</option>
        </select>
        <Toggle
          id="useModelInput"
          isChecked={chatNode.data.useModelInput}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useModelInput: e.target.checked } })}
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="temperature">
          Temperature
        </label>
        <input
          id="temperature"
          className="number-input"
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={chatNode.data.temperature}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, temperature: e.target.valueAsNumber } })}
          disabled={chatNode.data.useTemperatureInput || chatNode.data.useTopP}
        />
        <Toggle
          id="useTemperatureInput"
          isChecked={chatNode.data.useTemperatureInput}
          onChange={(e) =>
            onChange?.({ ...chatNode, data: { ...chatNode.data, useTemperatureInput: e.target.checked } })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="top_p">
          Top P
        </label>
        <input
          id="top_p"
          className="number-input"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={chatNode.data.top_p}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, top_p: e.target.valueAsNumber } })}
          disabled={chatNode.data.useTopPInput || !chatNode.data.useTopP}
        />
        <Toggle
          id="useTopPInput"
          isChecked={chatNode.data.useTopPInput}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useTopPInput: e.target.checked } })}
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="useTopP">
          Use Top P
        </label>
        <Toggle
          id="useTopP"
          isChecked={chatNode.data.useTopP}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useTopP: e.target.checked } })}
        />
        <div />
      </div>
      <div className="row">
        <label className="label" htmlFor="maxTokens">
          Max Tokens
        </label>
        <input
          id="maxTokens"
          className="number-input"
          type="number"
          step="1"
          min="0"
          max="32768"
          value={chatNode.data.maxTokens}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, maxTokens: e.target.valueAsNumber } })}
          disabled={chatNode.data.useMaxTokensInput}
        />
        <Toggle
          id="useMaxTokensInput"
          isChecked={chatNode.data.useMaxTokensInput}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useMaxTokensInput: e.target.checked } })}
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="useStop">
          Use Stop
        </label>
        <Toggle
          id="useStop"
          isChecked={chatNode.data.useStop}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useStop: e.target.checked } })}
        />
        <div />
      </div>
      <div className="row">
        <label className="label" htmlFor="stop">
          Stop
        </label>
        <input
          id="stop"
          className="number-input"
          type="text"
          value={chatNode.data.stop}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, stop: e.target.value } })}
          disabled={chatNode.data.useStopInput}
        />
        <Toggle
          id="useStopInput"
          isChecked={chatNode.data.useStopInput}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useStopInput: e.target.checked } })}
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="presencePenalty">
          Presence Penalty
        </label>
        <input
          id="presencePenalty"
          className="number-input"
          type="number"
          step="0.1"
          min="-2"
          max="2"
          value={chatNode.data.presencePenalty}
          onChange={(e) =>
            onChange?.({ ...chatNode, data: { ...chatNode.data, presencePenalty: e.target.valueAsNumber } })
          }
          disabled={chatNode.data.usePresencePenaltyInput}
        />
        <Toggle
          id="usePresencePenaltyInput"
          isChecked={chatNode.data.usePresencePenaltyInput}
          onChange={(e) =>
            onChange?.({ ...chatNode, data: { ...chatNode.data, usePresencePenaltyInput: e.target.checked } })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="frequencyPenalty">
          Frequency Penalty
        </label>
        <input
          id="frequencyPenalty"
          className="number-input"
          type="number"
          step="0.1"
          min="-2"
          max="2"
          value={chatNode.data.frequencyPenalty}
          onChange={(e) =>
            onChange?.({ ...chatNode, data: { ...chatNode.data, frequencyPenalty: e.target.valueAsNumber } })
          }
          disabled={chatNode.data.useFrequencyPenaltyInput}
        />
        <Toggle
          id="useFrequencyPenaltyInput"
          isChecked={chatNode.data.useFrequencyPenaltyInput}
          onChange={(e) =>
            onChange?.({ ...chatNode, data: { ...chatNode.data, useFrequencyPenaltyInput: e.target.checked } })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="cache">
          Cache (same inputs, same outputs)
        </label>
        <Toggle
          id="cache"
          isChecked={chatNode.data.cache}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, cache: e.target.checked } })}
        />
        <div />
      </div>
    </div>
  );
};

export const chatNodeDescriptor: NodeComponentDescriptor<'chat'> = {
  Body: ChatNodeBody,
  Output: ChatNodeOutput,
  Editor: ChatNodeEditor,
  FullscreenOutput: FullscreenChatNodeOutput,
};
