import 'core-js/actual';
import { RecoilRoot } from 'recoil';
import '@atlaskit/css-reset';
import { RivetApp } from './components/RivetApp.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <RivetApp />
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
