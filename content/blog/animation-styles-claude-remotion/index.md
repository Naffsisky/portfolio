---
title: 'Animation Styles untuk Video dengan Claude + Remotion: 30 Gaya yang Benar-Benar Dipakai'
date: '2026-11-01'
template: 'post'
draft: false
slug: 'animation-styles-claude-remotion'
category: 'Technology'
tags:
  - 'AI'
  - 'Claude Code'
  - 'Motion Design'
  - 'Remotion'
description: 'Daripada prompt "bikin animasi keren", lebih efektif memberi Claude resep gaya yang spesifik: warna dengan kode hex, font gratis, cara bergerak, dan daftar hal yang justru merusak hasilnya. Ini rangkuman 30 gaya animasi plus cara memakainya di Claude Code dan Remotion.'
seoTitle: 'Animation Styles dengan Claude + Remotion: 30 Gaya Siap Pakai'
seoDescription: 'Panduan membuat animasi video dengan Claude Code dan Remotion: cara memakai kartu resep gaya, kategori gaya yang tersedia, dan daftar larangan supaya hasilnya tidak terlihat AI-made.'
---

## Kenapa prompt "bikin animasi keren" gagal

Kalau kamu meminta AI membuat animasi dengan prompt umum, hasilnya cenderung jatuh ke satu dari dua ekstrem: terlalu polos, atau penuh efek ala template Canva — partikel bertebaran, glow neon, dan crossfade di semua transisi.

Yang kurang bukan kemampuan modelnya, tapi **spesifikasi**. Animasi yang terasa profesional selalu punya keputusan eksplisit: palet warna terbatas, satu jenis easing, tipografi yang konsisten, dan tekstur yang disengaja.

Pendekatan "kartu resep" menyelesaikan ini. Setiap gaya dijelaskan lewat empat hal:

- **The look** — warna (dengan kode hex), font gratis, layout, tekstur.
- **How it moves** — apa yang bergerak, kapan, dengan easing apa.
- **Never** — hal yang justru merusak gaya tersebut.
- **Prompt siap tempel** — tinggal ganti `[YOUR WORDS]`.

> Artikel ini merangkum halaman *Animation styles you can build with Claude* oleh **Shaan Johari (@viashaan)**, dipublikasikan 9 Juli 2026. Semua gaya, kategori, dan daftar larangan berasal dari sana.

---

## Cara memakai satu kartu gaya

1. **Pilih gaya berdasarkan kecocokan video**, bukan yang paling kamu suka. Setiap kartu menyebut cocok untuk apa.
2. **Salin prompt kartu itu.** Ganti `[YOUR WORDS]` dengan kalimat, produk, atau nama brand-mu.
3. **Tempel ke Claude Code.** Kalau Remotion sudah terpasang, hasilnya langsung dirender jadi video. Kalau belum, minta Claude memasangnya dulu:
   ```text
   set up Remotion in this folder and ask me before installing anything
   ```
4. **Beri catatan pada versi pertama** memakai bagian *How it moves* dan *Never* dari kartu. Dua bagian itu yang memberi kosakata untuk meminta perbaikan.
5. **Kalau sering dipakai, jadikan slash command.** Buat file `.claude/commands/nama-gaya.md`, tempel prompt-nya, dan taruh `$ARGUMENTS` di posisi kalimatmu. Setelah itu cukup ketik `/nama-gaya` diikuti teksmu.

Langkah 4 adalah yang paling membedakan hasil biasa dan hasil bagus. "Terlalu banyak gerakan" adalah catatan yang lemah; "gerak hanya di 0,4 detik pertama, sisanya diam" adalah catatan yang bisa dieksekusi.

---

## Kategori gaya yang tersedia

Halaman aslinya terus bertambah. Susunannya dibagi per bagian, dan setiap bagian berisi kartu yang bisa dibuka.

### Bagian 3 — tambahan terbaru

1. **Maps: Globe arcs** — busur di bola dunia untuk cerita jangkauan atau perjalanan.
2. **Launches: Laptop reveal** — produk muncul dari balik layar laptop.
3. **Explainers: Isometric flow** — alur proses dengan perspektif isometrik.
4. **Proof: Notification stack** — tumpukan notifikasi sebagai bukti sosial.
5. **Makeovers: Before and after slider** — perbandingan sebelum/sesudah.
6. **Data: Ranking bars** — bar chart yang menyusun ulang dirinya.
7. **Receipts: Social post receipt** — tangkapan layar postingan sebagai "bukti".
8. **Challenges: Day counter** — hitungan hari untuk tantangan.
9. **Comparisons: Versus** — dua hal diadu berdampingan.

### Bagian 2

1. **Maps: 3D Map Route** — rute perjalanan di peta tiga dimensi.
2. **Product: Exploded Teardown** — produk dibongkar menjadi komponen.
3. **Title cards: Ink Wash** — judul dengan tekstur tinta.
4. **Explainers: Paper Desk** — metafora kertas di atas meja.
5. **News dan commentary: Headline Highlight** — kutipan berita dengan sorotan.
6. **Finance dan data: Stat Chart** — angka besar yang bergerak.
7. **Product launches: App Mockup** — UI aplikasi di dalam mockup perangkat.
8. **Tutorials: Screen-Recording Zoom** — zoom ke bagian rekaman layar.
9. **Stories: Timeline** — perjalanan waktu.

### Bagian 1

1. **Glowing 2D motion: Glow Orb** — bola bercahaya sebagai fokus.
2. **Glassmorphism: Frosted Glass UI** — panel kaca buram.
3. **Apple style: Apple One-Take** — satu gerakan kamera tanpa potongan.
4. **CRT effect / retro-futurism: Retro CRT Glow** — estetika layar tabung.
5. **Oscilloscope art: Oscilloscope** — gelombang seperti alat ukur.
6. **Editorial layout: Magazine Layout and Note** — tata letak majalah.
7. **Editorial kinetic typography: Blue Editorial** — tipografi kinetik bergaya editorial.
8. **Risograph: Risograph** — tekstur cetak sablon dua warna.
9. **Swiss style: Swiss Grid** — grid ketat, tipografi netral.
10. **Blueprint / technical drawing: Pencil to Blueprint** — sketsa berubah jadi cetak biru.

---

## Bagian paling berguna: daftar larangan

Ini bagian yang paling sering diabaikan, padahal paling berpengaruh. Prompt animasi AI yang paling disukai justru banyak berisi **larangan**. Tambahkan salah satu (atau semuanya) di akhir prompt-mu:

- Jangan pakai glow neon, kecuali gayanya memang dibangun dari glow.
- Jangan ada ledakan partikel atau sparkle.
- Jangan pakai crossfade. Sesuatu berubah bentuk atau terpotong — bukan melebur.
- Jangan pakai easing memantul di semua elemen. Pilih satu momen saja untuk bounce.
- Jangan ada camera shake atau lens flare.
- Jangan ada lantai grid bercahaya.
- Jangan taruh teks di sudut frame.
- Jangan ada apa pun yang terlihat seperti template.

Kalau hasilnya masih terasa "AI-made", biasanya karena salah satu dari daftar di atas masih muncul. Hapus satu per satu, dan hasilnya langsung terasa lebih disengaja.

---

## Contoh prompt yang bisa langsung dipakai

Gabungkan struktur kartu dengan larangan di atas. Contoh untuk gaya *Swiss Grid*, dengan brand pengganti:

```text
Buat animasi 6 detik untuk teks "INFRASTRUCTURE THAT SCALES".

The look:
- Latar putih #F7F7F5, teks hitam #111111.
- Font: Inter atau Helvetica Now, weight 600, tracking rapat.
- Grid 12 kolom terlihat samar, warna #E5E5E5.
- Satu aksen merah #E63946 hanya untuk satu kata.

How it moves:
- Baris pertama masuk dari kiri dengan clip-path, 0.4 detik, ease-out.
- Baris kedua mengikuti 0.12 detik kemudian.
- Kata beraksen merah berubah warna tanpa gerakan tambahan.
- Setelah 4 detik, semuanya diam.

Never:
- Tanpa glow, tanpa partikel, tanpa crossfade.
- Tanpa bounce, tanpa camera shake, tanpa lens flare.
- Tanpa teks di sudut frame.
```

Perhatikan bahwa hampir semua baris adalah keputusan, bukan harapan. Itu yang membuat hasilnya bisa diprediksi.

---

## Kapan sebaiknya tidak memakai AI untuk animasi

Jujur saja: untuk video brand utama dengan kebutuhan naratif yang rumit, motion designer tetap lebih cepat. AI paling berguna untuk:

- Video pendek untuk sosial media dengan produksi berulang.
- Animasi data yang formatnya sama tiap bulan.
- Prototipe cepat untuk menguji ide sebelum masuk produksi penuh.
- Menjelaskan konsep teknis dengan visual yang konsisten.

Kalau kamu menemukan dirimu menulis prompt sepuluh kali untuk satu scene, itu tanda bahwa scene tersebut butuh tangan manusia.

---

## Kesimpulan

Animasi yang bagus bukan soal efeknya banyak, tapi soal keputusan yang konsisten:

1. Pilih **satu** gaya yang cocok dengan isi video.
2. Tentukan warna, font, dan tekstur secara eksplisit.
3. Batasi gerakan ke satu atau dua momen.
4. Tulis daftar larangan — itu yang menjaga hasilnya tetap rapi.
5. Verifikasi hasil render, jangan hanya percaya pada prompt.

Dengan pendekatan kartu resep, Claude Code dan Remotion bisa jadi alat produksi yang benar-benar dipakai, bukan sekadar mainan demo.

---

### Sumber

- *Animation styles you can build with Claude* — Shaan Johari (@viashaan), 9 Juli 2026.
