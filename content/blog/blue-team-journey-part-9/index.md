---
title: 'Blue Team Journey - Part 9: Certifications yang Masuk Akal'
date: '2026-11-21'
template: 'post'
draft: false
slug: 'blue-team-journey-part-9'
category: 'Cybersecurity'
tags:
  - 'Certifications'
  - 'Security+'
  - 'BTL1'
  - 'SC-200'
  - 'CySA+'
  - 'Blue Team'
  - 'Career'
  - 'Cybersecurity'
description: 'Panduan memilih sertifikasi Blue Team: Security+, BTL1, SC-200, CySA+, CDSA, CCD, sampai GIAC, lengkap dengan kalkulator jalur, budget, dan study plan.'
seoTitle: 'Sertifikasi Blue Team: Security+, BTL1, SC-200, CySA+'
seoDescription: 'Panduan memilih sertifikasi Blue Team berdasarkan tujuan, budget, dan waktu. Plus planner Python, perbandingan biaya, dan study plan 8 minggu.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-9/00-cover.png'
---

Sertifikasi punya dua fungsi: **lolos filter HR** dan **membuktikan kompetensi**. Yang pertama sering dangkal—tiga huruf di CV—tetapi nyata. Yang kedua baru terasa saat Anda diminta menjelaskan keputusan investigasi, bukan hanya memilih jawaban benar.

Artikel ini adalah **Part 9** dari seri **Blue Team Journey**, masuk ke Phase 7 dari [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap): **Certifications**. Kita akan membandingkan jalur entry, mid, dan advanced, menghitung biaya, lalu membuat **certification planner** dan **study plan** yang bisa dijalankan.

> Harga ujian berubah menurut region, pajak, voucher, dan waktu. Angka di artikel ini adalah estimasi dari roadmap; **selalu verifikasi harga resmi** sebelum membeli.

## Entry-level: membuka pintu

| Sertifikasi | Estimasi biaya | Format | Waktu belajar | Nilai utama |
|---|---:|---|---:|---|
| **CompTIA Security+ (SY0-701)** | $425 | MCQ + PBQ | 4–8 minggu | Paling sering muncul di job posting; baseline vocabulary |
| **Blue Team Level 1 (BTL1)** | ~$495 | 24-hour practical | 8–12 minggu | Bukti hands-on; sering disebut “OSCP-nya Blue Team” |
| **Microsoft SC-200** | $165 | MCQ + case study | 4–6 minggu | Sentinel/KQL; value terbaik untuk cloud/SOC |

Untuk pemula, urutan yang masuk akal:

```text
Security+ → BTL1 (atau SC-200) → pengalaman lab/portfolio
```

Security+ membantu lolos filter awal dan memberi kosakata bersama. BTL1 membuktikan Anda bisa melakukan investigasi dalam waktu terbatas. SC-200 relevan jika target Anda SOC yang memakai Microsoft Sentinel.

## Mid-level: validasi skill

| Sertifikasi | Estimasi biaya | Format | Kapan |
|---|---:|---|---|
| **CompTIA CySA+ (CS0-003)** | $404 | MCQ + PBQ | Setelah Security+ dan beberapa bulan pengalaman |
| **HTB CDSA** | $210–490 | 7-day practical | Setelah 6+ bulan belajar; fokus IR report |
| **Certified CyberDefender (CCD)** | ~$800 | 48-hour practical | Setelah 6+ bulan; DFIR network/disk/memory |

CySA+ memperluas Security+ ke security operations, vulnerability management, dan IR. CDSA menekankan investigasi dan laporan profesional. CCD lebih dalam ke forensics dan threat hunting.

## Advanced: spesialisasi

| Sertifikasi | Estimasi biaya | Format | Catatan |
|---|---:|---|---|
| **BTL2** | ~$2.500 | 72-hour practical | Validasi senior Blue Team |
| **OSDA (OffSec Defense Analyst)** | $999+ | Practical | Brand OffSec |
| **GIAC GCIH** | $8.000–9.000 | MCQ + practical | Incident handling; biasanya sponsor employer |
| **GIAC GCIA** | $8.000–9.000 | MCQ + practical | Intrusion analysis/network |
| **GIAC GCFA/GCFE** | $8.000–9.000 | MCQ + practical | Memory/disk forensics |

GIAC sangat mahal karena biasanya termasuk SANS training. Jangan membeli sendiri sebelum punya employer yang bisa mensponsori; fokus dulu pada pengalaman dan sertifikasi entry/mid.

## Jalur yang masuk akal

![Jalur sertifikasi|Foundation → hands-on → validation → spesialisasi, dengan cabang SOC, DFIR, dan cloud.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-9/01-lab-topology.png)

Kerangka umum:

```text
Security+ (HR filter + baseline)
    ↓
BTL1 (hands-on)  atau  SC-200 (cloud/Sentinel)
    ↓
CySA+ / CDSA / CCD (validasi mid-level)
    ↓
BTL2 / OSDA / GIAC (spesialisasi, biasanya sponsor)
```

Cabang berdasarkan tujuan:

| Tujuan | Jalur awal | Jalur lanjutan |
|---|---|---|
| SOC analyst umum | Security+ → BTL1 | CySA+ → BTL2 |
| Cloud/Sentinel SOC | SC-200 → Security+ | CySA+ → OSDA |
| DFIR | Security+ → BTL1 | CDSA/CCD → GCFA |
| Enterprise/regulated | Security+ → CySA+ | GCIH/GCFA (sponsor) |

Tidak ada jalur yang wajib untuk semua orang. Yang penting: **satu sertifikasi entry yang relevan + lab yang bisa dibuktikan**, bukan mengoleksi semua badge.

## Biaya yang sering terlupakan

- **Retake.** Gagal sekali berarti biaya ujian kedua; sisihkan buffer.
- **Training/bundle.** BTL1 dan CCD sudah termasuk training; GIAC biasanya termasuk SANS.
- **Renewal/CE.** Security+ memakai CEU; SC-200 memiliki renewal tahunan gratis (verifikasi kebijakan terbaru); GIAC memakai CPE.
- **Waktu.** 2–3 jam/hari selama 2–3 bulan adalah biaya oportunitas yang nyata.
- **Perjalanan/online proctoring.** Beberapa ujian memakai proctor online; siapkan kamera dan ruangan.

Cara menekan biaya:

- Voucher resmi, student discount, atau bundle training + exam.
- Employer sponsorship setelah Anda menunjukkan hasil lab/portfolio.
- Mulai dari SC-200 ($165) jika target cloud/Sentinel.
- Gunakan resource gratis: Professor Messer, Microsoft Learn, TryHackMe, CyberDefenders, dan dokumentasi resmi.

## Cara belajar yang efektif

```text
Objectives resmi → materi → lab → practice exam → review kesalahan → ulangi
```

Yang paling sering dilupakan: **lab**. Sertifikasi teori tanpa praktik mudah luntur. Gunakan lab dari seri ini:

| Materi sertifikasi | Lab seri ini |
|---|---|
| Networking, TCP/IP, TLS | Part 1 dan Part 7 |
| Identity, LDAP, AD | Part 2 dan Part 4 |
| SMB, file share | Part 3 |
| Linux, log, permission | Part 5 |
| Scripting, parsing | Part 6 |
| CIA, crypto, access control | Part 7 |
| SIEM, IDS, Sigma, SOAR | Part 8 |

Belajar dengan **spaced repetition**: review catatan di hari ke-1, ke-3, ke-7, dan ke-14. Untuk PBQ, latih skenario, bukan hanya hafal definisi.

## Praktik: certification planner

Script `cert_planner.py` menyimpan katalog sertifikasi, biaya, durasi, level, dan fokus. Ia memilih jalur yang cocok dengan goal, pengalaman, budget, dan waktu.

```python
CERTS = {
    "SECPLUS": {"name": "CompTIA Security+", "cost": 425, "weeks": 8, "level": "entry"},
    "BTL1": {"name": "Blue Team Level 1", "cost": 495, "weeks": 10, "level": "entry"},
    "SC200": {"name": "Microsoft SC-200", "cost": 165, "weeks": 6, "level": "entry"},
    # ...
}
```

Jalankan untuk skenario SOC pemula dengan budget $700 dan 9 bulan:

```bash
python3 cert_planner.py --goal soc --experience beginner \
  --budget 700 --months 9
```

![Planner SOC|Budget $700 memilih Security+ + SC-200 ($590); BTL1 akan melewati budget.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-9/02-planner-soc.png)

Hasilnya masuk budget, tetapi ada trade-off: SC-200 lebih ke cloud/Sentinel, sedangkan BTL1 lebih ke investigasi hands-on. Jika target Anda SOC umum dan Anda bisa menabung, **Security+ + BTL1** adalah kombinasi yang lebih langsung—tetapi totalnya sekitar $920, di atas budget contoh.

Skenario DFIR dengan pengalaman “some”, budget $1.200, 12 bulan:

```bash
python3 cert_planner.py --goal dfir --experience some \
  --budget 1200 --months 12
```

![Planner DFIR|Security+ + BTL1 + CDSA = $1.130 dan 24 minggu, masih dalam budget.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-9/03-planner-dfir.png)

Planner menulis JSON agar bisa dipakai automation:

```json
{
  "goal": "dfir",
  "path": ["SECPLUS", "BTL1", "CDSA"],
  "total_cost": 1130,
  "total_weeks": 24
}
```

Ini contoh kecil **decision automation**: aturan sederhana, data yang transparan, dan output yang bisa diaudit.

## Praktik: study plan 8 minggu

Script `study_plan.py` menghasilkan jadwal mingguan dan CSV:

```bash
python3 study_plan.py SECPLUS
```

![Study plan Security+|Delapan minggu: domain, lab, practice exam, dan review.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-9/04-study-plan.png)

Contoh minggu pertama:

```text
Week 1: Threats, attacks, vulnerabilities
        Professor Messer 1–20; log triage lab
Week 2: Architecture and design
        Network segmentation + TLS lab
```

Jadwal ini bukan aturan kaku. Yang penting:

- Setiap minggu ada **materi + lab + review**.
- Practice exam dilakukan sebelum minggu terakhir, bukan di hari H.
- Minggu terakhir untuk **weak domain**, bukan materi baru.
- Sisakan satu hari buffer untuk hal tak terduga.

## Strategi ujian

### MCQ dan PBQ

- Baca **objectives resmi** dan tandai domain yang lemah.
- Untuk PBQ, baca instruksi sampai selesai; sebagian meminta urutan atau konfigurasi.
- Jangan terjebak satu soal; flag dan lanjut.
- Jawab semua; tidak ada penalti untuk salah (kecuali aturan ujian menyatakan lain).
- Untuk soal skenario, pikirkan **CIA, least privilege, dan risk**—sering membantu memilih jawaban.

### Practical exam (BTL1/CDSA/CCD)

- Latih **report writing**: temuan, bukti, dampak, rekomendasi.
- Simulasikan waktu ujian; 24–72 jam berarti manajemen energi.
- Siapkan tooling dan catatan, tetapi jangan melanggar aturan open/closed book.
- Simpan artefak (PCAP, log, screenshot) dengan rapi.
- Jangan menyalin jawaban orang lain atau memakai exam dump; itu melanggar etika dan bisa membatalkan sertifikasi.

## Sertifikasi vs portfolio

Sertifikasi membuka pintu; portfolio membuat orang percaya. Yang bisa ditunjukkan:

- Writeup lab dari seri ini (network, LDAP, SMB, AD, Linux, scripting, tools).
- Repository GitHub dengan script dan README.
- Blog teknis yang menjelaskan keputusan, bukan hanya langkah.
- Home lab dengan diagram, log, dan hasil investigasi.
- Studi kasus: “alert ini, bukti ini, kesimpulan ini.”

Di CV, tulis dampak: “Membangun lab ELK + Grafana untuk 1.000+ log/hari” lebih kuat daripada “familiar dengan ELK”.

## Kesalahan umum

- **Mengoleksi badge tanpa pengalaman.** Tiga sertifikasi entry tidak menggantikan satu investigasi yang bisa Anda jelaskan.
- **Memakai exam dump.** Melanggar aturan, merusak kredibilitas, dan tidak membuat Anda kompeten.
- **Belajar hanya dari video.** Tanpa lab, konsep seperti Kerberos, ACL, dan Sigma cepat luntur.
- **Membeli GIAC terlalu awal.** Tunggu employer sponsorship atau target peran yang jelas.
- **Mengabaikan renewal.** CEU/CPE dan biaya renewal adalah bagian dari total cost.
- **Menghafal practice exam.** Pola soal berubah; pahami alasan jawabannya.
- **Tidak membaca job posting.** Sertifikasi yang tidak diminta pasar kerja Anda mungkin bukan prioritas.

## Alternatif dan pelengkap

Sertifikasi bukan satu-satunya sinyal. Beberapa alternatif yang sering sama kuatnya:

| Alternatif | Kekuatan |
|---|---|
| TryHackMe SOC Level 1 | Lab terstruktur, murah |
| LetsDefend | Simulasi alert SOC |
| CyberDefenders | DFIR challenge |
| Microsoft Learn | SC-200 gratis |
| Professor Messer | Security+ gratis |
| GitHub + blog | Bukti komunikasi dan dokumentasi |
| Home lab | Bukti inisiatif dan troubleshooting |

Kombinasi terbaik biasanya: **satu sertifikasi entry + satu portfolio lab + kemampuan menjelaskan keputusan**.

## Kapan sertifikasi tidak menjadi prioritas

Jika Anda sudah di dalam tim security dan promosi lebih ditentukan oleh bukti kerja, sertifikasi bisa ditunda. Jika Anda karier switcher tanpa pengalaman, sertifikasi entry + lab biasanya lebih efektif daripada menunggu “siap”. Jika target Anda employer tertentu, baca job posting mereka: beberapa mensyaratkan Security+ atau SC-200 secara eksplisit, beberapa lebih peduli studi kasus.

Yang tidak berubah: **sertifikasi membuka percakapan; kemampuan menutupnya.**

## Checklist Phase 7

- [ ] Memahami perbedaan entry, mid, dan advanced.
- [ ] Memilih satu jalur berdasarkan goal, budget, dan waktu.
- [ ] Memverifikasi harga dan format ujian resmi.
- [ ] Membuat jadwal belajar 8–12 minggu.
- [ ] Menyelesaikan minimal satu lab per domain.
- [ ] Mengambil practice exam sebelum ujian.
- [ ] Menyiapkan strategi PBQ/practical report.
- [ ] Menghindari exam dump dan jalur ilegal.
- [ ] Membangun portfolio yang mendukung sertifikasi.
- [ ] Merencanakan renewal/CE.

## Kesimpulan

Sertifikasi paling berguna saat ia **menutup celah tertentu**: Security+ untuk filter HR, BTL1 untuk bukti hands-on, SC-200 untuk Sentinel, CySA+/CDSA/CCD untuk validasi mid-level, dan GIAC untuk spesialisasi yang biasanya disponsori employer. Mengoleksi semuanya tanpa pengalaman justru melemahkan sinyal.

Di part ini kita membuat planner yang memilih jalur berdasarkan goal, pengalaman, budget, dan waktu, serta study plan 8 minggu yang menghubungkan materi ke lab nyata. Alatnya sederhana, tetapi memaksa keputusan menjadi eksplisit—sesuatu yang jarang dilakukan saat membeli sertifikasi.

Part berikutnya adalah **Hands-On Practice (Phase 8)**: platform latihan, urutan lab, dan cara mengubah latihan menjadi portfolio yang meyakinkan.
