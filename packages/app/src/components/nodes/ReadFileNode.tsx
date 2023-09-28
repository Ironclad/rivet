import { type FC } from 'react';
import Toggle from '@atlaskit/toggle';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';
import { type ChartNode, type ReadFileNode } from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import { ioProvider } from '../../utils/globals.js';

type ReadFileNodeBodyProps = {
  node: ReadFileNode;
};

const currentPathCss = css`
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Roboto mono', monospace;
  color: var(--primary-text);
`;

export const ReadFileNodeBody: FC<ReadFileNodeBodyProps> = ({ node }) => {
  return (
    <div>
      {!node.data.usePathInput && (
        <>
          Path:
          <span css={currentPathCss}>{node.data.path}</span>
        </>
      )}
    </div>
  );
};

export type ReadFileNodeEditorProps = {
  node: ReadFileNode;
  onChange?: (node: ChartNode<'readFile', ReadFileNode['data']>) => void;
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

  .input {
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
  }

  .checkbox-input {
    margin-left: 8px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

export const ReadFileNodeEditor: FC<ReadFileNodeEditorProps> = ({ node, onChange }) => {
  const handleBrowseClick = async () => {
    const path = await ioProvider.openFilePath();
    if (path) {
      onChange?.({
        ...node,
        data: { ...node.data, path: path as string },
      });
    }
  };

  return (
    <div css={container}>
      <div className="row">
        {node.data.usePathInput ? (
          <></>
        ) : (
          <>
            <label className="label" htmlFor="baseDirectory">
              Pick File
            </label>
            <Button onClick={handleBrowseClick}>Browse...</Button>
          </>
        )}
        <Toggle
          id="usePathInput"
          isChecked={node.data.usePathInput}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, usePathInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <div>
          Current Path: <span css={currentPathCss}>{node.data.usePathInput ? '(Using Input)' : node.data.path}</span>
        </div>
      </div>
    </div>
  );
};

export const readFileNodeDescriptor: NodeComponentDescriptor<'readFile'> = {
  Body: ReadFileNodeBody,
  Output: undefined,
  Editor: ReadFileNodeEditor,
};
