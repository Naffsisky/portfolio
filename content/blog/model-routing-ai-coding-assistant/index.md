---
title: 'Model Routing Playbook: Cara Memangkas Biaya AI Coding Assistant Tanpa Menurunkan Kualitas'
date: '2026-11-01'
template: 'post'
draft: false
slug: 'model-routing-ai-coding-assistant'
category: 'Technology'
tags:
  - 'AI'
  - 'Claude Code'
  - 'Cost Optimization'
  - 'DevOps'
description: 'Kebanyakan orang langsung pakai model termahal untuk semua tugas. Padahal ada tujuh pola routing yang terbukti menurunkan biaya 35–65% tanpa menurunkan kualitas hasil. Ini rangkuman playbook-nya, lengkap dengan cara menerapkannya di Claude Code dan Codex.'
seoTitle: 'Model Routing Playbook: Hemat Biaya AI Coding Tanpa Turun Kualitas'
seoDescription: 'Panduan model routing untuk AI coding assistant: 7 pola routing (effort, tier, rules, cascade, advisor, auto, trajectory), angka nyata penghematan, dan batasan yang perlu diwaspadai.'
---

## Kenapa topik ini penting

Kalau kamu memakai Claude Code, Codex, atau asisten coding lain setiap hari, tagihan bulanannya bisa membengkak tanpa kamu sadari. Penyebabnya biasanya satu: **semua tugas dikerjakan model termahal dengan effort maksimal**.

Menariknya, sebagian besar tugas tidak butuh itu. Menulis dokumentasi, memperbaiki typo, menambah unit test sederhana — semuanya bisa selesai dengan model satu tingkat di bawahnya, atau dengan model yang sama tapi effort lebih rendah.

Artikel ini merangkum *Model Routing Playbook* dari **@donimas (AI LEVELS)**, yang mengumpulkan tujuh pola routing beserta bukti dari dokumentasi resmi, tulisan produksi, dan paper. Saya tulis ulang dalam bahasa praktis, plus catatan bagian mana yang realistis dipakai sehari-hari.

> Semua angka di artikel ini berasal dari playbook tersebut (dicek 5 Oktober 2026). Harga dan kemampuan model berubah cepat — perlakukan sebagai indikasi, bukan janji.

---

## Lima aturan yang jadi inti

Kalau malas membaca semuanya, cukup hafal lima ini:

1. **Atur effort dulu sebelum ganti model.** Sebagian besar tugas tidak butuh `high`.
2. **Jangan jadikan model teratas sebagai default.** Satu tingkat di bawahnya menyelesaikan hampir sebanyak itu, dengan biaya jauh lebih kecil.
3. **Routing berdasarkan jenis tugas dan risiko**, pakai aturan sederhana.
4. **Verifikasi dengan kode** (test, type check, lint). Kalau gagal, naik satu langkah: effort dulu, baru model.
5. **Catat setiap kegagalan** dan ubah jadi aturan baru.

Poin nomor 4 yang paling sering dilewatkan orang. Routing tanpa verifikasi cuma menebak-nebak lebih murah — bukan lebih pintar.

---

## Pilih rute dalam 10 detik

| Situasi | Pola yang dipakai | Diatur di mana |
|---|---|---|
| Satu model untuk semua, tagihan tinggi | **Effort** | `/effort`, `model_reasoning_effort`, `reasoning.effort` |
| Model teratas jadi default | **Tier** | `/model sonnet` / `opus` |
| Tugas jelas berbeda (dokumentasi vs migrasi) | **Rules** | Subagent dengan model + effort, `CLAUDE.md` / `AGENTS.md` |
| Punya test atau pengecekan murah | **Cascade** | Verifier subagent + Stop hook |
| Model murah salah di keputusan penting | **Advisor** | `/model opusplan`, `/advisor opus`, Aider architect |
| Aplikasi API volume tinggi dengan log hasil | **Auto** | LiteLLM, vLLM Semantic Router, OpenRouter |

---

## Tujuh pola routing

### 1 · Effort routing

Model yang sama, kedalaman berpikir berbeda per tugas.

- **Kapan dipakai:** selalu jadi langkah pertama, sebelum menyentuh model lain.
- **Kenapa efektif:** sebagian besar tugas tidak butuh penalaran mendalam, jadi kamu membayar token berpikir yang tidak terpakai.

Praktisnya, satu model dengan effort `low` untuk rename variabel, dan `high` hanya untuk debugging race condition. Ini perubahan termurah yang bisa kamu lakukan hari ini.

> Mengubah effort itu murah. Mengubah model di tengah tugas justru membaca ulang seluruh konteks dengan harga penuh (prompt cache miss).

### 2 · Default satu tingkat di bawah model teratas

Jangan pakai model termahal sebagai default. Simpan untuk eskalasi.

- **Kapan dipakai:** ketika default-mu adalah model paling mahal.
- **Kenapa efektif:** tier kedua menyelesaikan hampir sebanyak tier pertama, dengan biaya jauh lebih rendah.

Satu peringatan penting: **harga per token ≠ harga per tugas**. Model yang lebih kuat kadang menyelesaikan pekerjaan dengan token lebih sedikit, jadi bandingkan biaya per tugas yang berhasil, bukan per token.

### 3 · Rules berdasarkan jenis tugas dan risiko

`if/else` biasa mengalahkan sihir.

- **Kapan dipakai:** tugasmu memang berbeda jenis — dokumentasi, test, fitur, migrasi, auth, atau pembayaran.
- **Kenapa efektif:** kamu sudah tahu tugas mana yang berisiko. Aturan tidak butuh biaya dan tidak berubah diam-diam.

Contoh nyata: semua perubahan di folder `auth/` dan `payments/` wajib pakai model teratas; dokumentasi dan komentar cukup model murah.

Aturan bisa basi. Tinjau ulang dari log setiap beberapa minggu.

### 4 · Cascade: murah dulu → verifikasi → eskalasi

Kualitasnya bergantung pada pengecekanmu.

- **Kapan dipakai:** kamu punya pengecekan murah dan andal — test, type check, lint, atau schema.
- **Kenapa efektif:** sebagian besar tugas lolos di tier murah, jadi kamu hanya membayar model kuat saat pengecekan membuktikan kamu membutuhkannya.

> Percobaan murah yang gagal biayanya lebih dari 4× percobaan yang berhasil. Eskalasi setelah **satu** perbaikan gagal, bukan lima. Dan ingat: test juga bisa meloloskan patch yang salah.

### 5 · Advisor dan pemisahan plan/execute

Tangan murah, otak kuat di momen kunci.

- **Kapan dipakai:** model murah benar di sebagian besar langkah, tapi keliru di keputusan besar.
- **Kenapa efektif:** perencanaan dan keputusan sulit hanya sebagian kecil token; eksekusinya yang mendominasi.

Setiap pergantian model di sesi utama membangun ulang prompt cache. Ukur dulu sebelum dipakai permanen.

### 6 · Auto router

Biarkan router memilih, lalu periksa hasilnya.

- **Kapan dipakai:** aplikasi API dengan trafik beragam dan hasil yang bisa dicatat.
- **Kenapa efektif:** classifier bisa mengenali request mudah lebih cepat daripada kamu menulis aturannya.

Tidak ada auto router yang memverifikasi hasil untukmu. Pengecekan tetap milikmu.

### 7 · Trajectory routing (riset)

Putuskan setelah 2–3 langkah pertama, bukan dari prompt.

- **Kapan dipakai:** tugas agentic yang tingkat kesulitannya baru terlihat setelah agent mulai menggali.
- **Kenapa efektif:** beberapa langkah awal memberi informasi lebih banyak daripada teks permintaan.

Masih tahap riset. Belum ada tool siap pakai.

---

## Angka yang jujur

Ini bagian yang biasanya dilewatkan konten viral:

- **"15× lebih murah"** dari Reel adalah **simulasi**: enam tugas yang sama, harga list asli, dibandingkan "model teratas dengan effort maksimal untuk semuanya". Sebagian besar keuntungan itu berasal dari berhenti melakukan hal yang boros.
- **Satu tingkat di bawah model teratas, effort default:** sekitar **5× lebih murah** dengan tingkat keberhasilan yang sama (data Anthropic).
- **Routing di atas itu:** **35–65% lebih murah** dengan kualitas setara di produksi (LangChain, Cursor, Databricks — self-reported).
- **Selalu model termurah:** sekitar **15–19× lebih murah** per tugas, tapi menyelesaikan **8–15 poin persen lebih sedikit** tugas.

Kesimpulannya bukan "pakai yang termurah", tapi "pakai yang tepat".

---

## Di mana routing bisa gagal

Ketahui ini sebelum membangun router sendiri:

- **Collapse** — router perlahan mengirim semua ke model terkuat.
- **Task baru menipu router** — mengganti kalimat permintaan bisa mengubah rute.
- **Pengecek memakan penghematan** — pada satu benchmark, model penilai menghabiskan **21%** dari total biaya.
- **Cheap-first bisa lebih mahal** — percobaan gagal >4× biaya percobaan sukses.
- **Serangan prompt** — teks yang dirancang khusus bisa memaksa request ke model mahal, menaikkan biaya **1,7× sampai lebih dari 8×**.

---

## Menerapkannya di Claude Code

Claude Code dan Codex **tidak punya hook untuk mengganti model per prompt**. Jadi "router" di sini adalah sesi utamamu yang mengikuti aturan, ditambah subagent dengan model + effort tetap, verifier, dan test gate.

Alurnya:

1. **Triage** membaca tugas → menentukan rute + tingkat risiko.
2. **Worker** (quick / build / deep) mengerjakan dengan model + effort-nya.
3. **Verifier + Stop hook** menjalankan pengecekan. Gagal → satu retry, naik satu langkah.
4. **Memory** menyimpan satu baris per kegagalan, supaya triage berikutnya lebih baik.

Contoh isi `CLAUDE.md` yang bisa langsung dipakai:

```md
## Model routing

- Default: sonnet, effort medium.
- Dokumentasi, komentar, commit message, rename: effort low.
- Perubahan di auth/, payments/, migration/: opus, effort high.
- Selalu jalankan `npm run lint && npm run typecheck && npm test` sebelum selesai.
- Kalau verifikasi gagal: perbaiki sekali. Gagal lagi → naikkan effort, lalu naikkan model.
- Catat setiap kegagalan di .claude/misses.md dalam satu baris: tugas, rute, penyebab.
```

Untuk Codex, prinsipnya sama: atur `model_reasoning_effort` di konfigurasi, tulis aturan routing di `AGENTS.md`, dan pakai subagent untuk tugas yang jelas berbeda.

---

## Yang perlu diukur

Jangan percaya perasaan "sudah lebih murah". Ukur:

- **Baseline:** satu model kuat (bukan termahal) pada `low` / `medium` / `high` untuk 50–100 tugasmu yang sebenarnya. Router harus mengalahkan ini.
- **Solve rate dan biaya per tugas yang berhasil** — bukan biaya per token.
- **p90 biaya per tugas** dan **escalation rate**.
- **False pass:** bug yang baru ketahuan setelah merge.
- **Prompt cache hit rate** — pergantian model membunuhnya.
- **Uji ulang level effort** setiap kali ada model baru rilis.

---

## Kesimpulan

Model routing bukan trik ajaib, tapi disiplin kecil yang menumpuk:

1. Turunkan effort lebih dulu.
2. Jangan default ke model termahal.
3. Tulis aturan berdasarkan risiko.
4. Verifikasi dengan kode, eskalasi sekali.
5. Catat kegagalan, jadikan aturan.

Tanpa langkah 4 dan 5, routing hanya memindahkan biaya ke bug yang lebih mahal.

---

### Sumber

- *Model Routing Playbook* — @donimas / AI LEVELS (dicek 5 Oktober 2026). Semua pola, angka, dan peringatan di artikel ini berasal dari sana.
