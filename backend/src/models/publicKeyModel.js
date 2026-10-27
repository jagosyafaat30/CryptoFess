/**
 * CryptoFess — Public Key Model
 * Mengelola kunci publik pengguna di tabel public_keys
 * CATATAN KEAMANAN: Private key DILARANG disimpan di tabel ini.
 */

import { getDb } from '../../../database/index.js';

export const publicKeyModel = {
  create(userId, algorithm, publicKeyData, keyVersion = 1) {
    const db = getDb();
    const dataStr = typeof publicKeyData === 'string'
      ? publicKeyData
      : JSON.stringify(publicKeyData);

    const stmt = db.prepare(
      `INSERT INTO public_keys (user_id, algorithm, public_key_data, key_version)
       VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(Number(userId), algorithm, dataStr, keyVersion);
    return this.findById(Number(result.lastInsertRowid));
  },

  findById(id) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, user_id, algorithm, public_key_data, key_version, created_at
       FROM public_keys
       WHERE id = ?`
    );
    return stmt.get(Number(id)) || null;
  },

  findByUserId(userId) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, user_id, algorithm, public_key_data, key_version, created_at
       FROM public_keys
       WHERE user_id = ?
       ORDER BY key_version DESC, created_at DESC`
    );
    return stmt.all(Number(userId));
  },

  findLatestByUserIdAndAlgorithm(userId, algorithm) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, user_id, algorithm, public_key_data, key_version, created_at
       FROM public_keys
       WHERE user_id = ? AND algorithm = ?
       ORDER BY key_version DESC, created_at DESC
       LIMIT 1`
    );
    return stmt.get(Number(userId), algorithm) || null;
  }
};
