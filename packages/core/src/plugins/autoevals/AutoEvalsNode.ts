import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import {
  Battle,
  ClosedQA,
  Factuality,
  Humor,
  Possible,
  Security,
  Summary,
  Translation,
  Sql,
  type templates,
} from 'autoevals';
import type {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeId,
  NodeImpl,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PluginNodeImpl,
  PortId,
} from '../../index.js';
import { match } from 'ts-pattern';
import { coerceType } from '../../utils/coerceType.js';
import { pluginNodeDefinition } from '../../model/NodeDefinition.js';

export type AutoEvalsNode = ChartNode<'autoevals', AutoEvalsNodeData>;

export type AutoEvalsNodeData = {
  evaluatorName?: keyof typeof templates;
};

const options = [
  { label: 'Factuality', value: 'factuality' },
  { label: 'Humor', value: 'humor' },
  { label: 'Security', value: 'security' },
  { label: 'Possible', value: 'possible' },
  { label: 'Summary', value: 'summary' },
  { label: 'Translation', value: 'translation' },
  { label: 'Battle', value: 'battle' },
  { label: 'Closed Q&A', value: 'closed_q_a' },
  { label: 'SQL', value: 'sql' },
];

export const AutoEvalsNodeImpl: PluginNodeImpl<AutoEvalsNode> = {
  create(): AutoEvalsNode {
    const chartNode: AutoEvalsNode = {
      type: 'autoevals',
      title: 'Autoevals',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        evaluatorName: 'factuality',
      },
    };

    return chartNode;
  },

  getInputDefinitions(data): NodeInputDefinition[] {
    const base: NodeInputDefinition[] = [
      {
        id: 'output' as PortId,
        dataType: 'string',
        title: 'Output',
      },
      {
        id: 'expected' as PortId,
        dataType: 'string',
        title: 'Expected',
      },
    ];

    const forEvaluator: NodeInputDefinition[] = match(data.evaluatorName)
      .with('factuality', (): NodeInputDefinition[] => [
        {
          id: 'input' as PortId,
          dataType: 'string',
          title: 'Input',
        },
      ])
      .with('battle', (): NodeInputDefinition[] => [
        {
          id: 'instructions' as PortId,
          dataType: 'string',
          title: 'Instructions',
        },
      ])
      .with('closed_q_a', (): NodeInputDefinition[] => [
        {
          id: 'input' as PortId,
          dataType: 'string',
          title: 'Input',
        },
        {
          id: 'criteria' as PortId,
          dataType: 'string',
          title: 'Criteria',
        },
      ])
      .with('humor', (): NodeInputDefinition[] => [])
      .with('possible', (): NodeInputDefinition[] => [
        {
          id: 'input' as PortId,
          dataType: 'string',
          title: 'Input',
        },
      ])
      .with('security', (): NodeInputDefinition[] => [])
      .with('summary', (): NodeInputDefinition[] => [
        {
          id: 'input' as PortId,
          dataType: 'string',
          title: 'Input',
        },
      ])
      .with('translation', (): NodeInputDefinition[] => [
        {
          id: 'input' as PortId,
          dataType: 'string',
          title: 'Input',
        },
        {
          id: 'language' as PortId,
          dataType: 'string',
          title: 'Language',
        },
      ])
      .with('sql', (): NodeInputDefinition[] => [
        {
          id: 'input' as PortId,
          dataType: 'string',
          title: 'Input',
        },
      ])
      .with(undefined, (): NodeInputDefinition[] => [])
      .exhaustive();

    return [...forEvaluator, ...base];
  },

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'number',
        id: 'score' as PortId,
        title: 'Score',
      },
      {
        dataType: 'string',
        id: 'rationale' as PortId,
        title: 'Rationale',
      },
      {
        dataType: 'object',
        id: 'metadata' as PortId,
        title: 'Metadata',
      },
    ];
  },

  getEditors(): EditorDefinition<AutoEvalsNode>[] {
    return [
      {
        type: 'dropdown',
        dataKey: 'evaluatorName',
        label: 'Evaluator',
        options,
      },
    ];
  },

  getBody(data): string | undefined {
    return options.find((option) => option.value === data.evaluatorName)?.label ?? 'None';
  },

  getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Evaluates the validity of a response using the autoevals library.
      `,
      infoBoxTitle: 'Autoevals Node',
      contextMenuTitle: 'Autoevals',
      group: 'Custom',
    };
  },

  async process(data, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const evaluatorName = data.evaluatorName;

    const output = coerceType(inputs['output' as PortId], 'string');
    const expected = coerceType(inputs['expected' as PortId], 'string');

    const baseArgs = {
      output,
      expected,
      openAiApiKey: context.settings.openAiKey,
      openAiOrganizationId: context.settings.openAiOrganization,
    };

    const result = await match(evaluatorName)
      .with('factuality', () => {
        const input = coerceType(inputs['input' as PortId], 'string');
        return Factuality({ ...baseArgs, input });
      })
      .with('battle', () => {
        const instructions = coerceType(inputs['instructions' as PortId], 'string');
        return Battle({ ...baseArgs, instructions });
      })
      .with('closed_q_a', () => {
        const input = coerceType(inputs['input' as PortId], 'string');
        const criteria = coerceType(inputs['criteria' as PortId], 'string');
        return ClosedQA({ ...baseArgs, input, criteria });
      })
      .with('humor', () => {
        return Humor({ ...baseArgs });
      })
      .with('possible', () => {
        const input = coerceType(inputs['input' as PortId], 'string');
        return Possible({ ...baseArgs, input });
      })
      .with('security', () => {
        return Security({ ...baseArgs });
      })
      .with('summary', () => {
        const input = coerceType(inputs['input' as PortId], 'string');
        return Summary({ ...baseArgs, input });
      })
      .with('translation', () => {
        const input = coerceType(inputs['input' as PortId], 'string');
        const language = coerceType(inputs['language' as PortId], 'string');
        return Translation({ ...baseArgs, input, language });
      })
      .with('sql', () => {
        const input = coerceType(inputs['input' as PortId], 'string');
        return Sql({ ...baseArgs, input });
      })
      .with(undefined, () => {
        throw new Error('Evaluator name is undefined');
      })
      .exhaustive();

    return {
      ['score' as PortId]: {
        type: 'number',
        value: result.score,
      },
      ['rationale' as PortId]: {
        type: 'string',
        value: (result.metadata?.rationale as string | undefined) ?? '',
      },
      ['metadata' as PortId]: {
        type: 'object',
        value: result.metadata as Record<string, unknown>,
      },
    };
  },
};

export const autoEvalsNode = pluginNodeDefinition(AutoEvalsNodeImpl, 'Autoevals');
