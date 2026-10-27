import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, tokenStorage } from '../services/api';
import { decryptMessage, DEFAULT_ELGAMAL_PARAMS } from '@crypto';
import {
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Code2,
  CheckCircle2,
  Copy,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export function ReadMessage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = tokenStorage.getUser();

  const [messageData, setMessageData] = useState(null);
  const [decryptedText, setDecryptedText] = useState(null);
  const [decryptError, setDecryptError] = useState('');
  const [loading, setLoading] = useState(true);
  const [manualKey, setManualKey] = useState('');
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);
  const [copiedCipher, setCopiedCipher] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadMessage();
  }, [id]);

  const loadMessage = async () => {
    try {
      setLoading(true);
      setDecryptError('');
      const data = await api.getMessage(id);
      setMessageData(data);

      // Tandai sebagai sudah dibaca jika belum
      if (!data.readAt) {
        api.markAsRead(id).catch(console.error);
      }

      // Ambil private key dari penyimpanan lokal browser
      const storedKey = tokenStorage.getPrivateKey(user.username);
      if (storedKey) {
        runDecryption(data.ciphertext, storedKey, data.cryptoMetadata);
      }
    } catch (err) {
      setDecryptError(err.message || 'Gagal memuat pesan');
    } finally {
      setLoading(false);
    }
  };

  const runDecryption = (ciphertext, privateKey, metadata) => {
    try {
      setDecryptError('');
      // Gunakan parameter dari metadata atau default RFC 3526
      const p = metadata?.p ? BigInt(metadata.p) : DEFAULT_ELGAMAL_PARAMS.p;
      const text = decryptMessage(ciphertext, privateKey, p);
      setDecryptedText(text);
    } catch (err) {
      setDecryptedText(null);
      setDecryptError(`Dekripsi gagal: ${err.message}. Pastikan private key Anda sesuai.`);
    }
  };

  const handleManualDecrypt = (e) => {
    e.preventDefault();
    if (!manualKey.trim() || !messageData) return;
    // Simpan ke storage jika berhasil
    runDecryption(messageData.ciphertext, manualKey.trim(), messageData.cryptoMetadata);
    tokenStorage.setPrivateKey(user.username, manualKey.trim());
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus pesan ini secara permanen dari inbox Anda?')) {
      return;
    }
    try {
      await api.deleteMessage(id);
      navigate('/inbox');
    } catch (err) {
      alert(err.message || 'Gagal menghapus pesan');
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-3" />
        <p>Mengambil ciphertext dari server...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/inbox"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Inbox</span>
        </Link>

        <button
          onClick={handleDelete}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus Pesan</span>
        </button>
      </div>

      {/* Main Message Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        {/* Metadata Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold text-white">
              Pesan Anonim #{messageData?.id}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
              ElGamal E2EE
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-1 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(messageData?.createdAt)}</span>
          </div>
        </div>

        {/* Status Dekripsi & Isi Pesan */}
        {decryptedText !== null ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
              <Unlock className="w-4 h-4" />
              <span>Dekripsi Berhasil di Peramban Anda</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-100 text-base leading-relaxed whitespace-pre-wrap font-sans">
              {decryptedText}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Private Key Diperlukan untuk Dekripsi</p>
                <p className="text-xs text-amber-200/80 mt-1">
                  Pesan ini terenkripsi asimetris dengan ElGamal. Untuk membacanya, masukkan private key Anda di bawah ini:
                </p>
              </div>
            </div>

            {decryptError && (
              <p className="text-xs text-rose-400 font-mono">{decryptError}</p>
            )}

            <form onSubmit={handleManualDecrypt} className="space-y-3">
              <textarea
                rows={2}
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                placeholder="Tempelkan private key Anda di sini..."
                required
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all"
              >
                Dekripsi Pesan Sekarang
              </button>
            </form>
          </div>
        )}

        {/* Collapsible Crypto Proof & Details */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setShowCryptoDetails(!showCryptoDetails)}
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span className="flex items-center space-x-1.5 font-semibold">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>Detail Teknis Kriptografi & Ciphertext (c1, c2)</span>
            </span>
            <span>{showCryptoDetails ? 'Tutup' : 'Lihat'}</span>
          </button>

          {showCryptoDetails && (
            <div className="mt-4 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">Ciphertext Mentah (Tersimpan di Database):</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(messageData?.ciphertext || '');
                      setCopiedCipher(true);
                      setTimeout(() => setCopiedCipher(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-sky-400 hover:text-sky-300"
                  >
                    {copiedCipher ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCipher ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 break-all select-all max-h-32 overflow-y-auto">
                  {messageData?.ciphertext}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 space-y-1 font-mono text-[11px]">
                <p className="text-white font-semibold mb-1">Rumus Pemulihan Pesan ElGamal:</p>
                <p>1. Faktor Rahasia Bersama: s = (c1 ^ x) mod p</p>
                <p>2. Invers Perkalian Modular: s_inv = s^(-1) mod p</p>
                <p>3. Pemulihan Nilai Pesan: m = (c2 * s_inv) mod p</p>
                <p>4. Konversi Blok (Chunking): Nilai m_i diterjemahkan kembali ke string UTF-8</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
