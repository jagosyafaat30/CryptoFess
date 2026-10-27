/**
 * CryptoFess — Core Mathematical Operations
 *
 * Implementasi manual operasi matematika bilangan bulat besar (BigInt)
 * tanpa menggunakan library eksternal.
 * Sesuai PRD_CryptoFess.md Bagian 8.4 dan Batasan Penggunaan Library.
 */

/**
 * Konversi input ke BigInt dengan aman
 * @param {number|string|bigint} value
 * @returns {bigint}
 */
export function toBigInt(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(`Number ${value} is outside safe integer range. Use string or BigInt.`);
    }
    return BigInt(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^-?[0-9]+$/.test(trimmed)) {
      throw new TypeError(`Invalid string format for BigInt: "${value}"`);
    }
    return BigInt(trimmed);
  }
  throw new TypeError(`Cannot convert value of type ${typeof value} to BigInt`);
}

/**
 * Pangkat Modular (Square-and-Multiply Algorithm)
 * Menghitung (base ^ exponent) mod modulus secara efisien.
 *
 * @param {number|string|bigint} baseVal
 * @param {number|string|bigint} exponentVal
 * @param {number|string|bigint} modulusVal
 * @param {boolean} [collectSteps=false] - Simpan langkah untuk visualisasi Crypto Lab
 * @returns {bigint|{result: bigint, steps: Array}}
 */
export function modPow(baseVal, exponentVal, modulusVal, collectSteps = false) {
  const base = toBigInt(baseVal);
  const exponent = toBigInt(exponentVal);
  const modulus = toBigInt(modulusVal);

  if (modulus <= 1n) {
    throw new RangeError(`Modulus must be greater than 1, got ${modulus}`);
  }

  if (exponent < 0n) {
    throw new RangeError(`Negative exponents are not supported in basic modPow; got ${exponent}`);
  }

  const steps = [];

  if (modulus === 1n) {
    return collectSteps ? { result: 0n, steps } : 0n;
  }

  let result = 1n;
  let b = ((base % modulus) + modulus) % modulus;
  let e = exponent;
  let stepIndex = 0;

  if (collectSteps) {
    steps.push({
      step: stepIndex++,
      action: 'INIT',
      description: `Inisialisasi: result = 1, base = ${b}, exponent = ${e}, modulus = ${modulus}`,
      result: result.toString(),
      currentBase: b.toString(),
      remainingExponent: e.toString()
    });
  }

  while (e > 0n) {
    const isOdd = (e & 1n) === 1n;

    if (collectSteps) {
      steps.push({
        step: stepIndex++,
        action: isOdd ? 'MULTIPLY_AND_SQUARE' : 'SQUARE_ONLY',
        bit: isOdd ? 1 : 0,
        description: isOdd
          ? `Bit ganjil (1): result = (${result} * ${b}) mod ${modulus}`
          : `Bit genap (0): result tetap ${result}`,
        previousResult: result.toString(),
        baseSquared: ((b * b) % modulus).toString()
      });
    }

    if (isOdd) {
      result = (result * b) % modulus;
    }

    b = (b * b) % modulus;
    e >>= 1n;
  }

  if (collectSteps) {
    steps.push({
      step: stepIndex,
      action: 'FINAL',
      description: `Selesai: (${base} ^ ${exponent}) mod ${modulus} = ${result}`,
      result: result.toString()
    });
    return { result, steps };
  }

  return result;
}

/**
 * Greatest Common Divisor (Algoritma Euclidean)
 *
 * @param {number|string|bigint} aVal
 * @param {number|string|bigint} bVal
 * @returns {bigint}
 */
export function gcd(aVal, bVal) {
  let a = toBigInt(aVal);
  let b = toBigInt(bVal);

  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;

  while (b !== 0n) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * Extended Euclidean Algorithm
 * Mencari gcd(a, b) serta koefisien x dan y sehingga:
 * a*x + b*y = gcd(a, b)
 *
 * @param {number|string|bigint} aVal
 * @param {number|string|bigint} bVal
 * @param {boolean} [collectSteps=false]
 * @returns {{ gcd: bigint, x: bigint, y: bigint, steps?: Array }}
 */
export function extendedGcd(aVal, bVal, collectSteps = false) {
  const originalA = toBigInt(aVal);
  const originalB = toBigInt(bVal);

  let a = originalA;
  let b = originalB;

  let old_r = a, r = b;
  let old_s = 1n, s = 0n;
  let old_t = 0n, t = 1n;

  const steps = [];

  if (collectSteps) {
    steps.push({
      step: 0,
      r: r.toString(),
      quotient: '-',
      x: s.toString(),
      y: t.toString()
    });
  }

  let stepCount = 1;
  while (r !== 0n) {
    const quotient = old_r / r;

    let tempR = r;
    r = old_r - quotient * tempR;
    old_r = tempR;

    let tempS = s;
    s = old_s - quotient * tempS;
    old_s = tempS;

    let tempT = t;
    t = old_t - quotient * tempT;
    old_t = tempT;

    if (collectSteps) {
      steps.push({
        step: stepCount++,
        remainder: old_r.toString(),
        quotient: quotient.toString(),
        x: old_s.toString(),
        y: old_t.toString(),
        equation: `${originalA}*(${old_s}) + ${originalB}*(${old_t}) = ${old_r}`
      });
    }
  }

  // Normalisasi jika gcd negatif
  if (old_r < 0n) {
    old_r = -old_r;
    old_s = -old_s;
    old_t = -old_t;
  }

  const result = { gcd: old_r, x: old_s, y: old_t };
  if (collectSteps) {
    result.steps = steps;
  }
  return result;
}

/**
 * Invers Perkalian Modular (Modular Multiplicative Inverse)
 * Mencari x sedemikian sehingga (a * x) mod modulus = 1
 *
 * @param {number|string|bigint} aVal
 * @param {number|string|bigint} modulusVal
 * @returns {bigint}
 */
export function modInverse(aVal, modulusVal) {
  const a = toBigInt(aVal);
  const modulus = toBigInt(modulusVal);

  if (modulus <= 1n) {
    throw new RangeError(`Modulus must be greater than 1, got ${modulus}`);
  }

  const { gcd: g, x } = extendedGcd(a, modulus);

  if (g !== 1n) {
    throw new Error(
      `Modular inverse does not exist: gcd(${a}, ${modulus}) = ${g} (not coprime)`
    );
  }

  // Normalisasi ke rentang [1, modulus - 1]
  const result = ((x % modulus) + modulus) % modulus;
  return result;
}

/**
 * Miller-Rabin Probabilistic Primality Test
 * Digunakan untuk validasi parameter demo atau custom prima di Crypto Lab.
 *
 * @param {number|string|bigint} nVal
 * @param {number} [rounds=10]
 * @returns {boolean}
 */
export function isProbablePrime(nVal, rounds = 10) {
  const n = toBigInt(nVal);

  if (n <= 1n) return false;
  if (n <= 3n) return true;
  if ((n & 1n) === 0n) return false;

  // Tulis n - 1 sebagai 2^s * d
  let d = n - 1n;
  let s = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1n;
  }

  // Basis prima deterministik awal
  const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

  for (let i = 0; i < rounds; i++) {
    let a;
    if (i < smallPrimes.length && smallPrimes[i] < n - 1n) {
      a = smallPrimes[i];
    } else {
      // Bilangan acak di [2, n - 2]
      a = randomBigInt(2n, n - 2n);
    }

    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) {
      continue;
    }

    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }

    if (composite) {
      return false;
    }
  }

  return true;
}

/**
 * Generator Bilangan Acak BigInt Kriptografis (CSPRNG)
 * Menggunakan crypto.getRandomValues bawaan Node / Browser
 * dengan rejection sampling agar seragam tanpa bias modulo.
 *
 * @param {bigint} min - Batas bawah inklusif
 * @param {bigint} max - Batas atas inklusif
 * @returns {bigint}
 */
export function randomBigInt(min, max) {
  const minB = toBigInt(min);
  const maxB = toBigInt(max);

  if (minB > maxB) {
    throw new RangeError(`min (${minB}) must be <= max (${maxB})`);
  }
  if (minB === maxB) return minB;

  const range = maxB - minB + 1n;
  const bitLength = range.toString(2).length;
  const byteLength = Math.ceil(bitLength / 8);

  // Akses WebCrypto API standar
  const cryptoObj =
    typeof globalThis !== 'undefined' && globalThis.crypto
      ? globalThis.crypto
      : null;

  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('Cryptographically secure random number generator is not available.');
  }

  // Rejection sampling untuk mencegah modulo bias
  const buffer = new Uint8Array(byteLength);
  const maxUnbiased = (1n << BigInt(byteLength * 8)) - ((1n << BigInt(byteLength * 8)) % range);

  while (true) {
    cryptoObj.getRandomValues(buffer);
    let randomVal = 0n;
    for (let i = 0; i < byteLength; i++) {
      randomVal = (randomVal << 8n) | BigInt(buffer[i]);
    }

    if (randomVal < maxUnbiased) {
      return minB + (randomVal % range);
    }
  }
}
