# CryptoFess — Platform Pesan Anonim Berbasis Kriptografi

CryptoFess adalah aplikasi web *anonymous confession* (pesan anonim) dengan perlindungan kriptografi asimetris. Pesan teks dienkripsi langsung di browser pengirim menggunakan algoritma **ElGamal**, dan nilai rahasia bersama (shared secret) dapat disimulasikan menggunakan **Diffie-Hellman**. Seluruh operasi matematika dan algoritma kriptografi inti diimplementasikan secara manual dari nol menggunakan JavaScript `BigInt` bawaan tanpa memanggil library kriptografi eksternal.

---

## 1. Arsitektur dan Batasan Penggunaan Library

### A. Implementasi Manual (Dibuat Sendiri Tanpa Library Kriptografi)
Sesuai batasan tugas dan `PRD_CryptoFess.md`:
1. **Operasi Matematika Inti (`crypto/math.js`)**:
   - `modPow(base, exponent, modulus)`: Algoritma perpangkatan modular *Square-and-Multiply* efisien dengan presisi `BigInt`.
   - `gcd(a, b)`: Algoritma Euclidean untuk mencari faktor persekutuan terbesar.
   - `extendedGcd(a, b)`: Algoritma Euclidean Diperluas (*Extended Euclidean Algorithm*) yang memenuhi identitas Bézout: $a \cdot x + b \cdot y = \gcd(a, b)$.
   - `modInverse(a, modulus)`: Invers perkalian modular berbasis Extended GCD dengan normalisasi rentang $[1, \text{modulus} - 1]$.
   - `isProbablePrime(n, rounds)`: Uji primalitas probabilistik Miller-Rabin untuk validasi parameter prima.
   - `randomBigInt(min, max)`: Generator bilangan bulat besar acak dengan *rejection sampling* menggunakan CSPRNG (`crypto.getRandomValues`).
2. **Diffie-Hellman Key Exchange (`crypto/diffieHellman.js`)**:
   - Validasi parameter $p$ dan $g$.
   - Pembangkitan private key $a$ dan public key $A = g^a \bmod p$.
   - Perhitungan shared secret $S_A = B^a \bmod p$ dan $S_B = A^b \bmod p$ serta verifikasi kesamaan rahasia bersama ($S_A = S_B$).
   - Validasi pencegahan serangan *small subgroup confinement* ($2 \le \text{public key} \le p - 2$).
3. **ElGamal Asymmetric Cryptosystem (`crypto/elgamal.js`)**:
   - Pembangkitan pasangan kunci: $x \in [2, p - 2]$, $y = g^x \bmod p$.
   - Enkripsi pesan numerik: $c_1 = g^k \bmod p$, $c_2 = (m \cdot y^k) \bmod p$.
   - Dekripsi ciphertext: $s = c_1^x \bmod p$, $s^{-1} = \text{modInverse}(s, p)$, $m = (c_2 \cdot s^{-1}) \bmod p$.
   - Validasi batas domain pesan $m \in [1, p - 1]$ dan validasi ciphertext.
4. **Message Packaging & Chunking (`crypto/encoding.js`)**:
   - Pembagian teks UTF-8 menjadi blok byte (*chunking*) yang aman terhadap batas bit modulus $p$.
   - Penyematan *sentinel byte* `0x01` untuk mencegah hilangnya byte null/nol awal pada string teks, emoji, atau karakter multibyte.

### B. Library Pendukung yang Digunakan
- **Frontend**: React 19, React Router v7, Tailwind CSS, Lucide Icons, Vite.
- **Backend**: Node.js v24, Express.js, Helmet, CORS, Express-Rate-Limit.
- **Database**: SQLite bawaan Node.js (`node:sqlite DatabaseSync`) dengan skema relasional tabel `users`, `public_keys`, dan `messages`.
- **Autentikasi & Keamanan Akun**: JWT (`jsonwebtoken`) untuk sesi login dan `bcryptjs` untuk hashing kata sandi akun di server.

---

## 2. Alur Pesan & Model Keamanan (Zero-Plaintext Server)

```
[Pengirim Anonim]                    [Server Backend & DB]                    [Penerima Pesan]
       |                                       |                                      |
       | 1. Ambil Public Key (y)               |                                      |
       |-------------------------------------->|                                      |
       |    Kembalikan (y, p, g)               |                                      |
       |<--------------------------------------|                                      |
       |                                       |                                      |
       | 2. Enkripsi Teks di Browser           |                                      |
       |    m -> chunks -> (c1, c2)            |                                      |
       |                                       |                                      |
       | 3. Kirim HANYA Ciphertext             |                                      |
       |-------------------------------------->|                                      |
       |                                       | Simpan ke DB                         |
       |                                       | (messages.ciphertext)                |
       |                                       |                                      |
       |                                       | 4. Buka Inbox & Ambil Ciphertext     |
       |                                       |<-------------------------------------|
       |                                       |    Kembalikan Ciphertext             |
       |                                       |------------------------------------->|
       |                                       |                                      |
       |                                       |                       5. Dekripsi Lokal
       |                                       |                          di Browser Penerima
       |                                       |                          (Pakai Private Key x)
```

1. **Penerima**: Memiliki pasangan kunci ElGamal. Public key $y$ tersimpan di database publik, sedangkan private key $x$ disimpan secara lokal di browser penerima (dan dapat dicadangkan oleh pengguna). Private key **tidak pernah** dikirim ke server.
2. **Pengirim Anonim**: Membuka `/fess/:username`. Browser pengirim mengunduh public key penerima, membagi teks menjadi blok-blok aman, dan mengenkripsinya dengan ElGamal secara lokal di browser.
3. **Penyimpanan Server**: Backend hanya menerima JSON array berisi pasangan numerik $(c_1, c_2)$ dan metadata kriptografi. Jika ada upaya pengiriman data `plaintext` atau `privateKey`, server akan menolak permintaan dengan kode 400.
4. **Pembacaan Pesan**: Penerima membuka inbox dan mengambil ciphertext. Dekripsi dilakukan di browser penerima menggunakan rumus invers modular manual. Pesan asli tampil utuh hanya jika private key cocok.

---

## 3. Struktur Direktori Proyek

```text
CryptoFess/
├── crypto/                       # Modul Kriptografi Manual (Tanpa Eksternal Library)
│   ├── math.js                   # modPow, gcd, extendedGcd, modInverse, primality, CSPRNG
│   ├── diffieHellman.js          # DH parameter validation, keygen, shared secret, simulasi
│   ├── elgamal.js                # ElGamal keygen, enkripsi (c1, c2), dekripsi, validasi
│   ├── encoding.js               # UTF-8 text chunking, sentinel encoding, serialisasi
│   └── index.js                  # Entry point modul kriptografi
├── backend/                      # Backend API Server (Node.js & Express)
│   └── src/
│       ├── controllers/          # authController, userController, messageController
│       ├── middleware/           # authMiddleware (JWT), rate limiting
│       ├── models/               # userModel, publicKeyModel, messageModel
│       ├── routes/               # authRoutes, userRoutes, messageRoutes, cryptoRoutes
│       ├── services/             # authService (bcrypt hash)
│       ├── app.js                # Express app setup & route binding
│       └── server.js             # Entry point server HTTP (port 5000)
├── database/                     # Basis Data SQLite
│   ├── schema.sql                # Skema DDL tabel users, public_keys, messages
│   └── index.js                  # Koneksi SQLite bawaan (node:sqlite DatabaseSync)
├── frontend/                     # Antarmuka Pengguna (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/           # Navbar, Alert, UI Cards
│   │   ├── pages/                # Home, Register, Login, Dashboard, SendFess, Inbox, ReadMessage, CryptoLab
│   │   ├── services/             # api.js & client token/key storage
│   │   ├── styles/               # index.css (Tailwind CSS)
│   │   ├── App.jsx               # Client routing
│   │   └── main.jsx              # React DOM entry point
│   ├── vite.config.js            # Vite build & dev proxy
│   └── package.json
├── tests/                        # Suite Pengujian Otomatis
│   ├── math.test.js              # Unit test fungsi matematika
│   ├── diffieHellman.test.js     # Unit test Diffie-Hellman
│   ├── elgamal.test.js           # Unit test ElGamal
│   ├── encoding.test.js          # Unit test text chunking & roundtrip
│   ├── api.test.js               # Integration test seluruh rute API
│   └── security.test.js          # Audit kepatuhan keamanan & E2EE
├── .env.example                  # Template variabel lingkungan
├── package.json                  # Root scripts & dependensi
└── PRD_CryptoFess.md             # Dokumen Spesifikasi Kebutuhan Produk
```

---

## 4. Instalasi dan Menjalankan Aplikasi

### Persyaratan Sistem
- Node.js versi 20.x atau 22.x atau 24.x (disarankan v24+)
- npm versi 10.x+

### Langkah 1: Kloning / Unduh Repositori
```bash
git clone <url-repository>
cd CryptoFess
```

### Langkah 2: Instalasi Dependensi
Instal dependensi root (backend) dan frontend:
```bash
npm install
cd frontend && npm install && cd ..
```

### Langkah 3: Konfigurasi Environment
Salin template konfigurasi `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi pada file `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=rahasia-jwt-super-aman-ganti-di-produksi
CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=./database/cryptofess.db
```

### Langkah 4: Build Frontend & Jalankan Aplikasi

#### Cara 1: Mode Produksi / Full-Stack Terpadu (Satu Port)
Build aset frontend dan jalankan server Express pada port `5000`:
```bash
npm run build
npm start
```
Buka peramban di: **`http://localhost:5000`**

#### Cara 2: Mode Pengembangan (Vite HMR + Backend Watcher)
Jalankan backend di satu terminal:
```bash
npm run dev:backend
```
Jalankan frontend Vite dev server di terminal lain:
```bash
npm run dev:frontend
```
Buka peramban di: **`http://localhost:5173`**

---

## 5. Dokumentasi API Endpoint

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/health` | Publik | Memeriksa status kesehatan backend API. |
| `POST` | `/api/auth/register` | Publik | Mendaftarkan akun baru dan mendaftarkan public key awal. |
| `POST` | `/api/auth/login` | Publik | Melakukan autentikasi dan menerbitkan JWT token. |
| `POST` | `/api/auth/logout` | Publik | Mengakhiri sesi pengguna. |
| `GET` | `/api/users/me` | Terlindungi | Mengambil profil pengguna aktif, statistik pesan, dan public key. |
| `POST` | `/api/users/public-key` | Terlindungi | Memperbarui atau menambahkan versi baru public key. |
| `GET` | `/api/recipients/:username` | Publik | Mengambil profil publik penerima pesan. |
| `GET` | `/api/recipients/:username/public-keys` | Publik | Mengambil public key penerima untuk proses enkripsi. |
| `POST` | `/api/messages` | Publik | Mengirimkan ciphertext pesan terenkripsi ke penerima. |
| `GET` | `/api/messages/inbox` | Terlindungi | Mengambil daftar pesan masuk milik pengguna aktif. |
| `GET` | `/api/messages/:id` | Terlindungi | Mengambil ciphertext satu pesan (otorisasi ketat: hanya penerima). |
| `PATCH` | `/api/messages/:id/read` | Terlindungi | Memperbarui status baca pesan (`read_at`). |
| `DELETE` | `/api/messages/:id` | Terlindungi | Menghapus pesan secara aman dari inbox penerima. |
| `GET` | `/api/crypto/parameters` | Publik | Mengambil parameter preset dan standar DH & ElGamal untuk Crypto Lab. |
| `POST` | `/api/crypto/simulate-dh` | Publik | Mensimulasikan pertukaran Diffie-Hellman antara Alice dan Bob. |

---

## 6. Pengujian Otomatis

Seluruh pengujian unit, integrasi, dan audit keamanan dijalankan menggunakan test runner bawaan Node.js (`node:test` dan `node:assert/strict`):

```bash
# Menjalankan seluruh pengujian (Math, DH, ElGamal, Encoding, API, Keamanan)
npm test

# Menjalankan pengujian modul kriptografi saja
npm run test:crypto

# Menjalankan pengujian API dan audit keamanan saja
npm run test:backend
```

### Hasil Pengujian yang Dijalankan (52/52 Lulus, 100% Pass)
- **Matematika Kriptografi**:
  - `TEST-MATH-01`: Square-and-multiply modPow diverifikasi terhadap nilai acuan & bilangan besar 2048-bit.
  - `TEST-MATH-02`: Algoritma Euclidean GCD untuk berbagai variasi bilangan dan kasus koprima.
  - `TEST-MATH-03`: Extended Euclidean GCD membuktikan identitas Bézout $a \cdot x + b \cdot y = \gcd(a, b)$.
  - `TEST-MATH-04`: Invers perkalian modular $(a \cdot \text{inv}) \bmod m \equiv 1$ serta penolakan pasangan non-koprima.
  - `TEST-MATH-05`: Penolakan parameter di luar jangkauan (modulus $\le 1$, eksponen negatif).
  - Miller-Rabin primality test & CSPRNG rejection sampling.
- **Diffie-Hellman Key Exchange**:
  - `TEST-DH-01`: Pembentukan public value $A = g^a \bmod p$.
  - `TEST-DH-02` s/d `TEST-DH-04`: Perhitungan shared secret $S_A = B^a \bmod p$ dan $S_B = A^b \bmod p$ serta kesamaan kedua rahasia bersama.
  - `TEST-DH-05`: Penolakan public key invalid (0, 1, $p-1$) dan parameter tidak sah.
  - Verifikasi pertukaran kunci pada parameter RFC 3526 MODP 2048-bit.
- **ElGamal Cryptosystem**:
  - `TEST-ELG-01`: Pembentukan pasangan kunci $y = g^x \bmod p$.
  - `TEST-ELG-02` & `TEST-ELG-03`: Enkripsi nilai pesan valid dan pemulihan nilai asli saat didekripsi.
  - `TEST-ELG-04`: Penolakan pesan di luar domain $[1, p - 1]$.
  - `TEST-ELG-05`: Penanganan ciphertext yang rusak atau tidak valid tanpa mengalami crash.
- **Pengemasan Teks (Encoding & Chunking)**:
  - Pemecahan string UTF-8 arbitrer, simbol, dan emoji dengan penyematan sentinel byte `0x01`.
  - Verifikasi dekripsi gagal jika private key salah.
- **Backend API & Akses Kontrol**:
  - `TEST-APP-01`: Registrasi akun baru berhasil.
  - `TEST-APP-02`: Penolakan username duplikat.
  - `TEST-APP-03` & `TEST-APP-04`: Verifikasi login berhasil dan penolakan kredensial salah.
  - `TEST-APP-05`: Pengiriman pesan anonim ke penerima yang sah.
  - `TEST-APP-06`: Inbox hanya menampilkan pesan milik pengguna yang sedang terautentikasi.
  - `TEST-APP-07`: Penerima sah dapat mengambil ciphertext pesan miliknya.
  - `TEST-APP-08`: Pengguna lain (Bob) dilarang mengakses pesan milik Alice (HTTP 403 Forbidden).
  - `TEST-APP-09`: Penghapusan pesan dari inbox.
- **Kepatuhan Keamanan (Audit E2EE)**:
  - Penolakan permintaan yang mencoba mengirim `plaintext` ke server.
  - Penolakan permintaan yang menyertakan `privateKey` ke server.
  - Audit langsung ke database SQLite: password disimpan dalam hash bcrypt `$2a$` dan ciphertext tidak mengandung string plaintext.

---

## 7. Batasan dan Analisis Risiko Keamanan

1. **Tujuan Edukasional**:
   Proyek ini dirancang untuk tujuan pembelajaran algoritma kriptografi klasik dan pengembangan web interaktif. Jangan gunakan aplikasi ini untuk komunikasi yang memerlukan perlindungan kerahasiaan tingkat militer sebelum dilakukan audit independen menyeluruh.
2. **Keterbatasan ElGamal Standar**:
   ElGamal buku teks (*textbook ElGamal*) bersifat mudah ditempa (*malleable*) dan rentan terhadap *chosen-ciphertext attack* (CCA) jika tidak dipadukan dengan skema *Optimal Asymmetric Encryption Padding* (OAEP) atau MAC (Message Authentication Code) autentikasi ciphertext.
3. **Man-In-The-Middle (MITM) pada Diffie-Hellman**:
   Pertukaran Diffie-Hellman dasar tidak mengautentikasi identitas pihak lawan. Pada Crypto Lab, pertukaran disimulasikan secara transparan untuk memahami aljabar modularnya.
4. **Keamanan Private Key Sisi Klien**:
   Private key disimpan di browser `localStorage`. Jika peramban dibersihkan, pengguna memerlukan private key cadangan untuk mendekripsi pesan-pesan lama yang telah tersimpan. Pengguna bertanggung jawab mencadangkan private key mereka secara aman.
5. **Anonimitas Jaringan**:
   CryptoFess versi 1.0 menjamin **anonimitas pengirim terhadap penerima** (penerima tidak mengetahui siapa pengirim pesan) dan **kerahasiaan isi pesan terhadap server**. Aplikasi ini tidak menyediakan *network-level anonymity* (seperti jaringan Tor / I2P) terhadap penyerang yang memantau paket pada tingkat ISP atau router jaringan.
