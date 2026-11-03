import { z } from 'zod';
import { phoneIN } from './common.validator.js';

export const authSyncSchema = z.object({
  phone: phoneIN.optional(),
}).strict();
