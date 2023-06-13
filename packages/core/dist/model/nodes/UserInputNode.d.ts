import { EditorDefinition, NodeImpl } from '../NodeImpl';
import { ChartNode, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { ArrayDataValue, StringDataValue } from '../DataValue';
import { Outputs, Inputs } from '../..';
export type UserInputNode = ChartNode<'userInput', UserInputNodeData>;
export type UserInputNodeData = {
    prompt: string;
    useInput: boolean;
};
export declare class UserInputNodeImpl extends NodeImpl<UserInputNode> {
    static create(prompt?: string): UserInputNode;
    getInputDefinitions(): NodeInputDefinition[];
    getOutputDefinitions(): NodeOutputDefinition[];
    getEditors(): EditorDefinition<UserInputNode>[];
    process(): Promise<Outputs>;
    getOutputValuesFromUserInput(questions: Inputs, answers: ArrayDataValue<StringDataValue>): Outputs;
}
export declare const userInputNode: import("../NodeImpl").NodeDefinition<UserInputNode>;
