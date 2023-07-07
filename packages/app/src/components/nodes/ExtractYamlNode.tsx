import { FC } from 'react';
import { ExtractYamlNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

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

export const extractYamlNodeDescriptor: NodeComponentDescriptor<'extractYaml'> = {
  Body: ExtractYamlNodeBody,
};
