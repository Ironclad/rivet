import { BrowserIOProvider } from '../io/BrowserIOProvider';
import { IOProvider } from '../io/IOProvider';
import { LegacyBrowserIOProvider } from '../io/LegacyBrowserIOProvider';
import { TauriIOProvider } from '../io/TauriIOProvider';

let ioProvider: IOProvider;

if (TauriIOProvider.isSupported()) {
  ioProvider = new TauriIOProvider();
} else if (BrowserIOProvider.isSupported()) {
  ioProvider = new BrowserIOProvider();
} else {
  ioProvider = new LegacyBrowserIOProvider();
}

export { ioProvider };
