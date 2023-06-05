import { FC } from 'react';
import { WaitForEventNode } from '@ironclad/nodai-core';
import Toggle from '@atlaskit/toggle';
import TextField from '@atlaskit/textfield';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type WaitForEventNodeBodyProps = {
  node: WaitForEventNode;
};

export const WaitForEventNodeBody: FC<WaitForEventNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useEventNameInput ? '(Using Input)' : node.data.eventName}</div>;
};

type WaitForEventNodeEditorProps = {
  node: WaitForEventNode;
  onChange?: (node: WaitForEventNode) => void;
};

export const WaitForEventNodeEditor: FC<WaitForEventNodeEditorProps> = ({ node, onChange }) => {
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

export const waitForEventNodeDescriptor: NodeComponentDescriptor<'waitForEvent'> = {
  Body: WaitForEventNodeBody,
  Output: undefined,
  Editor: WaitForEventNodeEditor,
};
