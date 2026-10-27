import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, tokenStorage } from '../services/api';
import {
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Lock,
  KeyRound,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Eye,
  RefreshCw
} from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const user = tokenStorage.getUser();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [localPrivKey, setLocalPrivKey] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const key = tokenStorage.getPrivateKey(user.username);
    setLocalPrivKey(key || '');

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      setProfileData(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fessUrl = `${window.location.origin}/fess/${user?.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fessUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyKey = () => {
    if (localPrivKey) {
      navigator.clipboard.writeText(localPrivKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  if (loading && !profileData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-3" />
        <p>Memuat dashboard CryptoFess...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-mono font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted Inbox</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Selamat datang, <span className="text-sky-400">@{user?.username}</span>!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Bagikan tautan Anda untuk menerima pesan rahasia anonim yang terenkripsi penuh.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/inbox"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all shadow-md shadow-sky-500/20 text-sm"
          >
            <Inbox className="w-4 h-4" />
            <span>Buka Inbox ({profileData?.stats?.unread || 0} baru)</span>
          </Link>
        </div>
      </div>

      {/* Tautan Fess Kamu Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-semibold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>Tautan Penerimaan Pesan Anonim Anda</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-300">
              Pengirim dapat membuka tautan ini tanpa login untuk mengirim pesan terenkripsi ke akun Anda.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Link
              to={`/fess/${user?.username}`}
              target="_blank"
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              <span>Uji Tautan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleCopyLink}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-sky-500/20"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Tautan Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs sm:text-sm text-sky-300 select-all break-all">
          {fessUrl}
        </div>
      </div>

      {/* Grid Statistik & Kriptografi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Pesan */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pesan Diterima</span>
            <Inbox className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {profileData?.stats?.total || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Tersimpan sebagai ciphertext aman di database.
          </p>
        </div>

        {/* Pesan Belum Dibaca */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pesan Belum Dibaca</span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {profileData?.stats?.unread || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Menunggu untuk didekripsi secara lokal di browser Anda.
          </p>
        </div>

        {/* Status Kunci Kriptografi */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kunci ElGamal Aktif</span>
            <KeyRound className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Versi {profileData?.publicKeys?.[0]?.key_version || 1}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Public key terdaftar di server untuk pengirim.
          </p>
        </div>
      </div>

      {/* Status Private Key Browser Lokal */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-xl mt-0.5 ${localPrivKey ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {localPrivKey ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {localPrivKey ? 'Private Key Tersedia di Peramban Ini' : 'Private Key Belum Tersimpan di Peramban Ini'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {localPrivKey
                  ? 'Anda dapat mendekripsi seluruh pesan yang masuk ke akun ini.'
                  : 'Jika Anda baru login dari browser lain, silakan masukkan private key cadangan Anda.'}
              </p>
            </div>
          </div>

          {localPrivKey ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPrivateKey ? 'Sembunyikan' : 'Tampilkan Kunci'}</span>
              </button>
              <button
                onClick={handleCopyKey}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-xs text-sky-400 transition-colors border border-sky-500/30"
              >
                {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Tersalin' : 'Cadangkan'}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Pulihkan Kunci
            </Link>
          )}
        </div>

        {showPrivateKey && localPrivKey && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
            {localPrivKey}
          </div>
        )}
      </div>

      {/* Akses Cepat Crypto Lab Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-500/20 bg-indigo-950/20">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Ingin mempelajari cara kerja rumus matematikanya?</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulasikan Diffie-Hellman Key Exchange dan Enkripsi/Dekripsi ElGamal langkah demi langkah di Crypto Lab.
            </p>
          </div>
        </div>
        <Link
          to="/lab"
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors whitespace-nowrap"
        >
          <span>Buka Crypto Lab</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
