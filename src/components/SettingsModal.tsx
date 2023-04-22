import { FC } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { atom, useRecoilState } from 'recoil';
import { settingsState } from '../state/settings';

const styles = {
  main: {
    zIndex: 9999,
  },
  closeButton: {},
};

const container = {
  fontFamily: 'Roboto, sans-serif',
  color: 'var(--foreground)',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  rowGap: '16px',
  columnGap: '32px',
  alignItems: 'center',
  gridAutoRows: '40px',

  '.row': {
    display: 'contents',
  },

  '.label': {
    fontWeight: 500,
    color: 'var(--foreground)',
  },
};

interface SettingsModalProps {}

export const settingsModalOpenState = atom({
  key: 'settingsModalOpen',
  default: false,
});

export const SettingsModal: FC<SettingsModalProps> = () => {
  const [isOpen, setIsOpen] = useRecoilState(settingsModalOpenState);
  const [settings, setSettings] = useRecoilState(settingsState);

  return (
    <div style={styles.main}>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Box sx={{ p: 2, width: 'fit-content', m: 'auto', mt: '15vh', bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Settings
          </Typography>
          <Box sx={container}>
            <div className="row">
              <div className="label">OpenAI API Key</div>
              <TextField
                variant="outlined"
                value={settings.openAiKey}
                onChange={(e) => setSettings((s) => ({ ...s, openAiKey: e.target.value }))}
              />
            </div>
            <div className="row">
              <div className="label">OpenAI Organization (optional)</div>
              <TextField
                variant="outlined"
                value={settings.openAiOrganization}
                onChange={(e) => setSettings((s) => ({ ...s, openAiOrganization: e.target.value }))}
              />
            </div>
          </Box>
          <Button
            variant="contained"
            color="primary"
            style={styles.closeButton}
            onClick={() => setIsOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
};
