import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  textToChunks,
  chunksToText,
  encryptMessage,
  decryptMessage,
  getMaxChunkBytes
} from '../crypto/encoding.js';
import {
  DEFAULT_ELGAMAL_PARAMS,
  DEMO_ELGAMAL_PARAMS,
  generateElGamalKeyPair
} from '../crypto/elgamal.js';

describe('Message Packaging & Chunking', () => {
  const p = DEFAULT_ELGAMAL_PARAMS.p;
  const g = DEFAULT_ELGAMAL_PARAMS.g;

  it('menghitung ukuran chunk aman yang sesuai batas bit modulus', () => {
    const bytes2048 = getMaxChunkBytes(p);
    assert.ok(bytes2048 > 200);

    const smallP = DEMO_ELGAMAL_PARAMS[0].p; // 2357 (~12 bit)
    const bytesSmall = getMaxChunkBytes(smallP);
    assert.equal(bytesSmall, 1);
  });

  it('chunking dan rekonstruksi teks (ASCII, bahasa Indonesia, simbol, emoji)', () => {
    const testStrings = [
      'Halo dunia!',
      'Ini adalah pesan rahasia anonim CryptoFess yang sangat rahasia.',
      'Karakter khusus: @#$%^&*()_+~`|}{[]:;?><,./ \n Baris baru.',
      'Dukungan UTF-8 & Emoji: Selamat malam! 🚀🔐✨🇮🇩',
      ''
    ];

    for (const text of testStrings) {
      const chunks = textToChunks(text, p);
      assert.ok(Array.isArray(chunks));
      for (const ch of chunks) {
        assert.ok(ch > 0n && ch < p, `Chunk ${ch} harus berada dalam [1, p - 1]`);
      }
      const restored = chunksToText(chunks);
      assert.equal(restored, text, `Gagal memulihkan teks: "${text}"`);
    }
  });

  it('end-to-end encryptMessage dan decryptMessage berhasil untuk teks panjang', () => {
    const keyPair = generateElGamalKeyPair(p, g);
    const originalMessage =
      'Halo! Aku cuma mau bilang kalau aku mengagumi dedikasi kamu dalam belajar kriptografi di CryptoFess. Tetap semangat ya!';

    const { ciphertext, cryptoMetadata } = encryptMessage(originalMessage, keyPair.publicKey, p, g);

    assert.equal(typeof ciphertext, 'string');
    assert.equal(cryptoMetadata.algorithm, 'ElGamal');
    assert.ok(cryptoMetadata.chunkCount > 0);

    // Pastikan ciphertext tidak mengandung plaintext asli
    assert.equal(ciphertext.includes(originalMessage), false);

    // Dekripsi dengan private key yang benar
    const decryptedText = decryptMessage(ciphertext, keyPair.privateKey, p);
    assert.equal(decryptedText, originalMessage);
  });

  it('gagal mendekripsi jika menggunakan private key yang salah', () => {
    const alice = generateElGamalKeyPair(p, g);
    const eve = generateElGamalKeyPair(p, g);

    const message = 'Rahasia negara';
    const { ciphertext } = encryptMessage(message, alice.publicKey, p, g);

    // Eve mencoba mendekripsi pesan Alice
    assert.throws(() => {
      const eveResult = decryptMessage(ciphertext, eve.privateKey, p);
      // Jika tidak throw, hasilnya pasti bukan pesan asli
      assert.notEqual(eveResult, message);
    });
  });

  it('menolak format ciphertext yang rusak atau bukan JSON valid', () => {
    const keyPair = generateElGamalKeyPair(p, g);
    assert.throws(() => decryptMessage('not a json', keyPair.privateKey, p));
    assert.throws(() => decryptMessage('{"invalid": true}', keyPair.privateKey, p));
  });
});
