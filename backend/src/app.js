/**
 * CryptoFess — Express Application Setup
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { messageRoutes } from './routes/messageRoutes.js';
import { cryptoRoutes } from './routes/cryptoRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Middleware Keamanan Header
  app.use(helmet({
    contentSecurityPolicy: false // Dinonaktifkan untuk kemudahan dev/api
  }));

  // CORS Middleware
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.use(cors({
    origin: corsOrigin,
    credentials: true
  }));

  // Body Parser (dengan batas ukuran yang aman)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Rate Limiting (Kecuali pada saat testing)
  if (process.env.NODE_ENV !== 'test') {
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 menit
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.' }
    });
    app.use('/api', generalLimiter);

    const messageLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Batas pengiriman pesan anonim tercapai. Coba lagi dalam beberapa menit.' }
    });
    app.use('/api/messages', messageLimiter);
  }

  // Healthcheck endpoint (PRD 12)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CryptoFess API',
      timestamp: new Date().toISOString()
    });
  });

  // Rute API
  app.use('/api/auth', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api', messageRoutes);
  app.use('/api', cryptoRoutes);

  // Layani Frontend Static (jika telah di-build)
  const distPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `Rute API ${req.method} ${req.originalUrl} tidak ditemukan` });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // 404 Handler untuk mode dev API saja
    app.use((req, res) => {
      res.status(404).json({ error: `Rute ${req.method} ${req.originalUrl} tidak ditemukan` });
    });
  }

  // Global Error Handler
  // CATATAN KEAMANAN: Jangan mencetak stack trace atau data sensitif ke respons
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan internal pada server';

    if (process.env.NODE_ENV !== 'test') {
      console.error(`[Error] ${status}: ${message}`);
    }

    res.status(status).json({
      error: message
    });
  });

  return app;
}
