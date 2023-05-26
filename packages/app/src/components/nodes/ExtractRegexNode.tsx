import { FC, useRef } from 'react';
import styled from '@emotion/styled';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { DataType, ExtractRegexNode, PortId, expectTypeOptional } from '@ironclad/nodai-core';
import { RenderDataValue } from '../RenderDataValue';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ExtractRegexNodeBodyProps = {
  node: ExtractRegexNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const ExtractRegexNodeBody: FC<ExtractRegexNodeBodyProps> = ({ node }) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  const regex = node.data.regex;

  // TODO regex highlight?
  // useLayoutEffect(() => {
  //   monaco.editor.colorizeElement(bodyRef.current!, {
  //     theme: 'prompt-interpolation',
  //   });
  // }, [truncated]);

  if (node.data.useRegexInput) {
    return <Body>(Using regex input)</Body>;
  }

  return <Body>{node.data.regex}</Body>;
};

export const ExtractRegexNodeOutput: FC<ExtractRegexNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>{output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  if (output.outputData['matches' as PortId]?.type === ('string[][]' as DataType)) {
    return <div>{JSON.stringify(output.outputData['matches' as PortId])}</div>;
  }

  const outputKeys = Object.keys(output.outputData).filter((key) => key.startsWith('output'));
  const matches = expectTypeOptional(output.outputData['matches' as PortId], 'string[]');

  return (
    <div>
      {outputKeys.map((key) => {
        const outputText = output.outputData![key as PortId];
        return (
          <div key={key}>
            <strong>{key}:</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              <RenderDataValue value={outputText} />
            </pre>
          </div>
        );
      })}
      <strong>Matches:</strong>
      {matches?.map((match) => (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{match}</pre>
      ))}
    </div>
  );
};

export type ExtractRegexNodeEditorProps = {
  node: ExtractRegexNode;
  onChange?: (node: ExtractRegexNode) => void;
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

export const ExtractRegexNodeEditor: FC<ExtractRegexNodeEditorProps> = ({ node, onChange }) => {
  const extractRegexNode = node as ExtractRegexNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="regex">
          Regex
        </label>
        <input
          id="regex"
          className="select"
          type="text"
          value={extractRegexNode.data.regex}
          onChange={(e) =>
            onChange?.({ ...extractRegexNode, data: { ...extractRegexNode.data, regex: e.target.value } })
          }
          disabled={extractRegexNode.data.useRegexInput}
        />
        <Toggle
          id="useRegexInput"
          isChecked={extractRegexNode.data.useRegexInput}
          onChange={(e) =>
            onChange?.({ ...extractRegexNode, data: { ...extractRegexNode.data, useRegexInput: e.target.checked } })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="errorOnFailed">
          Error on Failed
        </label>
        <Toggle
          id="errorOnFailed"
          isChecked={extractRegexNode.data.errorOnFailed}
          onChange={(e) =>
            onChange?.({ ...extractRegexNode, data: { ...extractRegexNode.data, errorOnFailed: e.target.checked } })
          }
        />
      </div>
    </div>
  );
};

export const extractRegexNodeDescriptor: NodeComponentDescriptor<'extractRegex'> = {
  Body: ExtractRegexNodeBody,
  Output: ExtractRegexNodeOutput,
  Editor: ExtractRegexNodeEditor,
};
