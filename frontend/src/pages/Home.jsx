import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FlaskConical,
  ArrowRight,
  ServerOff,
  Sparkles,
  Layers,
  Send,
  EyeOff
} from 'lucide-react';

export function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glow Highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[250px] bg-indigo-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Implementasi Mandiri Algoritma Diffie-Hellman & ElGamal</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Pesan Anonim Terlindungi dengan{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent">
            Kriptografi Asimetris
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Kirim curahan hati dan pesan anonim tanpa rasa cemas. Teks dienkripsi langsung di browser pengirim menggunakan algoritma ElGamal buatan tangan — server hanya menyimpan ciphertext.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
          >
            <span>Mulai Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/lab"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl glass-card hover:bg-slate-800/80 text-white font-semibold transition-all border border-slate-700"
          >
            <FlaskConical className="w-4 h-4 text-sky-400" />
            <span>Eksplorasi Crypto Lab</span>
          </Link>
        </div>
      </section>

      {/* Key Feature Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Enkripsi ElGamal Manual</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Algoritma ElGamal ditulis secara manual dari nol menggunakan JavaScript BigInt, mencakup pembagian blok (chunking), perpangkatan modular square-and-multiply, dan invers modular.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Diffie-Hellman Key Agreement</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Simulasi pertukaran kunci Diffie-Hellman interaktif di Crypto Lab membuktikan pembentukan nilai rahasia bersama (shared secret) antara dua pihak yang saling berkomunikasi.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl relative group hover:border-sky-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <ServerOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Plaintext di Server</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Server API dan database hanya menerima pasangan ciphertext (c1, c2). Plaintext tidak pernah dikirim, dan private key tidak pernah meninggalkan browser penerima.
            </p>
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Bagaimana Alur Pengiriman Pesan Berjalan?
          </h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Proses perlindungan pesan transparan dari browser ke browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl border-l-4 border-l-sky-500">
            <div className="text-xs font-mono text-sky-400 font-bold mb-1">LANGKAH 01</div>
            <h4 className="font-bold text-white text-base mb-1">Penerima Siap</h4>
            <p className="text-xs text-slate-400">
              Penerima mendaftar. Pasangan kunci ElGamal dihasilkan di browser, kunci publik dikirim ke server, dan tautan unik dibuat.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border-l-4 border-l-indigo-500">
            <div className="text-xs font-mono text-indigo-400 font-bold mb-1">LANGKAH 02</div>
            <h4 className="font-bold text-white text-base mb-1">Pengirim Anonim</h4>
            <p className="text-xs text-slate-400">
              Pengirim membuka tautan penerima. Browser mengambil kunci publik penerima tanpa perlu tahu identitas pengirim.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border-l-4 border-l-purple-500">
            <div className="text-xs font-mono text-purple-400 font-bold mb-1">LANGKAH 03</div>
            <h4 className="font-bold text-white text-base mb-1">Enkripsi Sisi Klien</h4>
            <p className="text-xs text-slate-400">
              Pesan dipecah menjadi blok byte matematis dan dienkripsi menjadi pasangan (c1, c2) langsung di peramban pengirim.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border-l-4 border-l-emerald-500">
            <div className="text-xs font-mono text-emerald-400 font-bold mb-1">LANGKAH 04</div>
            <h4 className="font-bold text-white text-base mb-1">Dekripsi Lokal</h4>
            <p className="text-xs text-slate-400">
              Penerima membuka inbox dan mendekripsi pesan menggunakan private key miliknya. Pesan terbaca secara utuh.
            </p>
          </div>
        </div>
      </section>

      {/* Catatan Keamanan Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-900 text-center text-xs text-slate-400">
        <p className="font-mono">
          CryptoFess v1.0 — Proyek Pembelajaran Implementasi Kriptografi & Keamanan Web.
        </p>
        <p className="mt-1">
          Algoritma matematika, Diffie-Hellman, dan ElGamal diimplementasikan secara manual menggunakan BigInt standar tanpa pustaka kriptografi pihak ketiga.
        </p>
      </footer>
    </div>
  );
}
