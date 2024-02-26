import { type FC, type ReactNode } from 'react';
import { css } from '@emotion/react';
import Modal, { ModalBody, ModalTransition } from '@atlaskit/modal-dialog';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const styles = css`
  padding: 16px 0;
  height: 100%;
  width: 100%;
`;

export const FullScreenModal: FC<FullScreenModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={onClose} width="100%" height="100%">
          <ModalBody>
            <div css={styles} onWheel={(e) => e.stopPropagation()}>
              {children}
            </div>
          </ModalBody>
        </Modal>
      )}
    </ModalTransition>
  );
};
