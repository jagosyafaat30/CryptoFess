import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { encryptMessage } from '@crypto';
import {
  Send,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Code2,
  RefreshCw,
  Sparkles,
  UserCheck
} from 'lucide-react';

export function SendFess() {
  const { username } = useParams();
  const [recipient, setRecipient] = useState(null);
  const [publicKeyData, setPublicKeyData] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCryptoPreview, setShowCryptoPreview] = useState(false);
  const [liveEncryptedPreview, setLiveEncryptedPreview] = useState(null);

  const MAX_CHARS = 1000;

  useEffect(() => {
    fetchRecipientInfo();
  }, [username]);

  const fetchRecipientInfo = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Ambil info penerima
      const recRes = await api.getRecipient(username);
      setRecipient(recRes.recipient);

      // 2. Ambil kunci publik penerima
      const keyRes = await api.getRecipientPublicKeys(username);
      if (keyRes.publicKeys && keyRes.publicKeys.length > 0) {
        setPublicKeyData(keyRes.publicKeys[0].publicKeyData);
      } else {
        setError('Penerima belum mengonfigurasi kunci publik kriptografi.');
      }
    } catch (err) {
      setError(err.message || 'Penerima tidak ditemukan atau belum siap menerima pesan.');
    } finally {
      setLoading(false);
    }
  };

  // Update live encryption preview jika user mengaktifkan toggle pratinjau
  const handleGeneratePreview = () => {
    if (!messageText.trim() || !publicKeyData) return;
    try {
      const enc = encryptMessage(
        messageText,
        publicKeyData.y,
        publicKeyData.p,
        publicKeyData.g
      );
      setLiveEncryptedPreview(enc);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    if (!messageText.trim()) {
      setError('Pesan tidak boleh kosong');
      return;
    }

    if (messageText.length > MAX_CHARS) {
      setError(`Pesan terlalu panjang (maksimum ${MAX_CHARS} karakter)`);
      return;
    }

    if (!publicKeyData) {
      setError('Kunci publik penerima tidak tersedia.');
      return;
    }

    setSending(true);

    try {
      // 1. Enkripsi pesan di sisi klien (Client-side ElGamal)
      const { ciphertext, cryptoMetadata } = encryptMessage(
        messageText,
        publicKeyData.y,
        publicKeyData.p,
        publicKeyData.g
      );

      // 2. Kirim HANYA ciphertext dan metadata ke backend (Plaintext TIDAK dikirim)
      await api.sendMessage(username, ciphertext, cryptoMetadata);

      setSuccess(true);
      setMessageText('');
      setLiveEncryptedPreview(null);
    } catch (err) {
      setError(err.message || 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-3" />
        <p>Memuat profil dan kunci publik penerima...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header Profile Info */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-sky-500/20">
          <UserCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Kirim Pesan ke <span className="text-sky-400">@{username}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Identitas Anda sepenuhnya anonim. Pesan akan dienkripsi dengan kunci publik ElGamal milik penerima sebelum dikirim.
        </p>
      </div>

      {/* Main Card Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl relative">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Pesan Anonim Berhasil Terkirim!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Pesan telah dienkripsi menggunakan ElGamal dan tersimpan dengan aman di inbox <span className="text-sky-400 font-mono">@{username}</span>.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setSuccess(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all"
              >
                Kirim Pesan Lagi
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Isi Pesan Anonim (Fess)
                </label>
                <span className={`text-xs font-mono ${messageText.length > MAX_CHARS ? 'text-rose-400' : 'text-slate-400'}`}>
                  {messageText.length} / {MAX_CHARS}
                </span>
              </div>
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tulis pesan rahasia, apresiasi, atau curahan hati kamu di sini..."
                required
                className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm leading-relaxed"
              />
            </div>

            {/* Toggle Pratinjau Kriptografi Edukasional */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-sky-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enkripsi Sisi-Klien Aktif (Zero Plaintext di Server)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCryptoPreview(!showCryptoPreview);
                    if (!showCryptoPreview) handleGeneratePreview();
                  }}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>{showCryptoPreview ? 'Tutup Inspeksi' : 'Inspeksi Ciphertext'}</span>
                </button>
              </div>

              {showCryptoPreview && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-400 font-mono">
                    Public Key Penerima (y):{' '}
                    <span className="text-slate-300 break-all">{publicKeyData?.y ? `${publicKeyData.y.slice(0, 30)}...` : 'N/A'}</span>
                  </div>
                  {liveEncryptedPreview && (
                    <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400 break-all select-all max-h-24 overflow-y-auto">
                      {liveEncryptedPreview.ciphertext}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400">
                    *Teks di atas adalah data aktual yang akan dikirim ke server. Server tidak pernah menerima kata-kata asli Anda.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending || !publicKeyData || messageText.length === 0 || messageText.length > MAX_CHARS}
              className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none"
            >
              {sending ? (
                <span>Mengenkripsi & Mengirim Pesan...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enkripsi & Kirim Pesan Anonim</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
