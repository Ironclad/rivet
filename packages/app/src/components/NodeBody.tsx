import { FC, Suspense, memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes.js';
import {
  ChartNode,
  ColorizedNodeBodySpec,
  MarkdownNodeBodySpec,
  NodeBodySpec,
  PlainNodeBodySpec,
  globalRivetNodeRegistry,
} from '@ironclad/rivet-core';
import { useMarkdown } from '../hooks/useMarkdown';
import { match } from 'ts-pattern';
import styled from '@emotion/styled';
import { LazyColorizedPreformattedText } from './LazyComponents';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';

export const NodeBody: FC<{ node: ChartNode }> = memo(({ node }) => {
  const { Body } = useUnknownNodeComponentDescriptorFor(node);
  useDependsOnPlugins();

  const body = Body ? <Body node={node} /> : <UnknownNodeBody node={node} />;

  return <div className="node-body">{body}</div>;
});

const UnknownNodeBodyWrapper = styled.div<{
  fontSize: number;
  fontFamily: 'monospace' | 'sans-serif';
}>`
  overflow: hidden;
  font-size: ${(props) => props.fontSize}px;
  font-family: ${(props) => (props.fontFamily === 'monospace' ? "'Roboto Mono', monospace" : "'Roboto', sans-serif")};
`;

const UnknownNodeBody: FC<{ node: ChartNode }> = ({ node }) => {
  const body = useMemo(() => globalRivetNodeRegistry.createDynamicImpl(node).getBody(), [node]);

  const bodySpec: NodeBodySpec | NodeBodySpec[] | undefined =
    typeof body === 'string' ? { type: 'plain', text: body } : body;
  let allSpecs = bodySpec ? (Array.isArray(bodySpec) ? bodySpec : [bodySpec]) : [];

  allSpecs = allSpecs.map((spec) => {
    if (spec.type === 'plain' && spec.text.startsWith('!markdown')) {
      return { type: 'markdown', text: spec.text.replace(/^!markdown/, '') };
    }

    return spec;
  });

  const renderedSpecs = allSpecs.map((spec) => ({
    spec,
    rendered: match(spec)
      .with({ type: 'plain' }, (spec) => <PlainNodeBody {...spec} />)
      .with({ type: 'markdown' }, (spec) => <MarkdownNodeBody {...spec} />)
      .with({ type: 'colorized' }, (spec) => <ColorizedNodeBody {...spec} />)
      .exhaustive(),
  }));

  return (
    <div>
      {renderedSpecs.map(({ spec, rendered }, i) => (
        <UnknownNodeBodyWrapper key={i} fontFamily={spec.fontFamily ?? 'sans-serif'} fontSize={spec.fontSize ?? 12}>
          {rendered}
        </UnknownNodeBodyWrapper>
      ))}
    </div>
  );
};

export const PlainNodeBody: FC<PlainNodeBodySpec> = memo(({ text }) => {
  return <pre className="pre-wrap">{text}</pre>;
});

export const MarkdownNodeBody: FC<MarkdownNodeBodySpec> = memo(({ text }) => {
  const markdownBody = useMarkdown(text);

  return <div className="pre-wrap" dangerouslySetInnerHTML={markdownBody} />;
});

export const ColorizedNodeBody: FC<ColorizedNodeBodySpec> = memo(({ text, language, theme }) => {
  return (
    <Suspense fallback={<div />}>
      <LazyColorizedPreformattedText text={text} language={language} theme={theme} />
    </Suspense>
  );
});
