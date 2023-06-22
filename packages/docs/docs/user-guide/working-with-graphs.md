---
title: 'Working with Graphs'
---

A Rivet project contains a set of named graphs. Each of these graphs contains a set of nodes connected together, forming the graph.

If you are used to code, a graph is analogous to a function. A function is a set of code that can be called from other code. A graph is a set of nodes that can be called from other graphs.

## Creating a Graph

To create a new graph, right click in the blank space in the graph list in the sidebar, and select "New Graph". This will create a new blank graph. The new graph is unsaved by default.

Go into the **Graph Info** tab and give your graph a new name, then save the new graph by pressing **Ctrl+S** or **Cmd+S**. Your new graph will now appear in the graph list.

## Navigating Between Graphs

To navigate between graphs, click on the graph in the graph list in the sidebar. This will open the graph in the main graph area.

## Deleting a Graph

To delete a graph, right click on it in the graph list in the sidebar and select "Delete Graph". This will delete the graph from your project. (**Warning** there is no undo at this time!)

## Running a Graph

To run the currently selected graph, press the **Run** button in the top right of Rivet. You can then watch the graph execute live.

When connected to a remote debugger, whenever the graph executes remotely, it will automatically show the result of the run in the current graph. If you have implemented `dynamicGraphRun` in your debugger server, you can also click the **Run** button to execute the graph remotely. If it is not implemented, the run button will not do anything.

## Graph Inputs

A graph has a set of inputs that can be thought of as the "arguments" to the graph. When calling the graph as a subgraph, or when calling the graph from your integrated code, you can pass in these inputs, which will be available to the nodes in the graph.

To add an input to the graph, add a new [Graph Input Node](../node-reference/graph-input). The ID of the Graph Input node will be the name of the input on the graph. You may give default values for inputs in the node editor for the input.

The output port of the Graph Input will contain the value of the input (from the parent graph or code) when the graph is called.

A useful pattern is to toggle on the input port for the default value input, and pass in some testing data to the default value port. Then, when this graph is executed in isolation.

## Graph Outputs

Similar to graph inputs, a graph can have outputs that can be thought of as the "return value" of the graph. When calling the graph as a subgraph, or when calling the graph from your integrated code, you can read the values of these outputs.

To add an output to the graph, add a new [Graph Output Node](../node-reference/graph-output). The ID of the Graph Output node will be the name of the output on the graph.

Connect a node to the input port of the Graph Output node. The value of the output port of the node will be the value of the output of the graph.

Once the graph has finished executing, the code or parent graph will be able to proceed with the outputs of the graph.

## Exporting Graphs

To export a single graph from your project, open the graph by clicking on it, and choose **Export Graph** from the File menu. This will open a file dialog where you can choose a location to save the graph. The graph will be saved as a `.rivet-graph` file.

## Importing Graphs

To import a graph into the current project (merging it into the current project), choose **Import Graph** from the File menu. This will open a file dialog where you can choose a graph to import. The graph will be imported into the current project.
