import { z } from 'zod';
import { rentalDate } from './common.validator.js';

export const reportQuerySchema = z.object({
  from: rentalDate,
  to: rentalDate,
}).strict();
