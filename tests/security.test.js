import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../backend/src/app.js';
import { initDatabase, closeDb, getDb } from '../database/index.js';
import {
  DEFAULT_ELGAMAL_PARAMS,
  generateElGamalKeyPair
} from '../crypto/elgamal.js';
import {
  encryptMessage,
  decryptMessage
} from '../crypto/encoding.js';

describe('Security & Cryptography Compliance Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.NODE_ENV = 'test';
    initDatabase(':memory:');
    const app = createApp();

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    closeDb();
  });

  it('Menolak jika plaintext dikirimkan langsung ke server API (Pemeriksaan E2EE)', async () => {
    // 1. Buat pengguna uji
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'charlie',
        password: 'password123'
      })
    });
    assert.equal(regRes.status, 201);

    // 2. Coba kirim pesan yang menyertakan plaintext / text / message
    const badPayload = {
      recipientUsername: 'charlie',
      plaintext: 'Ini teks rahasia yang tidak terenkripsi',
      ciphertext: JSON.stringify({ chunks: [{ c1: '1', c2: '2' }] })
    };

    const res = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badPayload)
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('Plaintext tidak boleh dikirimkan ke server'));
  });

  it('Menolak jika private key coba dikirimkan ke server', async () => {
    const leakAttempt = {
      username: 'hacker',
      password: 'password123',
      privateKey: '123456789'
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leakAttempt)
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('Private key DILARANG'));
  });

  it('Verifikasi database: Password disimpan sebagai hash bcrypt dan bukan plaintext', () => {
    const db = getDb();
    const users = db.prepare('SELECT username, password_hash FROM users').all();
    assert.ok(users.length > 0);

    for (const u of users) {
      assert.notEqual(u.password_hash, 'password123');
      // Hash bcrypt selalu diawali $2a$ atau $2b$
      assert.ok(u.password_hash.startsWith('$2'), 'Password hash harus berformat bcrypt');
    }
  });

  it('Alur Enkripsi Klien-ke-Klien Penuh dengan Algoritma Manual ElGamal', async () => {
    // 1. Dave membangkitkan pasangan kunci ElGamal secara lokal (Client-side)
    const p = DEFAULT_ELGAMAL_PARAMS.p;
    const g = DEFAULT_ELGAMAL_PARAMS.g;
    const daveKeys = generateElGamalKeyPair(p, g);

    // 2. Dave mendaftarkan akun dan hanya mengirimkan public key (y)
    const daveRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dave',
        password: 'davepassword123',
        publicKey: {
          algorithm: 'ElGamal',
          p: p.toString(),
          g: g.toString(),
          y: daveKeys.publicKey.toString()
        }
      })
    });
    assert.equal(daveRegRes.status, 201);
    const daveAuth = await daveRegRes.json();

    // 3. Pengirim anonim mengambil kunci publik Dave dari server
    const pubKeyRes = await fetch(`${baseUrl}/api/recipients/dave/public-keys`);
    assert.equal(pubKeyRes.status, 200);
    const pubKeyData = await pubKeyRes.json();
    const recipientKey = pubKeyData.publicKeys[0].publicKeyData;

    // 4. Pengirim anonim mengenkripsi pesan rahasia di browser/klien
    const secretConfession = 'Halo Dave! Aku kagum dengan cara kamu menyelesaikan tugas kriptografi!';
    const { ciphertext, cryptoMetadata } = encryptMessage(
      secretConfession,
      recipientKey.y,
      recipientKey.p,
      recipientKey.g
    );

    // 5. Pengirim mengirimkan ciphertext ke backend
    const sendRes = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUsername: 'dave',
        ciphertext,
        cryptoMetadata
      })
    });
    assert.equal(sendRes.status, 201);
    const sentData = await sendRes.json();

    // 6. Audit Database Server Langsung: Pastikan TIDAK ADA plaintext yang tersimpan di server
    const db = getDb();
    const storedMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(sentData.messageId);
    assert.ok(storedMsg);
    assert.equal(storedMsg.ciphertext.includes(secretConfession), false, 'Server menyimpan plaintext!');
    assert.ok(storedMsg.ciphertext.includes('chunks'));

    // 7. Dave masuk dan mengambil pesan dari inbox
    const fetchMsgRes = await fetch(`${baseUrl}/api/messages/${sentData.messageId}`, {
      headers: { Authorization: `Bearer ${daveAuth.token}` }
    });
    assert.equal(fetchMsgRes.status, 200);
    const fetchedMsg = await fetchMsgRes.json();

    // 8. Dave mendekripsi pesan secara lokal dengan private key Dave
    const decryptedMessage = decryptMessage(
      fetchedMsg.ciphertext,
      daveKeys.privateKey,
      p
    );

    // 9. Pesan hasil dekripsi harus persis sama dengan pesan rahasia asli!
    assert.equal(decryptedMessage, secretConfession);
  });
});
