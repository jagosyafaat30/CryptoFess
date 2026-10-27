import React, { useState } from 'react';
import {
  DEMO_DH_PARAMS,
  simulateDhExchange,
  generateDhKeyPair,
  computeDhSharedSecret,
  RFC3526_MODP_2048
} from '@crypto';
import {
  DEMO_ELGAMAL_PARAMS,
  generateElGamalKeyPair,
  elgamalEncrypt,
  elgamalDecrypt
} from '@crypto';
import {
  modPow,
  extendedGcd,
  modInverse,
  isProbablePrime,
  gcd
} from '@crypto';
import {
  FlaskConical,
  KeyRound,
  Lock,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

export function CryptoLab() {
  const [activeTab, setActiveTab] = useState('dh'); // 'dh' | 'elgamal' | 'math'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-mono font-semibold mb-2">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Laboratorium Kriptografi Interaktif</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Crypto Lab</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Eksplorasi dan verifikasi perhitungan matematika di balik algoritma Diffie-Hellman dan ElGamal langkah demi langkah.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dh')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dh'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Diffie-Hellman</span>
            </button>

            <button
              onClick={() => setActiveTab('elgamal')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'elgamal'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ElGamal</span>
            </button>

            <button
              onClick={() => setActiveTab('math')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'math'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Matematika Inti</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
        <span>
          <strong>Catatan Edukasional:</strong> Parameter kecil pada halaman simulasi ini dirancang agar angka dapat ditelusuri secara visual. Untuk komunikasi dunia nyata yang aman, sistem menggunakan parameter prima minimal 2048-bit (RFC 3526).
        </span>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === 'dh' && <DiffieHellmanTab />}
      {activeTab === 'elgamal' && <ElGamalTab />}
      {activeTab === 'math' && <MathTab />}
    </div>
  );
}

// ==========================================
// TAB 1: DIFFIE-HELLMAN LAB
// ==========================================
function DiffieHellmanTab() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [p, setP] = useState(DEMO_DH_PARAMS[0].p.toString());
  const [g, setG] = useState(DEMO_DH_PARAMS[0].g.toString());
  const [alicePriv, setAlicePriv] = useState('6');
  const [bobPriv, setBobPriv] = useState('15');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleRunSimulation = () => {
    setError('');
    try {
      const pBig = BigInt(p);
      const gBig = BigInt(g);
      const aBig = BigInt(alicePriv);
      const bBig = BigInt(bobPriv);

      const sim = simulateDhExchange(pBig, gBig, aBig, bBig);
      setResult(sim);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApplyPreset = (index) => {
    setSelectedPreset(index);
    setP(DEMO_DH_PARAMS[index].p.toString());
    setG(DEMO_DH_PARAMS[index].g.toString());
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Parameter Selection Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <KeyRound className="w-5 h-5 text-sky-400" />
          <span>Konfigurasi Parameter Pertukaran Kunci</span>
        </h3>

        {/* Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pilih Parameter Preset:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_DH_PARAMS.map((param, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(idx)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPreset === idx
                    ? 'border-sky-500 bg-sky-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{param.name}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  p = {param.p.toString()}, g = {param.g.toString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Modulus Prima (p)
            </label>
            <input
              type="text"
              value={p}
              onChange={(e) => setP(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Generator (g)
            </label>
            <input
              type="text"
              value={g}
              onChange={(e) => setG(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Private Key Alice (a)
            </label>
            <input
              type="text"
              value={alicePriv}
              onChange={(e) => setAlicePriv(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-sky-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Private Key Bob (b)
            </label>
            <input
              type="text"
              value={bobPriv}
              onChange={(e) => setBobPriv(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-indigo-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
            Error: {error}
          </div>
        )}

        <button
          onClick={handleRunSimulation}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-md shadow-sky-500/20 transition-all hover:scale-[1.01]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Jalankan Simulasi Diffie-Hellman</span>
        </button>
      </div>

      {/* Simulation Result Presentation */}
      {result && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/30 space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h4 className="text-xl font-bold text-white">Hasil Pertukaran Kunci</h4>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>S_Alice === S_Bob ({result.sharedSecret})</span>
            </div>
          </div>

          {/* Dual Party Visualization Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alice Card */}
            <div className="glass-card p-6 rounded-2xl border-l-4 border-l-sky-500 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">Pihak A (Alice)</span>
                <span className="text-xs font-mono text-sky-400">Pengirim / Peer A</span>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-900">
                  <span className="text-slate-400">1. Private Key (a):</span> {result.alice.privateKey}
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900">
                  <span className="text-slate-400">2. Public Key A = g^a mod p:</span>{' '}
                  <span className="text-sky-400 font-bold">{result.alice.publicKey}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-sky-500/20">
                  <span className="text-slate-400">3. Shared Secret S = B^a mod p:</span>{' '}
                  <span className="text-emerald-400 font-bold text-sm">{result.alice.computedSecret}</span>
                </div>
              </div>
            </div>

            {/* Bob Card */}
            <div className="glass-card p-6 rounded-2xl border-l-4 border-l-indigo-500 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">Pihak B (Bob)</span>
                <span className="text-xs font-mono text-indigo-400">Penerima / Peer B</span>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-900">
                  <span className="text-slate-400">1. Private Key (b):</span> {result.bob.privateKey}
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900">
                  <span className="text-slate-400">2. Public Key B = g^b mod p:</span>{' '}
                  <span className="text-indigo-400 font-bold">{result.bob.publicKey}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-indigo-500/20">
                  <span className="text-slate-400">3. Shared Secret S = A^b mod p:</span>{' '}
                  <span className="text-emerald-400 font-bold text-sm">{result.bob.computedSecret}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-white font-bold text-xs uppercase tracking-wider block mb-2">
              Langkah Perhitungan Matematis:
            </span>
            {result.explanation.map((line, idx) => (
              <div key={idx} className="text-slate-300 leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// TAB 2: ELGAMAL ASYMMETRIC LAB
// ==========================================
function ElGamalTab() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [p, setP] = useState(DEMO_ELGAMAL_PARAMS[0].p.toString());
  const [g, setG] = useState(DEMO_ELGAMAL_PARAMS[0].g.toString());
  const [privateKeyX, setPrivateKeyX] = useState('1751');
  const [messageM, setMessageM] = useState('1234');
  const [ephemeralK, setEphemeralK] = useState('1520');

  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState('');

  const handleRunElGamal = () => {
    setError('');
    try {
      const pBig = BigInt(p);
      const gBig = BigInt(g);
      const xBig = BigInt(privateKeyX);
      const mBig = BigInt(messageM);
      const kBig = BigInt(ephemeralK);

      // 1. Key Generation
      const keyGen = generateElGamalKeyPair(pBig, gBig, xBig, true);

      // 2. Encryption
      const enc = elgamalEncrypt(mBig, keyGen.publicKey, pBig, gBig, kBig, true);

      // 3. Decryption
      const dec = elgamalDecrypt(enc.c1, enc.c2, keyGen.privateKey, pBig, true);

      setSimResult({
        keyGen,
        enc,
        dec,
        recoveredCorrectly: dec.m === mBig
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Lock className="w-5 h-5 text-sky-400" />
          <span>Konfigurasi Enkripsi & Dekripsi ElGamal</span>
        </h3>

        {/* Preset Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pilih Parameter Preset:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_ELGAMAL_PARAMS.map((param, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPreset(idx);
                  setP(param.p.toString());
                  setG(param.g.toString());
                  setSimResult(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPreset === idx
                    ? 'border-sky-500 bg-sky-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{param.name}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  p = {param.p.toString()}, g = {param.g.toString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Prima (p)
            </label>
            <input
              type="text"
              value={p}
              onChange={(e) => setP(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Generator (g)
            </label>
            <input
              type="text"
              value={g}
              onChange={(e) => setG(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Private Key (x)
            </label>
            <input
              type="text"
              value={privateKeyX}
              onChange={(e) => setPrivateKeyX(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-sky-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Pesan Numerik (m)
            </label>
            <input
              type="text"
              value={messageM}
              onChange={(e) => setMessageM(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-amber-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Ephemeral (k)
            </label>
            <input
              type="text"
              value={ephemeralK}
              onChange={(e) => setEphemeralK(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-purple-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
            Error: {error}
          </div>
        )}

        <button
          onClick={handleRunElGamal}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-md shadow-sky-500/20 transition-all hover:scale-[1.01]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Jalankan Simulasi ElGamal (3 Fase Lengkap)</span>
        </button>
      </div>

      {/* 3-Stage Process Display */}
      {simResult && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Verifikasi Berhasil: Nilai Terdekripsi (m = {simResult.dec.m.toString()}) Persis Sama!</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stage 1: Keygen */}
            <div className="glass-card p-6 rounded-2xl space-y-3 border-t-4 border-t-sky-500">
              <span className="text-xs font-mono text-sky-400 font-bold uppercase">FASE 1: PEMBENTUKAN KUNCI</span>
              <h4 className="text-sm font-bold text-white">Public Key y = g^x mod p</h4>
              <div className="p-3 rounded-xl bg-slate-900 font-mono text-xs space-y-1.5 text-slate-300">
                <div>x = {privateKeyX}</div>
                <div>g = {g}, p = {p}</div>
                <div className="text-sky-400 font-bold pt-1 border-t border-slate-800">
                  y = {simResult.keyGen.publicKey.toString()}
                </div>
              </div>
            </div>

            {/* Stage 2: Encrypt */}
            <div className="glass-card p-6 rounded-2xl space-y-3 border-t-4 border-t-amber-500">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase">FASE 2: ENKRIPSI PESAN</span>
              <h4 className="text-sm font-bold text-white">Ciphertext C = (c1, c2)</h4>
              <div className="p-3 rounded-xl bg-slate-900 font-mono text-xs space-y-1.5 text-slate-300">
                <div>k = {ephemeralK}</div>
                <div>c1 = (g^k) mod p = <span className="text-amber-400 font-bold">{simResult.enc.c1.toString()}</span></div>
                <div>c2 = (m * y^k) mod p = <span className="text-amber-400 font-bold">{simResult.enc.c2.toString()}</span></div>
              </div>
            </div>

            {/* Stage 3: Decrypt */}
            <div className="glass-card p-6 rounded-2xl space-y-3 border-t-4 border-t-emerald-500">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase">FASE 3: DEKRIPSI</span>
              <h4 className="text-sm font-bold text-white">m = c2 * (c1^x)^(-1) mod p</h4>
              <div className="p-3 rounded-xl bg-slate-900 font-mono text-xs space-y-1.5 text-slate-300">
                <div>s = c1^x mod p</div>
                <div>s^(-1) dihitung via Extended GCD</div>
                <div className="text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  m_pulih = {simResult.dec.m.toString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// TAB 3: CORE MATHEMATICS PLAYGROUND
// ==========================================
function MathTab() {
  // ModPow State
  const [base, setBase] = useState('3');
  const [exp, setExp] = useState('5');
  const [mod, setMod] = useState('7');
  const [powResult, setPowResult] = useState(null);

  // Extended GCD State
  const [extA, setExtA] = useState('101');
  const [extB, setExtB] = useState('13');
  const [extResult, setExtResult] = useState(null);

  const handleCalculatePow = () => {
    try {
      const res = modPow(base, exp, mod, true);
      setPowResult(res);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCalculateExtGcd = () => {
    try {
      const res = extendedGcd(extA, extB, true);
      const inv = gcd(extA, extB) === 1n ? modInverse(extB, extA) : null;
      setExtResult({ ...res, inv });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Square and Multiply Tracker */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-sky-400" />
            <span>Pangkat Modular — Algoritma Square-and-Multiply</span>
          </h3>
          <p className="text-xs text-slate-400">
            Menghitung (base ^ exponent) mod modulus dengan kompleksitas O(log exponent) tanpa overflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Base</label>
            <input
              type="text"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Exponent</label>
            <input
              type="text"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Modulus</label>
            <input
              type="text"
              value={mod}
              onChange={(e) => setMod(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
        </div>

        <button
          onClick={handleCalculatePow}
          className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
        >
          Hitung Pangkat Modular & Tampilkan Langkah
        </button>

        {powResult && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="text-emerald-400 font-bold text-sm">
              Hasil: ({base} ^ {exp}) mod {mod} = {powResult.result.toString()}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto text-slate-300">
              {powResult.steps.map((st, i) => (
                <div key={i} className="text-[11px] border-b border-slate-800/60 pb-1">
                  [{st.action}] {st.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Extended Euclidean Algorithm Tracker */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Extended Euclidean Algorithm & Invers Modular</span>
          </h3>
          <p className="text-xs text-slate-400">
            Mencari nilai x dan y pada identitas Bézout a*x + b*y = gcd(a, b) serta invers perkalian modular.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Bilangan A</label>
            <input
              type="text"
              value={extA}
              onChange={(e) => setExtA(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Bilangan B</label>
            <input
              type="text"
              value={extB}
              onChange={(e) => setExtB(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
        </div>

        <button
          onClick={handleCalculateExtGcd}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
        >
          Hitung Extended GCD & Bézout
        </button>

        {extResult && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="text-emerald-400 font-bold text-sm">
              gcd({extA}, {extB}) = {extResult.gcd.toString()}
            </div>
            <div className="text-sky-300">
              Identitas Bézout: {extA}*({extResult.x.toString()}) + {extB}*({extResult.y.toString()}) = {extResult.gcd.toString()}
            </div>
            {extResult.inv && (
              <div className="text-amber-400">
                Invers modular dari {extB} mod {extA} = {extResult.inv.toString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
