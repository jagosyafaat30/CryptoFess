import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const userRoutes = Router();

// Endpoint profil pengguna aktif (Protected)
userRoutes.get('/users/me', authenticate, userController.getMe);
userRoutes.post('/users/public-key', authenticate, userController.updatePublicKey);

// Endpoint informasi publik penerima (Public)
userRoutes.get('/recipients/:username', userController.getRecipient);
userRoutes.get('/recipients/:username/public-keys', userController.getRecipientPublicKeys);
