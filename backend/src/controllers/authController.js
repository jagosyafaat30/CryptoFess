/**
 * CryptoFess — Authentication Controller
 */

import { userModel } from '../models/userModel.js';
import { publicKeyModel } from '../models/publicKeyModel.js';
import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { username, password, publicKey, algorithm = 'ElGamal' } = req.body;

      // Validasi input username
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username wajib diisi' });
      }

      const trimmedUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(trimmedUsername)) {
        return res.status(400).json({
          error: 'Username hanya boleh terdiri dari 3-30 karakter alfanumerik dan garis bawah (_)'
        });
      }

      // Validasi input password
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          error: 'Kata sandi minimal terdiri dari 6 karakter'
        });
      }

      // Validasi keamanan: Pastikan tidak ada private key yang dikirimkan
      if (req.body.privateKey || req.body.x || req.body.private_key) {
        return res.status(400).json({
          error: 'Pelanggaran keamanan: Private key DILARANG dikirimkan ke server!'
        });
      }

      // Periksa apakah username sudah terdaftar
      const existing = userModel.findByUsername(trimmedUsername);
      if (existing) {
        return res.status(409).json({
          error: `Username "${trimmedUsername}" sudah digunakan. Silakan pilih username lain.`
        });
      }

      // Hash password dengan bcrypt
      const passwordHash = await authService.hashPassword(password);
      const newUser = userModel.create(trimmedUsername, passwordHash);

      // Simpan kunci publik jika disertakan
      let savedPublicKey = null;
      if (publicKey) {
        savedPublicKey = publicKeyModel.create(
          newUser.id,
          algorithm,
          publicKey,
          1
        );
      }

      // Buat token autentikasi
      const token = authService.generateToken(newUser);

      return res.status(201).json({
        message: 'Registrasi berhasil',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          created_at: newUser.created_at
        },
        publicKey: savedPublicKey
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Username dan kata sandi wajib diisi'
        });
      }

      const user = userModel.findByUsername(username.trim().toLowerCase());
      if (!user) {
        return res.status(401).json({
          error: 'Username atau kata sandi tidak valid'
        });
      }

      const isValid = await authService.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          error: 'Username atau kata sandi tidak valid'
        });
      }

      const token = authService.generateToken(user);
      const publicKeys = publicKeyModel.findByUserId(user.id);

      return res.json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at
        },
        publicKeys
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res) {
    // Pada model JWT tanpa state server, logout dilakukan dengan penghapusan token di client.
    return res.json({
      message: 'Logout berhasil. Sesi telah diakhiri.'
    });
  }
};
