import { type FC } from 'react';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { type ImageNode } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { useRecoilValue } from 'recoil';
import { projectDataState } from '../../state/savedGraphs';

const styles = css`
  img {
    max-width: 100%;
  }
`;

type ImageNodeBodyProps = {
  node: ImageNode;
};

export const ImageNodeBody: FC<ImageNodeBodyProps> = ({ node }) => {
  const projectData = useRecoilValue(projectDataState);

  const dataRef = node.data.data;
  const b64Data = dataRef ? projectData?.[dataRef.refId] : undefined;
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
