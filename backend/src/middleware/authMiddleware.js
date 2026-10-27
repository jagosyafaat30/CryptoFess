/**
 * CryptoFess — Authentication & Authorization Middleware
 */

import { authService } from '../services/authService.js';
import { userModel } from '../models/userModel.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Autentikasi diperlukan. Token tidak ditemukan.'
    });
  }

  const token = authHeader.substring(7).trim();
  const decoded = authService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.'
    });
  }

  // Verifikasi pengguna masih ada di database
  const user = userModel.findById(decoded.id);
  if (!user) {
    return res.status(401).json({
      error: 'Pengguna tidak ditemukan.'
    });
  }

  req.user = user;
  next();
}
