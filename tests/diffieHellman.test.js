import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RFC3526_MODP_2048,
  DEMO_DH_PARAMS,
  validateDhParameters,
  generateDhKeyPair,
  computeDhSharedSecret,
  simulateDhExchange
} from '../crypto/diffieHellman.js';
import { modPow } from '../crypto/math.js';

describe('Diffie-Hellman Key Exchange', () => {
  const { p, g } = DEMO_DH_PARAMS[0]; // p = 23, g = 5

  it('validasi parameter dengan benar (TEST-DH-05)', () => {
    assert.doesNotThrow(() => validateDhParameters(23, 5));
    assert.throws(() => validateDhParameters(2, 5), RangeError);
    assert.throws(() => validateDhParameters(23, 1), RangeError);
    assert.throws(() => validateDhParameters(23, 24), RangeError);
  });

  it('pembentukan public value sesuai rumus A = g^a mod p (TEST-DH-01)', () => {
    const a = 6n;
    const { privateKey, publicKey } = generateDhKeyPair(p, g, a);
    assert.equal(privateKey, 6n);
    // 5^6 mod 23 = 15625 mod 23 = 8
    assert.equal(publicKey, 8n);
    assert.equal(publicKey, modPow(g, a, p));
  });

  it('perhitungan rahasia pihak A dan pihak B menghasilkan shared secret yang sama (TEST-DH-02, TEST-DH-03, TEST-DH-04)', () => {
    // Alice
    const a = 6n;
    const alice = generateDhKeyPair(p, g, a);

    // Bob
    const b = 15n;
    const bob = generateDhKeyPair(p, g, b);

    // Bob: 5^15 mod 23 = 19
    assert.equal(bob.publicKey, 19n);

    // Alice menghitung shared secret S_A = B^a mod p = 19^6 mod 23 = 2
    const { sharedSecret: secretA } = computeDhSharedSecret(alice.privateKey, bob.publicKey, p);

    // Bob menghitung shared secret S_B = A^b mod p = 8^15 mod 23 = 2
    const { sharedSecret: secretB } = computeDhSharedSecret(bob.privateKey, alice.publicKey, p);

    assert.equal(secretA, secretB);
    assert.equal(secretA, 2n);
  });

  it('bekerja dengan parameter besar RFC 3526 MODP 2048-bit', () => {
    const pBig = RFC3526_MODP_2048.p;
    const gBig = RFC3526_MODP_2048.g;

    const alice = generateDhKeyPair(pBig, gBig);
    const bob = generateDhKeyPair(pBig, gBig);

    const { sharedSecret: sAlice } = computeDhSharedSecret(alice.privateKey, bob.publicKey, pBig);
    const { sharedSecret: sBob } = computeDhSharedSecret(bob.privateKey, alice.publicKey, pBig);

    assert.equal(sAlice, sBob);
    assert.ok(sAlice > 0n);
  });

  it('simulasi lengkap DH untuk Crypto Lab berfungsi secara komprehensif', () => {
    const sim = simulateDhExchange(p, g, 4n, 7n);
    assert.equal(sim.matched, true);
    assert.ok(sim.explanation.length > 0);
    assert.equal(sim.alice.computedSecret, sim.bob.computedSecret);
  });

  it('menolak public key lawan yang tidak valid (0, 1, p - 1)', () => {
    const a = 5n;
    // Public key 0 atau 1 atau >= p - 1 ditolak
    assert.throws(() => computeDhSharedSecret(a, 0n, p), RangeError);
    assert.throws(() => computeDhSharedSecret(a, 1n, p), RangeError);
    assert.throws(() => computeDhSharedSecret(a, p - 1n, p), RangeError);
    assert.throws(() => computeDhSharedSecret(a, p + 5n, p), RangeError);
  });
});
