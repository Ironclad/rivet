import { type FC } from 'react';

import Popup from '@atlaskit/popup';
import { useToggle } from 'ahooks';
import { css } from '@emotion/react';

const buttonStyles = css`
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;

  > div {
    width: 32px;
    height: 32px;
    border-radius: 2px;
    border: 1px solid var(--grey);

    &:hover {
      border-color: var(--grey-light);
    }
  }
`;

const popupStyles = css`
  display: grid;
  grid-template-columns: auto auto;
  gap: 4px;
  padding: 16px;

  button {
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;

    > div {
      width: 32px;
      height: 32px;
      border-radius: 2px;
      border: 1px solid var(--grey);
      position: relative;

      &::after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 2;
        transition: background-color 0.2s ease-out;
      }

      &:hover {
        border-color: var(--grey-light);

        &::after {
          background-color: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
`;

const colors = [
  'var(--node-color-1)',
  'var(--node-color-2)',
  'var(--node-color-3)',
  'var(--node-color-4)',
  'var(--node-color-5)',
  'var(--node-color-6)',
  'var(--node-color-7)',
  'var(--node-color-8)',
];

export const NodeColorPicker: FC<{
  currentColor: { bg: string; border: string } | undefined;
  onChange: (newColor: { bg: string; border: string } | undefined) => void;
}> = ({ currentColor = { bg: 'var(--grey-darkish)', border: 'var(--grey-darkish)' }, onChange }) => {
  const [isOpen, toggleIsOpen] = useToggle();

  return (
    <Popup
      content={() => (
        <div css={popupStyles}>
          <button
            onClick={() => {
              onChange(undefined);
              toggleIsOpen.toggle();
            }}
          >
            <div />
          </button>
          <div />
          {colors.map((color) => (
            <>
              <button
                key={`${color}-border`}
                onClick={() => {
                  onChange({ bg: 'var(--grey-darkish)', border: color });
                  toggleIsOpen.toggle();
                }}
              >
                <div
                  style={{
                    borderColor: color,
                  }}
                />
              </button>
              <button
                key={`${color}-bg`}
                onClick={() => {
                  onChange({ bg: color, border: color });
                  toggleIsOpen.toggle();
                }}
              >
                <div
                  style={{
                    borderColor: color,
                    backgroundColor: color,
                  }}
                />
              </button>
            </>
          ))}
        </div>
      )}
      isOpen={isOpen}
      placement="bottom-start"
      trigger={(triggerProps) => (
        <button css={buttonStyles} {...triggerProps} onClick={toggleIsOpen.toggle}>
          <div
            style={{
              backgroundColor: currentColor.bg,
              borderColor: currentColor.border,
            }}
          />
        </button>
      )}
    />
  );
};
