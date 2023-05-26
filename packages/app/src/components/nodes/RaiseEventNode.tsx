import { FC } from 'react';
import { RaiseEventNode } from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import TextField from '@atlaskit/textfield';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type RaiseEventNodeBodyProps = {
  node: RaiseEventNode;
};

export const RaiseEventNodeBody: FC<RaiseEventNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useEventNameInput ? '(Using Input)' : node.data.eventName}</div>;
};

type RaiseEventNodeEditorProps = {
  node: RaiseEventNode;
  onChange?: (node: RaiseEventNode) => void;
};

export const RaiseEventNodeEditor: FC<RaiseEventNodeEditorProps> = ({ node, onChange }) => {
  const handleFunctionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, eventName: e.target.value },
    });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, useEventNameInput: e.target.checked },
    });
  };

  return (
    <div>
      <div>
        <label htmlFor="eventName">Event Name:</label>
        <TextField
          id="eventName"
          value={node.data.eventName}
          onChange={handleFunctionNameChange}
          isDisabled={node.data.useEventNameInput}
        />
      </div>
      <div>
        <label htmlFor="useEventNameInput">Use Event Name Input:</label>
        <Toggle id="useEventNameInput" isChecked={node.data.useEventNameInput} onChange={handleToggleChange} />
      </div>
    </div>
  );
};

export const RaiseEventNodeDescriptor: NodeComponentDescriptor<'raiseEvent'> = {
  Body: RaiseEventNodeBody,
  Output: undefined,
  Editor: RaiseEventNodeEditor,
};
