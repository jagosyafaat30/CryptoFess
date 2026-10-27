/**
 * CryptoFess — Message Controller
 *
 * Mengelola pengiriman pesan anonim, inbox, dan pembacaan pesan.
 * Sesuai PRD_CryptoFess.md Bagian 7.3, 7.4, 9, 12, dan 13.
 */

import { messageModel } from '../models/messageModel.js';
import { userModel } from '../models/userModel.js';

export const messageController = {
  async sendMessage(req, res, next) {
    try {
      const { recipientId, recipientUsername, ciphertext, cryptoMetadata } = req.body;

      // Cari ID penerima baik dari recipientId atau recipientUsername
      let targetRecipientId = recipientId;
      if (!targetRecipientId && recipientUsername) {
        const user = userModel.findByUsername(recipientUsername);
        if (!user) {
          return res.status(404).json({
            error: `Penerima dengan username "${recipientUsername}" tidak ditemukan`
          });
        }
        targetRecipientId = user.id;
      }

      if (!targetRecipientId) {
        return res.status(400).json({ error: 'ID atau username penerima wajib dicantumkan' });
      }

      const recipient = userModel.findById(targetRecipientId);
      if (!recipient) {
        return res.status(404).json({ error: 'Penerima tidak ditemukan' });
      }

      if (!ciphertext || typeof ciphertext !== 'string') {
        return res.status(400).json({ error: 'Ciphertext terenkripsi wajib disertakan' });
      }

      if (ciphertext.length > 500000) {
        return res.status(413).json({ error: 'Ukuran payload pesan melebihi batas yang diizinkan' });
      }

      // Validasi keamanan: Pastikan plaintext tidak dikirim ke server secara terang-terangan
      if (req.body.plaintext || req.body.message || req.body.text) {
        return res.status(400).json({
          error: 'Pelanggaran arsitektur E2EE: Plaintext tidak boleh dikirimkan ke server!'
        });
      }

      // Validasi keamanan: Pastikan private key tidak bocor di payload
      if (req.body.privateKey || req.body.x) {
        return res.status(400).json({
          error: 'Pelanggaran keamanan: Private key tidak boleh dikirimkan ke server!'
        });
      }

      // Validasi struktur JSON ciphertext
      try {
        const parsed = JSON.parse(ciphertext);
        if (!parsed.chunks || !Array.isArray(parsed.chunks)) {
          return res.status(400).json({ error: 'Format ciphertext tidak valid: chunks array hilang' });
        }
      } catch {
        return res.status(400).json({ error: 'Ciphertext harus berupa JSON string yang valid' });
      }

      const savedMessage = messageModel.create(
        targetRecipientId,
        ciphertext,
        cryptoMetadata || {}
      );

      return res.status(201).json({
        message: 'Pesan terenkripsi berhasil dikirim secara anonim',
        messageId: savedMessage.id,
        createdAt: savedMessage.created_at
      });
    } catch (error) {
      next(error);
    }
  },

  async getInbox(req, res, next) {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

      const messages = messageModel.findByRecipient(req.user.id, limit, offset);
      const stats = messageModel.countByRecipient(req.user.id);

      const items = messages.map(msg => {
        let meta = {};
        try {
          meta = JSON.parse(msg.crypto_metadata);
        } catch {
          meta = {};
        }

        return {
          id: msg.id,
          createdAt: msg.created_at,
          readAt: msg.read_at,
          isRead: Boolean(msg.read_at),
          cryptoMetadata: {
            algorithm: meta.algorithm || 'ElGamal',
            chunkCount: meta.chunkCount || 1,
            timestamp: meta.timestamp
          }
        };
      });

      return res.json({
        total: stats.total,
        unread: stats.unread,
        messages: items
      });
    } catch (error) {
      next(error);
    }
  },

  async getMessageById(req, res, next) {
    try {
      const { id } = req.params;
      const message = messageModel.findById(id);

      if (!message || message.deleted_at) {
        return res.status(404).json({ error: 'Pesan tidak ditemukan' });
      }

      // Otorisasi ketat: Hanya penerima yang berhak mengakses
      if (message.recipient_id !== req.user.id) {
        return res.status(403).json({
          error: 'Akses ditolak: Anda tidak memiliki hak untuk mengakses pesan ini'
        });
      }

      let parsedMeta = {};
      try {
        parsedMeta = JSON.parse(message.crypto_metadata);
      } catch {
        parsedMeta = {};
      }

      return res.json({
        id: message.id,
        recipientId: message.recipient_id,
        ciphertext: message.ciphertext,
        cryptoMetadata: parsedMeta,
        createdAt: message.created_at,
        readAt: message.read_at
      });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const message = messageModel.findById(id);

      if (!message || message.deleted_at) {
        return res.status(404).json({ error: 'Pesan tidak ditemukan' });
      }

      if (message.recipient_id !== req.user.id) {
        return res.status(403).json({
          error: 'Akses ditolak: Anda tidak memiliki hak mengubah pesan ini'
        });
      }

      messageModel.markAsRead(id, req.user.id);

      return res.json({
        message: 'Status baca berhasil diperbarui'
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      const message = messageModel.findById(id);

      if (!message || message.deleted_at) {
        return res.status(404).json({ error: 'Pesan tidak ditemukan' });
      }

      if (message.recipient_id !== req.user.id) {
        return res.status(403).json({
          error: 'Akses ditolak: Anda tidak memiliki hak menghapus pesan ini'
        });
      }

      messageModel.softDelete(id, req.user.id);

      return res.json({
        message: 'Pesan berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  }
};
