import { type BuiltInNodeType } from '@ironclad/rivet-core';

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
import delayNodeImage from '../assets/node_images/delay_node.png';
import commentNodeImage from '../assets/node_images/comment_node.png';
import objectNodeImage from '../assets/node_images/object_node.png';
import audioNodeImage from '../assets/node_images/audio_node.png';
import imageNodeImage from '../assets/node_images/image_node.png';
import httpCallNodeImage from '../assets/node_images/http_call_node.png';
import appendToDatasetNodeImage from '../assets/node_images/append_to_dataset_node.png';
import createDatasetNodeImage from '../assets/node_images/create_dataset_node.png';
import datasetNearestNeighborsNodeImage from '../assets/node_images/dataset_nearest_neighbors_node.png';
import getAllDatasetsNodeImage from '../assets/node_images/get_all_datasets_node.png';
import loadDatasetNodeImage from '../assets/node_images/load_dataset_node.png';
import splitNodeImage from '../assets/node_images/split_node.png';
import getDatasetRowNodeImage from '../assets/node_images/get_dataset_row_node.png';
import sliceNodeImage from '../assets/node_images/slice_node.png';
import extractMarkdownCodeBlocksImage from '../assets/node_images/extract_markdown_code_blocks_node.png';
import assembleMessageNodeImage from '../assets/node_images/assemble_message_node.png';
import urlReferenceNodeImage from '../assets/node_images/url_reference_node.png';
import destructureNodeImage from '../assets/node_images/destructure_node.png';
import replaceDatasetNodeImage from '../assets/node_images/replace_dataset_node.png';
import listGraphsNodeImage from '../assets/node_images/list_graphs_node.png';
import graphReferenceNodeImage from '../assets/node_images/graph_reference_node.png';
import callGraphNodeImage from '../assets/node_images/call_graph_node.png';

export const useBuiltInNodeImages = (): Record<BuiltInNodeType, string> => {
  return {
    text: textNodeImage,
    chat: chatNodeImage,
    chunk: chunkNodeImage,
    prompt: promptNodeImage,
    toYaml: toYamlNodeImage,
    toJson: toJsonNodeImage,
    join: joinNodeImage,
    assemblePrompt: assemblePromptNodeImage,
    trimChatMessages: trimChatMessagesNodeImage,
    gptFunction: gptFunctionNodeImage,
    getEmbedding: getEmbeddingNodeImage,
    extractRegex: extractRegexNodeImage,
    extractJson: extractJsonNodeImage,
    extractYaml: extractYamlNodeImage,
    extractObjectPath: extractObjectPathNodeImage,
    array: arrayNodeImage,
    pop: popNodeImage,
    hash: hashNodeImage,
    filter: filterNodeImage,
    boolean: boolNodeImage,
    number: numberNodeImage,
    compare: compareNodeImage,
    evaluate: evaluateNodeImage,
    match: matchNodeImage,
    if: ifNodeImage,
    ifElse: ifElseNodeImage,
    loopController: loopControllerNodeImage,
    coalesce: coalesceNodeImage,
    passthrough: passthroughNodeImage,
    abortGraph: abortGraphNodeImage,
    raceInputs: raceInputsNodeImage,
    randomNumber: randomNumberNodeImage,
    shuffle: shuffleNodeImage,
    code: codeNodeImage,
    context: contextNodeImage,
    externalCall: externalCallNodeImage,
    getGlobal: getGlobalNodeImage,
    graphInput: graphInputNodeImage,
    graphOutput: graphOutputNodeImage,
    raiseEvent: raiseEventNodeImage,
    readDirectory: readDirectoryNodeImage,
    readFile: readFileNodeImage,
    setGlobal: setGlobalNodeImage,
    subGraph: subgraphNodeImage,
    userInput: userInputNodeImage,
    vectorNearestNeighbors: vectorKnnNodeImage,
    vectorStore: vectorStoreNodeImage,
    waitForEvent: waitForEventNodeImage,
    delay: delayNodeImage,
    comment: commentNodeImage,
    object: objectNodeImage,
    audio: audioNodeImage,
    image: imageNodeImage,
    httpCall: httpCallNodeImage,
    appendToDataset: appendToDatasetNodeImage,
    createDataset: createDatasetNodeImage,
    datasetNearestNeighbors: datasetNearestNeighborsNodeImage,
    getAllDatasets: getAllDatasetsNodeImage,
    loadDataset: loadDatasetNodeImage,
    split: splitNodeImage,
    getDatasetRow: getDatasetRowNodeImage,
    slice: sliceNodeImage,
    extractMarkdownCodeBlocks: extractMarkdownCodeBlocksImage,
    assembleMessage: assembleMessageNodeImage,
    urlReference: urlReferenceNodeImage,
    destructure: destructureNodeImage,
    replaceDataset: replaceDatasetNodeImage,
    listGraphs: listGraphsNodeImage,
    graphReference: graphReferenceNodeImage,
    callGraph: callGraphNodeImage,
  };
};
