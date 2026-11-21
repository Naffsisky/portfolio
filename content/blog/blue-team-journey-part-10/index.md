---
title: 'Blue Team Journey - Part 10: Hands-On Practice dan Capstone Investigation'
date: '2026-11-21'
template: 'post'
draft: false
slug: 'blue-team-journey-part-10'
category: 'Cybersecurity'
tags:
  - 'Hands-On'
  - 'SOC'
  - 'DFIR'
  - 'TryHackMe'
  - 'CyberDefenders'
  - 'Blue Team'
  - 'Career'
  - 'Cybersecurity'
description: 'Panduan latihan Blue Team: platform, alur belajar, writeup, dan capstone investigation dengan evidence pack serta answer checker di Docker.'
seoTitle: 'Hands-On Practice Blue Team: Platform, Writeup, Capstone'
seoDescription: 'Latihan Blue Team dari guided ke open-ended: TryHackMe, BTLO, LetsDefend, CyberDefenders, HTB, plus capstone SOC challenge dan checker.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-10/00-cover.png'
---

Membaca tentang security tidak sama dengan bisa melakukannya. Di SOC, Anda tidak diberi pilihan jawaban; Anda diberi alert, log, dan waktu. Phase 8 dari [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap) adalah tentang **hands-on practice**: mengubah teori menjadi kebiasaan.

Artikel ini adalah **Part 10** dari seri **Blue Team Journey**. Kita akan membahas platform latihan, alur belajar, cara menulis writeup, lalu membangun **capstone investigation** sendiri: evidence pack, 10 pertanyaan, dan answer checker otomatis di Docker.

## Platform latihan

| Platform | Isi | Biaya | Cocok untuk |
|---|---|---|---|
| **TryHackMe** | Lab browser, SOC L1/L2 path, 40+ defensive room | Free + ~$14/bulan | Pemula |
| **Blue Team Labs Online** | 250+ investigasi, BTJA pathway gratis | Free tier | Intro Blue Team |
| **LetsDefend** | Simulasi SOC, alert queue, Elastic SIEM | Free tier | Workflow SOC |
| **CyberDefenders** | Blue Team CTF, 15+ kategori | Free tier | Intermediate |
| **Hack The Box** | 100+ Sherlock, Academy SOC path | ~$8/bulan (student) | Advanced/CDSA |
| **Splunk BOTS** | CTF SPL gratis | Free | Query SIEM |
| **KC7** | Game KQL | Free | Detection/KQL |
| **Malware Traffic Analysis** | PCAP malware nyata | Free | Network forensics |
| **OpenSOC** | Kompetisi Blue Team | Free | Team practice |
| **SANS Holiday Hack** | Challenge tahunan | Free | DFIR/CTF |

Harga dan isi platform berubah; verifikasi sebelum berlangganan. Yang penting bukan platform mana yang “terbaik”, tetapi **apakah Anda menyelesaikan investigasi dan menulis hasilnya**.

## Alur belajar

![Jalur latihan|Dari Pre-Security dan BTJA, SOC Level 1, LetsDefend, sampai challenge open-ended.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-10/01-lab-topology.png)

```text
1. TryHackMe Pre-Security        → networking, Linux, web dasar
2. BTLO BTJA                     → pengenalan Blue Team (6–7 jam)
3. TryHackMe SOC Level 1         → alert triage, SIEM, IR (50–80 jam)
4. LetsDefend                    → simulasi antrean alert SOC
5. CyberDefenders + HTB Sherlock → investigasi open-ended
6. TryHackMe SOC Level 2         → investigasi lanjutan
```

Aturan praktis:

- **Jangan lompat ke challenge open-ended sebelum baseline.** Networking, Linux, dan log dasar dulu.
- **Satu challenge selesai lebih baik daripada lima challenge setengah jalan.**
- **Tulis writeup** setelah setiap challenge; ini yang membedakan “pernah lihat” dari “bisa jelaskan”.

## Deliberate practice

Latihan yang efektif punya empat elemen:

1. **Target spesifik** — misalnya “menemukan initial access dalam 30 menit”.
2. **Timebox** — 60–90 menit per sesi, lalu review.
3. **Catatan** — command, temuan, hipotesis, kesalahan.
4. **Umpan balik** — answer key, writeup orang lain, atau review komunitas.

Hindari **tutorial hell**: menonton walkthrough tanpa mencoba sendiri. Tonton setelah mencoba, bukan sebelum.

Pertanyaan yang bagus setelah setiap challenge:

- Bukti apa yang pertama kali mengarah ke jawaban?
- Hipotesis apa yang salah, dan mengapa?
- Telemetri apa yang tidak tersedia?
- Deteksi apa yang bisa mencegah/mendeteksi lebih cepat?

## Menulis writeup yang berguna

Template:

```text
# Judul challenge
## Skenario
## Evidence yang diberikan
## Timeline
## IOC
## Analisis
## Containment/rekomendasi
## Detection opportunity
## Lessons learned
```

Writeup yang baik bukan sekadar “jawabannya adalah X”. Ia menunjukkan **proses**: bukti mana yang dipakai, hipotesis apa yang gugur, dan keputusan apa yang diambil.

Untuk portfolio, 3–5 writeup mendalam lebih kuat daripada 50 screenshot tanpa konteks. Publikasikan di blog, GitHub, atau Notion; sertakan diagram dan IOC (defanged).

## Capstone: mini SOC investigation

Lab ini membuat challenge yang bisa dinilai sendiri:

- `/evidence` — auth log, access log, EVE JSON, cron, SSH key, process/socket snapshot, IOC.
- `/challenge` — pertanyaan, kunci jawaban, dan `check_answers.py`.

Dockerfile ringkas:

```dockerfile
FROM ubuntu:24.04
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 jq grep \
 && rm -rf /var/lib/apt/lists/*
COPY evidence /evidence
COPY challenge /challenge
WORKDIR /challenge
CMD ["sleep", "infinity"]
```

Jalankan:

```bash
docker build -t practice-lab:1.0 ./image
docker run -d --name practice-client practice-lab:1.0
docker exec -it practice-client bash
```

Skenario: web server dikompromikan. Ada brute force SSH, scanning web, webshell, listener, cron persistence, dan SSH key backdoor.

### Triage

```bash
grep -c "Failed password" /evidence/auth.log

grep "Failed password" /evidence/auth.log \
  | grep -oE 'from [0-9.]+' | awk '{print $2}' \
  | sort | uniq -c | sort -rn | head

grep "Accepted" /evidence/auth.log

awk '$9 == 404 {print $7}' /evidence/access.log \
  | sort | uniq -c | sort -rn

jq -r 'select(.event_type=="alert") \
  | [.src_ip,.alert.signature,.alert.severity] | @tsv' /evidence/eve.json
```

![Triage evidence|Failed SSH, login berhasil, path 404, alert Suricata, cron, proses socat, dan SSH key backdoor.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-10/02-triage.png)

Temuan awal:

- **203.0.113.50** mendominasi failed SSH (5) dan juga merupakan IP C2 di cron/IOC.
- **analyst** berhasil login setelah rangkaian kegagalan.
- **`/.env`** paling sering 404 (5), pola scanning.
- **`/uploads/shell.php`** di-upload dan diakses dengan `?cmd=`.
- **`socat`** membuka port **4444**—shell listener.
- **`/etc/cron.d/system-update`** menjalankan `curl ... | bash`.
- **`authorized_keys`** berisi komentar `attacker@lab`.
- **`/tmp/world-writable.txt`** world-writable.

### Checker

Jawaban dikumpulkan di `submission.json`:

```json
{
  "attacker_ip": "203.0.113.50",
  "compromised_user": "analyst",
  "top_404_path": "/.env",
  "webshell": "/uploads/shell.php",
  "c2_ip": "203.0.113.50",
  "listener_port": "4444",
  "listener_process": "socat",
  "persistence_file": "/etc/cron.d/system-update",
  "backdoor_key_comment": "attacker@lab",
  "world_writable_file": "/tmp/world-writable.txt"
}
```

Checker membandingkan jawaban, memberi skor, dan menulis report:

```bash
python3 /challenge/check_answers.py /challenge/submission.json
```

![Skor 7/10|Jawaban salah tetap diberi feedback per pertanyaan; report JSON menyimpan hasil.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-10/03-score-partial.png)

Setelah memperbaiki tiga jawaban yang salah:

![Skor 10/10|Semua pertanyaan benar; checker menulis result.json untuk dokumentasi.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-10/04-score-perfect.png)

Checker bukan pengganti analis. Ia hanya memastikan jawaban konsisten dan memberi struktur latihan. Di dunia nyata, jawaban tidak selalu biner; yang dinilai adalah **kualitas bukti dan keputusan**.

## Latihan rutin

Contoh ritme mingguan:

| Hari | Aktivitas |
|---|---|
| Senin | 60 menit materi (satu domain) |
| Selasa | 90 menit lab guided |
| Rabu | 60 menit challenge + notes |
| Kamis | 90 menit open-ended challenge |
| Jumat | Tulis writeup + review kesalahan |
| Sabtu | Practice exam / CTF |
| Minggu | Istirahat atau review ringan |

Metrik yang lebih berguna daripada “jumlah jam”:

- Challenge selesai per bulan.
- Writeup dipublikasikan.
- Waktu dari alert ke hipotesis pertama.
- Jumlah false positive yang berhasil dijelaskan.
- Deteksi baru yang diuji.

## Memilih challenge

Gunakan urutan kesulitan:

1. **Guided** — ada hint dan walkthrough; fokus memahami alur.
2. **Semi-guided** — ada pertanyaan, tanpa langkah detail.
3. **Open-ended** — hanya evidence dan tujuan; Anda menentukan sendiri.

Jika stuck lebih dari 30 menit, catat hipotesis lalu buka hint. Jangan langsung menonton walkthrough; Anda kehilangan bagian paling berharga—proses berpikir.

## Kesalahan umum

- **Langsung ke challenge hard** tanpa baseline networking/Linux.
- **Menonton walkthrough sebelum mencoba**, lalu merasa “sudah bisa”.
- **Tidak menulis catatan**, sehingga tidak bisa mengulang atau menjelaskan.
- **Hanya mengejar flag**, bukan memahami bukti dan dampak.
- **Mengabaikan false positive**; di SOC, menjelaskan false positive sama pentingnya dengan menemukan true positive.
- **Membagikan flag/jawaban** challenge orang lain; itu merusak etika dan pembelajaran.
- **Menguji sistem nyata tanpa izin**; semua latihan harus di lab atau platform resmi.

## Rencana 8 minggu

| Minggu | Fokus | Output |
|---:|---|---|
| 1 | Networking + Linux dasar | Catatan command dan diagram |
| 2 | Log dan SIEM dasar | Triage 1 auth log |
| 3 | Web/network scanning | Analisis access log + PCAP |
| 4 | Windows/AD dasar | Analisis EVTX sample |
| 5 | Guided challenge | Writeup pertama |
| 6 | Semi-guided challenge | Writeup kedua + IOC |
| 7 | Open-ended challenge | Timeline + laporan |
| 8 | Capstone + review | Skor 10/10 + lessons learned |

Sesuaikan dengan waktu Anda; yang penting konsisten 3–5 sesi per minggu.

## Etika dan batasan

- Gunakan hanya lab, platform latihan, atau sistem yang Anda miliki/izin tertulis.
- Jangan menyerang infrastruktur publik, termasuk untuk “latihan”.
- Jangan mengunggah data pelanggan atau bukti sensitif ke platform publik.
- Defang IOC sebelum dibagikan; jangan sebarkan malware aktif.
- Hormati aturan platform: jangan sharing flag, jangan menyalin writeup orang lain.

## Dari challenge ke portfolio

Setelah 5–10 challenge, pilih 3–5 yang paling kuat:

- Satu network/PCAP investigation.
- Satu Windows/AD/EVTX investigation.
- Satu web/log investigation.
- Satu malware/forensics (jika tersedia).
- Satu capstone end-to-end.

Untuk setiap studi kasus, sertakan:

```text
Konteks → Evidence → Timeline → IOC → Analisis → Keputusan → Deteksi → Lessons
```

Itulah yang dilihat interviewer: bukan berapa banyak challenge, tetapi bagaimana Anda berpikir.

## Checklist Phase 8

- [ ] Menyelesaikan TryHackMe Pre-Security.
- [ ] Menyelesaikan BTLO BTJA.
- [ ] Menyelesaikan TryHackMe SOC Level 1 (minimal 50%).
- [ ] Berlatih alert triage di LetsDefend.
- [ ] Menyelesaikan minimal 5 CyberDefenders challenges.
- [ ] Menyelesaikan minimal 5 HTB Sherlocks.
- [ ] Berlatih SPL di Splunk BOTS atau KQL di KC7.
- [ ] Menulis writeup untuk setiap challenge.
- [ ] Menyelesaikan capstone 10/10.
- [ ] Menyimpan evidence dan report dengan rapi.

## Kesimpulan

Hands-on practice mengubah pengetahuan menjadi kemampuan. Platform membantu menyediakan lingkungan, tetapi yang menentukan adalah **cara berlatih**: target jelas, timebox, catatan, dan writeup. Tanpa writeup, pengalaman sulit dibuktikan; tanpa latihan open-ended, kemampuan hanya setara tutorial.

Di part ini kita membangun capstone mini SOC: evidence pack, 10 pertanyaan, checker otomatis, dan writeup. Pola ini bisa diperluas menjadi challenge sendiri—tambahkan PCAP, memory dump, atau EVTX, lalu buat pertanyaan yang memaksa analisis, bukan hafalan.

Seri ini ditutup dengan [Penutup: Dari Nol ke Blue Team, dan Langkah Setelahnya](/blog/blue-team-journey-penutup), yang merangkum perjalanan, memetakan karier, dan memberi rencana 90 hari.
