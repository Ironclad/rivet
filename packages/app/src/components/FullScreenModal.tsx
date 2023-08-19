import { FC, ReactNode } from 'react';
import { css } from '@emotion/react';
import { useHotkeys } from 'react-hotkeys-hook';
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTransition,
} from '@atlaskit/modal-dialog';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const styles = css`
  background-color: var(--grey-darker);
  overflow: auto;
  padding: 1rem;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overscroll-behavior: contain;
`;

export const FullScreenModal: FC<FullScreenModalProps> = ({ isOpen, onClose, children }) => {

  return (
    <ModalTransition>
      {isOpen && <Modal onClose={onClose} width="100%">
        <div css={styles} className="modal-content" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </Modal>}

    </ModalTransition>
  );
};
