import ReactDOM from 'react-dom/client';
import './index.css';
import './colors.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <React.StrictMode> atlaskit does not like
  <App />,
  // </React.StrictMode>
);
