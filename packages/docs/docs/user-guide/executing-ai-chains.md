---
title: 'Executing AI Chains'
---

## Data Flow

In general, data flows from **left to right** in a graph.

Graph execution will start from every node that does not have any inputs. You can refer to these nodes as **root nodes**.

When a node is executed, it will send its output to all of its connected nodes.

A node must wait for all of its inputs to be received before it can execute.

The following graph will _roughly_ execute in the order of these numbers. Every node with the same number will run in parallel. The arrows show the rough "flow" of the data.

![Data Flow](assets/data-flow.png)

## Chaining AI Responses

A common flow for chaining AI responses will be something like:

- Initialize a system prompt by using a [Text Node](../node-reference/text) or a [Prompt Node](../node-reference/prompt), and connect the text to the System Prompt port of a [Chat Node](../node-reference/chat).
- Construct your main prompt by using a [Text Node](../node-reference/text) or a [Prompt Node](../node-reference/prompt), and connect the text to the Prompt port of a [Chat Node](../node-reference/chat). You may also use an [Assemble Prompt Node](../node-reference/assemble-prompt) to construct a series of messages to send to the Chat node. The Prompt input of the chat node accepts a string, array of strings, a chat message (from a Prompt node), or an array of chat messages (which can be constructed using an Assemble Prompt node).
- Commonly you will want to parse the output text of the Chat node. This can be accomplished using the [Extract with Regex Node](../node-reference/extract-with-regex), the [Extract JSON Node](../node-reference/extract-json), or the [Extract YAML](../node-reference/extract-yaml) node. You can also use the [Extract with Regex Node](../node-reference/extract-with-regex) to extract multiple values from the output text.
- Next, it is common to use an [Extract Object Path](../node-reference/extract-object-path) node to extract a specific value from the structured data using jsonpath. This is useful if you are using the [Extract JSON Node](../node-reference/extract-json) or the [Extract YAML](../node-reference/extract-yaml) node.
- You may want to take different actions depending on what your extracted value is. For this, you can use the [Match Node](../node-reference/match) to match the extracted value against a series of patterns. Or, you can use an [If/Else Node](../node-reference/if-else) to get fallback values.
- Next, you will often want to use more [Text Nodes](../node-reference/text) or [Prompt Nodes](../node-reference/prompt) while interpolating the value you extracted, to construct a new message to send to another [Chat Node](../node-reference/chat).
- The above chain can then continue indefinitely, with the output of one Chat node being used as the input to another Chat node. Or, you can use a [Loop Controller Node](../node-reference/loop-controller) to pipe the results of this chain back into itself, for OODA AI agent application.
