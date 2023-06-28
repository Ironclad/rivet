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
export async function* streamChatCompletions({ auth, signal, ...rest }) {
    const defaultSignal = new AbortController().signal;
    const response = await fetchEventSource('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.apiKey}`,
            ...(auth.organization ? { 'OpenAI-Organization': auth.organization } : {}),
        },
        body: JSON.stringify({
            ...rest,
            stream: true,
        }),
        signal: signal ?? defaultSignal,
    });
    let hadChunks = false;
    for await (const chunk of response.events()) {
        hadChunks = true;
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
        yield data;
    }
    if (!hadChunks) {
        const responseJson = await response.json();
        throw new OpenAIError(response.status, responseJson);
    }
}
