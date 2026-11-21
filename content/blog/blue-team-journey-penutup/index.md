---
title: 'Blue Team Journey - Penutup: Dari Nol ke Blue Team, dan Langkah Setelahnya'
date: '2026-11-21'
template: 'post'
draft: false
slug: 'blue-team-journey-penutup'
category: 'Cybersecurity'
tags:
  - 'Blue Team'
  - 'Career'
  - 'Portfolio'
  - 'Roadmap'
  - 'Cybersecurity'
description: 'Penutup seri Blue Team Journey: rekap 10 bagian, peta karier, rencana 90 hari, portfolio, sertifikasi, dan cara melanjutkan setelah roadmap.'
seoTitle: 'Blue Team Journey Penutup: Langkah Setelah Roadmap'
seoDescription: 'Rekap seri Blue Team Journey, peta karier SOC/DFIR/detection, rencana 90 hari, portfolio, sertifikasi, dan tips mencari peran pertama.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-penutup/00-cover.png'
---

Sepuluh bagian sudah kita lewati: dari paket TCP, LDAP, SMB, Windows/AD, Linux CLI, scripting, security fundamentals, tools, sertifikasi, sampai capstone investigation.

Tapi roadmap bukan garis finis. Justru setelah ini pertanyaan yang lebih penting muncul: **apa yang dilakukan besok?**

Artikel penutup ini merangkum perjalanan, memetakan pilihan karier, dan memberi rencana 90 hari yang bisa langsung dijalankan.

## Rekap sepuluh bagian

![Sepuluh bagian Blue Team Journey|Dari networking sampai capstone, masing-masing dengan lab dan writeup.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-penutup/01-timeline.png)

| Bagian | Topik | Yang dibangun |
|---|---|---|
| [Part 1](/blog/blue-team-journey-part-1) | Networking | OSI, IP/subnet, TCP, DNS, TLS, PCAP |
| [Part 2](/blog/blue-team-journey-part-2) | LDAP | DIT, bind/search, ACL, injection, deteksi log |
| [Part 3](/blog/blue-team-journey-part-3) | SMB | Share, NTLM, signing, IDS, packet capture |
| [Part 4](/blog/blue-team-journey-part-4) | Windows/AD | Kerberos, event log, AD attacks, EVTX |
| [Part 5](/blog/blue-team-journey-part-5) | Linux CLI | Log, process, permission, persistence |
| [Part 6](/blog/blue-team-journey-part-6) | Scripting | Python, regex, API, SQL, Bash |
| [Part 7](/blog/blue-team-journey-part-7) | Security Fundamentals | CIA, crypto/PKI/TLS, ACL, SQLi/XSS, IR |
| [Part 8](/blog/blue-team-journey-part-8) | Blue Team Tools | SIEM, EDR, Suricata, Sigma, YARA, SOAR |
| [Part 9](/blog/blue-team-journey-part-9) | Certifications | Jalur, biaya, study plan |
| [Part 10](/blog/blue-team-journey-part-10) | Hands-On | Platform, writeup, capstone 10/10 |

Benang merahnya:

```text
Network → Identity → Endpoint → Data → Log → Detection → Response
```

Setiap bagian menambah satu lapisan visibilitas. Networking memberi tahu bagaimana data bergerak. LDAP/SMB/AD memberi tahu siapa dan apa yang diakses. Linux/Windows memberi endpoint evidence. Scripting dan tools mengubah evidence menjadi deteksi. Security fundamentals memberi alasan di balik kontrol. Practice mengubah semuanya menjadi kebiasaan.

## Yang seharusnya bisa Anda lakukan sekarang

- Menjelaskan TCP handshake, DNS, TLS, dan membaca PCAP dasar.
- Melakukan bind/search LDAP dan memahami ACL.
- Membaca share SMB, NTLM, signing, dan alert IDS.
- Menjelaskan Kerberos TGT/TGS dan membaca event log penting.
- Melakukan triage Linux: log, proses, socket, permission, persistence.
- Menulis script Python/Bash untuk parsing dan enrichment.
- Menjelaskan CIA, crypto, access control, dan IR.
- Membaca alert Suricata, menulis Sigma/YARA, dan membuat playbook SOAR sederhana.
- Menyelesaikan capstone investigation dan menulis laporan.

Kalau ada yang belum nyaman, tidak apa-apa. Kembali ke satu lab, ulangi, lalu tulis apa yang Anda pahami. Roadmap ini bisa diulang; yang penting bukan kecepatan, tetapi konsistensi.

## Peta karier

| Peran | Fokus utama | Sinyal entry |
|---|---|---|
| **SOC Analyst L1** | Triage alert, SIEM, log | Lab log + Security+/SC-200 |
| **DFIR Analyst** | Forensics, timeline, evidence | BTL1/CDSA/CCD + writeup |
| **Detection Engineer** | Rule, Sigma, query, tuning | GitHub rule + Part 6/8 lab |
| **Cloud Security** | IAM, cloud log, Sentinel | SC-200 + cloud lab |
| **Threat Intel** | IOC, MISP, reporting | TI writeup + OSINT |
| **GRC** | Risk, policy, ISO/NIST | Komunikasi + sertifikasi |

Peran pertama biasanya SOC Analyst L1, IT security, atau detection intern. DFIR dan detection engineering sering menjadi langkah berikutnya setelah pengalaman SOC.

## Rencana 90 hari

![Rencana 90 hari|Build portfolio, practice dan sertifikasi, lalu apply secara terarah.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-penutup/02-90days.png)

### Hari 1–30: build

- Pilih **3 writeup** terbaik dari lab/challenge.
- Rapikan **CV** dan **LinkedIn** dengan bukti dampak.
- Buat **GitHub** berisi script, README, dan diagram.
- Tulis satu studi kasus end-to-end: konteks, evidence, timeline, IOC, keputusan.

### Hari 31–60: practice

- Selesaikan **5 challenge open-ended**.
- Mulai **satu sertifikasi entry** yang relevan.
- Lakukan **mock interview** dan susun story bank.
- Minta feedback dari komunitas atau mentor.

### Hari 61–90: apply

- Lamar **20 peran terarah**, bukan 200 lamaran acak.
- Cari **referral** dan masuk komunitas.
- Iterasi dari rejection: perbaiki CV, story, dan target role.
- Tetap latihan 2–3 sesi per minggu agar skill tidak dingin.

## Portfolio yang meyakinkan

Portfolio bukan galeri screenshot. Ia adalah **bukti berpikir**.

Struktur studi kasus:

```text
Konteks → Evidence → Timeline → IOC → Analisis → Keputusan → Deteksi → Lessons
```

Contoh bullet CV:

- “Membangun lab Docker ELK + Grafana untuk 1.200 request, mem-parsing log Nginx dengan grok, dan membuat dashboard status/latency.”
- “Mendeteksi rantai brute force SSH + webshell dari auth/access log dan menulis laporan insiden.”
- “Menulis rule Sigma dan YARA, lalu mengotomatiskan alert IDS menjadi ticket/blocklist.”
- “Membangun Samba AD DC lab untuk menguji Kerberos, LDAPS, dan ACL least privilege.”

Angka dan hasil membuat bullet lebih kuat daripada daftar tool.

## Sertifikasi: satu yang relevan

Dari [Part 9](/blog/blue-team-journey-part-9): pilih **satu** entry cert yang sesuai target.

- **Security+** — filter HR dan baseline.
- **BTL1** — bukti hands-on.
- **SC-200** — cloud/Sentinel.

Jangan mengoleksi badge sebelum punya pengalaman. Sertifikasi membuka pintu; portfolio yang membuat orang percaya.

## Latihan yang berkelanjutan

Ritme mingguan yang realistis:

| Aktivitas | Frekuensi |
|---|---|
| Materi/teori | 2× per minggu |
| Lab guided | 1× per minggu |
| Challenge open-ended | 1× per minggu |
| Writeup | 1× per minggu |
| Review kesalahan | 1× per minggu |

Platform seperti TryHackMe, BTLO, LetsDefend, CyberDefenders, dan HTB Sherlock membantu, tetapi **writeup** adalah bukti yang tersisa setelah latihan selesai.

## Mencari peran pertama

- **Target role jelas.** “SOC Analyst L1” lebih efektif daripada “apa saja di cybersecurity”.
- **Baca job posting.** Tandai skill yang muncul berulang; pelajari itu dulu.
- **CV ringkas.** Satu halaman untuk junior; fokus pada lab, tools, dan hasil.
- **LinkedIn aktif.** Tulis proyek, bukan hanya gelar.
- **Referral.** Komunitas, alumni, Discord, meetup.
- **Interview story.** Gunakan STAR: Situation, Task, Action, Result.
- **Jujur.** Jangan mengklaim pengalaman produksi jika hanya lab; jelaskan lab dengan detail.

Pertanyaan interview yang sering muncul:

- “Ceritakan investigasi yang pernah Anda lakukan.”
- “Bagaimana Anda memprioritaskan alert?”
- “Apa yang Anda lakukan saat menemukan false positive?”
- “Bagaimana Anda melakukan containment tanpa merusak bukti?”
- “Apa perbedaan IDS dan IPS?”

Jawab dengan pengalaman lab Anda. Itu cukup untuk entry-level jika dijelaskan dengan baik.

## Mindset

- **Konsistensi 1 jam/hari** lebih baik daripada 10 jam sekali seminggu.
- **Kedalaman lebih baik daripada jumlah.** Satu investigasi yang dipahami lebih bernilai daripada sepuluh yang setengah jalan.
- **Etika.** Latihan hanya di lab/platform resmi; jangan menyerang sistem tanpa izin.
- **Istirahat.** Burnout adalah risiko nyata; jadwalkan hari tanpa layar.
- **Komunitas.** Belajar bersama mempercepat; mengajar orang lain memperdalam pemahaman.
- **Dokumentasi.** Jika tidak ditulis, seolah tidak terjadi.

## Checklist penutup

- [ ] Semua lab inti sudah dicoba minimal sekali.
- [ ] Punya 3–5 writeup yang bisa ditunjukkan.
- [ ] CV dan LinkedIn sudah diperbarui.
- [ ] Memilih satu jalur karier dan satu sertifikasi entry.
- [ ] Punya rencana 90 hari yang tertulis.
- [ ] Punya rutinitas latihan mingguan.
- [ ] Tahu etika dan batas legal.
- [ ] Siap memulai aplikasi pertama.

## Kesimpulan

Seri ini dimulai dari pertanyaan sederhana: bagaimana data bergerak, siapa yang mengaksesnya, dan bagaimana kita tahu ketika ada yang salah. Sepuluh bagian kemudian, jawabannya bukan satu tool atau satu sertifikasi, tetapi **rantai keterampilan**: networking, identitas, endpoint, log, scripting, fundamentals, tools, dan latihan.

Roadmap ini selesai di halaman, tetapi tidak di karier Anda. Mulai dari satu lab, satu writeup, dan satu lamaran. Ulangi. Perbaiki. Dokumentasikan.

Sertifikat membuka pintu. Lab membuat orang percaya. Writeup membuat Anda diingat.

Selamat melanjutkan perjalanan Blue Team.
