import { NodeType } from '@ironclad/rivet-core';
import { ContextMenuItem } from './useContextMenuConfiguration.js';
import dedent from 'ts-dedent';

import textNodeImage from '../assets/node_images/text_node.png';
import chatNodeImage from '../assets/node_images/chat_node.png';
import chunkNodeImage from '../assets/node_images/chunk_node.png';
import promptNodeImage from '../assets/node_images/prompt_node.png';
import toYamlNodeImage from '../assets/node_images/to_yaml_node.png';
import toJsonNodeImage from '../assets/node_images/to_json_node.png';
import joinNodeImage from '../assets/node_images/join_node.png';
import assemblePromptNodeImage from '../assets/node_images/assemble_prompt_node.png';
import trimChatMessagesNodeImage from '../assets/node_images/trim_chat_messages_node.png';
import gptFunctionNodeImage from '../assets/node_images/gpt_function_node.png';
import getEmbeddingNodeImage from '../assets/node_images/get_embedding_node.png';
import extractRegexNodeImage from '../assets/node_images/extract_regex_node.png';
import extractJsonNodeImage from '../assets/node_images/extract_json_node.png';
import extractYamlNodeImage from '../assets/node_images/extract_yaml_node.png';
import extractObjectPathNodeImage from '../assets/node_images/extract_object_path_node.png';
import arrayNodeImage from '../assets/node_images/array_node.png';
import popNodeImage from '../assets/node_images/pop_node.png';
import hashNodeImage from '../assets/node_images/hash_node.png';
import filterNodeImage from '../assets/node_images/filter_node.png';
import boolNodeImage from '../assets/node_images/bool_node.png';
import numberNodeImage from '../assets/node_images/number_node.png';
import compareNodeImage from '../assets/node_images/compare_node.png';
import evaluateNodeImage from '../assets/node_images/evaluate_node.png';
import matchNodeImage from '../assets/node_images/match_node.png';
import ifNodeImage from '../assets/node_images/if_node.png';
import ifElseNodeImage from '../assets/node_images/if_else_node.png';
import loopControllerNodeImage from '../assets/node_images/loop_controller_node.png';
import coalesceNodeImage from '../assets/node_images/coalesce_node.png';
import passthroughNodeImage from '../assets/node_images/passthrough_node.png';
import abortGraphNodeImage from '../assets/node_images/abort_graph_node.png';
import raceInputsNodeImage from '../assets/node_images/race_inputs_node.png';
import randomNumberNodeImage from '../assets/node_images/random_number_node.png';
import shuffleNodeImage from '../assets/node_images/shuffle_node.png';
import codeNodeImage from '../assets/node_images/code_node.png';
import contextNodeImage from '../assets/node_images/context_node.png';
import externalCallNodeImage from '../assets/node_images/external_call_node.png';
import getGlobalNodeImage from '../assets/node_images/get_global_node.png';
import graphInputNodeImage from '../assets/node_images/graph_input_node.png';
import graphOutputNodeImage from '../assets/node_images/graph_output_node.png';
import raiseEventNodeImage from '../assets/node_images/raise_event_node.png';
import readDirectoryNodeImage from '../assets/node_images/read_directory_node.png';
import readFileNodeImage from '../assets/node_images/read_file_node.png';
import setGlobalNodeImage from '../assets/node_images/set_global_node.png';
import subgraphNodeImage from '../assets/node_images/subgraph_node.png';
import userInputNodeImage from '../assets/node_images/user_input_node.png';
import vectorKnnNodeImage from '../assets/node_images/vector_knn_node.png';
import vectorStoreNodeImage from '../assets/node_images/vector_store_node.png';
import waitForEventNodeImage from '../assets/node_images/wait_for_event_node.png';

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
          image: promptNodeImage,
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
          image: chunkNodeImage,
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
          image: toYamlNodeImage,
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
          image: toJsonNodeImage,
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
          image: joinNodeImage,
          description: dedent`
            Takes an array of strings, and joins them using the configured delimiter.

            Defaults to a newline.
          `,
        },
      },
      {
        label: 'Extract With Regex',
        data: 'extractRegex',
        id: 'add-node:extractRegex',
        infoBox: {
          title: 'Extract With Regex Node',
          image: extractRegexNodeImage,
          description: dedent`
            Extracts data from the input text using the configured regular expression. The regular expression can contain capture groups to extract specific parts of the text.

            Each capture group corresponds to an output port of the node.
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
        label: 'Chat (Anthropic)',
        data: 'chatAnthropic',
        id: 'add-node:chatAnthropic',
        infoBox: {
          title: 'Chat (Anthropic) Node',
          description: dedent`
            Makes a call to an Anthropic chat model. The settings contains many options for tweaking the model's behavior.
          `,
        },
      },
      {
        label: 'Assemble Prompt',
        data: 'assemblePrompt',
        id: 'add-node:assemblePrompt',
        infoBox: {
          title: 'Assemble Prompt Node',
          image: assemblePromptNodeImage,
          description: dedent`
            Assembles an array of chat messages for use with a Chat node. The inputs can be strings or chat messages.

            The number of inputs is dynamic based on the number of connections.

            Strings are converted to User type chat messages.
          `,
        },
      },
      {
        label: 'Trim Chat Messages',
        data: 'trimChatMessages',
        id: 'add-node:trimChatMessages',
        infoBox: {
          title: 'Trim Chat Messages Node',
          image: trimChatMessagesNodeImage,
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
          image: gptFunctionNodeImage,
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
          image: getEmbeddingNodeImage,
          description: dedent`
            Gets a OpenAI vector embedding for the input text provided.

            Can be used with the Vector Store and Vector KNN nodes.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:lists',
    label: 'Lists',
    items: [
      {
        label: 'Array',
        data: 'array',
        id: 'add-node:array',
        infoBox: {
          title: 'Array Node',
          image: arrayNodeImage,
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
          image: popNodeImage,
          description: dedent`
            Pops the last value off the input array and outputs the new array and the popped value.

            Can also be used to just extract the last value from an array.
          `,
        },
      },
      {
        label: 'Filter',
        data: 'filter',
        id: 'add-node:filter',
        infoBox: {
          title: 'Filter Node',
          image: filterNodeImage,
          description: dedent`
            Takes in both an array of values, and an array of booleans of the same length, and filters the array where the corresponding boolean is true.
          `,
        },
      },
      {
        label: 'Shuffle',
        data: 'shuffle',
        id: 'add-node:shuffle',
        infoBox: {
          title: 'Shuffle Node',
          image: shuffleNodeImage,
          description: dedent`
            Shuffles the input array. Outputs the shuffled array.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:numbers',
    label: 'Numbers',
    items: [
      {
        label: 'Number',
        data: 'number',
        id: 'add-node:number',
        infoBox: {
          title: 'Number Node',
          image: numberNodeImage,
          description: dedent`
            Outputs a number constant, or converts an input value into a number.

            Can be configured to round the number to a certain number of decimal places.
          `,
        },
      },
      {
        label: 'RNG',
        data: 'randomNumber',
        id: 'add-node:randomNumber',
        infoBox: {
          title: 'RNG Node',
          image: randomNumberNodeImage,
          description: dedent`
            Outputs a random number between the configured min and max values.

            Can be configured to output only integers, and whether the max value is inclusive or exclusive.
          `,
        },
      },
    ],
  },
  {
    id: 'add-node-group:objects',
    label: 'Objects',
    items: [
      {
        label: 'Extract JSON',
        data: 'extractJson',
        id: 'add-node:extractJson',
        infoBox: {
          title: 'Extract JSON Node',
          image: extractJsonNodeImage,
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
          image: extractYamlNodeImage,
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
          image: extractObjectPathNodeImage,
          description: dedent`
            Extracts the value at the specified path from the input value. The path uses JSONPath notation to navigate through the value.
          `,
        },
      },
      {
        label: 'Object',
        data: 'object',
        id: 'add-node:object',
        infoBox: {
          title: 'Object Node',
          description: dedent`
            Creates an object from input values and a JSON template, escaping the input values and inserting them into the template.

            Useful for creating objects from multiple string inputs.
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
        label: 'Hash',
        data: 'hash',
        id: 'add-node:hash',
        infoBox: {
          title: 'Hash Node',
          image: hashNodeImage,
          description: dedent`
            Computes a hash of the input value using the configured hash function.
          `,
        },
      },
      {
        label: 'Bool',
        data: 'boolean',
        id: 'add-node:boolean',
        infoBox: {
          title: 'Bool Node',
          image: boolNodeImage,
          description: dedent`
            Outputs a boolean constant, or converts an input value into a boolean.
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
          image: matchNodeImage,
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
          image: ifNodeImage,
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
          image: ifElseNodeImage,
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
          image: loopControllerNodeImage,
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
          image: coalesceNodeImage,
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
          image: passthroughNodeImage,
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
          image: abortGraphNodeImage,
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
          image: raceInputsNodeImage,
          description: dedent`
            Takes in multiple inputs and outputs the value of the first one to finish. The other inputs are cancelled.
          `,
        },
      },
      {
        label: 'Compare',
        data: 'compare',
        id: 'add-node:compare',
        infoBox: {
          title: 'Compare Node',
          image: compareNodeImage,
          description: dedent`
            Compares two values using the configured operator and outputs the result.

            If the data types of the values do not match, then the B value is converted to the type of the A value.
          `,
        },
      },
      {
        label: 'Evaluate',
        data: 'evaluate',
        id: 'add-node:evaluate',
        infoBox: {
          title: 'Evaluate Node',
          image: evaluateNodeImage,
          description: dedent`
            Evaluates the configured mathematical operation on the input values and outputs the result.

            For more complex operations, you should use the \`Code\` node.
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
          image: graphOutputNodeImage,
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
          image: graphInputNodeImage,
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
          image: userInputNodeImage,
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
          image: readDirectoryNodeImage,
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
          image: readFileNodeImage,
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
          image: vectorStoreNodeImage,
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
          image: vectorKnnNodeImage,
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
          image: subgraphNodeImage,
          description: dedent`
            Executes another graph. Inputs and outputs are defined by Graph Input and Graph Output nodes within the subgraph.
          `,
        },
      },
      {
        label: 'Comment',
        data: 'comment',
        id: 'add-node:comment',
        infoBox: {
          title: 'Comment Node',
          description: dedent`
            A comment node is a node that does nothing. It is useful for adding notes to a graph.
          `,
        },
      },
      {
        label: 'External Call',
        data: 'externalCall',
        id: 'add-node:externalCall',
        infoBox: {
          title: 'External Call Node',
          image: externalCallNodeImage,
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
          image: raiseEventNodeImage,
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
          image: waitForEventNodeImage,
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
          image: codeNodeImage,
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
          image: contextNodeImage,
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
          image: getGlobalNodeImage,
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
          image: setGlobalNodeImage,
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
