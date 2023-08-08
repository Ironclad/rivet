import { css } from '@emotion/react';
import { CustomPicker } from 'react-color';
import { Alpha, Hue, Saturation } from 'react-color/lib/components/common';

export const TripleBarColorPicker = CustomPicker((props) => {
  return (
    <div
      css={css`
        user-select: none;
      `}
    >
      <div
        css={css`
          height: 48px;
          position: relative;
        `}
      >
        <Saturation {...props} />
      </div>
      <div
        css={css`
          height: 16px;
          position: relative;
        `}
      >
        <Hue {...props} />
      </div>
      <div
        css={css`
          height: 16px;
          position: relative;
        `}
      >
        <Alpha {...props} />
      </div>
    </div>
  );
});

export default TripleBarColorPicker;
