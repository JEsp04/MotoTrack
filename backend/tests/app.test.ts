import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { parseEnv } from '../src/config/env.js';

describe('API base', () => {
  it('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('una ruta inexistente responde 404 con el formato de error', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.errors).toEqual([]);
  });

  it('CORS solo acepta el origen configurado', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');

    const otro = await request(app).get('/api/health').set('Origin', 'https://otro-sitio.com');
    expect(otro.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('un JSON mal formado responde 400', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ esto no es json');
    expect(res.status).toBe(400);
  });
});

describe('Variables de entorno', () => {
  it('detiene el arranque y nombra la variable que falta', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://u:p@localhost:3306/db' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });
});
