---
title: 'Blue Team Journey - Part 7: Security Fundamentals dan Praktiknya'
date: '2026-11-19'
template: 'post'
draft: false
slug: 'blue-team-journey-part-7'
category: 'Cybersecurity'
tags:
  - 'Security Fundamentals'
  - 'CIA Triad'
  - 'Cryptography'
  - 'TLS'
  - 'Access Control'
  - 'MITRE ATT&CK'
  - 'Blue Team'
  - 'Cybersecurity'
description: 'Security fundamentals untuk defender: CIA triad, kriptografi, PKI/TLS, access control, segmentasi, SQLi/XSS, vulnerability management, framework, dan IR—dengan lab Docker.'
seoTitle: 'Security Fundamentals untuk Blue Team: CIA, Kripto, TLS, IR'
seoDescription: 'Belajar security fundamentals: CIA triad, enkripsi, hashing, TLS, ACL, segmentasi, SQLi/XSS, Trivy, NIST CSF, ATT&CK, dan incident response.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/00-cover.png'
---

Sampai di sini kita sudah punya banyak alat: networking, LDAP, SMB, Windows/AD, Linux CLI, dan scripting. Phase 5 dari [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap) mengikat semuanya dengan pertanyaan yang lebih mendasar: **apa yang sebenarnya kita lindungi, dari siapa, dan dengan kontrol apa?**

Artikel ini adalah **Part 7** dari seri **Blue Team Journey**: **Security Fundamentals**. Kita akan membahas CIA triad, kriptografi, PKI/TLS, access control, segmentasi jaringan, SQL injection/XSS, vulnerability management, framework, dan incident response—lalu mempraktikkan sebagian besarnya di lab Docker.

## CIA triad: tiga pertanyaan dasar

| Prinsip | Definisi | Kontrol | Contoh serangan |
|---|---|---|---|
| **Confidentiality** | Hanya pihak berwenang yang bisa membaca data | Enkripsi, ACL, DLP | Data breach, akses tidak sah |
| **Integrity** | Data tidak berubah tanpa terdeteksi | Hash, signature, checksum | MITM, modifikasi data |
| **Availability** | Sistem tersedia saat dibutuhkan | Redundansi, backup, anti-DDoS | DDoS, ransomware |

Tambahan prinsip yang sama penting:

- **Authentication (AuthN)** — membuktikan identitas: password, MFA, sertifikat, biometrik.
- **Authorization (AuthZ)** — menentukan akses: RBAC, ACL, policy.
- **Accounting** — mencatat aktivitas: audit log, SIEM.
- **Non-repudiation** — pihak yang melakukan aksi tidak bisa menyangkalnya: digital signature.
- **Least privilege** — akses minimum yang diperlukan.
- **Defense in depth** — beberapa lapisan kontrol, bukan satu tembok.
- **Zero trust** — jangan percaya hanya karena berada di jaringan internal; verifikasi terus-menerus.

CIA bukan hafalan ujian. Setiap kontrol yang kita pasang harus menjawab salah satu dari tiga pertanyaan itu, dan setiap insiden bisa dipetakan ke dampaknya pada C, I, atau A.

## Tipe serangan yang perlu dikenal

| Serangan | Cara kerja | Deteksi |
|---|---|---|
| Phishing | Email/link palsu menipu user | Email gateway, laporan user, header |
| Brute force | Tebak password otomatis | 4625 berulang, log auth |
| Credential stuffing | Password bocor dari breach lain | Banyak akun, satu sumber |
| Malware | Software berbahaya | EDR, proses aneh, network |
| Ransomware | Enkripsi file, minta tebusan | Mass file write/rename, canary |
| SQL injection | Perintah SQL masuk lewat input | WAF, query aneh, error DB |
| XSS | Script masuk ke halaman | WAF, output encoding, CSP |
| MITM | Menyadap komunikasi | Certificate warning, ARP aneh |
| Lateral movement | Pindah antar-host | Logon pattern, PsExec, SMB |
| Privilege escalation | Naik hak akses | 4672, 4728, SUID, sudo |
| Data exfiltration | Mencuri data keluar | Outbound besar, DNS tunneling |
| Supply chain | Kompromi vendor/update | Update aneh, koneksi tak terduga |

Di artikel ini kita akan mempraktikkan SQLi, XSS, kelemahan konfigurasi akses, dan vulnerability scanning. Tipe lain sudah muncul di part sebelumnya: brute force di [Part 5](/blog/blue-team-journey-part-5), SMB lateral movement di [Part 3](/blog/blue-team-journey-part-3), dan AD attacks di [Part 4](/blog/blue-team-journey-part-4).

## Cyber Kill Chain dan MITRE ATT&CK

**Cyber Kill Chain** (Lockheed Martin) membagi serangan menjadi:

```text
Reconnaissance → Weaponization → Delivery → Exploitation
→ Installation → Command & Control → Actions on Objectives
```

**MITRE ATT&CK** adalah katalog perilaku adversary dengan 14 tactic dan ratusan technique. Tactic utamanya:

| Tactic | Tujuan attacker |
|---|---|
| Reconnaissance | Mengumpulkan informasi target |
| Resource Development | Membangun infrastruktur |
| Initial Access | Masuk pertama kali |
| Execution | Menjalankan kode |
| Persistence | Mempertahankan akses |
| Privilege Escalation | Naik hak |
| Defense Evasion | Menghindari deteksi |
| Credential Access | Mencuri kredensial |
| Discovery | Memetakan environment |
| Lateral Movement | Pindah host |
| Collection | Mengumpulkan data |
| Command and Control | Komunikasi dengan implant |
| Exfiltration | Mencuri data |
| Impact | Merusak/mengganggu |

Cara memakainya: mulai dari alert atau bukti, tentukan tactic/technique-nya, lalu pilih telemetri yang bisa mendeteksi langkah berikutnya. Contoh: SQLi adalah **Initial Access (T1190)**, shell adalah **Execution (T1059)**, cron adalah **Persistence (T1053)**, dan koneksi keluar adalah **Command and Control (T1071)**.

## Framework yang perlu dikenal

| Framework | Fungsi | Fokus |
|---|---|---|
| **NIST CSF 2.0** | Strategi keamanan | Govern, Identify, Protect, Detect, Respond, Recover |
| **NIST SP 800-61** | Incident response | Preparation, Detection & Analysis, Containment/Eradication/Recovery, Post-Incident |
| **CIS Controls v8.1** | Prioritas kontrol | 18 kontrol, 3 implementation group |
| **ISO 27001** | ISMS | Tata kelola dan sertifikasi |
| **NIST SP 800-53** | Katalog kontrol | Kontrol keamanan dan privasi |

NIST CSF 2.0 menambahkan fungsi **Govern** dibanding versi sebelumnya. Lima fungsi lama (Identify, Protect, Detect, Respond, Recover) tetap ada; Govern menambahkan konteks risiko, kebijakan, dan akuntabilitas.

Incident response NIST SP 800-61:

```text
Preparation → Detection & Analysis → Containment, Eradication, Recovery → Post-Incident
```

Yang sering dilupakan: **post-incident**. Tanpa lessons learned dan perbaikan deteksi, insiden yang sama akan terulang.

## Lab: defense in depth

Lab Part 7 memakai beberapa container:

- `sec-web` — nginx dengan TLS, terhubung ke frontend dan backend.
- `sec-api` — service backend, hanya di network backend.
- `sec-client` — client di frontend, untuk tes TLS, ACL, dan kriptografi.
- `websec` — aplikasi Flask rentan dan versi aman untuk SQLi/XSS.
- `trivy` — scan vulnerability image `nginx:1.25-alpine`.

Dockerfile ringkas:

```dockerfile
FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      openssl python3 python3-cryptography python3-flask nginx curl \
      acl sudo libcap2-bin iputils-ping iproute2 sqlite3 ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && rm -f /etc/nginx/sites-enabled/default

COPY nginx/lab.conf /etc/nginx/conf.d/lab.conf
COPY html /srv/www
COPY api /srv/api
COPY websec /app/websec
CMD ["sleep", "infinity"]
```

Jalankan:

```bash
docker network create --subnet=172.34.10.0/24 sec-front
docker network create --subnet=172.34.20.0/24 sec-back
docker build -t sec-lab:1.0 ./image

docker run -d --name sec-web --network sec-front --ip 172.34.10.10 \
  -p 8443:443 -v "$PWD/certs:/certs:ro" \
  sec-lab:1.0 nginx -g 'daemon off;'
docker network connect --ip 172.34.20.10 sec-back sec-web

docker run -d --name sec-api --network sec-back --ip 172.34.20.20 \
  sec-lab:1.0 python3 -m http.server 8080 --directory /srv/api

docker run -d --name sec-client --network sec-front --ip 172.34.10.20 \
  -v "$PWD/certs:/certs:ro" sec-lab:1.0 sleep infinity

docker run -d --name websec --network sec-front --ip 172.34.10.30 \
  -p 8081:8081 sec-lab:1.0 python3 /app/websec/app.py
```

![Defense in depth|Data/kripto, identity/access, network/PKI, dan detection/response sebagai lapisan kontrol.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/01-lab-topology.png)

## Praktik 1: integrity dan non-repudiation

Hash membuktikan integritas, tetapi bukan enkripsi. Ubah satu karakter, hash berubah:

```bash
echo -n "transfer 100" > /tmp/message.txt
openssl dgst -sha256 /tmp/message.txt

echo -n "transfer 900" > /tmp/message.txt
openssl dgst -sha256 /tmp/message.txt
```

Digital signature menambahkan authenticity dan non-repudiation:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
openssl dgst -sha256 -sign private.pem -out sig.bin message.txt
openssl dgst -sha256 -verify public.pem -signature sig.bin message.txt
```

Jika file diubah, verifikasi gagal. HMAC juga menjaga integritas, tetapi memakai shared secret, sehingga tidak memberi non-repudiation.

![Integritas dan signature|Hash berubah saat data diubah; RSA signature Verified OK, lalu gagal setelah tamper.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/02-integrity.png)

Yang perlu diingat:

- **Hash** = integritas, bukan kerahasiaan.
- **HMAC** = integritas + authenticity dengan shared secret.
- **Digital signature** = integritas + authenticity + non-repudiation, selama private key aman.
- MD5/SHA1 tidak lagi cocok untuk collision resistance; gunakan SHA-256+.

## Praktik 2: confidentiality dan password storage

AES-GCM adalah authenticated encryption: confidentiality + integrity dalam satu operasi. Contoh Python:

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

key = AESGCM.generate_key(bit_length=256)
aes = AESGCM(key)
nonce = os.urandom(12)
ciphertext = aes.encrypt(nonce, b"transfer 100", b"lab")
print(aes.decrypt(nonce, ciphertext, b"lab"))
```

Mengubah ciphertext akan memicu `InvalidTag`, bukan plaintext rusak yang diam-diam diterima.

Password tidak boleh disimpan dengan hash cepat seperti SHA-256. Gunakan **salt + KDF lambat** (Argon2id, bcrypt, scrypt, atau PBKDF2) dan parameter biaya yang memadai. Contoh klasik salted SHA-512 crypt:

```bash
openssl passwd -6 -salt saltA "Password123!"
openssl passwd -6 -salt saltB "Password123!"
```

Hash berbeda karena salt berbeda. Namun SHA-512 crypt bukan pilihan utama modern; Argon2id lebih disarankan untuk password baru.

![Confidentiality|AES-GCM berhasil dekripsi, tamper terdeteksi; password yang sama menghasilkan hash berbeda karena salt.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/03-confidentiality.png)

## Praktik 3: TLS dan PKI

TLS memberi confidentiality dan integrity pada data in transit, serta authenticity server lewat sertifikat. PKI menghubungkan public key dengan identitas melalui CA.

Buat CA dan server certificate dengan SAN:

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/CN=Security Lab CA" -out ca.crt

openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/CN=web.sec.local" -out server.csr
printf "subjectAltName=DNS:web.sec.local,DNS:localhost,IP:127.0.0.1\n" > ext.cnf
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -days 3650 -sha256 -extfile ext.cnf
```

Tes dari client:

```bash
# Tanpa CA yang tepat: verifikasi gagal
curl --resolve web.sec.local:443:172.34.10.10 https://web.sec.local/

# Dengan CA yang tepat: berhasil
curl --cacert /certs/ca.crt --resolve web.sec.local:443:172.34.10.10 \
  https://web.sec.local/
```

![TLS dan PKI|Tanpa CA, curl menolak sertifikat; dengan CA, TLS 1.3 dan verifikasi berhasil.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/04-tls.png)

Pelajaran:

- **Hostname/SAN harus cocok** dengan nama yang diakses.
- **CA trust** menentukan apakah client menerima sertifikat.
- **TLS 1.3** memberi forward secrecy dan cipher modern.
- Jangan mematikan verifikasi (`-k`, `LDAPTLS_REQCERT=never`) di produksi.
- Untuk service-to-service, pertimbangkan **mTLS**.

## Praktik 4: access control dan least privilege

File `report.txt` dimiliki `alice:finance` dengan mode `640`. Bob tidak bisa membaca. ACL memberi Bob akses baca tanpa mengubah group:

```bash
setfacl -m u:bob:r-- /srv/finance/report.txt
getfacl -p /srv/finance/report.txt
runuser -u bob -- cat /srv/finance/report.txt
```

Sudo dapat dibatasi ke satu perintah:

```text
analyst ALL=(root) NOPASSWD: /usr/bin/cat /srv/finance/report.txt
```

Sudo hanya mengizinkan perintah itu; `cat /etc/shadow` tetap ditolak. Capability memberi privilege granular tanpa SUID penuh, misalnya `ping` memakai `cap_net_raw=ep`.

![Access control|ACL memberi Bob read tanpa menambah group; sudo hanya mengizinkan satu perintah; capability ping terbatas.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/05-access.png)

> Password pada contoh `sudo -S` hanya untuk demonstrasi. Di produksi, jangan menaruh password di command line atau shell history; gunakan mekanisme yang aman.

## Praktik 5: segmentasi jaringan

`sec-client` hanya terhubung ke network frontend. `sec-web` terhubung ke frontend dan backend. `sec-api` hanya di backend.

```bash
# Dari client: web berhasil
curl --cacert /certs/ca.crt --resolve web.sec.local:443:172.34.10.10 \
  https://web.sec.local/

# Dari client: api tidak punya route
curl --max-time 3 http://172.34.20.20:8080/

# Dari web: api berhasil
curl http://172.34.20.20:8080/
```

![Segmentasi jaringan|Client bisa mencapai web, tetapi tidak bisa langsung ke API backend; web bisa.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/06-segmentation.png)

Segmentasi membatasi **lateral movement**. Jika web dikompromikan, attacker tidak otomatis bisa menjangkau semua service. Di produksi, tambahkan firewall, security group, private subnet, dan kontrol egress.

## Praktik 6: SQL injection dan XSS

Aplikasi rentan menyusun query dengan f-string:

```python
query = f"SELECT username, role FROM users WHERE username = '{user}'"
rows = con.execute(query).fetchall()
```

Payload `' OR '1'='1` mengubah query menjadi selalu benar dan mengembalikan semua user. Versi aman memakai parameterized query:

```python
rows = con.execute(
    "SELECT username, role FROM users WHERE username = ?", (user,)
).fetchall()
```

XSS terjadi saat input dikembalikan tanpa encoding:

```python
return f"<h1>Results for {q}</h1>"          # rentan
return f"<h1>Results for {html.escape(q)}</h1>"  # aman
```

![SQLi dan XSS|Payload SQLi mengembalikan semua user pada versi rentan; versi aman kosong. XSS mentah vs di-escape.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/07-websec.png)

Mitigasi:

- **SQLi:** parameterized query, least privilege DB account, validasi input, WAF sebagai lapisan tambahan.
- **XSS:** output encoding, CSP, framework yang meng-escape secara default, hindari `innerHTML`.
- **SDLC:** code review, SAST/DAST, security testing di CI.

## Praktik 7: vulnerability management

Trivy memindai image dan memetakan CVE ke paket serta versi perbaikan:

```bash
docker run --rm -v trivy-cache:/root/.cache/trivy -v "$PWD:/out" \
  aquasec/trivy:latest image \
  --format json --severity CRITICAL,HIGH \
  -o /out/trivy.json nginx:1.25-alpine
```

Ringkas hasilnya dengan `jq`:

```bash
jq -r '.Results[] | .Vulnerabilities[]? | select(.Severity=="CRITICAL") \
  | [.VulnerabilityID,.PkgName,.InstalledVersion,(.FixedVersion//"-")] | @tsv' \
  trivy.json | column -t
```

![Vulnerability scan|Trivy menemukan 3 CRITICAL dan 17 HIGH pada base image lama, lengkap dengan versi perbaikan.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-7/08-trivy.png)

Cara membaca hasil:

- **Severity bukan satu-satunya faktor.** Pertimbangkan exploitability, exposure, dan dampak bisnis.
- **Fixed version** menentukan apakah patch tersedia.
- **Base image EOL** (Alpine 3.19) berarti update keamanan mungkin tidak tersedia; rebuild dengan base yang didukung.
- **Scan di CI**, bukan hanya di produksi; simpan SBOM dan riwayat scan.
- **Prioritaskan** CVE yang reachable dan exposed, bukan sekadar jumlah.

## Memetakan praktik ke framework

| Praktik | CIA | CSF 2.0 | CIS Controls | ATT&CK |
|---|---|---|---|---|
| Hash/signature | Integrity | Protect | 3 Data Protection | T1565 |
| AES/TLS | Confidentiality | Protect | 3, 4 | T1040, T1557 |
| ACL/sudo | Confidentiality, Integrity | Protect | 5, 6 | T1078, T1068 |
| Segmentasi | Confidentiality, Availability | Protect, Detect | 12, 13 | T1021, T1570 |
| SQLi/XSS fix | C, I, A | Protect, Detect | 16 App Security | T1190, T1059 |
| Trivy | Integrity, Availability | Identify, Protect | 7 Continuous Vuln Mgmt | T1190, T1203 |
| IR | Semua | Respond, Recover | 17 IR Mgmt | Semua tactic |

Contoh pemetaan insiden SQLi:

1. **Detection** — WAF/alert atau error DB.
2. **Analysis** — validasi payload, cek akses data, scope.
3. **Containment** — blokir IP/path, nonaktifkan endpoint, rotasi kredensial DB.
4. **Eradication** — perbaiki query parameterized, patch, review code.
5. **Recovery** — deploy fix, monitor, verifikasi.
6. **Post-incident** — tambah rule, test, update SDLC.

## Checklist Phase 5

- [ ] Bisa menjelaskan CIA triad dengan contoh nyata.
- [ ] Memahami AuthN, AuthZ, accounting, non-repudiation, least privilege.
- [ ] Bisa membedakan hash, HMAC, enkripsi simetris, asimetris, dan signature.
- [ ] Memahami cara kerja TLS, CA, SAN, dan verifikasi sertifikat.
- [ ] Bisa menjelaskan DAC/MAC/RBAC/ABAC dan ACL.
- [ ] Memahami segmentasi, firewall, IDS/IPS, dan zero trust.
- [ ] Bisa mendemonstrasikan SQLi/XSS dan perbaikannya.
- [ ] Bisa membaca hasil vulnerability scan dan memprioritaskan.
- [ ] Bisa memetakan serangan ke Cyber Kill Chain dan ATT&CK.
- [ ] Memahami NIST CSF 2.0, SP 800-61, CIS Controls, dan ISO 27001.
- [ ] Bisa menjelaskan fase incident response.

## Kesimpulan

Security fundamentals bukan sekadar teori untuk ujian. CIA triad menentukan apa yang dilindungi; kriptografi dan PKI melindungi data dan komunikasi; access control dan least privilege membatasi siapa yang bisa melakukan apa; segmentasi membatasi pergerakan; vulnerability management mengurangi permukaan serangan; dan framework/IR memberi struktur saat terjadi insiden.

Di part ini kita sudah mempraktikkan integritas dan signature, enkripsi AES-GCM dan password hashing, TLS dengan CA, ACL dan sudo, segmentasi frontend/backend, SQLi/XSS remediation, serta Trivy. Semua kontrol itu adalah lapisan berbeda dari defense in depth—bukan pengganti satu sama lain.

Part berikutnya adalah **Blue Team Tools (Phase 6)**: SIEM, EDR/XDR, network detection, forensics/IR, threat intelligence, dan SOAR—alat yang mengoperasikan konsep-konsep di part ini dalam skala nyata.
