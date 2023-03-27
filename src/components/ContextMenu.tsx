import { css } from '@emotion/react';
import { forwardRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onNodeSelected: (nodeType: string) => void;
}

const menuStyles = css`
  position: absolute;
  background-color: #2e2e2e;
  border: 2px solid #5a5a5a;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  font-family: 'Roboto Mono', monospace;
  color: #bbbbbb;
  padding: 8px;
  z-index: 1;
  min-width: 150px;
`;

const menuItemStyles = css`
  cursor: pointer;
  padding: 8px;
  margin: 4px 0;
  border-radius: 8px;
  transition: background-color 0.2s ease-out;

  &:hover {
    background-color: #3d3d3d;
  }
`;

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(({ x, y, onClose, onNodeSelected }, ref) => {
  return (
    <div ref={ref} css={menuStyles} style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
      <div css={menuItemStyles} onClick={() => onNodeSelected('ChatNode')}>
        Add Chat Node
      </div>
      <div css={menuItemStyles} onClick={() => onNodeSelected('UserInputNode')}>
        Add User Input Node
      </div>
      <div css={menuItemStyles} onClick={() => onClose()}>
        Cancel
      </div>
    </div>
  );
});
