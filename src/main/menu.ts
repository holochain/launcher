import AdmZip from 'adm-zip';
import { app, dialog, Menu, shell } from 'electron';

import type { LauncherFileSystem } from './filesystem';
import { isMac } from './utils';

// extending from electron's default menu: https://github.com/electron/electron/blob/398dde9dfbdfcfd7757ead9a30785c01de9f0808/lib/browser/default-menu.ts#L12
export const launcherMenu = (launcherFileSystem: LauncherFileSystem) => {
  const macAppMenu: Electron.MenuItemConstructorOptions = { role: 'appMenu' };
  const helpMenu: Electron.MenuItemConstructorOptions = {
    role: 'help',
    submenu: [
      {
        label: 'Open Logs',
        async click() {
          try {
            await shell.openPath(launcherFileSystem.profileLogsDir);
          } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dialog.showErrorBox('Failed to open logs folder', (e as any).toString());
          }
        },
      },
      {
        label: 'Export Logs',
        async click() {
          try {
            const zip = new AdmZip();
            zip.addLocalFolder(launcherFileSystem.profileLogsDir);
            const exportToPathResponse = await dialog.showSaveDialog({
              title: 'Export Logs',
              buttonLabel: 'Export',
              defaultPath: `Holochain_Launcher_${app.getVersion()}_logs_${new Date().toISOString()}.zip`,
            });
            if (exportToPathResponse.filePath) {
              zip.writeZip(exportToPathResponse.filePath);
              shell.showItemInFolder(exportToPathResponse.filePath);
            }
          } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dialog.showErrorBox('Failed to export logs', (e as any).toString());
          }
        },
      },
    ],
  };

  return Menu.buildFromTemplate([
    ...(isMac ? [macAppMenu] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    helpMenu,
  ]);
};
