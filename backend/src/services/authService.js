/**
 * CryptoFess — Authentication Service
 * Menangani hashing kata sandi dan pembuatan token JWT
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cryptofess-default-dev-secret-do-not-use-in-prod';
const JWT_EXPIRES_IN = '7d';

export const authService = {
  async hashPassword(password) {
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Kata sandi minimal 6 karakter');
    }
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
};
