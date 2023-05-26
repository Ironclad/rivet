import { ChangeEvent, FC } from 'react';
import { LoopControllerNode, Outputs, PortId } from '@ironclad/nodai-core';
import { RenderDataValue } from '../RenderDataValue';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import styled from '@emotion/styled';

type LoopControllerNodeBodyProps = {
  node: LoopControllerNode;
};

export const LoopControllerNodeBody: FC<LoopControllerNodeBodyProps> = ({ node }) => {
  return null;
};

export const LoopControllerNodeOutput: FC<{ outputs: Outputs }> = ({ outputs }) => {
  const outputKeys = Object.keys(outputs).filter((key) => key.startsWith('output'));

  const breakLoop = outputs['break' as PortId]!.type !== 'control-flow-excluded';

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
          <RenderDataValue key={key} value={outputs[key as PortId]} />
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
  OutputSimple: LoopControllerNodeOutput,
  Editor: LoopControllerNodeEditor,
};
