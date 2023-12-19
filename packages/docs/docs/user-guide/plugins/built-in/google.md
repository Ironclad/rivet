---
sidebar_label: Google
---

# Google Plugin

The Google plugin allows you to use Vertex AI to access models like Gemini.

:::info

You must use the [node executor](../../executors.md) to use the Google plugin in the Rivet UI. You may also use the plugin when embedding Rivet in your own application.

:::

## Configuration

Before you start, you must create a service account key. The service account key is a JSON file that you download, and then set the env variable `GOOGLE_APPLICATION_CREDENTIALS` to the location of. See [Google's "Install the Vertex AI client libraries"](https://cloud.google.com/vertex-ai/docs/start/client-libraries) article.

Then, you must add your GCP Project ID, Region, and the location of your application credentials to the Rivet settings panel, once the Google plugin has been enabled. See [Settings](../../../getting-started/setup.md) for more information.

## Nodes

### Chat (Google) Node

The Chat (Google) node allows you to use the Google Vertex API to generate text.

#### Inputs

| Title  | Data Type                                                    | Description                                       | Default Value | Notes                                                                                                                                                      |
| ------ | ------------------------------------------------------------ | ------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prompt | `string` or `string[]` or `chat-message` or `chat-message[]` | The messages to send to Google to get a response. | (Required)    | Google models do not support a system prompt like GPT does. System prompts will be converted to Asssistant prompts. |

#### Outputs

| Title    | Data Type | Description                      | Notes |
| -------- | --------- | -------------------------------- | ----- |
| Response | `string`  | The response message from Google |       |

#### Editor Settings

| Setting     | Description                                                                                                            | Default Value | Use Input Toggle | Input Data Type |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------- | --------------- |
| Model       | The Google model to use for the request (Gemini Pro, Gemini Pro Vision, etc)                                            | gemini-pro      | Yes              | `string`        |
| Temperature | The sampling temperature to use. Lower values are more deterministic. Higher values are more "creative".               | 0.5           | Yes              | `number`        |
| Top P       | Alternate sampling mode using the top X% of values. 0.1 corresponds to the top 10%.                                    | 1             | Yes              | `number`        |
| Use Top P   | Whether to use the Top P sampling mode.                                                                                | false         | Yes              | `boolean`       |
| Max Tokens  | The maximum number of tokens that GPT is allowed to return. When hitting the max tokens, the response will be cut off. | 1024          | Yes              | `number`        |
