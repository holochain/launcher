import { APP_STORE_APP_ID, DEVHUB_APP_ID } from '$shared/const';
import type { AppToInstall } from '$shared/types';

export const APP_STORE_SHA256 = 'e75e94b26e97e7ae9f8e9ea5d5ae0b532d561b7d12b4469275ea34ee06dcfd9c';
export const DEVHUB_SHA256 = '30faeccb7c0333ffd5a01e3be111dac71773ad344ecb386f2f011bf61e513d96';

export const DEFAULT_APPS_TO_INSTALL: AppToInstall[] = [
  {
    id: APP_STORE_APP_ID,
    sha256: APP_STORE_SHA256,
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
