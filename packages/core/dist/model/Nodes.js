import { UserInputNodeImpl } from './nodes/UserInputNode';
import { TextNodeImpl } from './nodes/TextNode';
import { ChatNodeImpl } from './nodes/ChatNode';
import { PromptNodeImpl } from './nodes/PromptNode';
import { ExtractRegexNodeImpl } from './nodes/ExtractRegexNode';
import { CodeNodeImpl } from './nodes/CodeNode';
import { MatchNodeImpl } from './nodes/MatchNode';
import { IfNodeImpl } from './nodes/IfNode';
import { ReadDirectoryNodeImpl } from './nodes/ReadDirectoryNode';
import { ReadFileNodeImpl } from './nodes/ReadFileNode';
import { IfElseNodeImpl } from './nodes/IfElseNode';
import { ChunkNodeImpl } from './nodes/ChunkNode';
import { GraphInputNodeImpl } from './nodes/GraphInputNode';
import { GraphOutputNodeImpl } from './nodes/GraphOutputNode';
import { SubGraphNodeImpl } from './nodes/SubGraphNode';
import { ArrayNodeImpl } from './nodes/ArrayNode';
import { ExtractJsonNodeImpl } from './nodes/ExtractJsonNode';
import { AssemblePromptNodeImpl } from './nodes/AssemblePromptNode';
import { LoopControllerNodeImpl } from './nodes/LoopControllerNode';
import { TrimChatMessagesNodeImpl } from './nodes/TrimChatMessagesNode';
import { ExtractYamlNodeImpl } from './nodes/ExtractYamlNode';
import { ExternalCallNodeImpl } from './nodes/ExternalCallNode';
import { ExtractObjectPathNodeImpl } from './nodes/ExtractObjectPathNode';
import { RaiseEventNodeImpl } from './nodes/RaiseEventNode';
import { ContextNodeImpl } from './nodes/ContextNode';
import { CoalesceNodeImpl } from './nodes/CoalesceNode';
import { PassthroughNodeImpl } from './nodes/PassthroughNode';
import { PopNodeImpl } from './nodes/PopNode';
import { SetGlobalNodeImpl } from './nodes/SetGlobalNode';
import { GetGlobalNodeImpl } from './nodes/GetGlobalNode';
export * from './nodes/UserInputNode';
export * from './nodes/TextNode';
export * from './nodes/ChatNode';
export * from './nodes/PromptNode';
export * from './nodes/ExtractRegexNode';
export * from './nodes/CodeNode';
export * from './nodes/MatchNode';
export * from './nodes/IfNode';
export * from './nodes/ReadDirectoryNode';
export * from './nodes/ReadFileNode';
export * from './nodes/IfElseNode';
export * from './nodes/ChunkNode';
export * from './nodes/GraphInputNode';
export * from './nodes/GraphOutputNode';
export * from './nodes/SubGraphNode';
export * from './nodes/ArrayNode';
export * from './nodes/ExtractJsonNode';
export * from './nodes/ExtractYamlNode';
export * from './nodes/AssemblePromptNode';
export * from './nodes/LoopControllerNode';
export * from './nodes/TrimChatMessagesNode';
export * from './nodes/ExternalCallNode';
export * from './nodes/ExtractObjectPathNode';
export * from './nodes/RaiseEventNode';
export * from './nodes/ContextNode';
export * from './nodes/CoalesceNode';
export * from './nodes/PassthroughNode';
export * from './nodes/PopNode';
export * from './nodes/SetGlobalNode';
export * from './nodes/GetGlobalNode';
const nodeImpls = {
    userInput: UserInputNodeImpl,
    text: TextNodeImpl,
    chat: ChatNodeImpl,
    prompt: PromptNodeImpl,
    extractRegex: ExtractRegexNodeImpl,
    code: CodeNodeImpl,
    match: MatchNodeImpl,
    if: IfNodeImpl,
    readDirectory: ReadDirectoryNodeImpl,
    readFile: ReadFileNodeImpl,
    ifElse: IfElseNodeImpl,
    chunk: ChunkNodeImpl,
    graphInput: GraphInputNodeImpl,
    graphOutput: GraphOutputNodeImpl,
    subGraph: SubGraphNodeImpl,
    array: ArrayNodeImpl,
    extractJson: ExtractJsonNodeImpl,
    extractYaml: ExtractYamlNodeImpl,
    extractObjectPath: ExtractObjectPathNodeImpl,
    assemblePrompt: AssemblePromptNodeImpl,
    loopController: LoopControllerNodeImpl,
    trimChatMessages: TrimChatMessagesNodeImpl,
    externalCall: ExternalCallNodeImpl,
    raiseEvent: RaiseEventNodeImpl,
    context: ContextNodeImpl,
    coalesce: CoalesceNodeImpl,
    passthrough: PassthroughNodeImpl,
    pop: PopNodeImpl,
    setGlobal: SetGlobalNodeImpl,
    getGlobal: GetGlobalNodeImpl,
};
export const createNodeInstance = (node) => {
    return new nodeImpls[node.type](node);
};
export function createUnknownNodeInstance(node) {
    return createNodeInstance(node);
}
const nodeFactories = {
    userInput: () => UserInputNodeImpl.create(),
    text: () => TextNodeImpl.create(),
    chat: () => ChatNodeImpl.create(),
    prompt: () => PromptNodeImpl.create(),
    extractRegex: () => ExtractRegexNodeImpl.create(),
    code: () => CodeNodeImpl.create(),
    match: () => MatchNodeImpl.create(),
    if: () => IfNodeImpl.create(),
    readDirectory: () => ReadDirectoryNodeImpl.create(),
    readFile: () => ReadFileNodeImpl.create(),
    ifElse: () => IfElseNodeImpl.create(),
    chunk: () => ChunkNodeImpl.create(),
    graphInput: () => GraphInputNodeImpl.create(),
    graphOutput: () => GraphOutputNodeImpl.create(),
    subGraph: () => SubGraphNodeImpl.create(),
    array: () => ArrayNodeImpl.create(),
    extractJson: () => ExtractJsonNodeImpl.create(),
    extractYaml: () => ExtractYamlNodeImpl.create(),
    extractObjectPath: () => ExtractObjectPathNodeImpl.create(),
    assemblePrompt: () => AssemblePromptNodeImpl.create(),
    loopController: () => LoopControllerNodeImpl.create(),
    trimChatMessages: () => TrimChatMessagesNodeImpl.create(),
    externalCall: () => ExternalCallNodeImpl.create(),
    raiseEvent: () => RaiseEventNodeImpl.create(),
    context: () => ContextNodeImpl.create(),
    coalesce: () => CoalesceNodeImpl.create(),
    passthrough: () => PassthroughNodeImpl.create(),
    pop: () => PopNodeImpl.create(),
    setGlobal: () => SetGlobalNodeImpl.create(),
    getGlobal: () => GetGlobalNodeImpl.create(),
};
export function nodeFactory(type) {
    return nodeFactories[type]();
}
export const nodeDisplayName = {
    userInput: 'User Input',
    text: 'Text',
    chat: 'Chat',
    prompt: 'Prompt',
    assemblePrompt: 'Assemble Prompt',
    extractRegex: 'Extract With Regex',
    extractJson: 'Extract JSON',
    code: 'Code',
    match: 'Match',
    if: 'If',
    ifElse: 'If/Else',
    loopController: 'Loop Controller',
    readDirectory: 'Read Directory',
    readFile: 'Read File',
    chunk: 'Chunk',
    graphInput: 'Graph Input',
    graphOutput: 'Graph Output',
    subGraph: 'Subgraph',
    array: 'Array',
    trimChatMessages: 'Trim Chat Messages',
    extractYaml: 'Extract YAML',
    externalCall: 'External Call',
    extractObjectPath: 'Extract Object Path',
    raiseEvent: 'Raise Event',
    context: 'Context',
    coalesce: 'Coalesce',
    passthrough: 'Passthrough',
    pop: 'Pop',
    setGlobal: 'Set Global',
    getGlobal: 'Get Global',
};
