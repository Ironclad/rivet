import { RecoilRoot } from 'recoil';
import '@atlaskit/css-reset';
import { RivetApp } from './components/RivetApp';

function App() {
  return (
    <RecoilRoot>
      <RivetApp />
    </RecoilRoot>
  );
}

export default App;
