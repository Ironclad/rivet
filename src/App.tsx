import { useState } from 'react';
import { NodeCanvas } from './components/NodeCanvas';
import { Nodes } from './model/Nodes';
import { ChartNode } from './model/NodeBase';
import { ConcatNodeImpl } from './model/nodes/ConcatNode';

function App() {
  const [nodes, setNodes] = useState<ChartNode<string, unknown>[]>([] satisfies Nodes[]);

  return (
    <div>
      <NodeCanvas nodes={nodes} onNodesChanged={setNodes} />
    </div>
  );
}

export default App;
