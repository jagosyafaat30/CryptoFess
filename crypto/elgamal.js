/**
 * CryptoFess — ElGamal Asymmetric Cryptosystem Module
 *
 * Implementasi manual kriptografi asimetris ElGamal.
 * Tanpa memanggil library kriptografi eksternal.
 * Sesuai PRD_CryptoFess.md Bagian 8.2 dan Kriteria Penerimaan.
 */

import { toBigInt, modPow, modInverse, gcd, randomBigInt } from './math.js';

/**
 * Parameter standar ElGamal
 * Dapat menggunakan parameter yang sama dengan Diffie-Hellman atau parameter demo
 */
export const DEFAULT_ELGAMAL_PARAMS = {
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

export const DEMO_ELGAMAL_PARAMS = [
  {
    name: 'Lab Edukasi (p = 2357, g = 2)',
    p: 2357n,
    g: 2n
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
 * Validasi parameter ElGamal (p dan g)
 *
 * @param {number|string|bigint} pVal
 * @param {number|string|bigint} gVal
 */
export function validateElGamalParameters(pVal, gVal) {
  const p = toBigInt(pVal);
  const g = toBigInt(gVal);

  if (p <= 2n) {
    throw new RangeError(`Modulus prima p harus > 2, diperoleh ${p}`);
  }
  if (g < 2n || g >= p) {
    throw new RangeError(`Generator g harus berada pada rentang [2, p - 1], diperoleh ${g}`);
  }

  return { p, g };
}

/**
 * Pembangkitan pasangan kunci ElGamal (Private key x, Public key y)
 * y = g^x mod p
 *
 * @param {number|string|bigint} pVal
 * @param {number|string|bigint} gVal
 * @param {number|string|bigint|null} [customPrivateKey=null]
 * @param {boolean} [collectSteps=false]
 * @returns {{ privateKey: bigint, publicKey: bigint, steps?: Array }}
 */
export function generateElGamalKeyPair(pVal, gVal, customPrivateKey = null, collectSteps = false) {
  const { p, g } = validateElGamalParameters(pVal, gVal);

  let privateKey;
  if (customPrivateKey !== null && customPrivateKey !== undefined) {
    privateKey = toBigInt(customPrivateKey);
    if (privateKey < 2n || privateKey >= p - 1n) {
      throw new RangeError(`Private key x harus berada di rentang [2, p - 2], diperoleh ${privateKey}`);
    }
  } else {
    // Generate private key x in [2, p - 2]
    privateKey = randomBigInt(2n, p - 2n);
  }

  const steps = [];
  if (collectSteps) {
    steps.push({
      step: 1,
      description: 'Pilih private key x',
      formula: 'x ∈ [2, p - 2]',
      privateKey: privateKey.toString()
    });
  }

  // Hitung public key y = g^x mod p
  const publicKey = modPow(g, privateKey, p);

  if (collectSteps) {
    steps.push({
      step: 2,
      description: 'Hitung public key y',
      formula: 'y = (g ^ x) mod p',
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
 * Memilih nilai acak ephemeral k yang koprima dengan p - 1
 *
 * @param {bigint} p
 * @returns {bigint}
 */
export function generateEphemeralK(p) {
  const pMinusOne = p - 1n;
  let attempts = 0;
  while (attempts < 1000) {
    const k = randomBigInt(2n, p - 2n);
    if (gcd(k, pMinusOne) === 1n) {
      return k;
    }
    attempts++;
  }
  // Fallback jika loop probabilistik
  for (let k = 3n; k < p - 1n; k += 2n) {
    if (gcd(k, pMinusOne) === 1n) {
      return k;
    }
  }
  return 2n;
}

/**
 * Enkripsi ElGamal terhadap sebuah nilai numerik m
 * c1 = g^k mod p
 * c2 = (m * (y^k mod p)) mod p
 *
 * @param {number|string|bigint} mVal - Pesan numerik m dalam domain [1, p - 1]
 * @param {number|string|bigint} publicKeyVal - Public key penerima (y)
 * @param {number|string|bigint} pVal - Modulus prima
 * @param {number|string|bigint} gVal - Generator
 * @param {number|string|bigint|null} [customK=null] - Nilai acak ephemeral k opsional (untuk lab/test)
 * @param {boolean} [collectSteps=false]
 * @returns {{ c1: bigint, c2: bigint, k?: bigint, steps?: Array }}
 */
export function elgamalEncrypt(mVal, publicKeyVal, pVal, gVal, customK = null, collectSteps = false) {
  const { p, g } = validateElGamalParameters(pVal, gVal);
  const m = toBigInt(mVal);
  const y = toBigInt(publicKeyVal);

  // Validasi domain pesan m: harus 1 <= m < p (0 tidak memiliki invers dan berpotensi bocor)
  if (m <= 0n || m >= p) {
    throw new RangeError(
      `Pesan numerik m harus berada dalam domain matematis [1, p - 1]. Diberikan: ${m}, batas p: ${p}`
    );
  }

  // Validasi public key
  if (y < 2n || y >= p) {
    throw new RangeError(`Public key y tidak valid: ${y}. Harus dalam rentang [2, p - 1]`);
  }

  // Tentukan ephemeral key k
  let k;
  if (customK !== null && customK !== undefined) {
    k = toBigInt(customK);
    if (k < 1n || k >= p - 1n) {
      throw new RangeError(`Nilai ephemeral k harus berada dalam rentang [1, p - 2], diperoleh ${k}`);
    }
  } else {
    k = generateEphemeralK(p);
  }

  const steps = [];

  // Hitung c1 = g^k mod p
  const c1 = modPow(g, k, p);

  // Hitung faktor shared s = y^k mod p
  const yk = modPow(y, k, p);

  // Hitung c2 = (m * yk) mod p
  const c2 = (m * yk) % p;

  if (collectSteps) {
    steps.push({
      step: 1,
      description: 'Pilih nilai rahasia sementara (ephemeral key) k',
      formula: 'gcd(k, p - 1) = 1',
      k: k.toString()
    });
    steps.push({
      step: 2,
      description: 'Hitung ciphertext bagian pertama c1',
      formula: 'c1 = (g ^ k) mod p',
      c1: c1.toString()
    });
    steps.push({
      step: 3,
      description: 'Hitung faktor masking (y ^ k) mod p',
      formula: 'mask = (y ^ k) mod p',
      mask: yk.toString()
    });
    steps.push({
      step: 4,
      description: 'Hitung ciphertext bagian kedua c2',
      formula: 'c2 = (m * mask) mod p',
      c2: c2.toString()
    });
  }

  const result = { c1, c2, k };
  if (collectSteps) {
    result.steps = steps;
  }
  return result;
}

/**
 * Dekripsi ElGamal terhadap ciphertext (c1, c2)
 * s = c1^x mod p
 * s_inv = modInverse(s, p)
 * m = (c2 * s_inv) mod p
 *
 * @param {number|string|bigint} c1Val
 * @param {number|string|bigint} c2Val
 * @param {number|string|bigint} privateKeyVal - Private key penerima (x)
 * @param {number|string|bigint} pVal - Modulus prima
 * @param {boolean} [collectSteps=false]
 * @returns {{ m: bigint, steps?: Array }}
 */
export function elgamalDecrypt(c1Val, c2Val, privateKeyVal, pVal, collectSteps = false) {
  const c1 = toBigInt(c1Val);
  const c2 = toBigInt(c2Val);
  const x = toBigInt(privateKeyVal);
  const p = toBigInt(pVal);

  if (p <= 2n) {
    throw new RangeError(`Modulus prima p harus > 2, diperoleh ${p}`);
  }

  if (x < 2n || x >= p - 1n) {
    throw new RangeError(`Private key x harus berada di rentang [2, p - 2], diperoleh ${x}`);
  }

  // Validasi ciphertext domain
  if (c1 <= 0n || c1 >= p) {
    throw new RangeError(`Ciphertext c1 tidak valid: ${c1}. Harus berada di [1, p - 1]`);
  }
  if (c2 <= 0n || c2 >= p) {
    throw new RangeError(`Ciphertext c2 tidak valid: ${c2}. Harus berada di [1, p - 1]`);
  }

  const steps = [];

  // 1. Hitung s = c1^x mod p (faktor bersama)
  const s = modPow(c1, x, p);

  // 2. Invers modular s^-1 mod p
  const sInv = modInverse(s, p);

  // 3. Pulihkan pesan m = (c2 * sInv) mod p
  const m = (c2 * sInv) % p;

  if (collectSteps) {
    steps.push({
      step: 1,
      description: 'Hitung shared secret factor s dari c1 dan private key x',
      formula: 's = (c1 ^ x) mod p',
      s: s.toString()
    });
    steps.push({
      step: 2,
      description: 'Hitung invers perkalian modular dari s terhadap modulus p',
      formula: 's_inv = s^(-1) mod p',
      sInv: sInv.toString()
    });
    steps.push({
      step: 3,
      description: 'Dekripsi nilai pesan asli m',
      formula: 'm = (c2 * s_inv) mod p',
      m: m.toString()
    });
  }

  const result = { m };
  if (collectSteps) {
    result.steps = steps;
  }
  return result;
}
