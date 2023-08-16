export type NodeBodySpecBase = {
  fontSize?: number;
  fontFamily?: 'monospace' | 'sans-serif';
};

export type PlainNodeBodySpec = {
  type: 'plain';
  text: string;
};

export type MarkdownNodeBodySpec = {
  type: 'markdown';
  text: string;
};

export type ColorizedNodeBodySpec = {
  type: 'colorized';
  language: string;
  text: string;
  theme?: string;
};

export type NodeBodySpec = NodeBodySpecBase & (PlainNodeBodySpec | MarkdownNodeBodySpec | ColorizedNodeBodySpec);
