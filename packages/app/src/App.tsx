import 'core-js/actual';
import '@atlaskit/css-reset';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RivetAppLoader } from './components/RivetAppLoader';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RivetAppLoader />
    </QueryClientProvider>
  );
}

export default App;
