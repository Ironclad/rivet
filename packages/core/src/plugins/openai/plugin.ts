import { type RivetPlugin } from '../../index.js';
import { createThreadNode } from './nodes/CreateThreadNode.js';
import { getThreadNode } from './nodes/GetThreadNode.js';
import { deleteThreadNode } from './nodes/DeleteThreadNode.js';
import { createAssistantNode } from './nodes/CreateAssistantNode.js';
import { getAssistantNode } from './nodes/GetAssistantNode.js';
import { listAssistantsNode } from './nodes/ListAssistantsNode.js';
import { deleteAssistantNode } from './nodes/DeleteAssistantNode.js';
import { uploadFileNode } from './nodes/UploadFileNode.js';
import { listOpenAIFilesNode } from './nodes/ListOpenAIFilesNode.js';
import { getOpenAIFileNode } from './nodes/GetOpenAIFileNode.js';
import { attachAssistantFileNode } from './nodes/AttachAssistantFileNode.js';
import { createThreadMessageNode } from './nodes/CreateThreadMessageNode.js';
import { listThreadMessagesNode } from './nodes/ListThreadMessagesNode.js';
import { runThreadNode } from './nodes/RunThreadNode.js';
import { threadMessageNode } from './nodes/ThreadMessageNode.js';

export const openAIPlugin: RivetPlugin = {
  id: 'openai',
  name: 'OpenAI',

  configSpec: {},

  contextMenuGroups: [
    {
      id: 'openai',
      label: 'OpenAI',
    },
  ],

  register(register) {
    register(createThreadNode);
    register(getThreadNode);
    register(deleteThreadNode);
    register(createAssistantNode);
    register(getAssistantNode);
    register(listAssistantsNode);
    register(deleteAssistantNode);
    register(uploadFileNode);
    register(listOpenAIFilesNode);
    register(getOpenAIFileNode);
    register(attachAssistantFileNode);
    register(createThreadMessageNode);
    register(listThreadMessagesNode);
    register(runThreadNode);
    register(threadMessageNode);
  },
};
