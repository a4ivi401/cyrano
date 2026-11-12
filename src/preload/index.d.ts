import { IElectronAPI } from '../common/electronApi';

export type { IElectronAPI };

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
