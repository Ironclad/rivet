import { RecoilRoot } from 'recoil';
import { GraphBuilder } from './components/GraphBuilder';
import { MenuBar } from './components/MenuBar';

function App() {
  return (
    <RecoilRoot>
      <div className="app">
        <MenuBar />
        <GraphBuilder />
      </div>
    </RecoilRoot>
  );
}

export default App;
