import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toBigInt,
  modPow,
  gcd,
  extendedGcd,
  modInverse,
  isProbablePrime,
  randomBigInt
} from '../crypto/math.js';

describe('Matematika Kriptografi — toBigInt', () => {
  it('berhasil mengonversi number, string, dan bigint', () => {
    assert.equal(toBigInt(42), 42n);
    assert.equal(toBigInt('12345678901234567890'), 12345678901234567890n);
    assert.equal(toBigInt(100n), 100n);
    assert.equal(toBigInt('-5'), -5n);
  });

  it('menolak string non-numerik dan tipe tidak valid', () => {
    assert.throws(() => toBigInt('abc'), TypeError);
    assert.throws(() => toBigInt(null), TypeError);
    assert.throws(() => toBigInt({}), TypeError);
  });
});

describe('Matematika Kriptografi — modPow (Square-and-Multiply)', () => {
  it('menghasilkan nilai yang sesuai dengan perhitungan acuan (TEST-MATH-01)', () => {
    // 2^3 mod 5 = 8 mod 5 = 3
    assert.equal(modPow(2, 3, 5), 3n);
    // 3^5 mod 7 = 243 mod 7 = 5
    assert.equal(modPow(3, 5, 7), 5n);
    // 7^0 mod 13 = 1
    assert.equal(modPow(7, 0, 13), 1n);
    // (base > modulus) 10^2 mod 7 = 3^2 mod 7 = 9 mod 7 = 2
    assert.equal(modPow(10, 2, 7), 2n);
  });

  it('menghitung bilangan besar tanpa kehilangan presisi', () => {
    const base = 123456789012345678901234567890n;
    const exp = 65537n;
    const mod = 1000000007n;
    const res = modPow(base, exp, mod);
    assert.ok(res >= 0n && res < mod);
    // Modulo bertahap verifikasi sifat matematis
    assert.equal(res, modPow(base % mod, exp, mod));
  });

  it('mengumpulkan log langkah perhitungan untuk visualisasi Crypto Lab', () => {
    const { result, steps } = modPow(3, 5, 7, true);
    assert.equal(result, 5n);
    assert.ok(steps.length > 0);
    assert.equal(steps[0].action, 'INIT');
    assert.equal(steps[steps.length - 1].action, 'FINAL');
  });

  it('menolak modulus <= 1 dan eksponen negatif (TEST-MATH-05)', () => {
    assert.throws(() => modPow(2, 3, 1), RangeError);
    assert.throws(() => modPow(2, 3, 0), RangeError);
    assert.throws(() => modPow(2, -1, 5), RangeError);
  });
});

describe('Matematika Kriptografi — gcd (Euclidean) (TEST-MATH-02)', () => {
  it('menghasilkan faktor persekutuan terbesar yang benar', () => {
    assert.equal(gcd(54, 24), 6n);
    assert.equal(gcd(24, 54), 6n);
    assert.equal(gcd(17, 31), 1n); // bilangan prima koprima
    assert.equal(gcd(0, 42), 42n);
    assert.equal(gcd(42, 0), 42n);
    assert.equal(gcd(-54, 24), 6n);
  });
});

describe('Matematika Kriptografi — extendedGcd (TEST-MATH-03)', () => {
  it('memenuhi Identitas Bézout: a*x + b*y = gcd(a, b)', () => {
    const testPairs = [
      [240n, 46n],
      [101n, 13n],
      [314159n, 271828n],
      [7919n, 1009n],
      [123456789n, 987654321n]
    ];

    for (const [a, b] of testPairs) {
      const { gcd: g, x, y } = extendedGcd(a, b);
      assert.equal(gcd(a, b), g);
      assert.equal(a * x + b * y, g, `Identitas Bézout gagal untuk a=${a}, b=${b}`);
    }
  });

  it('dapat mencatat langkah-langkah untuk demonstrasi lab', () => {
    const res = extendedGcd(101, 13, true);
    assert.ok(res.steps && res.steps.length > 0);
    assert.equal(res.gcd, 1n);
  });
});

describe('Matematika Kriptografi — modInverse (TEST-MATH-04)', () => {
  it('menghasilkan invers modular yang valid: (a * inv) mod m === 1', () => {
    const testCases = [
      { a: 3n, m: 7n, expected: 5n },      // (3 * 5) % 7 = 15 % 7 = 1
      { a: 3n, m: 11n, expected: 4n },     // (3 * 4) % 11 = 12 % 11 = 1
      { a: 42n, m: 2017n, expected: 1969n },
      { a: 65537n, m: 1000000007n }
    ];

    for (const { a, m, expected } of testCases) {
      const inv = modInverse(a, m);
      if (expected !== undefined) {
        assert.equal(inv, expected);
      }
      assert.equal((a * inv) % m, 1n, `Invers modular gagal untuk a=${a}, m=${m}`);
      assert.ok(inv >= 1n && inv < m, 'Invers harus dalam rentang [1, m - 1]');
    }
  });

  it('menolak pasangan yang tidak koprima (gcd !== 1)', () => {
    assert.throws(() => modInverse(6, 9), /not coprime/);
    assert.throws(() => modInverse(10, 20), /not coprime/);
  });

  it('menolak modulus <= 1', () => {
    assert.throws(() => modInverse(5, 1), RangeError);
    assert.throws(() => modInverse(5, 0), RangeError);
  });
});

describe('Matematika Kriptografi — isProbablePrime & randomBigInt', () => {
  it('dapat mendeteksi bilangan prima dan komposit secara tepat', () => {
    assert.equal(isProbablePrime(2), true);
    assert.equal(isProbablePrime(3), true);
    assert.equal(isProbablePrime(7919), true);
    assert.equal(isProbablePrime(65537), true);

    assert.equal(isProbablePrime(1), false);
    assert.equal(isProbablePrime(4), false);
    assert.equal(isProbablePrime(7920), false);
    assert.equal(isProbablePrime(100), false);
  });

  it('randomBigInt menghasilkan bilangan bulat di rentang yang ditentukan', () => {
    const min = 100n;
    const max = 200n;
    for (let i = 0; i < 50; i++) {
      const r = randomBigInt(min, max);
      assert.ok(r >= min && r <= max);
    }
  });
});
