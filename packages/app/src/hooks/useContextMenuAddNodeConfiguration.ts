import { NodeType } from '@ironclad/rivet-core';
import { ContextMenuItem } from './useContextMenuConfiguration.js';
import dedent from 'ts-dedent';

import textNodeImage from '../assets/node_images/text_node.png.js';
import chatNodeImage from '../assets/node_images/chat_node.png.js';

const textNode = {
  label: 'Text',
  data: 'text',
  id: 'add-node:text',
  infoBox: {
    title: 'Text Node',
    image: textNodeImage,
    description: dedent`
      Outputs a string of text. It can also interpolate values using <span style="color: var(--primary)">{{tags}}</span>.

      The inputs are dynamic based on the interpolation tags.
    `,
  },
} as const satisfies ContextMenuItem;
const chatNode = {
  label: 'Chat',
  data: 'chat',
  id: 'add-node:chat',
  infoBox: {
    title: 'Chat Node',
    image: chatNodeImage,
    description: dedent`
      Makes a call to an LLM chat model. Currently only supports GPT. The settings contains many options for tweaking the model's behavior.

      The \`System Prompt\` input specifies a system prompt as the first message to the model. This is useful for providing context to the model.

      The \`Prompt\` input takes one or more strings or chat-messages (from a Prompt node) to send to the model.
    `,
  },
} as const satisfies ContextMenuItem;

export const addContextMenuGroups = [
  {
    id: 'add-node-group:common',
    label: 'Common',
    items: [textNode, chatNode],
  },
  {
    id: 'add-node-group:text',
    label: 'Text',
    items: [
      textNode,
      {
        label: 'Prompt',
        data: 'prompt',
        id: 'add-node:prompt',
        infoBox: {
          title: 'Prompt Node',
          description: dedent`
            Outputs a chat message, which is a string of text with an attached "type" saying who sent the message (User, Assistant, System) and optionally an attached "name".

            Also provides the same <span style="color: var(--primary)">{{interpolation}}</span> capabilities as a Text node.

            Can change one chat message type into another chat message type. For example, changing a User message into a System message.
        `,
        },
      },
      {
        label: 'Chunk',
        data: 'chunk',
        id: 'add-node:chunk',
        infoBox: {
          title: 'Chunk Node',
          description: dedent`
            Splits the input text into an array of chunks based on an approximate GPT token count per chunk.

            The "overlap" setting allows you to partially overlap the chunks for redundancy.

            Can also be used for string length truncation by only using the \`First\` or \`Last\` outputs of the node.
        `,
        },
      },
      {
        label: 'To YAML',
        data: 'toYaml',
        id: 'add-node:toYaml',
        infoBox: {
          title: 'To YAML Node',
          description: dedent`
          Turns the input object into YAML text.
        `,
        },
      },
      {
        label: 'To JSON',
        data: 'toJson',
        id: 'add-node:toJson',
        infoBox: {
          title: 'To JSON Node',
          description: dedent`
            Turns the input value into its JSON equivalent (stringifies the value).
          `,
        },
      },
      {
        label: 'Join',
        data: 'join',
        id: 'add-node:join',
        infoBox: {
          title: 'Join Node',
          description: dedent`
            Takes an array of strings, and joins them using the configured delimiter.

            Defaults to a newline.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:ai',
    label: 'AI',
    items: [
      chatNode,
      {
        label: 'Assemble Prompt',
        data: 'assemblePrompt',
        id: 'add-node:assemblePrompt',
        infoBox: {
          title: 'Assemble Prompt Node',
          description: dedent`
            Assembles an array of chat messages for use with a Chat node. The inputs can be strings or chat messages.

            The number of inputs is dynamic based on the number of connections.
          `,
        },
      },
      {
        label: 'Trim Chat Messages',
        data: 'trimChatMessages',
        id: 'add-node:trimChatMessages',
        infoBox: {
          title: 'Trim Chat Messages Node',
          description: dedent`
            Takes an array of chat messages, and slices messages from the beginning or the end of the list until the total length of the messages is under the configured token length.

            Useful for setting up infinite message chains that stay under the LLM context limit.
          `,
        },
      },
      {
        label: 'GPT Function',
        data: 'gptFunction',
        id: 'add-node:gptFunction',
        infoBox: {
          title: 'GPT Function Node',
          description: dedent`
            Defines a GPT function, which is a method that the LLM can call in its responses.
          `,
        },
      },
      {
        label: 'Get Embedding',
        data: 'getEmbedding',
        id: 'add-node:getEmbedding',
        infoBox: {
          title: 'Get Embedding Node',
          description: dedent`
            Gets a OpenAI vector embedding for the input text provided.

            Can be used with the Vector Store and Vector KNN nodes.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:data',
    label: 'Data',
    items: [
      {
        label: 'Extract With Regex',
        data: 'extractRegex',
        id: 'add-node:extractRegex',
        infoBox: {
          title: 'Extract With Regex Node',
          description: dedent`
            Extracts data from the input text using the configured regular expression. The regular expression can contain capture groups to extract specific parts of the text.

            Each capture group corresponds to an output port of the node.
          `,
        },
      },
      {
        label: 'Extract JSON',
        data: 'extractJson',
        id: 'add-node:extractJson',
        infoBox: {
          title: 'Extract JSON Node',
          description: dedent`
            Finds and parses the first JSON object in the input text.

            Outputs the parsed object.
          `,
        },
      },
      {
        label: 'Extract YAML',
        data: 'extractYaml',
        id: 'add-node:extractYaml',
        infoBox: {
          title: 'Extract YAML Node',
          description: dedent`
            Finds and parses a YAML object in the input text with a predefined root property name (configurable).

            Defaults to \`yamlDocument\`, which means the input text must have a \`yamlDocument:\` root node somewhere in it. All indented text after that is considered part of the YAML.

            Outputs the parsed object.
          `,
        },
      },
      {
        label: 'Extract Object Path',
        data: 'extractObjectPath',
        id: 'add-node:extractObjectPath',
        infoBox: {
          title: 'Extract Object Path Node',
          description: dedent`
            Extracts the value at the specified path from the input value. The path uses JSONPath notation to navigate through the value.
          `,
        },
      },
      {
        label: 'Array',
        data: 'array',
        id: 'add-node:array',
        infoBox: {
          title: 'Array Node',
          description: dedent`
            Creates an array from the input values. By default, flattens any arrays which are inputs into a single array. Can be configured to keep the arrays separate, or deeply flatten arrays.

            Useful for both creating and merging arrays.

            The number of inputs is dynamic based on the number of connections.
          `,
        },
      },
      {
        label: 'Pop',
        data: 'pop',
        id: 'add-node:pop',
        infoBox: {
          title: 'Pop Node',
          description: dedent`
            Pops the last value off the input array and outputs the new array and the popped value.

            Can also be used to just extract the last value from an array.
          `,
        },
      },
      {
        label: 'Hash',
        data: 'hash',
        id: 'add-node:hash',
        infoBox: {
          title: 'Hash Node',
          description: dedent`
            Computes a hash of the input value using the configured hash function.
          `,
        },
      },
      {
        label: 'Filter',
        data: 'filter',
        id: 'add-node:filter',
        infoBox: {
          title: 'Filter Node',
          description: dedent`
            Takes in both an array of values, and an array of booleans of the same length, and filters the array where the corresponding boolean is true.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:logic',
    label: 'Logic',
    items: [
      {
        label: 'Match',
        data: 'match',
        id: 'add-node:match',
        infoBox: {
          title: 'Match Node',
          description: dedent`
            Any number of regular expressions can be configured, each corresponding to an output of the node. The output port of the first matching regex will be ran, and all other output ports will not be ran.
          `,
        },
      },
      {
        label: 'If',
        data: 'if',
        id: 'add-node:if',
        infoBox: {
          title: 'If Node',
          description: dedent`
            Takes in a condition and a value. If the condition is truthy, the value is passed through the output port. If the condition is not truthy, the output port is not ran.
          `,
        },
      },
      {
        label: 'If/Else',
        data: 'ifElse',
        id: 'add-node:ifElse',
        infoBox: {
          title: 'If/Else Node',
          description: dedent`
            Takes in three inputs: a condition, a true value, and a false value. If the condition is truthy, the true value is passed through the output port. If the condition is not truthy, the false value is passed through the output port.

            This node can "consume" a \`Not Ran\` to continue a graph from that point.
          `,
        },
      },
      {
        label: 'Loop Controller',
        data: 'loopController',
        id: 'add-node:loopController',
        infoBox: {
          title: 'Loop Controller Node',
          description: dedent`
            Defines the entry point for a loop. Values from inside the loop should be passed back through the "Input" ports, and their corresponding "Default" values can be specified on the input ports as well.

            If the "continue" input is falsey, then the "break" output will run.
          `,
        },
      },
      {
        label: 'Coalesce',
        data: 'coalesce',
        id: 'add-node:coalesce',
        infoBox: {
          title: 'Coalesce Node',
          description: dedent`
            Takes in any number of inputs and outputs the first value that exists. Useful for consolidating branches after a Match node. This node can also "consume" the "Not Ran" value.
          `,
        },
      },
      {
        label: 'Passthrough',
        data: 'passthrough',
        id: 'add-node:passthrough',
        infoBox: {
          title: 'Passthrough Node',
          description: dedent`
            Simply passes the input value to the output without any modifications.
          `,
        },
      },
      {
        label: 'Abort Graph',
        data: 'abortGraph',
        id: 'add-node:abortGraph',
        infoBox: {
          title: 'Abort Graph Node',
          description: dedent`
            Aborts the execution of the entire graph immediately.

            Can either "successfully" abort the graph (early-exit), or "error" abort the graph.
          `,
        },
      },
      {
        label: 'Race Inputs',
        data: 'raceInputs',
        id: 'add-node:raceInputs',
        infoBox: {
          title: 'Race Inputs Node',
          description: dedent`
            Takes in multiple inputs and outputs the value of the first one to finish. The other inputs are cancelled.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:input-output',
    label: 'Input/Output',
    items: [
      {
        label: 'Graph Output',
        data: 'graphOutput',
        id: 'add-node:graphOutput',
        infoBox: {
          title: 'Graph Output Node',
          description: dedent`
            Each instance of this node represents an individual output of the graph. The value passed into this node becomes part of the overall output of the graph.
          `,
        },
      },
      {
        label: 'Graph Input',
        data: 'graphInput',
        id: 'add-node:graphInput',
        infoBox: {
          title: 'Graph Input Node',
          description: dedent`
            Defines an input for the graph which can be passed in when the graph is called, or defines one of the input ports when the graph is a subgraph.
          `,
        },
      },
      {
        label: 'User Input',
        data: 'userInput',
        id: 'add-node:userInput',
        infoBox: {
          title: 'User Input Node',
          description: dedent`
            Prompts the user for input during the execution of the graph. The user's response becomes the output of this node.
          `,
        },
      },
      {
        label: 'Read Directory',
        data: 'readDirectory',
        id: 'add-node:readDirectory',
        infoBox: {
          title: 'Read Directory Node',
          description: dedent`
            Reads the contents of the specified directory and outputs an array of filenames.
          `,
        },
      },
      {
        label: 'Read File',
        data: 'readFile',
        id: 'add-node:readFile',
        infoBox: {
          title: 'Read File Node',
          description: dedent`
            Reads the contents of the specified file and outputs it as a string.
          `,
        },
      },
      {
        label: 'Vector Store',
        data: 'vectorStore',
        id: 'add-node:vectorStore',
        infoBox: {
          title: 'Vector Store Node',
          description: dedent`
            Takes in a vector, as well as data to store with the vector. This data is stored in the configured vector DB integration for later retrieval.
          `,
        },
      },
      {
        label: 'Vector KNN',
        data: 'vectorNearestNeighbors',
        id: 'add-node:vectorNearestNeighbors',
        infoBox: {
          title: 'Vector KNN Node',
          description: dedent`
            Performs a k-nearest neighbors search on the vectors stored in the configured vector DB integration. Takes in a vector and returns the k closest vectors and their corresponding data.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:advanced',
    label: 'Advanced',
    items: [
      {
        label: 'Subgraph',
        data: 'subGraph',
        id: 'add-node:subGraph',
        infoBox: {
          title: 'Subgraph Node',
          description: dedent`
            Executes another graph. Inputs and outputs are defined by Graph Input and Graph Output nodes within the subgraph.
          `,
        },
      },
      {
        label: 'External Call',
        data: 'externalCall',
        id: 'add-node:externalCall',
        infoBox: {
          title: 'External Call Node',
          description: dedent`
            Provides a way to call into the host project from inside a Rivet graph when Rivet graphs are integrated into another project.
          `,
        },
      },
      {
        label: 'Raise Event',
        data: 'raiseEvent',
        id: 'add-node:raiseEvent',
        infoBox: {
          title: 'Raise Event Node',
          description: dedent`
            Raises an event that the host project or a 'Wait For Event' node can listen for.
          `,
        },
      },
      {
        label: 'Wait For Event',
        data: 'waitForEvent',
        id: 'add-node:waitForEvent',
        infoBox: {
          title: 'Wait For Event Node',
          description: dedent`
            Waits for a specific event to be raised by a 'Raise Event' node or the host project. The event name can be configured.
          `,
        },
      },
      {
        label: 'Code',
        data: 'code',
        id: 'add-node:code',
        infoBox: {
          title: 'Code Node',
          description: dedent`
            Executes a piece of JavaScript code. Documentation for the inputs and outputs is available in the default code.
          `,
        },
      },
      {
        label: 'Context',
        data: 'context',
        id: 'add-node:context',
        infoBox: {
          title: 'Context Node',
          description: dedent`
            Retrieves a value from the graph's context using a configured id. The context serves as a "global graph input", allowing the same values to be accessible from any graph or subgraph.
          `,
        },
      },
      {
        label: 'Get Global',
        data: 'getGlobal',
        id: 'add-node:getGlobal',
        infoBox: {
          title: 'Get Global Node',
          description: dedent`
            Retrieves a global value that is shared across all graphs and subgraphs. The id of the global value is configured in this node.
          `,
        },
      },
      {
        label: 'Set Global',
        data: 'setGlobal',
        id: 'add-node:setGlobal',
        infoBox: {
          title: 'Set Global Node',
          description: dedent`
            Sets a global value that is shared across all graphs and subgraphs. The id of the global value and the value itself are configured in this node.
          `,
        },
      },
    ],
  },
] as const satisfies readonly ContextMenuItem[] & {
  items?: readonly ContextMenuItem<NodeType>[];
};

export function useContextMenuAddNodeConfiguration() {
  return addContextMenuGroups;
}
