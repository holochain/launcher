import type { CallZomeRequestUnsigned } from '@holochain/client';
import { contextBridge, ipcRenderer } from 'electron';
import type { ZomeCallUnsignedNapi } from 'hc-launcher-rust-utils';

contextBridge.exposeInMainWorld('__HC_ZOME_CALL_SIGNER__', {
  signZomeCall: (request: CallZomeRequestUnsigned) => ipcRenderer.invoke('sign-zome-call', request),
});

const contextBridgeApi = {
  signZomeCall: (zomeCall: ZomeCallUnsignedNapi) =>
    ipcRenderer.invoke('sign-zome-call-legacy', zomeCall),
};

export type ContextBridgeApi = typeof contextBridgeApi;

contextBridge.exposeInMainWorld('electronAPI', contextBridgeApi);
