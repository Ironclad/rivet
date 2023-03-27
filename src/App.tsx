import { useState } from 'react';
import { NodeCanvas } from './components/NodeCanvas';
import { Nodes } from './model/Nodes';
import { ChartNode } from './model/NodeBase';
import { ConcatNodeImpl } from './model/nodes/ConcatNode';

function App() {
  const [nodes, setNodes] = useState<ChartNode<string, unknown>[]>([
    { ...ConcatNodeImpl.create(), visualData: { x: 50, y: 50 } },
    { ...ConcatNodeImpl.create(), visualData: { x: 250, y: 50 } },
    { ...ConcatNodeImpl.create(), visualData: { x: 50, y: 150 } },
    { ...ConcatNodeImpl.create(), visualData: { x: 250, y: 250 } },
  ] satisfies Nodes[]);

  return (
    <div>
      <NodeCanvas nodes={nodes} onNodesChanged={setNodes} />
    </div>
  );
}

export default App;
