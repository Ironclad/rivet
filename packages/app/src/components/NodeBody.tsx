import { type FC, Suspense, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type HeightCache, useNodeBodyHeight } from '../hooks/useNodeBodyHeight';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes.js';
import {
  type ChartNode,
  type ColorizedNodeBodySpec,
  type MarkdownNodeBodySpec,
  type NodeBodySpec,
  type PlainNodeBodySpec,
  globalRivetNodeRegistry,
  type NodeBody as RenderedNodeBody,
  getError,
} from '@ironclad/rivet-core';
import { useMarkdown } from '../hooks/useMarkdown';
import { match } from 'ts-pattern';
import styled from '@emotion/styled';
import { LazyColorizedPreformattedText } from './LazyComponents';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import { useGetRivetUIContext } from '../hooks/useGetRivetUIContext';
import { useAsyncEffect } from 'use-async-effect';
import { toast } from 'react-toastify';

export const NodeBody: FC<{ heightCache: HeightCache; node: ChartNode }> = memo(({ heightCache, node }) => {
  const { Body } = useUnknownNodeComponentDescriptorFor(node);
  useDependsOnPlugins();

  const body = Body ? <Body node={node} /> : <UnknownNodeBody heightCache={heightCache} node={node} />;

  return <div className="node-body">{body}</div>;
});

NodeBody.displayName = 'NodeBody';

const UnknownNodeBodyWrapper = styled.div<{
  fontSize: number;
  fontFamily: 'monospace' | 'sans-serif';
}>`
  overflow: hidden;
  font-size: ${(props) => props.fontSize}px;
  font-family: ${(props) => (props.fontFamily === 'monospace' ? "'Roboto Mono', monospace" : "'Roboto', sans-serif")};
`;

const UnknownNodeBody: FC<{ heightCache: HeightCache; node: ChartNode }> = ({ heightCache, node }) => {
  const getUIContext = useGetRivetUIContext();

  const [body, setBody] = useState<RenderedNodeBody | undefined>();
  const { ref, height } = useNodeBodyHeight(heightCache, node.id, !!body);

  useAsyncEffect(async () => {
    try {
      const impl = globalRivetNodeRegistry.createDynamicImpl(node);
      // eslint-disable-next-line @typescript-eslint/await-thenable -- it is thenable you dummy
      const renderedBody = await impl.getBody(await getUIContext({ node }));

      setBody(renderedBody);
    } catch (err) {
      toast.error(`Failed to load body for node ${node.id}: ${getError(err).message}`);
    }
  }, [node]);

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
    <div ref={ref} style={{ height }}>
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

PlainNodeBody.displayName = 'PlainNodeBody';

export const MarkdownNodeBody: FC<MarkdownNodeBodySpec> = memo(({ text }) => {
  const markdownBody = useMarkdown(text);

  return <div className="pre-wrap" dangerouslySetInnerHTML={markdownBody} />;
});

MarkdownNodeBody.displayName = 'MarkdownNodeBody';

export const ColorizedNodeBody: FC<ColorizedNodeBodySpec> = memo(({ text, language, theme }) => {
  return (
    <Suspense fallback={<div />}>
      <LazyColorizedPreformattedText text={text} language={language} theme={theme} />
    </Suspense>
  );
});

ColorizedNodeBody.displayName = 'ColorizedNodeBody';
