import 'core-js/actual';
import '@atlaskit/css-reset';
import { RivetApp } from './components/RivetApp.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RivetApp />
    </QueryClientProvider>
  );
}

export default App;
