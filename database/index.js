/**
 * CryptoFess — Database Access Layer
 *
 * Menggunakan SQLite bawaan Node.js (node:sqlite DatabaseSync)
 * Sesuai PRD_CryptoFess.md Bagian 13.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let instance = null;

/**
 * Inisialisasi koneksi database
 * @param {string} [customPath]
 * @returns {DatabaseSync}
 */
export function initDatabase(customPath) {
  const dbPath = customPath || process.env.DATABASE_PATH || path.join(__dirname, 'cryptofess.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // Aktifkan foreign key pragma
  db.exec('PRAGMA foreign_keys = ON;');

  // Jalankan skema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  instance = db;
  return db;
}

/**
 * Dapatkan instance database aktif (singleton)
 * @returns {DatabaseSync}
 */
export function getDb() {
  if (!instance) {
    return initDatabase();
  }
  return instance;
}

/**
 * Tutup koneksi database
 */
export function closeDb() {
  if (instance) {
    instance.close();
    instance = null;
  }
}
