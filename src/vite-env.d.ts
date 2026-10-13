/// <reference types="vite/client" />

interface ElectronStoreAPI {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
}

interface ElectronWindowAPI {
  minimize: () => void;
  close: () => void;
  dragStart: (x: number, y: number) => void;
  dragMove: (x: number, y: number) => void;
}

interface Window {
  electronAPI?: {
    store: ElectronStoreAPI;
    window: ElectronWindowAPI;
  };
}