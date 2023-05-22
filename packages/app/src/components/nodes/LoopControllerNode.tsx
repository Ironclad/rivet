import { ChangeEvent, FC } from 'react';
import { LoopControllerNode, PortId } from '@ironclad/nodai-core';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import styled from '@emotion/styled';

type LoopControllerNodeBodyProps = {
  node: LoopControllerNode;
};

export const LoopControllerNodeBody: FC<LoopControllerNodeBodyProps> = ({ node }) => {
  return null;
};

export const LoopControllerNodeOutput: FC<{ node: LoopControllerNode }> = ({ node }) => {
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

  const outputKeys = Object.keys(output.outputData).filter((key) => key.startsWith('output'));

  const breakLoop = output.outputData['break' as PortId]!.type !== 'control-flow-excluded';

  return (
    <div>
      <div key="break">
        <em>Continue:</em>
        {breakLoop ? 'false' : 'true'}
      </div>
      {outputKeys.map((key, i) => (
        <div key={key}>
          <div>
            <em>Output {i + 1}</em>
          </div>
          <RenderDataValue key={key} value={output.outputData![key as PortId]} />
        </div>
      ))}
    </div>
  );
};

type LoopControllerNodeEditorProps = {
  node: LoopControllerNode;
  onChange?: (node: LoopControllerNode) => void;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;

  .maxIterations {
    width: 100px;
  }
`;

const handleInputChange =
  (node: LoopControllerNode, onChange?: (node: LoopControllerNode) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value <= 0) {
      return;
    }
    onChange?.({
      ...node,
      data: {
        ...node.data,
        maxIterations: value,
      },
    });
  };

export const LoopControllerNodeEditor: FC<LoopControllerNodeEditorProps> = ({ node, onChange }) => {
  return (
    <Container>
      <label htmlFor="maxIterations">Max Iterations:</label>
      <input
        type="number"
        className="maxIterations"
        min="1"
        defaultValue={node.data.maxIterations ?? 100}
        onChange={handleInputChange(node, onChange)}
      />
    </Container>
  );
};

export const loopControllerNodeDescriptor: NodeComponentDescriptor<'loopController'> = {
  Body: LoopControllerNodeBody,
  Output: LoopControllerNodeOutput,
  Editor: LoopControllerNodeEditor,
};
