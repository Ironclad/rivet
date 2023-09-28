import { type RivetPlugin } from '../../index.js';
import { chatHuggingFaceNode } from './nodes/ChatHuggingFace.js';
import { textToImageHuggingFaceNode } from './nodes/TextToImageHuggingFace.js';

export const huggingFacePlugin: RivetPlugin = {
  id: 'huggingface',
  name: 'Hugging Face',

  configSpec: {
    huggingFaceAccessToken: {
      type: 'secret',
      label: 'Hugging Face Access Token',
      description: 'Your access token for the Hugging Face API.',
      pullEnvironmentVariable: 'HUGGING_FACE_ACCESS_TOKEN',
      helperText: 'Create at https://huggingface.co/settings/tokens',
    },
  },

  contextMenuGroups: [
    {
      id: 'huggingFace',
      label: 'Hugging Face',
    },
  ],

  register(register) {
    register(chatHuggingFaceNode);
    register(textToImageHuggingFaceNode);
  },
};
