import { type FC } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { helpModalOpenState } from '../state/ui';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import DiscordIcon from '../assets/vendor_logos/discord-mark-white.svg?react';
import GithubIcon from '../assets/vendor_logos/github-mark-white.svg?react';
import TwitterIcon from '../assets/vendor_logos/twitter-logo.svg?react';
import YoutubeIcon from '../assets/vendor_logos/youtube-icon.png';
import QuestionIcon from 'majesticons/line/question-circle-line.svg?react';
import { css } from '@emotion/react';

const styles = css`
  ul li a,
  h2 a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 16px;

    svg {
      color: white;
    }

    img {
      height: 14px;
      object-fit: contain;
    }
  }
`;

export const HelpModal: FC = () => {
  const [helpModalOpen, setHelpModalOpen] = useRecoilState(helpModalOpenState);

  return (
    <ModalTransition>
      {helpModalOpen && (
        <Modal onClose={() => setHelpModalOpen(false)}>
          <ModalHeader>
            <ModalTitle>Help</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div css={styles}>
              <p>Need help with Rivet? Check out the following places!</p>

              <h2>
                <a href="https://discord.gg/qT8B2gv9Mg" target="_blank" rel="noreferrer">
                  <DiscordIcon /> Rivet Community Discord
                </a>
              </h2>
              <p>
                Join the Rivet Community Discord to get help with Rivet, share your creations, discuss prompt
                engineering, and more!
              </p>
              <h2>
                <a href="https://rivet.ironcladapp.com/docs" target="_blank" rel="noreferrer">
                  <QuestionIcon /> Rivet Documentation
                </a>
              </h2>
              <p>
                The Rivet documentation contains a wealth of information on how to use Rivet, documentation for every
                node, and instructions for integrating Rivet into your own application.
              </p>
              <h2>
                <a href="https://github.com/Ironclad/rivet/issues" target="_blank" rel="noreferrer">
                  <GithubIcon viewBox="0 0 100 100" /> GitHub Issues
                </a>
              </h2>
              <p>Need to report a bug? Open an issue on GitHub to let us know!</p>
              <h2>
                <a href="https://twitter.com/rivet_ts" target="_blank" rel="noreferrer">
                  <TwitterIcon /> Rivet on X (Twitter)
                </a>
              </h2>
              <p>Join the discussions about Rivet on X!</p>
              <h2>
                {' '}
                <a href="https://www.youtube.com/channel/UCzCPXL6k7kjr26rhfWNmbfA" target="_blank" rel="noreferrer">
                  <img src={YoutubeIcon} alt="YouTube Logo" /> Rivet YouTube
                </a>
              </h2>
              <p>The Rivet YouTube channel contains tutorials, ideas, and more about how to use Rivet to its best! </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" autoFocus onClick={() => setHelpModalOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
