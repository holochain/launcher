import type { CallZomeRequestUnsigned } from '@holochain/client';
import { contextBridge, ipcRenderer } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';

contextBridge.exposeInMainWorld('__HC_ZOME_CALL_SIGNER__', {
  signZomeCall: (request: CallZomeRequestUnsigned) => ipcRenderer.invoke('sign-zome-call', request),
});

process.once('loaded', async () => {
  exposeElectronTRPC();
});
