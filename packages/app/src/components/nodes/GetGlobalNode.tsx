import { FC } from 'react';
import { GetGlobalNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

export const GetGlobalNodeBody: FC<{
  node: GetGlobalNode;
}> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
      {node.data.wait && <p>Waits for available data</p>}
    </div>
  );
};

export const getGlobalNodeDescriptor: NodeComponentDescriptor<'getGlobal'> = {
  Body: GetGlobalNodeBody,
};
