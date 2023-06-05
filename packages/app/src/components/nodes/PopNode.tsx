import { FC } from 'react';
import { css } from '@emotion/react';
import { PopNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export const popNodeDescriptor: NodeComponentDescriptor<'pop'> = {
  Body: undefined,
  Output: undefined,
  Editor: undefined,
};
