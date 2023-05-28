import fetchEventSource from './fetchEventSource';
// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285
export class OpenAIError extends Error {
    status;
    responseJson;
    constructor(status, responseJson) {
        super(`OpenAIError: ${status} ${JSON.stringify(responseJson)}`);
        this.status = status;
        this.responseJson = responseJson;
        this.name = 'OpenAIError';
    }
}
export async function* streamChatCompletions({ auth, signal, model, messages, temperature, top_p, max_tokens, n, stop, presence_penalty, frequency_penalty, logit_bias, }) {
    const defaultSignal = new AbortController().signal;
    const response = await fetchEventSource('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.apiKey}`,
            ...(auth.organization ? { 'OpenAI-Organization': auth.organization } : {}),
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature,
            top_p,
            max_tokens,
            n,
            stop,
            presence_penalty,
            frequency_penalty,
            logit_bias,
        }),
        signal: signal ?? defaultSignal,
    });
    for await (const chunk of response.events()) {
        if (chunk === '[DONE]') {
            return;
        }
        let data;
        try {
            data = JSON.parse(chunk);
        }
        catch (err) {
            console.error('JSON parse failed on chunk: ', chunk);
            throw err;
        }
        const text = data?.choices?.[0]?.delta?.content ?? '';
        if (typeof text === 'string' && text.length > 0) {
            yield text;
        }
    }
}
