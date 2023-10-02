import dedent from 'ts-dedent';
import AnthropicLogo from './assets/vendor_logos/anthropic-logo.png';
import AssemblyAiLogo from './assets/vendor_logos/assemblyAI-logo.png';
import RivetLogo from './assets/vendor_logos/rivet-logo.png';
import GentraceLogo from './assets/vendor_logos/gentrace.svg';
import HuggingFaceLogo from './assets/vendor_logos/hf-logo.svg';
import MongoDBLogo from './assets/vendor_logos/MongoDB_Logomark_ForestGreen.svg';
import PineconeLogo from './assets/vendor_logos/pinecone-logo.png';

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
    logoImage: RivetLogo,
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
];
