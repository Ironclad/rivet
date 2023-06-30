---
title: Subgraphs
---

Subgraphs are a powerful tool for composing graphs together. They allow you to create a graph that can be used as a node in another graph. This allows you to create reusable components, and to create graphs that are easier to understand.

If you are familiar with code, a graph is like a function, and a subgraph is like a function call. You can pass inputs into a subgraph, and it will return outputs. The inputs can be thought of as function arguments, and the outputs can be thought of as the return value. A graph can output multiple values, however.

### Creating a Subgraph

To create a subgraph, simply create a new graph in your project and add nodes to it.

You may want to add [Graph Input Nodes](../node-reference/graph-input) to the graph to allow you to pass in values to the subgraph. You may also want to add [Graph Output Nodes](../node-reference/graph-output) to the graph to allow you to return values from the subgraph.

### Create Subgraph Helper

If you select multiple nodes by holding shift and clicking on them, you can right click on the selection and choose **Create Subgraph**. This will create a new subgraph with the selected nodes in it. The nodes will not be removed from the current graph at this time. See [working with nodes](./adding-connecting-nodes) for more information on how to use this.

### Calling a Subgraph

To call a subgraph, add a [Subgraph Node](../node-reference/subgraph) to your graph. Connect any required data to the input ports of the subgraph, and connect any output data of the subgraph to the next nodes in your chain.

Subgraphs can call other subgraphs, allowing you to create a hierarchy of subgraphs. You can also call the current graph as a subgraph, however be careful to avoid infinite loops!
