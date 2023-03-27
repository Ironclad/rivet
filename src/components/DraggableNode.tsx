import { useDraggable } from '@dnd-kit/core';
import { ChartNode } from '../model/NodeBase';

interface DraggableNodeProps {
  node: ChartNode<string, unknown>;
  onEdit?: () => void;
  onSelect?: () => void;
}

export const DraggableNode: React.FC<DraggableNodeProps> = ({ node, onEdit, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: node.id });

  const style = {
    transform: `translate(${node.visualData.x + (transform?.x ?? 0)}px, ${node.visualData.y + (transform?.y ?? 0)}px)`,
  };

  return (
    <div className="node" ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div className="node-title">{node.title}</div>
      <div className="node-body">{node.text}</div>
      <div className="node-ports">
        <div className="input-ports">
          {node.inputDefinitions.map((input) => (
            <div key={input.id} className="port">
              <div className="port-label">{input.title}</div>
              <div className="input-port" />
            </div>
          ))}
        </div>
        <div className="output-ports">
          {node.outputDefinitions.map((output) => (
            <div key={output.id} className="port">
              <div className="output-port" />
              <div className="port-label">{output.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
