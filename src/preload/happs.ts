import { contextBridge, ipcRenderer } from 'electron';
import { ZomeCallUnsignedNapi } from 'hc-launcher-rust-utils';

const contextBridgeApi = {
  signZomeCall: (zomeCall: ZomeCallUnsignedNapi) => ipcRenderer.invoke('sign-zome-call', zomeCall),
};

export type ContextBridgeApi = typeof contextBridgeApi;

contextBridge.exposeInMainWorld('electronAPI', contextBridgeApi);
