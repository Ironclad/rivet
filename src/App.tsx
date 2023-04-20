import { RecoilRoot } from 'recoil';
import { GraphBuilder } from './components/GraphBuilder';

function App() {
  return (
    <RecoilRoot>
      <GraphBuilder />
    </RecoilRoot>
  );
}

export default App;
