/**
 * CryptoFess — Server Entry Point
 */

import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { initDatabase } from '../../database/index.js';

const PORT = process.env.PORT || 5000;

// Inisialisasi Database
initDatabase();

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`🚀 CryptoFess Backend API berjalan di http://localhost:${PORT}`);
  console.log(`🔐 Modul Kriptografi: Diffie-Hellman & ElGamal (Implementasi Manual)`);
});

process.on('SIGINT', () => {
  console.log('Menutup server CryptoFess...');
  server.close(() => {
    process.exit(0);
  });
});
