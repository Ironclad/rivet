import { FC, ReactNode } from 'react';
import { css } from '@emotion/react';
import { Portal } from '@mui/material';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const styles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;

  .modal-content {
    background-color: var(--grey-darker);
    width: calc(100% - 100px);
    height: calc(100% - 100px);
    overflow: auto;
    padding: 1rem;
    position: relative;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
`;

export const FullScreenModal: FC<FullScreenModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div css={styles} className="full-screen-modal" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </Portal>
  );
};
