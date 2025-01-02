import { type FC, useLayoutEffect, useRef, useMemo } from 'react';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { type AudioNode } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { useAtomValue } from 'jotai';
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
  if (node.data.useDataInput) {
    return <div>Audio data from input</div>;
  }

  return <AudioNodeHasDataInput node={node} />;
};

export const AudioNodeHasDataInput: FC<AudioNodeBodyProps> = ({ node }) => {
  const projectData = useAtomValue(projectDataState);

  const dataRef = node.data.data;

  const b64Data = dataRef ? projectData?.[dataRef.refId] : undefined;

  const dataUri = useMemo(
    () => `data:${node.data.mediaType ?? 'audio/wav'};base64,${b64Data}`,
    [b64Data, node.data.mediaType],
  );

  const audioSourceRef = useRef<HTMLAudioElement>(null);

  useLayoutEffect(() => {
    if (audioSourceRef.current && dataUri) {
      audioSourceRef.current.src = dataUri;
    }
  }, [dataUri]);

  return <div css={styles}>{dataUri ? <audio controls ref={audioSourceRef}></audio> : <div>No audio data</div>}</div>;
};

export const audioNodeDescriptor: NodeComponentDescriptor<'audio'> = {
  Body: AudioNodeBody,
};
