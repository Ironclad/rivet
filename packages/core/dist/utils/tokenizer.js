import { encoding_for_model } from '@dqbd/tiktoken';
export const openaiModels = {
    'gpt-4': {
        maxTokens: 8192,
        tiktokenModel: 'gpt-4',
        cost: {
            prompt: 0.03,
            completion: 0.06,
        },
        displayName: 'GPT-4',
    },
    'gpt-4-32k': {
        maxTokens: 32768,
        tiktokenModel: 'gpt-4-32k',
        cost: {
            prompt: 0.06,
            completion: 0.12,
        },
        displayName: 'GPT-4 32k',
    },
    'gpt-4-0613': {
        maxTokens: 8192,
        tiktokenModel: 'gpt-4',
        cost: {
            prompt: 0.03,
            completion: 0.06,
        },
        displayName: 'GPT-4 (v0613)',
    },
    'gpt-4-32k-0613': {
        maxTokens: 32768,
        tiktokenModel: 'gpt-4',
        cost: {
            prompt: 0.06,
            completion: 0.12,
        },
        displayName: 'GPT-4 32k (v0613)',
    },
    'gpt-3.5-turbo': {
        maxTokens: 4096,
        tiktokenModel: 'gpt-3.5-turbo',
        cost: {
            prompt: 0.002,
            completion: 0.002,
        },
        displayName: 'GPT-3.5 Turbo',
    },
    'gpt-3.5-turbo-0613': {
        maxTokens: 16384,
        tiktokenModel: 'gpt-3.5-turbo',
        cost: {
            prompt: 0.002,
            completion: 0.002,
        },
        displayName: 'GPT-3.5 (v0613)',
    },
};
export const supportedModels = Object.keys(openaiModels);
export function getTokenCountForString(input, model) {
    const encoding = encoding_for_model(model);
    const encoded = encoding.encode(input);
    encoding.free();
    return encoded.length;
}
export function getTokenCountForMessages(messages, model) {
    const encoding = encoding_for_model(model);
    const tokenCount = messages.reduce((sum, message) => {
        const encoded = encoding.encode(JSON.stringify(message));
        return sum + encoded.length;
    }, 0);
    encoding.free();
    return tokenCount;
}
export function assertValidModel(model) {
    if (!supportedModels.includes(model)) {
        throw new Error(`Invalid model: ${model}`);
    }
}
export function chunkStringByTokenCount(input, targetTokenCount, model, overlapPercent) {
    overlapPercent = Number.isNaN(overlapPercent) ? 0 : Math.max(0, Math.min(1, overlapPercent));
    const chunks = [];
    const guess = Math.floor(targetTokenCount * (input.length / getTokenCountForString(input, model)));
    let remaining = input;
    while (remaining.length > 0) {
        chunks.push(remaining.slice(0, guess));
        remaining = remaining.slice(guess - Math.floor(guess * overlapPercent));
    }
    return chunks;
}
export function getCostForTokens(tokenCount, type, model) {
    const costPerThousand = openaiModels[model].cost[type];
    return (tokenCount / 1000) * costPerThousand;
}
export function getCostForPrompt(messages, model) {
    const tokenCount = getTokenCountForMessages(messages, openaiModels[model].tiktokenModel);
    return getCostForTokens(tokenCount, 'prompt', model);
}
export const modelOptions = Object.entries(openaiModels).map(([id, { displayName }]) => ({
    value: id,
    label: displayName,
}));
