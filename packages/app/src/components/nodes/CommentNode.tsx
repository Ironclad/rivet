import { type FC } from 'react';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { type CommentNode } from '@ironclad/rivet-core';
import { useMarkdown } from '../../hooks/useMarkdown';
import { css } from '@emotion/react';

const styles = css`
  font-family: 'Roboto', sans-serif;
  padding: 20px;
  height: 100%;

  * {
    color: inherit !important;
  }

  h1 {
    font-size: 100px;
  }

  h2 {
    font-size: 75px;
  }

  h3 {
    font-size: 50px;
  }

  h4 {
    font-size: 25px;
  }

  h5 {
    font-size: 15px;
  }

  h6 {
    font-size: 12px;
  }

  p {
    max-width: 600px;
  }
`;

const CommentNodeBody: FC<{ node: CommentNode }> = ({ node }) => {
  const markdown = useMarkdown(node.data.text);

  const style = {
    color: node.data.color,
    backgroundColor: node.data.backgroundColor,
  };

  return <div css={styles} style={style} dangerouslySetInnerHTML={markdown} />;
};

export const commentNodeDescriptor: NodeComponentDescriptor<'comment'> = {
  Body: CommentNodeBody,
};
