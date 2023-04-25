import { FC } from 'react';
import { ChunkNode, ChunkNodeData } from '../../model/nodes/ChunkNode';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { ChartNode, PortId } from '../../model/NodeBase';
import { css } from '@emotion/react';

export type ChunkNodeBodyProps = {
  node: ChunkNode;
};

export const ChunkNodeBody: FC<ChunkNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <div>Model: {node.data.model}</div>
      <div>Token Count: {node.data.numTokensPerChunk}</div>
    </div>
  );
};

export const ChunkNodeOutput: FC<ChunkNodeBodyProps> = ({ node }) => {
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

  const outputChunks = output.outputData['chunks' as PortId];

  return (
    <div>
      {outputChunks?.type === 'string[]' &&
        outputChunks.value.map((chunk, index) => (
          <pre key={index} className="pre-wrap">
            {chunk}
          </pre>
        ))}
    </div>
  );
};

type ChunkNodeEditorProps = {
  node: ChartNode;
  onChange?: (node: ChartNode<'chunk', ChunkNodeData>) => void;
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: grid;
  grid-template-columns: auto 1fr;
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
`;

export const ChunkNodeEditor: FC<ChunkNodeEditorProps> = ({ node, onChange }) => {
  const chunkNode = node as ChunkNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="model">
          Model
        </label>
        <select
          id="model"
          className="select"
          value={chunkNode.data.model}
          onChange={(e) => onChange?.({ ...chunkNode, data: { ...chunkNode.data, model: e.target.value } })}
        >
          {/* Add your model options here */}
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-32k">GPT-4 32K</option>
        </select>
      </div>
      <div className="row">
        <label className="label" htmlFor="numTokensPerChunk">
          Token Count
        </label>
        <input
          id="numTokensPerChunk"
          className="number-input"
          type="number"
          step="1"
          min="1"
          max="32768"
          value={chunkNode.data.numTokensPerChunk}
          onChange={(e) =>
            onChange?.({ ...chunkNode, data: { ...chunkNode.data, numTokensPerChunk: e.target.valueAsNumber } })
          }
        />
      </div>
    </div>
  );
};
