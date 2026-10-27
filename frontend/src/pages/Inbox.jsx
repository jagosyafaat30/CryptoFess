import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, tokenStorage } from '../services/api';
import {
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Trash2,
  Clock,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export function Inbox() {
  const navigate = useNavigate();
  const user = tokenStorage.getUser();
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getInbox();
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
    } catch (err) {
      setError(err.message || 'Gagal memuat inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteMessage(id);
      setMessages(messages.filter((m) => m.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.message || 'Gagal menghapus pesan');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <InboxIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Kotak Masuk (Inbox)</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Total {total} pesan ({unread} belum dibaca)
            </p>
          </div>
        </div>

        <button
          onClick={fetchInbox}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Message List */}
      {loading && messages.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-3" />
          <p>Memuat pesan terenkripsi...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-dashed border-slate-800">
          <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mx-auto">
            <Mail className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Belum Ada Pesan Masuk</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Bagikan tautan penerimaan pesan Anda ke teman atau media sosial untuk mulai menerima pesan anonim.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all"
            >
              <span>Buka Dashboard & Salin Tautan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Link
              key={msg.id}
              to={`/messages/${msg.id}`}
              className={`block glass-card p-4 sm:p-5 rounded-2xl border transition-all hover:border-sky-500/40 hover:bg-slate-900/60 ${
                !msg.isRead
                  ? 'border-sky-500/30 bg-sky-950/10'
                  : 'border-slate-800/80 bg-slate-900/30'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      !msg.isRead
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {!msg.isRead ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white truncate">
                        Pesan Anonim #{msg.id}
                      </span>
                      {!msg.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30">
                          BARU
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(msg.createdAt)}</span>
                      </span>
                      <span className="hidden sm:inline-flex items-center space-x-1 text-slate-500 font-mono text-[11px]">
                        <Lock className="w-3 h-3 text-indigo-400" />
                        <span>{msg.cryptoMetadata?.algorithm || 'ElGamal'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-sky-400 font-semibold pr-2">
                    <span>Dekripsi & Baca</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <button
                    onClick={(e) => handleDelete(msg.id, e)}
                    disabled={deletingId === msg.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Hapus Pesan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
