import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, tokenStorage } from '../services/api';
import { Lock, User, KeyRound, AlertCircle, ArrowRight, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const res = await api.login(cleanUsername, password);

      // Jika pengguna memasukkan private key secara manual
      if (customPrivateKey.trim()) {
        tokenStorage.setPrivateKey(cleanUsername, customPrivateKey.trim());
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa username dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Masuk ke CryptoFess</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Akses inbox dan dekripsi pesan anonim Anda.
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
                  placeholder="Masukkan kata sandi"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>

            {/* Opsi masukkan private key jika ganti browser/perangkat */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
              >
                <span>Masuk dari perangkat baru? Pulihkan Private Key</span>
                {showKeyInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showKeyInput && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="block text-xs font-mono text-slate-300">
                    Tempelkan Private Key Cadangan (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={customPrivateKey}
                    onChange={(e) => setCustomPrivateKey(e.target.value)}
                    placeholder="BigInt private key..."
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Jika tidak diisi dan private key tersimpan di browser ini, sistem akan otomatis menggunakannya.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="text-sm">Memproses...</span>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Belum memiliki akun?{' '}
            <Link to="/register" className="text-sky-400 hover:underline font-semibold">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
