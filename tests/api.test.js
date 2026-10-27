import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../backend/src/app.js';
import { initDatabase, closeDb } from '../database/index.js';

describe('Backend API Integration Tests', () => {
  let server;
  let baseUrl;
  let testDb;

  let aliceToken;
  let aliceId;
  let bobToken;
  let bobId;
  let sentMessageId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    testDb = initDatabase(':memory:');
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

  it('GET /api/health mengembalikan status ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });

  it('POST /api/auth/register mendaftarkan pengguna baru dengan sukses (TEST-APP-01)', async () => {
    const payload = {
      username: 'alice',
      password: 'password123',
      publicKey: {
        algorithm: 'ElGamal',
        p: '2357',
        g: '2',
        y: '123'
      }
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.username, 'alice');
    aliceToken = data.token;
    aliceId = data.user.id;
  });

  it('POST /api/auth/register menolak username duplikat (TEST-APP-02)', async () => {
    const payload = {
      username: 'alice',
      password: 'password123'
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.ok(data.error.includes('sudah digunakan'));
  });

  it('POST /api/auth/register menolak kata sandi kurang dari 6 karakter', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'shortpass', password: '123' })
    });

    assert.equal(res.status, 400);
  });

  it('POST /api/auth/login berhasil dengan kredensial yang valid (TEST-APP-03)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'password123' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.username, 'alice');
  });

  it('POST /api/auth/login menolak kredensial yang tidak valid (TEST-APP-04)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'wrongpassword' })
    });

    assert.equal(res.status, 401);
  });

  it('Daftarkan pengguna Bob untuk pengujian isolasi pesan', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bob', password: 'password123' })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    bobToken = data.token;
    bobId = data.user.id;
  });

  it('GET /api/users/me mengembalikan profil pengguna yang terautentikasi', async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.username, 'alice');
    assert.ok(data.stats);
  });

  it('GET /api/recipients/:username mengembalikan informasi publik penerima', async () => {
    const res = await fetch(`${baseUrl}/api/recipients/alice`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.recipient.username, 'alice');
    assert.equal(data.recipient.hasPublicKey, true);
  });

  it('GET /api/recipients/:username/public-keys mengembalikan kunci publik penerima', async () => {
    const res = await fetch(`${baseUrl}/api/recipients/alice/public-keys`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.username, 'alice');
    assert.ok(data.publicKeys.length > 0);
  });

  it('POST /api/messages mengirim pesan anonim ke Alice (TEST-APP-05)', async () => {
    const fakeCiphertext = JSON.stringify({
      version: '1.0',
      chunks: [{ c1: '123', c2: '456' }]
    });

    const res = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUsername: 'alice',
        ciphertext: fakeCiphertext,
        cryptoMetadata: { algorithm: 'ElGamal', chunkCount: 1 }
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.messageId);
    sentMessageId = data.messageId;
  });

  it('GET /api/messages/inbox menampilkan pesan milik pengguna penerima (TEST-APP-06)', async () => {
    // Alice melihat inbox-nya
    const resAlice = await fetch(`${baseUrl}/api/messages/inbox`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });

    assert.equal(resAlice.status, 200);
    const dataAlice = await resAlice.json();
    assert.equal(dataAlice.total, 1);
    assert.equal(dataAlice.unread, 1);
    assert.equal(dataAlice.messages[0].id, sentMessageId);

    // Bob melihat inbox-nya (harus 0)
    const resBob = await fetch(`${baseUrl}/api/messages/inbox`, {
      headers: { Authorization: `Bearer ${bobToken}` }
    });
    assert.equal(resBob.status, 200);
    const dataBob = await resBob.json();
    assert.equal(dataBob.total, 0);
  });

  it('GET /api/messages/:id mengembalikan pesan untuk penerima sah (TEST-APP-07)', async () => {
    const res = await fetch(`${baseUrl}/api/messages/${sentMessageId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, sentMessageId);
    assert.ok(data.ciphertext);
  });

  it('GET /api/messages/:id menolak akses pengguna lain (Bob mencoba baca pesan Alice) (TEST-APP-08)', async () => {
    const res = await fetch(`${baseUrl}/api/messages/${sentMessageId}`, {
      headers: { Authorization: `Bearer ${bobToken}` }
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes('Akses ditolak'));
  });

  it('PATCH /api/messages/:id/read menandai pesan sebagai terbaca', async () => {
    const res = await fetch(`${baseUrl}/api/messages/${sentMessageId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${aliceToken}` }
    });

    assert.equal(res.status, 200);

    // Cek statistik unread
    const inboxRes = await fetch(`${baseUrl}/api/messages/inbox`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    const inboxData = await inboxRes.json();
    assert.equal(inboxData.unread, 0);
  });

  it('DELETE /api/messages/:id menghapus pesan dari inbox (TEST-APP-09)', async () => {
    const res = await fetch(`${baseUrl}/api/messages/${sentMessageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${aliceToken}` }
    });

    assert.equal(res.status, 200);

    // Pastikan tidak ada lagi di inbox
    const inboxRes = await fetch(`${baseUrl}/api/messages/inbox`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    const inboxData = await inboxRes.json();
    assert.equal(inboxData.total, 0);
  });
});
