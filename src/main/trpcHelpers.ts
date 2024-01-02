import { ZodSchema } from 'zod';

import { throwTRPCErrorError } from './utils';

export const validateWithZod = <T>({
  schema,
  data,
  errorType,
}: {
  schema: ZodSchema<T>;
  data: unknown;
  errorType: string;
}): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return throwTRPCErrorError({
      message: errorType,
      cause: result.error,
    });
  }
  return result.data;
};
