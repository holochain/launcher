import { type ExtendedAppInfo, ExtendedAppInfoSchema } from '../../../../types';

export const validateApp = (app: unknown): app is ExtendedAppInfo => {
	return ExtendedAppInfoSchema.safeParse(app).success;
};
