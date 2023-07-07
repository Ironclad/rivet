import 'core-js/actual';
import { RecoilRoot } from 'recoil';
import '@atlaskit/css-reset';
import { RivetApp } from './components/RivetApp.js';

function App() {
  return (
    <RecoilRoot>
      <RivetApp />
    </RecoilRoot>
  );
}

export default App;
