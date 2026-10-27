import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ELGAMAL_PARAMS,
  DEMO_ELGAMAL_PARAMS,
  validateElGamalParameters,
  generateElGamalKeyPair,
  elgamalEncrypt,
  elgamalDecrypt
} from '../crypto/elgamal.js';
import { modPow } from '../crypto/math.js';

describe('ElGamal Asymmetric Cryptosystem', () => {
  const { p, g } = DEMO_ELGAMAL_PARAMS[0]; // p = 2357, g = 2

  it('pembentukan pasangan kunci sesuai rumus y = g^x mod p (TEST-ELG-01)', () => {
    const x = 1751n; // Private key
    const { privateKey, publicKey } = generateElGamalKeyPair(p, g, x);
    assert.equal(privateKey, 1751n);
    // y = 2^1751 mod 2357
    const expectedY = modPow(g, x, p);
    assert.equal(publicKey, expectedY);
  });

  it('enkripsi nilai numerik valid dan dekripsi memulihkan nilai asli (TEST-ELG-02, TEST-ELG-03)', () => {
    const keyPair = generateElGamalKeyPair(p, g);
    const originalMessage = 1234n; // Nilai m di dalam [1, p - 1]

    // Enkripsi
    const { c1, c2, k } = elgamalEncrypt(originalMessage, keyPair.publicKey, p, g);
    assert.ok(c1 > 0n && c1 < p);
    assert.ok(c2 > 0n && c2 < p);

    // Dekripsi
    const { m } = elgamalDecrypt(c1, c2, keyPair.privateKey, p);
    assert.equal(m, originalMessage);
  });

  it('bekerja dengan nilai k khusus untuk verifikasi vektor matematis', () => {
    const x = 1751n;
    const { publicKey } = generateElGamalKeyPair(p, g, x);
    const m = 2035n;
    const k = 1520n;

    const { c1, c2 } = elgamalEncrypt(m, publicKey, p, g, k);
    const { m: decrypted } = elgamalDecrypt(c1, c2, x, p);
    assert.equal(decrypted, m);
  });

  it('menolak pesan di luar domain [1, p - 1] (TEST-ELG-04)', () => {
    const { publicKey } = generateElGamalKeyPair(p, g);
    // m = 0 ditolak
    assert.throws(() => elgamalEncrypt(0n, publicKey, p, g), RangeError);
    // m >= p ditolak
    assert.throws(() => elgamalEncrypt(p, publicKey, p, g), RangeError);
    assert.throws(() => elgamalEncrypt(p + 10n, publicKey, p, g), RangeError);
  });

  it('menangani ciphertext tidak valid tanpa crash (TEST-ELG-05)', () => {
    const { privateKey } = generateElGamalKeyPair(p, g);
    // c1 = 0 atau c1 >= p tidak valid
    assert.throws(() => elgamalDecrypt(0n, 100n, privateKey, p), RangeError);
    assert.throws(() => elgamalDecrypt(100n, 0n, privateKey, p), RangeError);
    assert.throws(() => elgamalDecrypt(p + 1n, 100n, privateKey, p), RangeError);
  });

  it('bekerja dengan parameter besar RFC 3526 2048-bit', () => {
    const pBig = DEFAULT_ELGAMAL_PARAMS.p;
    const gBig = DEFAULT_ELGAMAL_PARAMS.g;

    const keyPair = generateElGamalKeyPair(pBig, gBig);
    const largeMessage = 9876543210987654321098765432109876543210n;

    const { c1, c2 } = elgamalEncrypt(largeMessage, keyPair.publicKey, pBig, gBig);
    const { m: decrypted } = elgamalDecrypt(c1, c2, keyPair.privateKey, pBig);

    assert.equal(decrypted, largeMessage);
  });

  it('mencatat langkah kalkulasi untuk demonstrasi Crypto Lab', () => {
    const keyPair = generateElGamalKeyPair(p, g, null, true);
    assert.ok(keyPair.steps && keyPair.steps.length > 0);

    const enc = elgamalEncrypt(100n, keyPair.publicKey, p, g, null, true);
    assert.ok(enc.steps && enc.steps.length === 4);

    const dec = elgamalDecrypt(enc.c1, enc.c2, keyPair.privateKey, p, true);
    assert.ok(dec.steps && dec.steps.length === 3);
  });
});
