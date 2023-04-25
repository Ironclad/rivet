import { FC } from 'react';
import { ReadFileNode } from '../../model/nodes/ReadFileNode';
import { ChartNode } from '../../model/NodeBase';
import { RenderDataValue } from '../RenderDataValue';
import { PortId } from '../../model/NodeBase';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { assertBaseDir } from '../../model/native/BaseDir';
import Toggle from '@atlaskit/toggle';
import { css } from '@emotion/react';

type ReadFileNodeBodyProps = {
  node: ReadFileNode;
};

export const ReadFileNodeBody: FC<ReadFileNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <div>Base Directory: {node.data.baseDirectory}</div>
      {!node.data.usePathInput && <div>Path: {node.data.path}</div>}
    </div>
  );
};

export const ReadFileNodeOutput: FC<ReadFileNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputContent = output.outputData['content' as PortId];
  return (
    <pre style={{ whiteSpace: 'pre-wrap' }}>
      <RenderDataValue value={outputContent} />
    </pre>
  );
};

export type ReadFileNodeEditorProps = {
  node: ChartNode;
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
  const readFileNode = node as ReadFileNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="baseDirectory">
          Base Directory
        </label>
        <input
          id="baseDirectory"
          className="input"
          type="text"
          value={readFileNode.data.baseDirectory}
          onChange={(e) => {
            const baseDir = e.target.value;
            assertBaseDir(baseDir);
            onChange?.({ ...readFileNode, data: { ...readFileNode.data, baseDirectory: baseDir } });
          }}
        />
        <Toggle
          id="useBaseDirectoryInput"
          isChecked={readFileNode.data.useBaseDirectoryInput}
          onChange={(e) =>
            onChange?.({
              ...readFileNode,
              data: { ...readFileNode.data, useBaseDirectoryInput: e.target.checked },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="path">
          Path
        </label>
        <input
          id="path"
          className="input"
          type="text"
          value={readFileNode.data.path}
          onChange={(e) => onChange?.({ ...readFileNode, data: { ...readFileNode.data, path: e.target.value } })}
        />
        <Toggle
          id="usePathInput"
          isChecked={readFileNode.data.usePathInput}
          onChange={(e) =>
            onChange?.({
              ...readFileNode,
              data: { ...readFileNode.data, usePathInput: e.target.checked },
            })
          }
        />
      </div>
    </div>
  );
};
