import { useDraggable } from '@dnd-kit/core';
import { ChartNode } from '../model/NodeBase';
import { CSSProperties, FC, HTMLAttributes, forwardRef } from 'react';

interface DraggableNodeProps {
  node: ChartNode<string, unknown>;
  onEdit?: () => void;
  onSelect?: () => void;
}

export const DraggableNode: React.FC<DraggableNodeProps> = ({ node, onEdit, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });

  return (
    <ViewNode
      ref={setNodeRef}
      node={node}
      onEdit={onEdit}
      onSelect={onSelect}
      isDragging={isDragging}
      xDelta={transform?.x}
      yDelta={transform?.y}
      nodeAttributes={attributes}
      handleAttributes={listeners}
    />
  );
};

export type ViewNodeProps = {
  node: ChartNode<string, unknown>;
  onEdit?: () => void;
  onSelect?: () => void;
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;

  nodeAttributes?: HTMLAttributes<HTMLDivElement>;
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
};

export const ViewNode = forwardRef<HTMLDivElement, ViewNodeProps>(
  ({ node, handleAttributes, nodeAttributes, xDelta = 0, yDelta = 0, isDragging, isOverlay }, ref) => {
    const style: CSSProperties = {
      opacity: isDragging ? '0' : '',
      transform: isOverlay
        ? `translate(${node.visualData.x + xDelta}px, ${node.visualData.y + yDelta}px)`
        : `translate(${node.visualData.x}px, ${node.visualData.y}px)`,
    };

    return (
      <div className={isOverlay ? 'node overlayNode' : 'node'} ref={ref} style={style} {...nodeAttributes}>
        <div className="node-title" {...handleAttributes}>
          {node.title}
        </div>
        <div className="node-body"></div>
        <div className="node-ports">
          <div className="input-ports">
            {node.inputDefinitions.map((input) => (
              <div key={input.id} className="port">
                <div className="input-port" />
                <div className="port-label">{input.title}</div>
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
  },
);
