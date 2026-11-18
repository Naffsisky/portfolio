---
title: 'Blue Team Journey - Part 3: SMB - Cara Kerja, Share, dan Deteksi Akses File'
date: '2026-11-18'
template: 'post'
draft: false
slug: 'blue-team-journey-part-3'
category: 'Cybersecurity'
tags:
  - 'SMB'
  - 'Samba'
  - 'File Sharing'
  - 'NTLM'
  - 'Blue Team'
  - 'Docker'
  - 'Cybersecurity'
description: 'Panduan SMB untuk defender: dialect SMB2/SMB3, NTLM, share dan ACL, signing, packet capture, log autentikasi, serta deteksi akses file mencurigakan, dipraktikkan dengan Samba di Docker.'
seoTitle: 'SMB untuk Blue Team: Cara Kerja, Share, dan Deteksi'
seoDescription: 'Belajar SMB dari nol: setup Samba di Docker, enumerasi share, autentikasi NTLM, ACL, signing, capture SMB2 dengan tshark, dan deteksi dari log.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/00-cover.png'
---

Setelah networking dan LDAP, protokol berikutnya yang hampir selalu muncul di investigasi adalah **SMB (Server Message Block)**. Di kantor, SMB adalah cara user membuka folder bersama. Di sisi attacker, SMB adalah jalan untuk enumerasi, brute force, relay, lateral movement, dan exfiltration. Di sisi defender, SMB menghasilkan log akses file yang sangat kaya—kalau kita tahu cara membacanya.

Artikel ini adalah **Part 3** dari seri **Blue Team Journey**. Kita akan membangun file server Samba di Docker, membuat dua share dengan hak akses berbeda, lalu mempraktikkan enumerasi, autentikasi, transfer file, pemeriksaan signing, packet capture, dan analisis log.

## Apa itu SMB

SMB adalah protokol client-server untuk berbagi file, printer, dan named pipe. Client membuka **share** di server, lalu melakukan operasi file seperti membuat, membaca, menulis, dan menghapus.

Alamat share memakai format UNC:

```text
\\server\share\path\file.txt
```

Di lab ini:

```text
\\172.30.0.10\public\laporan.txt
\\172.30.0.10\finance\rahasia.txt
```

Port yang perlu dikenal:

| Port | Protokol | Catatan |
|---:|---|---|
| `445/TCP` | SMB langsung | Port utama SMB2/SMB3 modern |
| `139/TCP` | NetBIOS Session Service | Legacy, sering dipakai SMB1 |
| `137/UDP` | NetBIOS Name Service | Resolusi nama legacy |
| `138/UDP` | NetBIOS Datagram | Datagram legacy |
| `443/UDP` | SMB over QUIC | Windows Server 2022+ |

SMB1 sering digambarkan sebagai protokol yang “berisik”: banyak round-trip, bergantung pada NetBIOS, dan punya sejarah kerentanan serius. SMB2 dan SMB3 jauh lebih efisien, tetapi bukan berarti otomatis aman.

## Versi SMB dan relevansi keamanannya

| Versi | Muncul di | Fitur utama | Catatan keamanan |
|---|---|---|---|
| SMB1 | Windows lama | NetBIOS, RAP | EternalBlue/MS17-010, WannaCry |
| SMB2 | Vista/2008 | Lebih efisien, compounding | Masih tanpa enkripsi |
| SMB2.1 | Windows 7/2008 R2 | Oplock, large MTU | Umum di perangkat lama |
| SMB3.0 | Windows 8/2012 | Encryption, multichannel | AES-CCM |
| SMB3.0.2 | Windows 8.1/2012 R2 | Scale-out, SMB Direct | Perbaikan performa |
| SMB3.1.1 | Windows 10/2016 | Preauth integrity, AES-GCM | Pilihan terbaik saat ini |
| SMB over QUIC | Windows Server 2022+ | SMB lewat QUIC/UDP 443 | Cocok untuk akses remote |

Dua kerentanan yang wajib dikenal defender:

- **MS17-010 / EternalBlue** — eksploit SMB1 yang dipakai WannaCry dan NotPetya untuk menyebar. Mitigasi utama: patch dan matikan SMB1.
- **CVE-2020-0796 / SMBGhost** — kerentanan pada kompresi SMB3 di Windows 10 1903/1909. Mitigasi: patch dan batasi akses 445.

Kerentanan lama bukan alasan untuk mengabaikan SMB2/3. SMB modern tetap bisa menjadi target **NTLM relay**, **password spraying**, **share enumeration**, dan **lateral movement** lewat admin share.

## Cara kerja SMB

Satu sesi SMB kira-kira melewati empat tahap:

```text
1. Negotiate      → client dan server menyepakati dialect + kapabilitas
2. Session setup  → autentikasi (NTLM/Kerberos), signing/encryption
3. Tree connect   → client membuka \\server\share
4. File operation → create, read, write, query directory, close
```

Di SMB2, operasi direpresentasikan sebagai command:

| Command | Nilai | Fungsi |
|---|---:|---|
| `NEGOTIATE` | 0 | Pilih dialect dan kapabilitas |
| `SESSION_SETUP` | 1 | Autentikasi |
| `TREE_CONNECT` | 3 | Buka share |
| `CREATE` | 5 | Buka/buat file |
| `CLOSE` | 6 | Tutup handle |
| `READ` | 8 | Baca file |
| `WRITE` | 9 | Tulis file |
| `IOCTL` | 11 | Kontrol khusus, termasuk DFS |
| `QUERY_DIRECTORY` | 14 | List direktori |
| `QUERY_INFO` | 16 | Ambil metadata |

### Autentikasi: NTLM dan Kerberos

Di lingkungan Windows/AD, SMB biasanya memakai **Kerberos** untuk domain user. Di lab workgroup, SMB memakai **NTLMv2**:

1. Client mengirim `NEGOTIATE` (NTLMSSP type 1).
2. Server membalas `CHALLENGE` (type 2) berisi challenge acak.
3. Client mengirim `AUTHENTICATE` (type 3) berisi respons yang dihitung dari password hash dan challenge.

Password tidak dikirim secara langsung. Namun, respons NTLM bisa direlay oleh penyerang ke layanan lain jika target menerima NTLM dan tidak mewajibkan signing/encryption. Inilah dasar **NTLM relay**.

### Signing dan encryption

Dua konsep yang sering tertukar:

- **SMB signing** — menjamin integritas dan autentikasi paket. Tidak menyembunyikan isi file.
- **SMB encryption** — menyembunyikan isi dan metadata SMB3, termasuk nama file, dari capture jaringan.

Lab ini memakai `server signing = mandatory`, tetapi enkripsi dimatikan agar isi SMB terlihat di packet capture. Di produksi, aktifkan enkripsi untuk share sensitif.

### Share, permission, dan admin share

SMB punya dua lapisan izin:

1. **Share permission** — siapa yang boleh connect ke share.
2. **Filesystem permission** — siapa yang boleh membaca/menulis file di dalamnya.

Yang berlaku adalah yang paling ketat. Di Samba, `valid users` membatasi share; permission Unix membatasi file. Di Windows, share ACL bertemu NTFS ACL.

Share bawaan yang sering muncul di Windows:

| Share | Fungsi | Risiko |
|---|---|---|
| `C$` | Root drive C | Lateral movement, akses file sistem |
| `ADMIN$` | Folder Windows | Remote admin, service creation |
| `IPC$` | Named pipe/RPC | Enumerasi, SAMR, remote management |
| `SYSVOL` | Group Policy | Reconnaissance AD |

Akses ke admin share oleh user biasa atau dari host yang tidak biasa adalah sinyal yang layak diselidiki.

## SMB dari sisi attacker dan defender

Skenario yang sering muncul:

| Skenario | Yang dilakukan attacker | Bukti yang ditinggalkan |
|---|---|---|
| Share enumeration | List share dan file | Log akses share, pola query |
| Brute force | Tebak password user | 4625, `NT_STATUS_WRONG_PASSWORD` |
| Password spraying | Satu password ke banyak user | 4625 tersebar, lalu 4624 |
| NTLM relay | Relay autentikasi ke SMB/LDAP | NTLMSSP, 4624 type 3, signing lemah |
| Lateral movement | Akses `C$`/`ADMIN$`, buat service | 5140/5145, 7045, 4688 |
| Ransomware | Enkripsi file di share | Mass file write/rename, canary file |
| Exfiltration | Baca banyak file | Volume read besar, akses di luar jam kerja |

Defender tidak perlu melihat isi setiap file. Yang penting adalah **pola**: siapa, dari host mana, ke share apa, kapan, berapa banyak, dan apakah berhasil.

## Lab: Samba di Docker

Lab terdiri dari satu server Samba dan satu client di network terisolasi. Image berisi `smbclient`, `tcpdump`, `tshark`, dan `nmap`.

### Dockerfile

```dockerfile
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN echo "wireshark-common/install-setuid boolean false" | debconf-set-selections \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      samba samba-common-bin smbclient tcpdump tshark nmap iproute2 netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

COPY smb.conf /etc/samba/smb.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
 && mkdir -p /srv/samba/public /srv/samba/finance

EXPOSE 445
ENTRYPOINT ["/entrypoint.sh"]
```

### smb.conf

```ini
[global]
   workgroup = WORKGROUP
   server string = SMB Lab
   security = user
   map to guest = Bad User
   server min protocol = SMB2
   server signing = mandatory
   smb encrypt = off
   log file = /var/log/samba/log.%m
   log level = 2
   max log size = 1000
   load printers = no
   printing = bsd
   printcap name = /dev/null
   disable spoolss = yes

[public]
   path = /srv/samba/public
   browseable = yes
   read only = no
   valid users = alice, bob

[finance]
   path = /srv/samba/finance
   browseable = yes
   read only = no
   valid users = alice
```

Penjelasan:

- **`server min protocol = SMB2`** mematikan SMB1.
- **`server signing = mandatory`** mewajibkan signing.
- **`smb encrypt = off`** hanya untuk lab agar capture bisa dibaca. Di produksi gunakan `desired` atau `required` untuk data sensitif.
- **`valid users`** adalah share-level ACL sederhana.
- **`map to guest = Bad User`** memetakan user tak dikenal ke guest, tetapi `guest ok` tidak diaktifkan; akses tetap ditolak.

### entrypoint.sh

```sh
#!/bin/sh
set -e

useradd -M -s /usr/sbin/nologin alice 2>/dev/null || true
useradd -M -s /usr/sbin/nologin bob 2>/dev/null || true

(echo "${ALICE_PASS:-AlicePass123!}"; echo "${ALICE_PASS:-AlicePass123!}") | smbpasswd -a -s alice
(echo "${BOB_PASS:-BobPass123!}"; echo "${BOB_PASS:-BobPass123!}") | smbpasswd -a -s bob
smbpasswd -e alice
smbpasswd -e bob

chmod 0777 /srv/samba/public /srv/samba/finance
exec smbd --foreground --no-process-group --debug-stdout
```

### Menjalankan

```bash
docker network create --subnet=172.30.0.0/24 smb-lab

docker build -t smb-lab:1.5 ./image

docker run -d --name smb-server \
  --network smb-lab --ip 172.30.0.10 \
  -p 4450:445 \
  -e ALICE_PASS='AlicePass123!' \
  -e BOB_PASS='BobPass123!' \
  -v "$PWD/shares/public:/srv/samba/public" \
  -v "$PWD/shares/finance:/srv/samba/finance" \
  smb-lab:1.5

docker run -d --name smb-client \
  --network smb-lab --ip 172.30.0.20 \
  --cap-add=NET_RAW --cap-add=NET_ADMIN \
  --entrypoint sleep \
  -v "$PWD/fixtures:/fixtures" \
  smb-lab:1.5 infinity
```

![Topologi lab SMB|Client dan server Samba di network terisolasi; public untuk alice/bob, finance hanya alice.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/01-lab-topology.png)

> Port host `4450` dipakai agar tidak bentrok dengan SMB di host. Di dalam network lab, client tetap memakai port `445`.

## Praktik 1: enumerasi share

Dari container client:

```bash
smbclient -L //172.30.0.10 -N
smbclient -L //172.30.0.10 -U 'alice%AlicePass123!'
```

![Enumerasi share secara anonymous|Nama share public, finance, dan IPC$ terlihat tanpa login, meskipun akses ke share tetap ditolak.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/02-enumeration.png)

Hasilnya penting: **nama share bisa terlihat tanpa autentikasi**, tetapi bukan berarti isinya bisa diakses. Ini perbedaan antara **share enumeration** dan **share access**. Banyak organisasi menganggap “guest disabled” berarti tidak ada informasi yang bocor, padahal nama share dan IPC$ masih bisa memperlihatkan struktur layanan.

## Praktik 2: autentikasi dan ACL

```bash
smbclient //172.30.0.10/public -N -c 'ls'
smbclient //172.30.0.10/public -U 'alice%AlicePass123!' -c 'ls'
smbclient //172.30.0.10/finance -U 'bob%BobPass123!' -c 'ls'
smbclient //172.30.0.10/finance -U 'alice%AlicePass123!' -c 'ls'
```

![ACL share public dan finance|Anonymous dan Bob ditolak; Alice bisa membuka public dan finance.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/03-access.png)

Yang terlihat:

- `public` memakai `valid users = alice, bob`, jadi Bob bisa akses.
- `finance` hanya mengizinkan Alice, jadi Bob mendapat `NT_STATUS_ACCESS_DENIED`.
- Anonymous ditolak di kedua share.

`NT_STATUS_ACCESS_DENIED` berbeda dari `NT_STATUS_LOGON_FAILURE`. Yang pertama berarti autentikasi mungkin berhasil, tetapi otorisasi gagal; yang kedua berarti kredensial salah. Membedakan keduanya penting saat membaca log.

## Praktik 3: transfer file

```bash
smbclient //172.30.0.10/public -U 'alice%AlicePass123!' \
  -c 'put /fixtures/laporan.txt laporan-upload.txt; ls; get laporan-upload.txt /tmp/downloaded.txt'

cat /tmp/downloaded.txt
```

![Upload dan download lewat SMB|File di-upload, ditampilkan di direktori, lalu di-download kembali dan isinya cocok.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/04-transfer.png)

Dari sudut defender, operasi ini menghasilkan jejak:

- **SMB create/write** untuk upload.
- **SMB read** untuk download.
- **Share access** dan file access di log server.
- **Network flow** dengan volume data.

Kalau share berisi data sensitif, pola “banyak file dibaca dalam waktu singkat” atau “download di luar jam kerja” lebih penting daripada satu file tunggal.

## Praktik 4: posture SMB

```bash
nmap -p445 --script smb-protocols,smb2-security-mode 172.30.0.10
```

![Posture SMB|Dialect 2.1 sampai 3.1.1 terdeteksi; SMB signing enabled and required.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/05-nmap.png)

Hasil lab:

- SMB1 tidak muncul di daftar dialect.
- SMB2.1, 3.0, 3.0.2, dan 3.1.1 tersedia.
- Signing **enabled and required**.

Di environment nyata, temuan seperti ini harus masuk inventory:

- Apakah SMB1 masih aktif di server lama?
- Apakah signing required di semua server?
- Apakah share sensitif memakai SMB3 encryption?
- Apakah port 445 terbuka dari network yang tidak seharusnya?

## Praktik 5: membaca traffic SMB

Capture dilakukan di client:

```bash
tcpdump -i eth0 -nn -s0 -w /tmp/public.pcap 'tcp port 445' &
smbclient //172.30.0.10/public -U 'alice%AlicePass123!' \
  -c 'ls; put /fixtures/laporan.txt laporan-new.txt; ls'
kill -INT %1
```

Lalu baca dengan `tshark`:

```bash
tshark -r /tmp/public.pcap -Y 'smb2.filename' \
  -T fields -e smb2.cmd -e smb2.filename -e smb2.nt_status

tshark -r /tmp/public.pcap -Y 'ntlmssp' \
  -T fields -e ntlmssp.messagetype -e ntlmssp.auth.username -e ntlmssp.challenge.target_name
```

![Capture SMB2 dan NTLMSSP|Nama file terlihat pada SMB2 CREATE/QUERY_DIRECTORY; NTLMSSP menunjukkan username alice.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/06-capture.png)

Yang bisa dibaca:

- **Command 5** adalah `CREATE` (membuka file).
- **Command 14** adalah `QUERY_DIRECTORY` (listing).
- **`smb2.filename`** memperlihatkan nama file yang diakses.
- **NTLMSSP type 1/2/3** menunjukkan negotiate, challenge, dan authenticate.
- **`ntlmssp.auth.username`** menunjukkan user yang mencoba login.

Ini terjadi karena enkripsi SMB dimatikan di lab. Kalau SMB3 encryption aktif, isi dan nama file tidak akan terlihat; yang tersisa adalah metadata koneksi, volume, dan timing. Karena itu, defender tidak bisa hanya mengandalkan PCAP: log server dan EDR tetap diperlukan.

> **Catatan:** capture hanya boleh dilakukan pada network dan sistem yang Anda miliki atau yang memberi izin. Jangan menangkap traffic pengguna tanpa dasar hukum dan kebijakan yang jelas.

## Praktik 6: log dan deteksi

Samba mencatat autentikasi dan akses share. Contoh setelah tiga password salah dan satu login benar:

```bash
docker logs smb-server 2>&1 | grep -E 'Auth:|connect to service' | tail -4
```

![Log autentikasi SMB|Tiga percobaan NT_STATUS_WRONG_PASSWORD dari alice, lalu koneksi berhasil ke share public.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-3/07-logs.png)

Pola yang terlihat:

- `NT_STATUS_WRONG_PASSWORD` berulang dari satu user dan satu IP.
- Setelah beberapa percobaan, ada `connect to service public ... as user alice`.

Di Windows, padanan event log yang perlu dikumpulkan:

| Event ID | Arti | Relevansi |
|---:|---|---|
| `4624` | Logon berhasil | Logon type 3 = network logon |
| `4625` | Logon gagal | Brute force, spraying |
| `4776` | NTLM credential validation | Autentikasi NTLM ke DC |
| `4768` | Kerberos TGT | Autentikasi domain |
| `4769` | Kerberos service ticket | Akses service, termasuk SMB |
| `5140` | Network share accessed | Share apa yang dibuka |
| `5145` | Detailed file share access | File/pipe yang diakses |
| `7045` | Service installed | Sering muncul pada lateral movement |
| `4688` | Process creation | Proses yang memicu akses SMB |

Skenario deteksi:

| Skenario | Indikator |
|---|---|
| Brute force | Banyak `4625`/`WRONG_PASSWORD` untuk satu user/IP |
| Password spraying | Sedikit percobaan untuk banyak user |
| Share enumeration | Banyak query share/file dari satu host |
| Admin share access | `5140` ke `C$`/`ADMIN$` oleh user non-admin |
| Ransomware | Mass file write/rename, canary file terpicu |
| Exfiltration | Volume read besar, akses di luar jam kerja |
| NTLM relay | NTLM type 3 dari host tak biasa, signing lemah |

## Hardening SMB

### Windows

```powershell
# Matikan SMB1
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force

# Wajibkan signing
Set-SmbServerConfiguration -RequireSecuritySignature $true -Force
Set-SmbClientConfiguration -RequireSecuritySignature $true -Force

# Cek status
Get-SmbServerConfiguration | Select EnableSMB1Protocol,RequireSecuritySignature
Get-SmbServerConfiguration | Select EnableSMB2Protocol
```

Untuk data sensitif, aktifkan SMB encryption:

```powershell
Set-SmbShare -Name "Finance" -EncryptData $true -Force
```

### Samba

```ini
[global]
   server min protocol = SMB3_00
   server signing = mandatory
   smb encrypt = required
   restrict anonymous = 2
   map to guest = Never
```

### Kontrol lainnya

- [ ] Blokir port 445 di perimeter; jangan biarkan SMB keluar ke internet.
- [ ] Segmentasikan share sensitif dari workstation umum.
- [ ] Terapkan least privilege pada share dan filesystem.
- [ ] Hapus atau batasi admin share jika tidak diperlukan.
- [ ] Nonaktifkan NTLMv1; prioritaskan Kerberos.
- [ ] Patch server dan endpoint; SMB1/SMBGhost/EternalBlue.
- [ ] Pantau 4625, 5140, 5145, 7045, dan log Samba.
- [ ] Gunakan canary file di share sensitif.
- [ ] Uji backup dan restore, bukan hanya backup.
- [ ] Review share permission secara berkala.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `NT_STATUS_ACCESS_DENIED` | User tidak ada di `valid users` atau ACL filesystem | Cek `testparm -s`, permission direktori |
| `NT_STATUS_LOGON_FAILURE` | Password salah atau user SMB belum dibuat | Cek `smbpasswd -a`, log auth |
| Share tidak muncul | `browseable = no` atau akses ditolak | Cek konfigurasi share |
| `SMB1 disabled` | Client memakai SMB1 | Paksa client ke SMB2/3 |
| Signing mismatch | Server/client signing tidak cocok | Samakan `server signing` dan client |
| Capture tidak menampilkan nama file | SMB3 encryption aktif | Matikan enkripsi untuk lab, atau analisis metadata |
| Nmap tidak menemukan script | Paket nmap tidak lengkap | Pastikan `nmap` dan script tersedia |
| Container tidak bisa mount share | Network atau port salah | Cek `nc -zv server 445`, DNS/IP |

## Checklist praktik

- [ ] Bisa menjelaskan SMB2/SMB3 dan port 445.
- [ ] Bisa membedakan share permission dan filesystem permission.
- [ ] Bisa melakukan enumerasi share anonymous dan menjelaskan batasannya.
- [ ] Bisa melakukan autentikasi NTLM dengan `smbclient`.
- [ ] Bisa melakukan upload/download dan membaca log akses.
- [ ] Bisa memeriksa dialect dan signing dengan `nmap`.
- [ ] Bisa membaca nama file dan NTLMSSP dari PCAP.
- [ ] Bisa menjelaskan mengapa SMB3 encryption mengubah visibilitas.
- [ ] Bisa membaca `4625`, `5140`, dan `5145` di Windows.
- [ ] Bisa menerapkan hardening SMB1/signing/encryption.

## Kesimpulan

SMB adalah protokol file-sharing yang sangat umum, dan justru karena itu menjadi jalur favorit untuk enumerasi, brute force, lateral movement, dan ransomware. Memahami alurnya—negotiate, session setup, tree connect, file operation—membuat kita bisa membaca bukti di log dan packet capture, bukan hanya melihat alert “SMB traffic”.

Di part ini kita sudah mempraktikkan semuanya di lab Docker: share enumeration, autentikasi NTLM, ACL public/finance, upload/download, pemeriksaan signing dan dialect, capture SMB2/NTLMSSP, serta analisis log autentikasi. Lab juga menunjukkan batas visibilitas: tanpa enkripsi, nama file terlihat; dengan SMB3 encryption, defender harus mengandalkan log server, EDR, dan metadata.

Setelah networking, LDAP, dan SMB, fondasi identitas dan file sharing sudah cukup kuat. Part berikutnya akan masuk ke **Windows Essentials dan Active Directory**: event log, proses, service, registry, serta bagaimana SMB, LDAP, dan Kerberos bertemu di lingkungan domain.
