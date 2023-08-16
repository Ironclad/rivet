import { FC } from 'react';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { ImageNode } from '@ironclad/rivet-core';
import { css } from '@emotion/react';

const styles = css`
  img {
    max-width: 100%;
  }
`;

type ImageNodeBodyProps = {
  node: ImageNode;
};

export const ImageNodeBody: FC<ImageNodeBodyProps> = ({ node }) => {
  const b64Data = node.data.data;
  const mediaType = node.data.mediaType ?? 'image/png';

  const dataUri = `data:${mediaType};base64,${b64Data}`;

  return (
    <div css={styles}>
      <img src={dataUri} alt="" />
    </div>
  );
};

export const imageNodeDescriptor: NodeComponentDescriptor<'image'> = {
  Body: ImageNodeBody,
};
