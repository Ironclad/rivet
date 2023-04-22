import { RecoilRoot } from 'recoil';
import '@atlaskit/css-reset';
import { NodaiApp } from './components/NodaiApp';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <RecoilRoot>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <NodaiApp />
      </ThemeProvider>
    </RecoilRoot>
  );
}

export default App;
