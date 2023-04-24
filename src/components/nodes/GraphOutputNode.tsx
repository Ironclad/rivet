import { FC } from 'react';
import { GraphOutputNode } from '../../model/nodes/GraphOutputNode';
import { ChartNode } from '../../model/NodeBase';

export type GraphOutputNodeBodyProps = {
  node: GraphOutputNode;
};

export const GraphOutputNodeBody: FC<GraphOutputNodeBodyProps> = ({ node }) => {
  return (
    <div>
      <h3>{node.data.id}</h3>
      <p>Type: {node.data.dataType}</p>
    </div>
  );
};

export type GraphOutputNodeEditorProps = {
  node: ChartNode;
  onChange?: (node: ChartNode) => void;
};

export const GraphOutputNodeEditor: FC<GraphOutputNodeEditorProps> = ({ node, onChange }) => {
  // TODO: Implement the editor component for GraphOutputNode
  return <div>Graph Output Node Editor</div>;
};
