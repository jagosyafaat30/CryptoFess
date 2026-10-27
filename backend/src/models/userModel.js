/**
 * CryptoFess — User Model
 * Mengelola data pengguna di tabel users
 */

import { getDb } from '../../../database/index.js';

export const userModel = {
  create(username, passwordHash) {
    const db = getDb();
    const stmt = db.prepare(
      `INSERT INTO users (username, password_hash)
       VALUES (?, ?)`
    );
    const result = stmt.run(username.trim().toLowerCase(), passwordHash);
    return this.findById(Number(result.lastInsertRowid));
  },

  findByUsername(username) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, username, password_hash, created_at, updated_at
       FROM users
       WHERE username = ?`
    );
    return stmt.get(username.trim().toLowerCase()) || null;
  },

  findById(id) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, username, created_at, updated_at
       FROM users
       WHERE id = ?`
    );
    return stmt.get(Number(id)) || null;
  }
};
