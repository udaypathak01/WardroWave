import { describe, expect, it } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import YAML from 'yamljs';
import { createApp } from '../../src/app.js';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']);

function normalizePath(path) {
  return path
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function registeredRoutes(stack, prefix = '') {
  const routes = [];
  for (const layer of stack) {
    if (layer.route) {
      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const path of paths) {
        for (const method of Object.keys(layer.route.methods)) {
          routes.push(`${method.toUpperCase()} ${normalizePath(`${prefix}/${path}`)}`);
        }
      }
    } else if (layer.name === 'router') {
      const source = layer.regexp.source;
      const marker = source.indexOf('\\/?(?=');
      const mountPath = marker > 0 ? source.slice(1, marker).replace(/\\\//g, '/') : '';
      routes.push(...registeredRoutes(
        layer.handle.stack,
        normalizePath(`${prefix}/${mountPath}`)
      ));
    }
  }
  return routes;
}

function documentedRoutes(spec) {
  const routes = new Set();
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const server = pathItem.servers?.[0]?.url ?? spec.servers?.[0]?.url ?? '';
    const basePath = `${server.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    for (const method of Object.keys(pathItem)) {
      if (HTTP_METHODS.has(method)) {
        routes.add(`${method.toUpperCase()} ${normalizePath(basePath)}`);
      }
    }
  }
  return routes;
}

describe('OpenAPI route coverage', () => {
  it('documents every registered Express route and bearer authentication scheme', () => {
    const spec = YAML.load(fileURLToPath(new URL('../../openapi.yaml', import.meta.url)));
    const app = createApp();
    const documented = documentedRoutes(spec);
    const missing = registeredRoutes(app._router.stack).filter((route) => !documented.has(route));

    expect(spec.openapi).toBe('3.0.3');
    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(missing).toEqual([]);
  });
});
