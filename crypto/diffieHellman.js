/**
 * CryptoFess — Diffie-Hellman Key Exchange Module
 *
 * Implementasi manual algoritma pertukaran kunci Diffie-Hellman.
 * Tanpa library eksternal.
 * Sesuai PRD_CryptoFess.md Bagian 8.1 dan Kriteria Penerimaan.
 */

import { toBigInt, modPow, randomBigInt } from './math.js';

/**
 * Parameter standar Diffie-Hellman (RFC 3526 MODP Group 14 - 2048 bit)
 * Generator g = 2
 */
export const RFC3526_MODP_2048 = {
  name: 'RFC 3526 Group 14 (2048-bit)',
  g: 2n,
  p: BigInt(
    '0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
    '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
    'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
    'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
    'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' +
    'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' +
    '83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
    '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
    'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' +
    'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' +
    '15728E5A8AACAA68FFFFFFFFFFFFFFFF'
  )
};

/**
 * Parameter demo kecil untuk Crypto Lab & Pengujian Cepat
 */
export const DEMO_DH_PARAMS = [
  {
    name: 'Lab Edukasi (p = 23, g = 5)',
    p: 23n,
    g: 5n
  },
  {
    name: 'Lab Edukasi (p = 7919, g = 7)',
    p: 7919n,
    g: 7n
  },
  {
    name: 'Lab Edukasi (p = 65537, g = 3)',
    p: 65537n,
    g: 3n
  }
];

/**
 * Validasi parameter Diffie-Hellman
 *
 * @param {number|string|bigint} pVal
 * @param {number|string|bigint} gVal
 */
export function validateDhParameters(pVal, gVal) {
  const p = toBigInt(pVal);
  const g = toBigInt(gVal);

  if (p <= 2n) {
    throw new RangeError(`Prime modulus p must be > 2, got ${p}`);
  }
  if (g < 2n || g >= p) {
    throw new RangeError(`Generator g must be in range [2, p - 1], got ${g}`);
  }

  return { p, g };
}

/**
 * Pembangkitan pasangan kunci Diffie-Hellman
 *
 * @param {number|string|bigint} pVal
 * @param {number|string|bigint} gVal
 * @param {number|string|bigint|null} [customPrivateKey=null] - Untuk simulasi atau pengujian
 * @param {boolean} [collectSteps=false]
 * @returns {{ privateKey: bigint, publicKey: bigint, steps?: Array }}
 */
export function generateDhKeyPair(pVal, gVal, customPrivateKey = null, collectSteps = false) {
  const { p, g } = validateDhParameters(pVal, gVal);

  let privateKey;
  if (customPrivateKey !== null && customPrivateKey !== undefined) {
    privateKey = toBigInt(customPrivateKey);
    if (privateKey < 2n || privateKey >= p - 1n) {
      throw new RangeError(
        `Private key must be in range [2, p - 2] (got ${privateKey})`
      );
    }
  } else {
    // Generate private value a in range [2, p - 2]
    privateKey = randomBigInt(2n, p - 2n);
  }

  // Hitung public value: A = g^a mod p
  const steps = [];
  if (collectSteps) {
    steps.push({
      step: 1,
      name: 'Key Generation',
      formula: 'A = (g ^ a) mod p',
      p: p.toString(),
      g: g.toString(),
      privateKey: privateKey.toString()
    });
  }

  const publicKey = modPow(g, privateKey, p);

  if (collectSteps) {
    steps.push({
      step: 2,
      name: 'Public Key Calculated',
      publicKey: publicKey.toString()
    });
  }

  const result = { privateKey, publicKey };
  if (collectSteps) {
    result.steps = steps;
  }
  return result;
}

/**
 * Menghitung shared secret Diffie-Hellman
 * S = (otherPublicKey ^ privateKey) mod p
 *
 * @param {number|string|bigint} privateKeyVal
 * @param {number|string|bigint} otherPublicKeyVal
 * @param {number|string|bigint} pVal
 * @param {boolean} [collectSteps=false]
 * @returns {{ sharedSecret: bigint, steps?: Array }}
 */
export function computeDhSharedSecret(privateKeyVal, otherPublicKeyVal, pVal, collectSteps = false) {
  const privateKey = toBigInt(privateKeyVal);
  const otherPublicKey = toBigInt(otherPublicKeyVal);
  const p = toBigInt(pVal);

  if (p <= 2n) {
    throw new RangeError(`Prime modulus p must be > 2, got ${p}`);
  }

  if (privateKey < 2n || privateKey >= p - 1n) {
    throw new RangeError(`Private key must be in range [2, p - 2], got ${privateKey}`);
  }

  // Verifikasi public key lawan untuk mencegah serangan small-subgroup (0, 1, p - 1)
  if (otherPublicKey < 2n || otherPublicKey >= p - 1n) {
    throw new RangeError(
      `Invalid public key: ${otherPublicKey}. Must be in range [2, p - 2]`
    );
  }

  const steps = [];
  if (collectSteps) {
    steps.push({
      step: 1,
      formula: 'SharedSecret = (B ^ a) mod p',
      otherPublicKey: otherPublicKey.toString(),
      privateKey: privateKey.toString(),
      p: p.toString()
    });
  }

  const sharedSecret = modPow(otherPublicKey, privateKey, p);

  if (collectSteps) {
    steps.push({
      step: 2,
      sharedSecret: sharedSecret.toString()
    });
  }

  const result = { sharedSecret };
  if (collectSteps) {
    result.steps = steps;
  }
  return result;
}

/**
 * Simulasi lengkap pertukaran Diffie-Hellman antara Pihak A (Alice) dan Pihak B (Bob)
 * Digunakan oleh Crypto Lab dan Pengujian.
 *
 * @param {number|string|bigint} pVal
 * @param {number|string|bigint} gVal
 * @param {number|string|bigint|null} [privateKeyA=null]
 * @param {number|string|bigint|null} [privateKeyB=null]
 * @returns {object} Detail seluruh proses pertukaran
 */
export function simulateDhExchange(pVal, gVal, privateKeyA = null, privateKeyB = null) {
  const { p, g } = validateDhParameters(pVal, gVal);

  // 1. Alice membangkitkan pasangan kunci
  const alice = generateDhKeyPair(p, g, privateKeyA, true);

  // 2. Bob membangkitkan pasangan kunci
  const bob = generateDhKeyPair(p, g, privateKeyB, true);

  // 3. Alice menghitung shared secret menggunakan public key Bob
  const aliceShared = computeDhSharedSecret(alice.privateKey, bob.publicKey, p, true);

  // 4. Bob menghitung shared secret menggunakan public key Alice
  const bobShared = computeDhSharedSecret(bob.privateKey, alice.publicKey, p, true);

  const matched = aliceShared.sharedSecret === bobShared.sharedSecret;

  return {
    parameters: {
      p: p.toString(),
      g: g.toString()
    },
    alice: {
      privateKey: alice.privateKey.toString(),
      publicKey: alice.publicKey.toString(),
      computedSecret: aliceShared.sharedSecret.toString()
    },
    bob: {
      privateKey: bob.privateKey.toString(),
      publicKey: bob.publicKey.toString(),
      computedSecret: bobShared.sharedSecret.toString()
    },
    sharedSecret: aliceShared.sharedSecret.toString(),
    matched,
    explanation: [
      `1. Parameter publik disepakati: p = ${p}, g = ${g}`,
      `2. Alice memilih private key a = ${alice.privateKey}, menghitung public key A = g^a mod p = ${alice.publicKey}`,
      `3. Bob memilih private key b = ${bob.privateKey}, menghitung public key B = g^b mod p = ${bob.publicKey}`,
      `4. Alice menerima B, menghitung S_Alice = B^a mod p = ${aliceShared.sharedSecret}`,
      `5. Bob menerima A, menghitung S_Bob = A^b mod p = ${bobShared.sharedSecret}`,
      `6. Kesimpulan: S_Alice ${matched ? '===' : '!=='} S_Bob (${aliceShared.sharedSecret})`
    ]
  };
}
