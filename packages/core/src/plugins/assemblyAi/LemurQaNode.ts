import { nanoid } from 'nanoid';
import { dedent } from 'ts-dedent';
import {
  AnyDataValue,
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
  PortId,
  StringArrayDataValue,
  StringDataValue,
  coerceType,
  nodeDefinition,
  ObjectDataValue,
  ArrayDataValue
} from '../../index.js';
import { LemurNodeData, LemurParams, getApiKey, getLemurParams, lemurEditorDefinitions } from './lemurHelpers.js';

export type LemurQaNode = ChartNode<'assemblyAiLemurQa', LemurQaNodeData>;

export type LemurQaNodeData = LemurNodeData & {
  questions_answer_format?: string;
  questions_context?: string;
  questions_answer_options?: string;
};

export class LemurQaNodeImpl extends NodeImpl<LemurQaNode> {
  static create(): LemurQaNode {
    const chartNode: LemurQaNode = {
      type: 'assemblyAiLemurQa',
      title: 'LeMUR Question & Answers',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        final_model: 'default'
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'transcript_ids' as PortId,
        dataType: ['string', 'string[]'],
        title: 'Transcript IDs',
      },
      {
        id: 'questions' as PortId,
        dataType: ['string', 'string[]', 'object', 'object[]', 'any', 'any[]'],
        title: 'Questions',
      },
      {
        id: 'context' as PortId,
        dataType: 'string',
        title: 'Context',
      }
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'object[]',
        id: 'response' as PortId,
        title: 'Response',
      },
    ];
  }

  getEditors(): EditorDefinition<LemurQaNode>[] {
    return [
      {
        type: 'string',
        label: 'Context',
        dataKey: 'context'
      },
      ...lemurEditorDefinitions as unknown as EditorDefinition<LemurQaNode>[],
      {
        type: 'string',
        label: 'Questions Answer Format',
        dataKey: 'questions_answer_format'
      },
      {
        type: 'string',
        label: 'Questions Context',
        dataKey: 'questions_context'
      },
      {
        type: 'string',
        label: 'Questions Answer Options',
        dataKey: 'questions_answer_options'
      }
    ];
  }

  getBody(): string | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`Use AssemblyAI LeMUR to ask questions about transcripts`,
      infoBoxTitle: 'Use AssemblyAI LeMUR Question & Answer',
      contextMenuTitle: 'LeMUR Q&A',
      group: ['AI', 'AssemblyAI'],
    };
  }

  getQuestions(inputs: Inputs): Question[] {
    const input = inputs['questions' as PortId] as StringDataValue
      | StringArrayDataValue
      | AnyDataValue
      | ObjectDataValue
      | ArrayDataValue<ObjectDataValue>
      | ArrayDataValue<AnyDataValue>;

    if (!input) throw new Error('Transcript IDs are required.');

    if (input.type === 'string') {
      return [{
        question: coerceType(input, 'string')
      }];
    } else if (input.type === 'string[]') {
      return coerceType(input, 'string[]')
        .map(question => ({ question }));
    } else if (input.type === 'object') {
      return [coerceType(input, 'object')] as Question[];
    } else if (input.type === 'object[]') {
      return coerceType(input, 'object[]') as unknown as Question[];
    } else if (input.type === 'any' && typeof input.value === 'string') {
      return [{
        question: coerceType(input, 'string')
      }];
    } else if ((input.type === 'any' && Array.isArray(input.value)) || input.type === 'any[]') {
      return (input.value as any[]).map<Question>((question: any) => {
        if (typeof question === 'string') {
          return { question };
        } else if (typeof question === 'object') {
          return question as Question;
        } else {
          throw new Error('Question must be a string or object.');
        }
      });
    }
    throw new Error('Audio input must be a string, string[], a question object, or an array of question objects.');
  }

  applyQuestionEditors(question: Question): Question {
    if (!('answer_format' in question) && this.chartNode.data.questions_answer_format) {
      question.answer_format = this.chartNode.data.questions_answer_format;
    }
    if (!('answer_options' in question) && this.chartNode.data.questions_answer_options) {
      question.answer_options = this.chartNode.data.questions_answer_options.split(';');
    }
    if (!('context' in question) && this.chartNode.data.questions_context) {
      question.context = this.chartNode.data.questions_context;
    }

    return question;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const apiKey = getApiKey(context);

    const questions = this.getQuestions(inputs)
      .map(this.applyQuestionEditors.bind(this));

    const params: LemurParams & {
      questions: Question[],
    } = {
      questions,
      ...getLemurParams(inputs, this.chartNode.data)
    };

    const { response } = await runLemurQa(apiKey, params);
    return {
      ['response' as PortId]: {
        type: 'object[]',
        value: response,
      },
    };
  }
}

async function runLemurQa(
  apiToken: string,
  params: object
) {
  const response = await fetch('https://api.assemblyai.com/lemur/v3/generate/question-answer',
    {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        authorization: apiToken
      }
    }
  );
  const body = await response.json();
  if (response.status !== 200) {
    if ('error' in body) throw new Error(body.error);
    throw new Error(`LeMUR QA failed with status ${response.status}`);
  }

  return body as { response: QuestionAnswer[] };
}

type Question = {
  question: string;
  context?: string;
  answer_format?: string;
  answer_options?: string[];
};
type QuestionAnswer = {
  question: string;
  answer: string;
};

export const lemurQaNode = nodeDefinition(LemurQaNodeImpl, 'LeMUR Q&A');
