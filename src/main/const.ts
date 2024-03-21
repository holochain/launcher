import type { AppToInstall } from '../types';

export const WINDOW_SIZE = 600;
export const SEARCH_HEIGH = 200;

export const APPSTORE_APP_ID = 'App Store 0.0.1';
export const APPSTORE_SHA256 = 'e75e94b26e97e7ae9f8e9ea5d5ae0b532d561b7d12b4469275ea34ee06dcfd9c';
export const DEVHUB_APP_ID = 'Dev Hub 0.0.1';
export const DEVHUB_SHA256 = '30faeccb7c0333ffd5a01e3be111dac71773ad344ecb386f2f011bf61e513d96';

export const APPS_TO_INSTALL: AppToInstall[] = [
  {
    id: APPSTORE_APP_ID,
    sha256: APPSTORE_SHA256,
    name: 'appstore.happ',
    progressUpdate: 'installingAppStore',
  },
  {
    id: DEVHUB_APP_ID,
    sha256: DEVHUB_SHA256,
    name: 'devhub.happ',
    progressUpdate: 'installingDevHub',
  },
];
