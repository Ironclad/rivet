import { encoding_for_model } from '@dqbd/tiktoken';
export const supportedModels = [
    'gpt-4',
    'gpt-4-32k',
    'gpt-4-tools',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-tools',
    //'text-davinci-003', 'code-davinci-002'
];
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
export const modelMaxTokens = {
    'gpt-4': 8192,
    'gpt-4-32k': 32768,
    'gpt-4-tools': 8192,
    'gpt-3.5-turbo': 4096,
    'gpt-3.5-turbo-tools': 4096,
    // 'text-davinci-003': 4097,
    // 'code-davinci-002': 8001,
};
export const modelToTiktokenModel = {
    'gpt-4': 'gpt-4',
    'gpt-4-32k': 'gpt-4-32k',
    'gpt-4-tools': 'gpt-4',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'gpt-3.5-turbo-tools': 'gpt-3.5-turbo',
    // 'text-davinci-003': 'text-davinci-003',
    // 'code-davinci-002': 'code-davinci-002',
};
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
const modelCost = {
    'gpt-4': { prompt: 0.03, completion: 0.06 },
    'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
    'gpt-4-tools': { prompt: 0.03, completion: 0.06 },
    'gpt-3.5-turbo': { prompt: 0.002, completion: 0.002 },
    'gpt-3.5-turbo-tools': { prompt: 0.002, completion: 0.002 },
};
export function getCostForTokens(tokenCount, type, model) {
    const costPerThousand = modelCost[model][type];
    return (tokenCount / 1000) * costPerThousand;
}
export function getCostForPrompt(messages, model) {
    const tokenCount = getTokenCountForMessages(messages, modelToTiktokenModel[model]);
    return getCostForTokens(tokenCount, 'prompt', model);
}
export const modelDisplayNames = {
    'gpt-4': 'GPT-4',
    'gpt-4-32k': 'GPT-4 32k',
    'gpt-4-tools': 'GPT-4 Tools',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-3.5-turbo-tools': 'GPT-3.5 Turbo Tools',
};
export const modelOptions = Object.entries(modelDisplayNames).map(([value, label]) => ({ value, label }));
