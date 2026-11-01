---
title: '5 Tools Biar Claude Code Punya Selera Desain (Panduan Install Lengkap)'
date: '2026-11-01'
template: 'post'
draft: false
slug: 'tools-selera-desain-claude-code'
category: 'Technology'
tags:
  - 'AI'
  - 'Claude Code'
  - 'Web Development'
  - 'Design'
description: 'Hasil dari Claude Code sering kelihatan "AI banget": gradasi ungu, tiga kartu kembar, emoji di mana-mana. Lima tools ini memperbaiki itu — dari skill selera desain sampai Claude yang bisa membuka browser sendiri untuk mengecek hasil kerjanya.'
seoTitle: '5 Tools Biar Claude Code Punya Selera Desain'
seoDescription: 'Daftar lengkap 5 tools untuk memperbaiki selera desain Claude Code: Taste Skill, Web Design Guidelines, DESIGN.md, screenshot jadi kode, dan Playwright CLI. Lengkap dengan perintah install.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/5-tools-selera-desain.png'
---

## Masalahnya bukan model, tapi selera

Claude Code sudah cukup pintar menulis komponen React. Yang sering kurang adalah **rasa**: warna gradasi ungu yang itu-itu saja, tiga kartu kembar dengan ikon generik, emoji di setiap heading, dan spacing yang terasa "template".

Solusinya bukan model yang lebih besar, tapi memberi konteks desain yang jelas. Lima tools berikut melakukan itu. Semuanya bisa dipasang dalam **±15 menit**.

> Rangkuman ini diadaptasi dari panduan "5 Tools Biar Claude Code Punya Selera Desain" oleh Aksa (dicek 19 Oktober 2026). Perintah dan link bisa berubah — selalu ikuti dokumentasi resminya.

![Lima tools untuk memperbaiki selera desain Claude Code|Taste Skill, Web Design Guidelines, DESIGN.md, screenshot jadi kode, dan Playwright CLI.](https://is3.cloudhost.id/public-data/project-images/blog/5-tools-selera-desain.png)

---

## Persiapan (cukup sekali)

Sebelum mulai, siapkan tiga hal:

1. **Terminal** — Terminal di macOS, PowerShell di Windows.
2. **Node.js 22 atau lebih baru** — unduh versi LTS di [nodejs.org](https://nodejs.org/).
3. **Claude Code** — ikuti panduan resmi di `code.claude.com/docs/en/setup`.

Cek Node.js:

```bash
node -v
```

Kalau muncul `v22.x.x` atau lebih tinggi, kamu siap.

> Semua perintah di bawah dijalankan **di dalam folder project**. Caranya: ketik `cd`, spasi, lalu drag folder project ke terminal, tekan Enter.

---

## 1. Taste Skill — menanamkan selera desain

**Gunanya:** membuat Claude punya "selera". Gradasi ungu, tiga kartu kembar, dan emoji berlebihan langsung dilarang.

**Link:** `github.com/Leonxlnx/taste-skill`

**Cara install (pilih salah satu):**

Cara A, lewat terminal:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Cara B, di dalam Claude Code:

```text
/plugin marketplace add Leonxlnx/taste-skill
/plugin install taste-skill@taste-skill
```

**Cara pakai:** tidak perlu dipanggil. Cukup minta Claude membuat tampilan, skill-nya jalan sendiri.

```text
Bikinin landing page untuk kedai kopi saya, namanya Kopi Senja.
```

> Skill ini butuh Node.js 22+ dan browser Chrome/Edge di laptopmu.

---

## 2. Web Design Guidelines — reviewer desain

**Gunanya:** mengecek desain yang sudah dibuat Claude, lalu menunjukkan kesalahannya **per baris kode**. Seperti dosen yang merevisi, tapi untuk tampilan web.

**Link:** `github.com/vercel-labs/agent-skills` (skill `web-design-guidelines`)

**Cara install:**

```bash
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
```

**Cara pakai:**

```text
Review UI saya pakai web design guidelines, terus benerin yang salah.
```

Hasilnya berupa daftar temuan dalam format `file:baris`, jadi mudah ditelusuri.

---

## 3. Awesome Design (DESIGN.md) — contekan sistem desain

**Gunanya:** memberi Claude referensi sistem desain dari brand terkenal (Stripe, Apple, Notion, Linear, dan lain-lain): tipografi, warna, spacing, komponen, sampai layout. Tidak perlu sejam memilih biru yang mana.

**Link:** `github.com/VoltAgent/awesome-design-md` · preview di `getdesign.md`

**Cara install:** tidak perlu install. Cukup taruh satu file `DESIGN.md` di folder project.

1. Pilih gaya yang kamu suka di `getdesign.md`.
2. Unduh file-nya. Contoh gaya Stripe:

```bash
curl -o DESIGN.md https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/stripe/DESIGN.md
```

3. Suruh Claude memakainya:

```text
Bikinin halaman utama yang tampilannya ngikutin DESIGN.md.
```

Mau gaya lain? Ganti kata `stripe` di URL dengan `apple`, `notion`, `linear.app`, `vercel`, `airbnb`, atau `claude`.

> Di Windows, kalau `curl` error, pakai `curl.exe`. Atau buka link-nya di browser, salin isinya, simpan sebagai `DESIGN.md`.

---

## 4. Screenshot jadi kode

**Gunanya:** menemukan desain yang kamu suka? Screenshot, berikan ke Claude, dan Claude membuat versi miripnya.

**Link:** panduan resmi Claude Code, bagian *Work with images*.

**Cara install:** tidak perlu — sudah bawaan Claude Code.

**Cara pakai:**

1. Screenshot desain incaranmu (macOS: `Cmd + Shift + 4`, Windows: `Win + Shift + S`).
2. Masukkan ke Claude Code dengan salah satu cara:
   - Tekan `Ctrl + V` (di macOS juga `Ctrl`, bukan `Cmd`). Di Windows: `Alt + V`.
   - Drag gambar ke jendela Claude Code.
   - Tulis lokasi file-nya, misalnya `/Users/kamu/Desktop/desain.png`.
3. Beri perintah:

```text
Bikin halaman yang mirip desain ini pakai HTML dan Tailwind.
```

> Gunakan sebagai inspirasi, bukan untuk menjiplak logo atau brand orang lain.

---

## 5. Playwright CLI — Claude yang bisa membuka browser

**Gunanya:** Claude bisa membuka browser sendiri, mengklik-klik web-mu, mengambil screenshot, lalu mengecek hasilnya sendiri — termasuk tampilan versi HP.

**Link:** `playwright.dev/docs/getting-started-cli`

**Cara install:**

```bash
# 1. Pasang alatnya (sekali saja)
npm install -g @playwright/cli@latest

# 2. Pasang skill untuk Claude (jalankan di folder project)
playwright-cli install --skills

# 3. Cek
playwright-cli --help
```

Mau dipakai di semua project? Tambahkan `-g` di perintah kedua.

**Cara pakai:** jalankan web-mu dulu, lalu minta Claude:

```text
Buka web saya di localhost:3000 pakai playwright-cli, klik semua tombolnya,
ambil screenshot, cek juga tampilan versi HP, terus benerin kalau ada yang rusak.
```

> Butuh Node.js versi 20 ke atas.

---

## Urutan yang saya sarankan

1. Pasang **Taste Skill** dan taruh satu `DESIGN.md`, lalu minta Claude membuat halaman.
2. Setelah jadi, jalankan **Playwright CLI** supaya Claude mengecek sendiri di browser (termasuk versi HP).
3. Terakhir, **Web Design Guidelines** untuk review detailnya.
4. Menemukan desain keren di luar sana? Pakai **screenshot jadi kode**.

Alasannya: Taste Skill dan DESIGN.md mencegah kesalahan sejak awal, Playwright menangkap yang rusak secara visual, dan Web Design Guidelines merapikan sisa detailnya.

---

## Kalau error

- **`command not found: npx` atau `npm`** — Node.js belum terpasang. Ulangi bagian persiapan.
- **Skill tidak terpakai** — tutup Claude Code, buka lagi di folder project yang sama.
- **`curl` gagal di Windows** — ganti dengan `curl.exe` atau unduh manual.

---

## Penutup

Yang membuat output Claude Code terasa "AI banget" biasanya bukan modelnya, tapi tidak adanya konteks: tidak ada aturan selera, tidak ada referensi sistem desain, dan tidak ada pengecekan visual.

Lima tools di atas menutup tiga celah itu dengan biaya hampir nol. Mulai dari Taste Skill dan satu `DESIGN.md` hari ini — hasilnya langsung terasa di halaman berikutnya.

---

### Sumber

- *5 Tools Biar Claude Code Punya Selera Desain* — Aksa (dicek 19 Oktober 2026).
