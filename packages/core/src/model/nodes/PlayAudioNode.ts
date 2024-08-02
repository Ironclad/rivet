import {
  type ChartNode,
  type NodeId,
  type PortId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nanoid } from 'nanoid/non-secure';
import { type EditorDefinition, type Inputs, type InternalProcessContext, type Outputs } from '../../index.js';
import { expectType } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type PlayAudioNode = ChartNode<'playAudio', PlayAudioNodeData>;

type PlayAudioNodeData = {};

export class PlayAudioNodeImpl extends NodeImpl<PlayAudioNode> {
  static create(): PlayAudioNode {
    return {
      id: nanoid() as NodeId,
      type: 'playAudio',
      title: 'Play Audio',
      visualData: { x: 0, y: 0, width: 200 },
      data: {},
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    inputDefinitions.push({
      id: 'data' as PortId,
      title: 'Data',
      dataType: 'audio',
      coerced: false,
    });

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'data' as PortId,
        title: 'Audio Data',
        dataType: 'audio',
      },
    ];
  }

  getEditors(): EditorDefinition<PlayAudioNode>[] {
    return [];
  }

  static getUIData(): NodeUIData {
    return {
      contextMenuTitle: 'Play Audio',
      group: 'Input/Output',
      infoBoxTitle: 'Play Audio Node',
      infoBoxBody: 'Plays audio data to the speakers.',
    };
  }

  async process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs> {
    if (!context.audioProvider) {
      throw new Error('Playing audio is not supported in this context');
    }

    const data = expectType(inputData['data' as PortId], 'audio');

    await context.audioProvider.playAudio({ type: 'audio', value: data }, context.signal);

    return {
      ['data' as PortId]: {
        type: 'audio',
        value: data,
      },
    };
  }
}

export const playAudioNode = nodeDefinition(PlayAudioNodeImpl, 'Play Audio');
