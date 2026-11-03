import { describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('HTTP application', () => {
  it('serves its health endpoint without connecting to MongoDB', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        version: expect.any(String),
        uptimeSeconds: expect.any(Number),
        memory: expect.any(Object),
        databaseState: expect.any(Number),
      },
    });
    expect(Object.keys(response.body)).toEqual(['success', 'data']);
    expect(response.headers['x-request-id']).toBeTruthy();
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['cross-origin-resource-policy']).toBe('same-site');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('reports readiness according to the current MongoDB connection state', async () => {
    const response = await request(app).get('/health/ready');
    const connected = mongoose.connection.readyState === 1;
    expect(response.status).toBe(connected ? 200 : 503);
    expect(response.body.success).toBe(connected);
    if (connected) {
      expect(response.body.data).toMatchObject({
        status: 'ready',
        checks: {
          database: 'ok',
          integrations: {
            firebase: expect.any(Boolean),
            cloudinary: expect.any(Boolean),
          },
        },
      });
    } else {
      expect(response.body.error).toMatchObject({
        code: 'NOT_READY',
        message: 'Service is not ready',
        details: { database: 'unavailable' },
      });
    }
  });

  it('loads the OpenAPI definition and serves Swagger UI', async () => {
    const response = await request(app).get('/api/docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  it('validates and replaces query values before catalog handlers run', async () => {
    const response = await request(app).get('/api/v1/catalog/products?page=not-a-number');
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Validation failed');
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'page' }),
    ]));
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('validates pagination for the read-only static catalog export', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/prerender/products?page=not-a-number');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'page' }),
    ]));
  });

  it('exposes Section 11 catalog routes and validates their query contracts', async () => {
    const invalidAvailabilityFilter = await request(app)
      .get('/api/v1/products?available=true');
    expect(invalidAvailabilityFilter.status).toBe(400);
    expect(invalidAvailabilityFilter.body.error.code).toBe('VALIDATION_ERROR');

    const missingAvailabilityDates = await request(app)
      .get('/api/v1/products/summer-dress/availability?variantId=507f1f77bcf86cd799439011');
    expect(missingAvailabilityDates.status).toBe(400);

    const invalidPincode = await request(app).get('/api/v1/pincodes/123/serviceable');
    expect(invalidPincode.status).toBe(400);
  });

  it('protects the new image-upload endpoints behind authentication', async () => {
    const avatar = await request(app).post('/api/v1/users/me/avatar');
    const productImage = await request(app)
      .post('/api/v1/admin/products/507f1f77bcf86cd799439011/images');
    const reviewImage = await request(app)
      .post('/api/v1/catalog/products/507f1f77bcf86cd799439011/reviews');
    expect(avatar.status).toBe(401);
    expect(productImage.status).toBe(401);
    expect(reviewImage.status).toBe(401);
  });

  it('returns a stable route-not-found response', async () => {
    const response = await request(app).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
      message: 'Route not found',
      code: 'NOT_FOUND',
    });
  });

  it('rejects disallowed CORS origins with a request-correlated error', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://not-allowed.example');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CORS_ORIGIN_DENIED');
    expect(response.headers['x-request-id']).toBeTruthy();
  });
});
