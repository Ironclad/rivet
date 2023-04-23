import { match } from 'ts-pattern';
import { ChartNode } from '../model/NodeBase';
import { FC, memo } from 'react';
import { ChatNode } from '../model/nodes/ChatNode';
import { CodeNode } from '../model/nodes/CodeNode';
import { ExtractRegexNode } from '../model/nodes/ExtractRegexNode';
import { MatchNode } from '../model/nodes/MatchNode';
import { PromptNode } from '../model/nodes/PromptNode';
import { TextNode } from '../model/nodes/TextNode';
import { UserInputNode } from '../model/nodes/UserInputNode';
import { ChatNodeBody } from './nodes/ChatNode';
import { CodeNodeBody } from './nodes/CodeNode';
import { ExtractRegexNodeBody } from './nodes/ExtractRegexNode';
import { MatchNodeBody } from './nodes/MatchNode';
import { PromptNodeBody } from './nodes/PromptNode';
import { TextNodeBody } from './nodes/TextNode';
import { UserInputNodeBody } from './nodes/UserInputNode';
import { IfNodeBody } from './nodes/ItNode';

export const NodeBody: FC<{ node: ChartNode }> = memo(({ node }) => {
  const body = match(node)
    .with({ type: 'prompt' }, (node) => <PromptNodeBody node={node as PromptNode} />)
    .with({ type: 'chat' }, (node) => <ChatNodeBody node={node as ChatNode} />)
    .with({ type: 'text' }, (node) => <TextNodeBody node={node as TextNode} />)
    .with({ type: 'extractRegex' }, (node) => <ExtractRegexNodeBody node={node as ExtractRegexNode} />)
    .with({ type: 'code' }, (node) => <CodeNodeBody node={node as CodeNode} />)
    .with({ type: 'match' }, (node) => <MatchNodeBody node={node as MatchNode} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeBody node={node as UserInputNode} />)
    .with({ type: 'if' }, () => <IfNodeBody />)
    .otherwise(() => <div>Unknown node type</div>);

  return <div className="node-body">{body}</div>;
});
