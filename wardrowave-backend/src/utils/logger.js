import pino from 'pino';
import { env } from '../config/env.js';

const transport = env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers.x-razorpay-signature',
    'req.body.password',
    'req.body.token',
  ],
}, transport ? pino.transport(transport) : undefined);
