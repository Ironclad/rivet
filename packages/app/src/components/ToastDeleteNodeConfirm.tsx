import { type NodeId, type GraphId } from "@ironclad/rivet-core";
import { ToastConfirm } from "./ToastConfirm";

interface ToastDeleteNodeConfirmProps {
  nodeGraphMap: Map<NodeWithName, GraphWithName>;
  onDelete: () => void;
  onCancel?: () => void;
}

export type NodeWithName = {
  nodeId: NodeId;
  name: string;
};

export type GraphWithName = {
  id: GraphId;
  name: string;
};


export const ToastDeleteNodeConfirm: React.FC<ToastDeleteNodeConfirmProps> = ({
  nodeGraphMap,
  onDelete,
}) => {
  const message = "This node is connected to other graphs in this project: ";
  const confirmMessage = "Are you sure you want to delete the node?";
  return (

    <div>
      <ToastConfirm
        onConfirm={onDelete}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
      >
      <span style={{ fontSize: '12px' }}>{message}</span>
      <ul>
        { 
          [...nodeGraphMap.entries()].map(([node, graph], index) => (
            <li key={index}> {node.name} [{graph.name}]</li>
          ))
        }
      </ul>
      <span style={{ fontSize: '12px' }}>{confirmMessage}</span>
      </ToastConfirm>
    </div>
  );
};
