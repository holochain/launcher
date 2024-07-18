import { APP_STORE_APP_ID, DEVHUB_APP_ID } from '$shared/const';
import type { AppToInstall } from '$shared/types';

export const APP_STORE_INSTALL: AppToInstall = {
  id: APP_STORE_APP_ID,
  name: 'appstore.happ',
  progressUpdate: 'installingAppStore',
};

export const DEVHUB_INSTALL: AppToInstall = {
  id: DEVHUB_APP_ID,
  name: 'devhub.happ',
  progressUpdate: 'installingDevHub',
};

export const DEFAULT_APPS_TO_INSTALL: AppToInstall[] = [APP_STORE_INSTALL];
