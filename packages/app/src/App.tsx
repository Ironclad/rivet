import { RecoilRoot } from 'recoil';
import '@atlaskit/css-reset';
import { NodaiApp } from './components/NodaiApp';

function App() {
  return (
    <RecoilRoot>
      <NodaiApp />
    </RecoilRoot>
  );
}

export default App;
