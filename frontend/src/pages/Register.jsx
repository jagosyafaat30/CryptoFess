import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, tokenStorage } from '../services/api';
import { DEFAULT_ELGAMAL_PARAMS, generateElGamalKeyPair } from '@crypto';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, Copy, ArrowRight, ShieldCheck } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backupKeyModal, setBackupKeyModal] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username tidak boleh kosong');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
      setError('Username harus 3-30 karakter alfanumerik atau garis bawah');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setLoading(true);

    try {
      // 1. Bangkitkan pasangan kunci ElGamal secara lokal di browser
      const p = DEFAULT_ELGAMAL_PARAMS.p;
      const g = DEFAULT_ELGAMAL_PARAMS.g;
      const keyPair = generateElGamalKeyPair(p, g);

      const cleanUsername = username.trim().toLowerCase();

      // 2. Simpan private key hanya di browser client
      tokenStorage.setPrivateKey(cleanUsername, keyPair.privateKey.toString());

      // 3. Kirim hanya public key ke server API
      const res = await api.register(cleanUsername, password, {
        algorithm: 'ElGamal',
        p: p.toString(),
        g: g.toString(),
        y: keyPair.publicKey.toString()
      });

      // Simpan token sesi
      tokenStorage.setToken(res.token);
      tokenStorage.setUser(res.user);

      // Tampilkan modal backup private key kepada pengguna
      setBackupKeyModal({
        username: cleanUsername,
        privateKey: keyPair.privateKey.toString(),
        publicKey: keyPair.publicKey.toString()
      });
    } catch (err) {
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrivateKey = () => {
    if (backupKeyModal) {
      navigator.clipboard.writeText(backupKeyModal.privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleProceedToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Buat Akun CryptoFess</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Pasangan kunci ElGamal dibuat secara otomatis di browser Anda.
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-8 rounded-2xl shadow-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. anonim_fess"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="text-sm">Membangkitkan Kunci ElGamal & Mendaftar...</span>
                ) : (
                  <>
                    <span>Daftar & Buat Kunci Kriptografi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="text-sky-400 hover:underline font-semibold">
              Masuk di sini
            </Link>
          </div>
        </div>

        {/* Modal Backup Kunci (Jika Registrasi Sukses) */}
        {backupKeyModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-lg w-full border border-sky-500/30">
              <div className="flex items-center space-x-3 text-emerald-400 mb-4">
                <ShieldCheck className="w-7 h-7" />
                <h3 className="text-xl font-bold text-white">Akun & Kunci Kriptografi Siap!</h3>
              </div>

              <p className="text-sm text-slate-300 mb-4">
                Akun <strong className="text-white font-mono">@{backupKeyModal.username}</strong> berhasil didaftarkan. Private key telah tersimpan di browser ini.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
                    Private Key Anda (Rahasia)
                  </span>
                  <button
                    onClick={handleCopyPrivateKey}
                    className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kunci</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 break-all select-all max-h-24 overflow-y-auto">
                  {backupKeyModal.privateKey}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  *Simpan kunci ini jika Anda ingin membuka pesan dari perangkat atau browser lain.
                </p>
              </div>

              <button
                onClick={handleProceedToDashboard}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all text-sm"
              >
                Lanjutkan ke Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
