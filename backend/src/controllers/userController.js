/**
 * CryptoFess — User & Recipient Controller
 */

import { userModel } from '../models/userModel.js';
import { publicKeyModel } from '../models/publicKeyModel.js';
import { messageModel } from '../models/messageModel.js';

export const userController = {
  async getMe(req, res, next) {
    try {
      const user = userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
      }

      const stats = messageModel.countByRecipient(user.id);
      const publicKeys = publicKeyModel.findByUserId(user.id);

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        stats,
        publicKeys
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePublicKey(req, res, next) {
    try {
      const { algorithm = 'ElGamal', publicKeyData } = req.body;

      if (!publicKeyData) {
        return res.status(400).json({ error: 'Data kunci publik wajib diisi' });
      }

      // Validasi keamanan: Larangan private key ke server
      if (req.body.privateKey || req.body.x || (typeof publicKeyData === 'object' && publicKeyData.x)) {
        return res.status(400).json({
          error: 'Pelanggaran keamanan: Private key DILARANG dikirimkan ke server!'
        });
      }

      const existingKeys = publicKeyModel.findByUserId(req.user.id);
      const nextVersion = existingKeys.length + 1;

      const created = publicKeyModel.create(
        req.user.id,
        algorithm,
        publicKeyData,
        nextVersion
      );

      return res.status(201).json({
        message: 'Kunci publik berhasil diperbarui',
        publicKey: created
      });
    } catch (error) {
      next(error);
    }
  },

  async getRecipient(req, res, next) {
    try {
      const { username } = req.params;
      const user = userModel.findByUsername(username);

      if (!user) {
        return res.status(404).json({
          error: `Penerima dengan username "${username}" tidak ditemukan`
        });
      }

      const latestKey = publicKeyModel.findLatestByUserIdAndAlgorithm(user.id, 'ElGamal');

      return res.json({
        recipient: {
          id: user.id,
          username: user.username,
          created_at: user.created_at,
          hasPublicKey: Boolean(latestKey)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getRecipientPublicKeys(req, res, next) {
    try {
      const { username } = req.params;
      const user = userModel.findByUsername(username);

      if (!user) {
        return res.status(404).json({
          error: `Penerima dengan username "${username}" tidak ditemukan`
        });
      }

      const keys = publicKeyModel.findByUserId(user.id);
      if (keys.length === 0) {
        return res.status(404).json({
          error: `Penerima belum mengonfigurasi kunci publik kriptografi.`
        });
      }

      // Kembalikan public key terbaru
      return res.json({
        recipientId: user.id,
        username: user.username,
        publicKeys: keys.map(k => ({
          id: k.id,
          algorithm: k.algorithm,
          publicKeyData: JSON.parse(k.public_key_data),
          keyVersion: k.key_version,
          createdAt: k.created_at
        }))
      });
    } catch (error) {
      next(error);
    }
  }
};
