import express from 'express';
import { describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { authorize } from '../../src/middlewares/authorize.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { requestIdMiddleware } from '../../src/middlewares/requestId.js';
import { authSyncRateLimiter } from '../../src/middlewares/rateLimiters.js';
import { uploadMany, uploadSingle } from '../../src/middlewares/upload.js';
import { validate } from '../../src/middlewares/validate.js';
import { z } from 'zod';

function uploadTestApp(middleware) {
  const app = express();
  app.use(requestIdMiddleware);
  app.post('/upload', middleware, (req, res) => {
    res.status(200).json({ files: req.files?.length ?? Number(Boolean(req.file)) });
  });
  app.use(errorHandler);
  return app;
}

describe('Security middleware', () => {
  it('only authorizes explicitly allowed roles', () => {
    const next = jest.fn();
    const middleware = authorize('admin');
    middleware({ user: { role: 'customer' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      message: 'Forbidden',
    }));

    next.mockClear();
    middleware({ user: { role: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('strips Mongo operator and dotted keys before Zod validation', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/input',
      validate(z.object({
        name: z.string(),
        nested: z.object({ safe: z.string() }).strict(),
      }).strict()),
      (req, res) => res.json(req.body)
    );
    app.use(errorHandler);

    const response = await request(app).post('/input').send({
      name: 'dress',
      '$where': 'malicious',
      nested: { safe: 'value', 'a.b': 'discarded' },
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'dress', nested: { safe: 'value' } });
  });

  it('accepts supported image signatures and rejects content spoofing', async () => {
    const app = uploadTestApp(uploadSingle('image'));
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const accepted = await request(app)
      .post('/upload')
      .attach('image', validJpeg, { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.files).toBe(1);

    const spoofed = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('not an image'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(spoofed.status).toBe(400);
    expect(spoofed.body.error.code).toBe('INVALID_UPLOAD_CONTENT');

    const unsupported = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('text'), { filename: 'photo.txt', contentType: 'text/plain' });
    expect(unsupported.status).toBe(400);
    expect(unsupported.body.error.code).toBe('INVALID_UPLOAD_TYPE');

    const missingFile = await request(app).post('/upload');
    expect(missingFile.status).toBe(400);
    expect(missingFile.body.error.code).toBe('UPLOAD_FILE_REQUIRED');
  });

  it('enforces image count and the five-megabyte file-size limit', async () => {
    const app = uploadTestApp(uploadMany('images', 1));
    const imageHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const tooMany = await request(app)
      .post('/upload')
      .attach('images', imageHeader, { filename: 'one.png', contentType: 'image/png' })
      .attach('images', imageHeader, { filename: 'two.png', contentType: 'image/png' });
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.error.code).toBe('LIMIT_UNEXPECTED_FILE');

    const tooLarge = await request(app)
      .post('/upload')
      .attach('images', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'large.png',
        contentType: 'image/png',
      });
    expect(tooLarge.status).toBe(400);
    expect(tooLarge.body.error.code).toBe('LIMIT_FILE_SIZE');
  });

  it('limits IP-scoped authentication sync traffic with a stable error', async () => {
    const app = express();
    app.use(requestIdMiddleware);
    app.post('/sync', authSyncRateLimiter, (req, res) => res.status(204).end());
    app.use(errorHandler);

    let response;
    for (let attempt = 0; attempt < 21; attempt += 1) {
      response = await request(app).post('/sync');
    }
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
    expect(response.headers['x-request-id']).toBeTruthy();
  });
});
