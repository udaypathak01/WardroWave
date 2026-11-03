import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalRateLimiter } from './middlewares/rateLimiters.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { notFoundMiddleware } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sanitizeMiddleware } from './middlewares/sanitize.js';
import routes from './routes/index.js';
import { getLiveness, getReadiness } from './controllers/health.controller.js';
import { getPublicConfig } from './controllers/meta.controller.js';
import { ApiError } from './utils/ApiError.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.use(requestIdMiddleware);
  app.use(pinoHttp({
    logger,
    genReqId: (req) => req.id,
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers.x-razorpay-signature',
      'req.body.password',
      'req.body.token',
    ],
    customLogLevel: (req, res, error) => {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }));
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    hsts: env.NODE_ENV === 'production' ? undefined : false,
  }));
  const allowedOrigins = new Set(env.CORS_ORIGINS.split(',').map((origin) => origin.trim()));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new ApiError(403, 'Origin is not allowed by CORS', 'CORS_ORIGIN_DENIED'));
    },
    credentials: false,
    exposedHeaders: ['X-Request-Id'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Request-Id'],
  }));
  app.use(compression());
  app.use(cookieParser());
  app.use(`${env.API_PREFIX}/webhooks/razorpay`, express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb', parameterLimit: 100 }));
  app.use(sanitizeMiddleware);
  app.use(hpp());
  app.use(globalRateLimiter);

  app.get('/health', getLiveness);
  app.get('/health/ready', getReadiness);
  app.get('/meta/config', getPublicConfig);
  if (env.NODE_ENV !== 'production' || env.ENABLE_DOCS) {
    const openapiDocument = YAML.load(fileURLToPath(new URL('../openapi.yaml', import.meta.url)));
    app.use('/api/docs', helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
    }), swaggerUi.serve, swaggerUi.setup(openapiDocument));
  }
  app.use(env.API_PREFIX, routes);
  app.use(notFoundMiddleware);
  app.use(errorHandler);
  return app;
}

export default createApp;
