import { BrowserIOProvider } from '../io/BrowserIOProvider.js';
import { IOProvider } from '../io/IOProvider.js';
import { LegacyBrowserIOProvider } from '../io/LegacyBrowserIOProvider.js';
import { TauriIOProvider } from '../io/TauriIOProvider.js';
import { BrowserDatasetProvider } from '../io/BrowserDatasetProvider';

let ioProvider: IOProvider;
const datasetProvider = new BrowserDatasetProvider();

if (TauriIOProvider.isSupported()) {
  ioProvider = new TauriIOProvider();
} else if (BrowserIOProvider.isSupported()) {
  ioProvider = new BrowserIOProvider();
} else {
  ioProvider = new LegacyBrowserIOProvider();
}

export { ioProvider, datasetProvider };
