import { FC } from 'react';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { AudioNode } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { useRecoilValue } from 'recoil';
import { projectDataState } from '../../state/savedGraphs';

const styles = css`
  img {
    max-width: 100%;
  }
`;

type AudioNodeBodyProps = {
  node: AudioNode;
};

export const AudioNodeBody: FC<AudioNodeBodyProps> = ({ node }) => {
  const projectData = useRecoilValue(projectDataState);

  const dataRef = node.data.data;
  const b64Data = dataRef ? projectData?.[dataRef.refId] : undefined;
  const dataUri = b64Data ? `data:audio/mp4;base64,${b64Data}` : undefined;

  return (
    <div css={styles}>
      {dataUri ? (
        <audio controls>
          <source src={dataUri} />
        </audio>
      ) : (
        <div>No audio data</div>
      )}
    </div>
  );
};

export const audioNodeDescriptor: NodeComponentDescriptor<'audio'> = {
  Body: AudioNodeBody,
};
