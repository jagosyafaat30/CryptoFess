-- CryptoFess Database Schema
-- Sesuai PRD_CryptoFess.md Bagian 13

PRAGMA foreign_keys = ON;

-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Tabel Public Keys
-- CATATAN KEAMANAN: Private key DILARANG disimpan pada tabel ini atau di database server.
CREATE TABLE IF NOT EXISTS public_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    algorithm TEXT NOT NULL,
    public_key_data TEXT NOT NULL,
    key_version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_public_keys_user ON public_keys(user_id);

-- Tabel Messages
-- CATATAN KEAMANAN: Plaintext DILARANG disimpan pada tabel ini.
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    ciphertext TEXT NOT NULL,
    crypto_metadata TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    deleted_at DATETIME NULL,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, read_at) WHERE deleted_at IS NULL;
