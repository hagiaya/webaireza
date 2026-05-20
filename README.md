# Ara Studio — AI Influencer Automation

Ara Studio adalah aplikasi web full-stack premium berbasis **Next.js 14 App Router** untuk mengotomatiskan pembuatan konten edukasi coding digital yang diperankan oleh karakter AI bernama **"Ara"**. Aplikasi ini membantu merancang topik viral, menyusun naskah video dengan kecerdasan buatan, men-sintesis vokal ceria berkecepatan tinggi dengan Puter.js TTS, serta menjadwalkan konten secara otomatis untuk platform **TikTok**, **Instagram Reels**, dan **YouTube Shorts**.

---

## 🚀 Fitur Utama
1. **Premium Dark Theme & Aesthetics**: Desain modern serba gelap beraksen Ungu (#7C3AED) dan Pink (#EC4899), lengkap dengan efek glassmorphism, glowing borders, serta transisi animasi halus.
2. **Dashboard Kontrol (/)**: Panel komando yang menyajikan metrik performa harian creator, aksi pembuatan vokal batch cepat, timeline penayangan slot konten harian, serta feed log aktivitas audit.
3. **Script Generator AI (/scripts)**: Form topik modular yang memanggil Anthropic Claude API untuk merangkai konten koding berenergi tinggi dalam gaya percakapan Ara (menggunakan emoji, diksi santai, kalimat hook mengejutkan, dan call-to-action). Dilengkapi dengan editor naskah inline interaktif.
4. **TTS Generator (/audio)**: Mengubah naskah menjadi vokal MP3 buatan Ara lewat **Puter.js TTS SDK**, menyimpannya langsung ke Supabase Storage, dan memperbarui status database.
5. **Content Calendar (/calendar)**: Grid kalender bulanan dan harian dengan tag warna platform untuk visualisasi strategi. Dilengkapi tombol automasi penjadwalan konten 7 hari ke depan secara instan.
6. **Topic Bank (/topics)**: Gudang ide coding terstruktur dengan skor tren viralitas, filter, opsi kelola bulk, serta shortcut cepat untuk generate naskah.
7. **SVG Chart Analytics (/analytics)**: Metrik data tayangan dan interaksi visual yang dibuat dengan visualisasi SVG modern (Line chart neon glow, Donut platform chart, Bar weekly volume).
8. **Settings (/settings)**: Panel profile karakter Ara, pengaturan notifikasi, konfigurasi API key, dan utilitas backup database.

---

## 💾 Fitur Dual-Mode Database (Premium Fallback)
Aplikasi ini dilengkapi dengan **Dual-Mode Supabase Client** di `src/lib/supabase.ts`:
- **Mode Normal (Supabase Real)**: Bila file `.env` diisi dengan kredensial Supabase Anda, aplikasi akan berjalan terintegrasi penuh secara realtime di atas Cloud Database dan Storage.
- **Mode Uji Coba (Mock Database)**: Jika environment variables dibiarkan kosong atau bertanda placeholder, aplikasi akan secara cerdas **mengalihkan penyimpanan ke LocalStorage peramban**. Hal ini memungkinkan Anda untuk menguji coba pembuatan, pengeditan, penghapusan, pemutaran lagu audio, visualisasi grafik, dan automasi penjadwalan 100% lancar secara offline seketika tanpa perlu setup awal!

---

## 🛠️ Langkah Instalasi

### 1. Kloning dan Instalasi Dependensi
Jalankan di terminal Anda:
```bash
# Install paket NPM
npm install
```

### 2. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env` di direktori utama proyek:
```bash
cp .env.example .env
```
Isi variabel di dalam berkas `.env` dengan kredensial dari Supabase dan Anthropic:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[id-project-kamu].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-kamu]
ANTHROPIC_API_KEY=[api-key-claude-kamu]
```

### 3. Jalankan Server Dev Lokal
```bash
npm run dev
```
Buka peramban di alamat: [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Inisialisasi Supabase Database & Storage

### 1. Inisialisasi Database Schema
Salin kueri SQL di berkas `supabase/migrations/20260519000000_init_schema.sql` dan tempel di **SQL Editor** pada panel dasbor Supabase Anda, lalu klik **Run**:
```sql
-- Dapatkan script SQL lengkap di berkas:
-- supabase/migrations/20260519000000_init_schema.sql
```

### 2. Pembuatan Bucket Supabase Storage
1. Masuk ke dasbor Supabase Anda -> pilih **Storage**.
2. Klik **New Bucket** -> Namakan bucket dengan kata `audios`.
3. Aktifkan/toggle opsi **Public bucket** menjadi **True/Active** (agar berkas audio MP3 Ara dapat diakses dan diputar publik).
4. Klik **Save**.

---

## 🎙️ Implementasi Vokal Puter.js
Aplikasi ini meload **Puter.js v2 SDK** secara asinkron lewat component layout:
```html
<script src="https://js.puter.com/v2/"></script>
```
Lalu melakukan konversi teks naskah ke vokal digital Ara pada sisi klien (`src/app/audio/page.tsx`):
```javascript
const audioFile = await window.puter.ai.txt2speech(script.content, {
  voice: 'nova', // nova/shimmer/coral/alloy
  engine: 'openai' // openai/elevenlabs/polly
});
const fileUrl = audioFile.url;
```

---

## ☁️ Deployment ke Vercel
Aplikasi ini dikonfigurasi dengan berkas `vercel.json` dan siap di-deploy ke Vercel:
1. Hubungkan repositori Git Anda ke akun Vercel.
2. Tambahkan environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `ANTHROPIC_API_KEY` pada pengaturan proyek Vercel.
3. Klik **Deploy**!
