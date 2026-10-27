/**
 * CryptoFess — Message Encoding and Packaging Module
 *
 * Mengonversi teks arbitrer menjadi representasi numerik yang sesuai
 * dengan domain matematis ElGamal [1, p - 1] melalui chunking berbasis byte.
 * Sesuai PRD_CryptoFess.md Bagian 6.3 dan 8.2.
 */

import { toBigInt } from './math.js';
import { elgamalEncrypt, elgamalDecrypt } from './elgamal.js';

/**
 * Menghitung ukuran byte maksimal per chunk untuk modulus p tertentu.
 * Menggunakan sentinel byte 0x01 sehingga:
 * (maxBytesPerChunk + 1) * 8 <= bitLength(p) - 1
 *
 * @param {bigint} p
 * @returns {number}
 */
export function getMaxChunkBytes(p) {
  const pBig = toBigInt(p);
  const bitLength = pBig.toString(2).length;
  // Sisakan ruang untuk sentinel byte dan pastikan < p
  const maxBytes = Math.floor((bitLength - 2) / 8);
  return Math.max(1, maxBytes);
}

/**
 * Mengubah string teks (UTF-8) menjadi array bilangan BigInt m_i
 * di mana setiap m_i berada pada domain [1, p - 1].
 * Sentinel 0x01 ditambahkan di awal setiap chunk agar byte bernilai 0x00 tidak hilang.
 *
 * @param {string} text
 * @param {bigint} p
 * @returns {bigint[]}
 */
export function textToChunks(text, p) {
  if (typeof text !== 'string') {
    throw new TypeError('Teks pesan harus berupa string');
  }

  const pBig = toBigInt(p);
  const maxChunkBytes = getMaxChunkBytes(pBig);

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  if (bytes.length === 0) {
    // Teks kosong direpresentasikan dengan satu chunk berisi sentinel saja
    return [1n];
  }

  const chunks = [];
  for (let i = 0; i < bytes.length; i += maxChunkBytes) {
    const slice = bytes.slice(i, i + maxChunkBytes);

    // Awali dengan sentinel byte 0x01
    let chunkVal = 1n;
    for (let j = 0; j < slice.length; j++) {
      chunkVal = (chunkVal << 8n) | BigInt(slice[j]);
    }

    if (chunkVal >= pBig) {
      throw new RangeError(`Nilai chunk ${chunkVal} melebihi modulus p ${pBig}`);
    }

    chunks.push(chunkVal);
  }

  return chunks;
}

/**
 * Mengembalikan array bilangan BigInt m_i menjadi teks UTF-8 asli
 *
 * @param {bigint[]} chunks
 * @returns {string}
 */
export function chunksToText(chunks) {
  if (!Array.isArray(chunks)) {
    throw new TypeError('Chunks harus berupa array BigInt');
  }

  if (chunks.length === 0) return '';
  if (chunks.length === 1 && toBigInt(chunks[0]) === 1n) return '';

  const allBytes = [];

  for (const chunkVal of chunks) {
    let val = toBigInt(chunkVal);
    const chunkBytes = [];

    while (val > 0n) {
      chunkBytes.unshift(Number(val & 0xFFn));
      val >>= 8n;
    }

    // Periksa sentinel byte di awal
    if (chunkBytes.length === 0 || chunkBytes[0] !== 0x01) {
      throw new Error('Format chunk tidak valid: sentinel byte 0x01 tidak ditemukan');
    }

    // Ambil byte data setelah sentinel
    for (let i = 1; i < chunkBytes.length; i++) {
      allBytes.push(chunkBytes[i]);
    }
  }

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(new Uint8Array(allBytes));
}

/**
 * Mengenkripsi teks lengkap dengan ElGamal chunking
 *
 * @param {string} text - Pesan teks asli
 * @param {number|string|bigint} publicKey - Kunci publik penerima (y)
 * @param {number|string|bigint} p - Modulus prima
 * @param {number|string|bigint} g - Generator
 * @returns {{ ciphertext: string, cryptoMetadata: object }}
 */
export function encryptMessage(text, publicKey, p, g) {
  const pBig = toBigInt(p);
  const gBig = toBigInt(g);
  const yBig = toBigInt(publicKey);

  const chunks = textToChunks(text, pBig);
  const encryptedPairs = [];

  for (const chunk of chunks) {
    const { c1, c2 } = elgamalEncrypt(chunk, yBig, pBig, gBig);
    encryptedPairs.push({
      c1: c1.toString(),
      c2: c2.toString()
    });
  }

  const payload = {
    version: '1.0',
    chunks: encryptedPairs
  };

  const cryptoMetadata = {
    algorithm: 'ElGamal',
    version: '1.0',
    chunkCount: encryptedPairs.length,
    p: pBig.toString(),
    g: gBig.toString(),
    recipientPublicKey: yBig.toString(),
    timestamp: new Date().toISOString()
  };

  return {
    ciphertext: JSON.stringify(payload),
    cryptoMetadata
  };
}

/**
 * Mendekripsi ciphertext serialisasi kembali ke teks asli
 *
 * @param {string|object} ciphertextRaw - JSON string atau objek ciphertext
 * @param {number|string|bigint} privateKey - Private key penerima (x)
 * @param {number|string|bigint} p - Modulus prima
 * @returns {string} Plaintext hasil dekripsi
 */
export function decryptMessage(ciphertextRaw, privateKey, p) {
  const pBig = toBigInt(p);
  const xBig = toBigInt(privateKey);

  let payload;
  if (typeof ciphertextRaw === 'string') {
    try {
      payload = JSON.parse(ciphertextRaw);
    } catch (e) {
      throw new Error(`Format ciphertext bukan JSON yang valid: ${e.message}`);
    }
  } else if (typeof ciphertextRaw === 'object' && ciphertextRaw !== null) {
    payload = ciphertextRaw;
  } else {
    throw new TypeError('Ciphertext harus berupa JSON string atau object');
  }

  if (!payload.chunks || !Array.isArray(payload.chunks)) {
    throw new Error('Ciphertext payload tidak memiliki struktur chunks yang valid');
  }

  const decryptedChunks = [];
  for (const item of payload.chunks) {
    if (!item.c1 || !item.c2) {
      throw new Error('Ciphertext item tidak memiliki pasangan (c1, c2)');
    }
    const { m } = elgamalDecrypt(item.c1, item.c2, xBig, pBig);
    decryptedChunks.push(m);
  }

  return chunksToText(decryptedChunks);
}
