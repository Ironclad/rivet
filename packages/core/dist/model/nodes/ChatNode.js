import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { assertValidModel, getCostForPrompt, getCostForTokens, getTokenCountForMessages, getTokenCountForString, modelMaxTokens, modelToTiktokenModel, } from '../../utils/tokenizer';
import { addWarning } from '../../utils/outputs';
import { streamChatCompletions } from '../../utils/openai';
import retry from 'p-retry';
import { match } from 'ts-pattern';
import { expectTypeOptional } from '../../utils/expectType';
import { coerceType } from '../../utils/coerceType';
// Temporary
const cache = new Map();
export class ChatNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'chat',
            title: 'Chat',
            id: nanoid(),
            visualData: {
                x: 0,
                y: 0,
                width: 200,
            },
            data: {
                model: 'gpt-3.5-turbo',
                useModelInput: false,
                temperature: 0.5,
                useTemperatureInput: false,
                top_p: 1,
                useTopPInput: false,
                useTopP: false,
                useUseTopPInput: false,
                maxTokens: 1024,
                useMaxTokensInput: false,
                useStop: false,
                stop: '',
                useStopInput: false,
                presencePenalty: 0,
                usePresencePenaltyInput: false,
                frequencyPenalty: 0,
                useFrequencyPenaltyInput: false,
                cache: false,
            },
        };
        return chartNode;
    }
    getInputDefinitions(connections) {
        const inputs = [];
        inputs.push({
            id: 'systemPrompt',
            title: 'System Prompt',
            dataType: 'string',
            required: false,
        });
        if (this.chartNode.data.useModelInput) {
            inputs.push({
                id: 'model',
                title: 'Model',
                dataType: 'string',
                required: false,
            });
        }
        if (this.chartNode.data.useTemperatureInput) {
            inputs.push({
                dataType: 'number',
                id: 'temperature',
                title: 'Temperature',
            });
        }
        if (this.chartNode.data.useTopPInput) {
            inputs.push({
                dataType: 'number',
                id: 'top_p',
                title: 'Top P',
            });
        }
        if (this.chartNode.data.useUseTopPInput) {
            inputs.push({
                dataType: 'boolean',
                id: 'useTopP',
                title: 'Use Top P',
            });
        }
        if (this.chartNode.data.useMaxTokensInput) {
            inputs.push({
                dataType: 'number',
                id: 'maxTokens',
                title: 'Max Tokens',
            });
        }
        if (this.chartNode.data.useStopInput) {
            inputs.push({
                dataType: 'string',
                id: 'stop',
                title: 'Stop',
            });
        }
        if (this.chartNode.data.usePresencePenaltyInput) {
            inputs.push({
                dataType: 'number',
                id: 'presencePenalty',
                title: 'Presence Penalty',
            });
        }
        if (this.chartNode.data.useFrequencyPenaltyInput) {
            inputs.push({
                dataType: 'number',
                id: 'frequencyPenalty',
                title: 'Frequency Penalty',
            });
        }
        inputs.push({
            dataType: ['chat-message', 'chat-message[]'],
            id: 'prompt',
            title: 'Prompt',
        });
        return inputs;
    }
    getOutputDefinitions() {
        return [
            {
                dataType: 'string',
                id: 'response',
                title: 'Response',
            },
        ];
    }
    async process(inputs, context) {
        const output = {};
        const model = expectTypeOptional(inputs['model'], 'string') ?? this.chartNode.data.model;
        assertValidModel(model);
        const temperature = expectTypeOptional(inputs['temperature'], 'number') ?? this.chartNode.data.temperature;
        const topP = expectTypeOptional(inputs['top_p'], 'number') ?? this.chartNode.data.top_p;
        const useTopP = expectTypeOptional(inputs['useTopP'], 'boolean') ?? this.chartNode.data.useTopP;
        const stop = this.data.useStop
            ? expectTypeOptional(inputs['stop'], 'string') ?? this.chartNode.data.stop
            : undefined;
        const presencePenalty = expectTypeOptional(inputs['presencePenalty'], 'number') ?? this.chartNode.data.presencePenalty;
        const frequencyPenalty = expectTypeOptional(inputs['frequencyPenalty'], 'number') ?? this.chartNode.data.frequencyPenalty;
        const prompt = inputs['prompt'];
        if (!prompt) {
            throw new Error('Prompt is required');
        }
        let messages = match(prompt)
            .with({ type: 'chat-message' }, (p) => [p.value])
            .with({ type: 'chat-message[]' }, (p) => p.value)
            .with({ type: 'string' }, (p) => [{ type: 'user', message: p.value }])
            .with({ type: 'string[]' }, (p) => p.value.map((v) => ({ type: 'user', message: v })))
            .otherwise((p) => {
            if (p.type.endsWith('[]') || ((p.type === 'any' || p.type === 'object') && Array.isArray(p.value))) {
                const stringValues = p.value.map((v) => coerceType({
                    type: p.type.endsWith('[]') ? p.type.replace('[]', '') : p.type,
                    value: v,
                }, 'string'));
                return stringValues.filter((v) => v != null).map((v) => ({ type: 'user', message: v }));
            }
            const coerced = coerceType(p, 'string');
            return coerced != null ? [{ type: 'user', message: coerceType(p, 'string') }] : [];
        });
        console.dir(messages);
        const systemPrompt = inputs['systemPrompt'];
        if (systemPrompt) {
            messages = [{ type: 'system', message: coerceType(systemPrompt, 'string') }, ...messages];
        }
        const completionMessages = messages.map((message) => ({
            content: message.message,
            role: message.type,
        }));
        let { maxTokens } = this.chartNode.data;
        const tokenCount = getTokenCountForMessages(completionMessages, modelToTiktokenModel[model]);
        if (tokenCount >= modelMaxTokens[model]) {
            throw new Error(`The model ${model} can only handle ${modelMaxTokens[model]} tokens, but ${tokenCount} were provided in the prompts alone.`);
        }
        if (tokenCount + maxTokens > modelMaxTokens[model]) {
            const message = `The model can only handle a maximum of ${modelMaxTokens[model]} tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${modelMaxTokens[model] - tokenCount}.`;
            addWarning(output, message);
            maxTokens = Math.floor((modelMaxTokens[model] - tokenCount) * 0.95); // reduce max tokens by 5% to be safe, calculation is a little wrong.
        }
        try {
            return await retry(async () => {
                const cacheKey = JSON.stringify({
                    messages,
                    model,
                    temperature: useTopP ? undefined : temperature,
                    topP: useTopP ? topP : undefined,
                    maxTokens,
                    frequencyPenalty,
                    presencePenalty,
                    stop,
                });
                if (this.data.cache) {
                    const cached = cache.get(cacheKey);
                    if (cached) {
                        return cached;
                    }
                }
                const chunks = streamChatCompletions({
                    auth: {
                        apiKey: context.settings.openAiKey,
                        organization: context.settings.openAiOrganization,
                    },
                    messages: completionMessages,
                    model,
                    temperature: useTopP ? undefined : temperature,
                    top_p: useTopP ? topP : undefined,
                    max_tokens: maxTokens,
                    n: 1,
                    frequency_penalty: frequencyPenalty,
                    presence_penalty: presencePenalty,
                    stop,
                    signal: context.signal,
                });
                let responseParts = [];
                for await (const chunk of chunks) {
                    responseParts.push(chunk);
                    output['response'] = {
                        type: 'string',
                        value: responseParts.join(''),
                    };
                    context.onPartialOutputs?.(output);
                }
                const requestTokenCount = getTokenCountForMessages(completionMessages, model);
                output['requestTokens'] = { type: 'number', value: requestTokenCount };
                const responseTokenCount = getTokenCountForString(responseParts.join(), model);
                output['responseTokens'] = { type: 'number', value: responseTokenCount };
                const cost = getCostForPrompt(completionMessages, model) + getCostForTokens(responseTokenCount, 'completion', model);
                output['cost'] = { type: 'number', value: cost };
                Object.freeze(output);
                cache.set(cacheKey, output);
                return output;
            }, {
                retries: 4,
                signal: context.signal,
                onFailedAttempt(error) {
                    console.log(error);
                },
            });
        }
        catch (error) {
            throw new Error(`Error processing ChatNode: ${error.message}`);
        }
    }
}
