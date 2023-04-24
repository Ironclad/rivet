import { FC } from 'react';
import { GraphInputNode } from '../../model/nodes/GraphInputNode';
import { ChartNode } from '../../model/NodeBase';

export type GraphInputNodeBodyProps = {
  node: GraphInputNode;
};

export const GraphInputNodeBody: FC<GraphInputNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
    </div>
  );
};

export type GraphInputNodeEditorProps = {
  node: ChartNode;
  onChange?: (node: ChartNode) => void;
};

export const GraphInputNodeEditor: FC<GraphInputNodeEditorProps> = ({ node, onChange }) => {
  // TODO: Implement the editor component for GraphInputNode
  return <div>Graph Input Node Editor</div>;
};
