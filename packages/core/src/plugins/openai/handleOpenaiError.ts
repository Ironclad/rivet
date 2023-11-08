export async function handleOpenAIError(response: Response) {
  if (!response.ok) {
    let errorBody: any;
    try {
      errorBody = await response.json();
    } catch (err) {
      throw new Error(`OpenAI request failed, no JSON body. Status code: ${response.status}`);
    }

    if (errorBody?.error?.message) {
      throw new Error(errorBody.error.message);
    } else {
      throw new Error(`OpenAI request failed with body. Status code: ${response.status}: ${JSON.stringify(errorBody)}`);
    }
  }
}
