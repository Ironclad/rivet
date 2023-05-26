import { FC } from 'react';
import { ExtractYamlNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import TextField from '@atlaskit/textfield';

export type ExtractYamlNodeBodyProps = {
  node: ExtractYamlNode;
};

export const ExtractYamlNodeBody: FC<ExtractYamlNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <div>Root: {node.data.rootPropertyName}</div>
      {node.data.objectPath && <div>Path: {node.data.objectPath}</div>}
    </div>
  );
};

type ExtractYamlNodeEditorProps = {
  node: ExtractYamlNode;
  onChange?: (node: ExtractYamlNode) => void;
};

export const ExtractYamlNodeEditor: FC<ExtractYamlNodeEditorProps> = ({ node, onChange }) => {
  const handleRootPropertyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, rootPropertyName: e.target.value },
    });
  };

  const handleFunctionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, objectPath: e.target.value },
    });
  };

  return (
    <div>
      <div>
        <label htmlFor="rootProperty">Root Property:</label>
        <TextField id="rootProperty" value={node.data.rootPropertyName} onChange={handleRootPropertyNameChange} />
      </div>
      <div>
        <label htmlFor="path">Extract Path:</label>
        <TextField id="path" value={node.data.objectPath ?? ''} onChange={handleFunctionNameChange} />
      </div>
    </div>
  );
};

export const extractYamlNodeDescriptor: NodeComponentDescriptor<'extractYaml'> = {
  Body: ExtractYamlNodeBody,
  Output: undefined,
  Editor: ExtractYamlNodeEditor,
};
