import dedent from 'ts-dedent';
import AnthropicLogo from './assets/vendor_logos/anthropic-logo.png';
import AssemblyAiLogo from './assets/vendor_logos/assemblyAI-logo.png';
import RivetLogo from './assets/vendor_logos/rivet-logo.png';
import GentraceLogo from './assets/vendor_logos/gentrace.svg';
import HuggingFaceLogo from './assets/vendor_logos/hf-logo.svg';
import MongoDBLogo from './assets/vendor_logos/MongoDB_Logomark_ForestGreen.svg';
import PineconeLogo from './assets/vendor_logos/pinecone-logo.png';
import OpenAILogo from './assets/vendor_logos/openai-white-logomark.svg';
import ChromaLogo from './assets/vendor_logos/chroma.svg';
import OllamaLogo from './assets/vendor_logos/ollama-logo.png';
import BraintrustLogo from './assets/vendor_logos/braintrust_data_logo.jpeg';
import PythonLogo from './assets/vendor_logos/Python-logo.svg.png';
import FolderLogo from './assets/vendor_logos/folder-icon.png';
import GoogleLogo from './assets/vendor_logos/google-logo.png';
import PDF2MDLogo from './assets/vendor_logos/pdf2md-logo.png';
import TransformerLabLogo from './assets/vendor_logos/transformerlab-logo.svg';

type SharedPluginInfo = {
  id: string;
  name: string;
  description: string;

  author: string;
  authorLink?: string;

  github?: string;
  documentation?: string;
  website?: string;

  logoImage?: string;
};

export type PackagePluginInfo = SharedPluginInfo & {
  type: 'package';
  package: string;
  tag: string;
};

export type BuiltInPluginInfo = SharedPluginInfo & {
  type: 'built-in';
};

export type PluginInfo = PackagePluginInfo | BuiltInPluginInfo;

export const pluginInfos: PluginInfo[] = [
  {
    type: 'package',
    id: 'rivet-plugin-example-python-exec@latest',
    name: 'Example Plugin - Python Exec',
    description: dedent`
      Example plugin that allows you to execute a Python script using an added node.
    `,
    author: 'Rivet Team',
    package: 'rivet-plugin-example-python-exec',
    tag: 'latest',
    logoImage: PythonLogo,
    github: 'https://github.com/abrenneke/rivet-plugin-example-python-exec',
  },
  {
    type: 'built-in',
    id: 'anthropic',
    name: 'Anthropic',
    description: dedent`
      Allows you to chat with Anthropic LLM models such as Claude 2 and Claude Instant.

      Adds a Chat (Anthropic) node.
    `,
    author: 'Rivet Team',
    logoImage: AnthropicLogo,
    documentation: 'https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/anthropic',
  },
  {
    type: 'built-in',
    id: 'autoevals',
    name: 'AutoEvals',
    description: dedent`
      Simplified evaluation of LLM responses using the autoevals library.

      Adds an Autoevals node with many variants of evaluations.
    `,
    author: 'Braintrust',
    logoImage: BraintrustLogo,
    documentation: 'https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/autoevals',
  },
  {
    type: 'built-in',
    id: 'assemblyAi',
    name: 'AssemblyAI',
    description: dedent`
      Use [AssemblyAI](https://www.assemblyai.com/) to build AI applications with voice data.

      - [Transcribe audio files](https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/assemblyai#transcribe-audio-node)
      - [Summarize audio files using LeMUR](https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/assemblyai#lemur-summary-node)
      - [Answer questions about audio files using LeMUR Q&A](https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/assemblyai#lemur-qa)
      - [Extract action items from audio files using LeMUR](https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/assemblyai#lemur-action-items)
      - [Run custom LLM tasks against audio files using LeMUR](https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/assemblyai#lemur-custom-task)

      Follow this [step-by-step tutorial to see these capabilities in action](https://www.assemblyai.com/blog/podcast-qa-application-rivet/).
    `,
    author: 'AssemblyAI',
    logoImage: AssemblyAiLogo,
    documentation: 'https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/assemblyai',
  },
  {
    type: 'built-in',
    id: 'pinecone',
    name: 'Pinecone',
    description: dedent`
      Adds an integration so that Pinecone's vector database can be used for the
      Vector Store and Vector KNN nodes.
    `,
    author: 'Rivet Team',
    logoImage: PineconeLogo,
  },
  {
    type: 'built-in',
    id: 'huggingFace',
    name: 'Hugging Face',
    description: dedent`
      Adds a Chat (Hugging Face) node that allows you to chat with any of Hugging Face's LLM models.
    `,
    author: 'Rivet Team',
    logoImage: HuggingFaceLogo,
  },
  {
    type: 'built-in',
    id: 'gentrace',
    name: 'Gentrace',
    description: dedent`
      Gentrace evaluates and observes your generative AI pipelines.

      This plugin helps you run Gentrace test cases through your Rivet graph and evaluates their performance on a variety of benchmarks.
    `,
    author: 'Gentrace',
    logoImage: GentraceLogo,
    documentation: 'https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/gentrace',
  },
  {
    type: 'package',
    id: 'rivet-plugin-example@latest',
    name: 'Example Plugin',
    description: dedent`
      Example plugin that adds an example node.
    `,
    author: 'Rivet Team',
    package: 'rivet-plugin-example',
    tag: 'latest',
    github: 'https://github.com/abrenneke/rivet-plugin-example',
    logoImage: RivetLogo,
  },
  {
    type: 'package',
    id: 'rivet-oobabooga-plugin@latest',
    name: 'Oobabooga',
    description: dedent`
      Integrate Rivet with the Oobabooga text generation Web UI.
    `,
    github: 'https://github.com/hushaudio/rivet-oobabooga-plugin',
    package: 'rivet-oobabooga-plugin',
    tag: 'latest',
    author: 'HU$H',
  },
  {
    type: 'package',
    id: 'rivet-plugin-mongodb@latest',
    name: 'MongoDB',
    description: dedent`
      Adds Store and KNN nodes that use MongoDB as a vector database.
    `,
    github: 'https://github.com/a-rothwell/rivet-plugin-mongodb',
    author: 'Andrew Rothwell',
    package: 'rivet-plugin-mongodb',
    tag: 'latest',
    logoImage: MongoDBLogo,
  },
  {
    type: 'package',
    id: 'rivet-plugin-fs@latest',
    name: 'FS Plugin',
    description: dedent`
      Adds two dangerous nodes that should be used in a sandboxed environment if possible:

      - **Write File**, which writes a string to a file
      - **Shell Command**, which executes a shell command
    `,
    github: 'https://github.com/abrenneke/rivet-plugin-fs',
    author: 'Rivet Team',
    package: 'rivet-plugin-fs',
    tag: 'latest',
    logoImage: FolderLogo,
  },
  {
    type: 'built-in',
    id: 'openai',
    name: 'OpenAI',
    description: dedent`
      Adds full OpenAI support, such as fine-tuning, assistants, and more.
    `,
    author: 'Rivet Team',
    logoImage: OpenAILogo,
  },
  {
    type: 'package',
    id: 'rivet-plugin-chromadb@latest',
    name: 'Chroma',
    description: dedent`
      Integrate with [Chroma](https://www.trychroma.com/), the AI-native open-source embedding database.

      Adds nodes to store and query vectors, documents, and metadata in Chroma, and nodes to create/delete and list Chroma collections.
    `,
    github: 'https://github.com/abrenneke/rivet-plugin-chromadb',
    author: 'Rivet Team',
    package: 'rivet-plugin-chromadb',
    tag: 'latest',
    logoImage: ChromaLogo,
  },
  {
    type: 'package',
    id: 'rivet-plugin-ollama@latest',
    name: 'Ollama',
    description: dedent`
      Adds a node that allows you to chat with Ollama's LLM models.
    `,
    github: 'https://github.com/abrenneke/rivet-plugin-ollama',
    author: 'Rivet Team',
    package: 'rivet-plugin-ollama',
    tag: 'latest',
    logoImage: OllamaLogo,
  },
  {
    type: 'built-in',
    id: 'google',
    name: 'Google',
    description: dedent`
      Allows you to chat with Google LLM models such as Gemini.

      Adds a Chat (Google) node.
    `,
    author: 'Rivet Team',
    logoImage: GoogleLogo,
    documentation: 'https://rivet.ironcladapp.com/docs/user-guide/plugins/built-in/google',
  },
  {
    type: 'package',
    id: 'rivet-plugin-pdf2md@latest',
    name: 'PDF to Markdown',
    description: dedent`
      Adds a node 'PDF to Markdown' node that converts PDF contents into markdown for use with LLMs.
      This plugin is based on: https://github.com/opengovsg/pdf2md
    `,
    github: 'https://github.com/ai-made-approachable/rivet-plugin-pdf2md',
    author: 'Tim Köhler',
    package: 'rivet-plugin-pdf2md',
    tag: 'latest',
    logoImage: PDF2MDLogo,
  },
  {
    type: 'package',
    id: 'rivet-plugin-transformerlab@latest',
    name: 'Transformer Lab',
    description: dedent`
      Adds nodes to interact with Transformer Lab. Especially useful for fine-tuning and chatting with local models.
      For video tutorials go to: https://www.youtube.com/channel/UCmKOkBE5i2MQG_2UOi9GoNg/
    `,
    github: 'https://github.com/ai-made-approachable/rivet-plugin-transformerlab',
    author: 'Tim Köhler',
    package: 'rivet-plugin-transformerlab',
    tag: 'latest',
    logoImage: TransformerLabLogo,
  },
];
