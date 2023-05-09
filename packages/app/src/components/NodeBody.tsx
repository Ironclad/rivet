import { match } from 'ts-pattern';
import { FC, memo } from 'react';
import { ChatNodeBody } from './nodes/ChatNode';
import { CodeNodeBody } from './nodes/CodeNode';
import { ExtractRegexNodeBody } from './nodes/ExtractRegexNode';
import { MatchNodeBody } from './nodes/MatchNode';
import { PromptNodeBody } from './nodes/PromptNode';
import { TextNodeBody } from './nodes/TextNode';
import { UserInputNodeBody } from './nodes/UserInputNode';
import { IfNodeBody } from './nodes/IfNode';
import { ChartNode, Nodes } from '@ironclad/nodai-core';
import { ReadDirectoryNodeBody } from './nodes/ReadDirectoryNode';
import { ReadFileNodeBody } from './nodes/ReadFileNode';
import { IfElseNodeBody } from './nodes/IfElseNode';
import { ChunkNodeBody } from './nodes/ChunkNode';
import { GraphInputNodeBody } from './nodes/GraphInputNode';
import { GraphOutputNodeBody } from './nodes/GraphOutputNode';
import { SubGraphNodeBody } from './nodes/SubGraphNode';

export const NodeBody: FC<{ node: ChartNode }> = memo(({ node }) => {
  const body = match(node as Nodes)
    .with({ type: 'prompt' }, (node) => <PromptNodeBody node={node} />)
    .with({ type: 'chat' }, (node) => <ChatNodeBody node={node} />)
    .with({ type: 'text' }, (node) => <TextNodeBody node={node} />)
    .with({ type: 'extractRegex' }, (node) => <ExtractRegexNodeBody node={node} />)
    .with({ type: 'code' }, (node) => <CodeNodeBody node={node} />)
    .with({ type: 'match' }, (node) => <MatchNodeBody node={node} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeBody node={node} />)
    .with({ type: 'if' }, () => <IfNodeBody />)
    .with({ type: 'ifElse' }, (node) => <IfElseNodeBody node={node} />)
    .with({ type: 'readDirectory' }, (node) => <ReadDirectoryNodeBody node={node} />)
    .with({ type: 'readFile' }, (node) => <ReadFileNodeBody node={node} />)
    .with({ type: 'chunk' }, (node) => <ChunkNodeBody node={node} />)
    .with({ type: 'graphInput' }, (node) => <GraphInputNodeBody node={node} />)
    .with({ type: 'graphOutput' }, (node) => <GraphOutputNodeBody node={node} />)
    .with({ type: 'subGraph' }, (node) => <SubGraphNodeBody node={node} />)
    .otherwise(() => <div>Unknown node type</div>);

  return <div className="node-body">{body}</div>;
});
