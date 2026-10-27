/**
 * CryptoFess — Message Model
 * Mengelola penyimpanan pesan terenkripsi pada tabel messages.
 * CATATAN KEAMANAN: Plaintext DILARANG disimpan di server.
 */

import { getDb } from '../../../database/index.js';

export const messageModel = {
  create(recipientId, ciphertext, cryptoMetadata) {
    const db = getDb();
    const metaStr = typeof cryptoMetadata === 'string'
      ? cryptoMetadata
      : JSON.stringify(cryptoMetadata);

    const stmt = db.prepare(
      `INSERT INTO messages (recipient_id, ciphertext, crypto_metadata)
       VALUES (?, ?, ?)`
    );
    const result = stmt.run(Number(recipientId), ciphertext, metaStr);
    return this.findById(Number(result.lastInsertRowid));
  },

  findById(id) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, recipient_id, ciphertext, crypto_metadata, created_at, read_at, deleted_at
       FROM messages
       WHERE id = ?`
    );
    return stmt.get(Number(id)) || null;
  },

  findByIdAndRecipient(id, recipientId) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, recipient_id, ciphertext, crypto_metadata, created_at, read_at, deleted_at
       FROM messages
       WHERE id = ? AND recipient_id = ? AND deleted_at IS NULL`
    );
    return stmt.get(Number(id), Number(recipientId)) || null;
  },

  findByRecipient(recipientId, limit = 50, offset = 0) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT id, recipient_id, ciphertext, crypto_metadata, created_at, read_at
       FROM messages
       WHERE recipient_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    );
    return stmt.all(Number(recipientId), Number(limit), Number(offset));
  },

  countByRecipient(recipientId) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread
       FROM messages
       WHERE recipient_id = ? AND deleted_at IS NULL`
    );
    const row = stmt.get(Number(recipientId));
    return {
      total: Number(row.total || 0),
      unread: Number(row.unread || 0)
    };
  },

  markAsRead(id, recipientId) {
    const db = getDb();
    const stmt = db.prepare(
      `UPDATE messages
       SET read_at = CURRENT_TIMESTAMP
       WHERE id = ? AND recipient_id = ? AND read_at IS NULL AND deleted_at IS NULL`
    );
    const result = stmt.run(Number(id), Number(recipientId));
    return result.changes > 0;
  },

  softDelete(id, recipientId) {
    const db = getDb();
    const stmt = db.prepare(
      `UPDATE messages
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = ? AND recipient_id = ? AND deleted_at IS NULL`
    );
    const result = stmt.run(Number(id), Number(recipientId));
    return result.changes > 0;
  }
};
