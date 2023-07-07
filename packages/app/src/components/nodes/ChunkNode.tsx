import { FC } from 'react';
import { ChunkNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

export type ChunkNodeBodyProps = {
  node: ChunkNode;
};

export const ChunkNodeBody: FC<ChunkNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <div>Model: {node.data.model}</div>
      <div>Token Count: {node.data.numTokensPerChunk}</div>
      {node.data.overlap && <div>Overlap %: {node.data.overlap}</div>}
    </div>
  );
};

export const chunkNodeDescriptor: NodeComponentDescriptor<'chunk'> = {
  Body: ChunkNodeBody,
};
