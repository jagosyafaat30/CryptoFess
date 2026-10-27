import { Router } from 'express';
import { messageController } from '../controllers/messageController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const messageRoutes = Router();

// Kirim pesan anonim (Public)
messageRoutes.post('/messages', messageController.sendMessage);

// Operasi inbox dan pesan pengguna aktif (Protected)
messageRoutes.get('/messages/inbox', authenticate, messageController.getInbox);
messageRoutes.get('/messages/:id', authenticate, messageController.getMessageById);
messageRoutes.patch('/messages/:id/read', authenticate, messageController.markAsRead);
messageRoutes.delete('/messages/:id', authenticate, messageController.deleteMessage);
