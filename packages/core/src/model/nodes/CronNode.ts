import { nanoid } from 'nanoid';
import type { DataValue } from '../DataValue.js';
import type { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import type { GraphId } from '../NodeGraph.js';
import { NodeImpl, type NodeBody } from '../NodeImpl.js';
import { dedent } from 'ts-dedent';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { InternalProcessContext } from '../ProcessContext.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType.js';
import * as cronParser from 'cron-parser';

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks';
type ScheduleType = 'interval' | 'cron';

interface IntervalSchedule {
  type: 'interval';
  value: number;
  unit: TimeUnit;
}

interface CronSchedule {
  type: 'cron';
  expression: string;
}

type Schedule = IntervalSchedule | CronSchedule;

export type CronNode = ChartNode<'cron', CronNodeData>;

export type CronNodeData = {
  targetGraph: GraphId | undefined;
  scheduleType: ScheduleType;
  schedule: string;
  executeImmediately?: boolean;

  useTargetGraphInput?: boolean;
};

export class CronNodeImpl extends NodeImpl<CronNode> {
  static create(): CronNode {
    const chartNode: CronNode = {
      type: 'cron',
      title: 'Cron',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        targetGraph: undefined,
        scheduleType: 'interval',
        schedule: '5 minutes',
        executeImmediately: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'trigger' as PortId,
      title: 'Trigger',
      dataType: 'boolean',
      description: 'Starts the scheduled job when true.',
    });

    if (this.data.useTargetGraphInput) {
      inputs.push({
        id: 'targetGraph' as PortId,
        title: 'Target Graph',
        dataType: 'string',
        description: 'The subgraph to execute on schedule',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Last Output',
        dataType: 'any',
        description: 'The last output from the subgraph execution.',
      },
      {
        id: 'iteration' as PortId,
        title: 'Iteration',
        dataType: 'number',
        description: 'The current iteration number.',
      },
      {
        id: 'completed' as PortId,
        title: 'Completed',
        dataType: 'boolean',
        description: 'True when the job has completed.',
      },
      {
        id: 'nextRun' as PortId,
        title: 'Next Run',
        dataType: 'string',
        description: 'The scheduled time for the next execution.',
      },
    ];
  }

  static getUIData() {
    return {
      infoBoxBody: dedent`
        Executes a subgraph on a schedule. Supports:
        - Natural language (e.g., "every 5 minutes", "daily at 3pm")
        - Cron expressions (e.g., "0 * * * *")
        - Simple intervals (e.g., "5 minutes", "1 hour")
      `,
      infoBoxTitle: 'Cron Node',
      contextMenuTitle: 'Cron',
      group: ['Advanced'],
    };
  }

  getEditors(): EditorDefinition<CronNode>[] {
    return [
      {
        type: 'toggle',
        dataKey: 'executeImmediately',
        label: 'Execute Immediately',
        helperMessage: 'Starts the job immediately when the node is run, in addition to the schedule',
      },
      {
        type: 'graphSelector',
        dataKey: 'targetGraph',
        useInputToggleDataKey: 'useTargetGraphInput',
        label: 'Target Graph',
        helperMessage: 'The subgraph to execute on schedule',
      },
      {
        type: 'dropdown',
        dataKey: 'scheduleType',
        label: 'Schedule Type',
        options: [
          { label: 'Cron Expression', value: 'cron' },
          { label: 'Simple Interval', value: 'interval' },
        ],
        helperMessage: 'How to specify the schedule',
      },
      {
        type: 'string',
        dataKey: 'schedule',
        label: 'Schedule',
        helperMessage: dedent`
          Examples:
          Cron: "*/5 * * * *", "0 15 * * *"
          Interval: "5 minutes", "1 hour", "7 days"
        `,
      },
    ];
  }

  private parseSchedule(): Schedule {
    const { scheduleType, schedule } = this.data;

    if (scheduleType === 'cron') {
      return { type: 'cron', expression: schedule };
    }

    // Parse interval
    const match = schedule.match(/^(\d+)\s*(second|seconds|minute|minutes|hour|hours|day|days|week|weeks)$/i);
    if (!match) {
      throw new Error('Invalid interval format. Expected: "number unit" (e.g., "5 minutes")');
    }

    const value = parseInt(match[1]!, 10);
    let unit = match[2]!.toLowerCase() as TimeUnit;

    // Normalize unit to plural
    if (unit.endsWith('s')) {
      unit = unit as TimeUnit;
    } else {
      unit = `${unit}s` as TimeUnit;
    }

    return { type: 'interval', value, unit };
  }

  private getNextRunTime(schedule: Schedule): Date {
    const now = new Date();

    if (schedule.type === 'interval') {
      const { value, unit } = schedule;
      const next = new Date(now);

      switch (unit) {
        case 'seconds':
          next.setSeconds(now.getSeconds() + value);
          break;
        case 'minutes':
          next.setMinutes(now.getMinutes() + value);
          break;
        case 'hours':
          next.setHours(now.getHours() + value);
          break;
        case 'days':
          next.setDate(now.getDate() + value);
          break;
        case 'weeks':
          next.setDate(now.getDate() + value * 7);
          break;
      }

      return next;
    }

    if (schedule.type === 'cron') {
      const cron = cronParser.parseExpression(schedule.expression, { currentDate: now });

      const next = cron.next().toDate();
      return next;
    }

    throw new Error('Invalid schedule type');
  }

  getBody(context: RivetUIContext): NodeBody {
    if (!this.data.targetGraph && !this.data.useTargetGraphInput) {
      return 'No target graph selected';
    }

    const graphName = this.data.useTargetGraphInput
      ? 'graph from input'
      : context.project.graphs[this.data.targetGraph!]?.metadata?.name ?? 'Unknown Graph';
    return `Executes ${graphName}\n${this.data.schedule}`;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    if (inputs['trigger' as PortId] !== undefined) {
      const trigger = coerceTypeOptional(inputs['trigger' as PortId], 'boolean');

      if (!trigger) {
        return {
          ['completed' as PortId]: { type: 'boolean', value: false },
          ['iteration' as PortId]: { type: 'number', value: 0 },
        };
      }
    }

    if (!this.data.targetGraph) {
      throw new Error('No target graph selected');
    }

    let iteration = 0;
    const schedule = this.parseSchedule();

    let lastOutputs: Outputs = {};

    let didExecuteFirstTime = !this.data.executeImmediately;

    while (!context.signal.aborted) {
      const nextRun = didExecuteFirstTime ? this.getNextRunTime(schedule) : new Date();
      const delay = nextRun.getTime() - Date.now();

      didExecuteFirstTime = true;

      // Emit the next run time
      const outputs: Outputs = {
        ['output' as PortId]: lastOutputs
          ? { type: 'object', value: lastOutputs as Record<string, unknown> }
          : {
              type: 'any',
              value: null,
            },
        ['iteration' as PortId]: { type: 'number', value: iteration },
        ['completed' as PortId]: { type: 'boolean', value: false },
        ['nextRun' as PortId]: { type: 'string', value: nextRun.toISOString() },
      };

      if (delay > 0) {
        await new Promise((resolve) => {
          context.signal.addEventListener('abort', resolve, { once: true });

          setTimeout(resolve, delay);
        });
      }

      if (context.signal.aborted) {
        throw new Error('Aborted');
      }

      iteration++;

      const subprocessor = context.createSubProcessor(this.data.targetGraph, { signal: context.signal });
      lastOutputs = await subprocessor.processGraph(
        context,
        lastOutputs as Record<string, DataValue>,
        context.contextValues,
      );

      // Check for break signal
      const breakSignal = coerceTypeOptional(lastOutputs['break' as PortId], 'boolean');
      if (breakSignal === true) {
        return {
          ...outputs,
          ['completed' as PortId]: { type: 'boolean', value: true },
        };
      }
    }

    return {
      ['output' as PortId]: lastOutputs
        ? { type: 'object', value: lastOutputs as Record<string, unknown> }
        : { type: 'any', value: null },
      ['iteration' as PortId]: { type: 'number', value: iteration },
      ['completed' as PortId]: { type: 'boolean', value: true },
      ['nextRun' as PortId]: { type: 'string', value: new Date().toISOString() },
    };
  }
}

export const cronNode = nodeDefinition(CronNodeImpl, 'Cron');
