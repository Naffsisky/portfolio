---
title: 'Blue Team Journey - Part 4: Windows Essentials dan Active Directory'
date: '2026-11-18'
template: 'post'
draft: false
slug: 'blue-team-journey-part-4'
category: 'Cybersecurity'
tags:
  - 'Windows'
  - 'Active Directory'
  - 'Kerberos'
  - 'Event Log'
  - 'Sysmon'
  - 'Samba'
  - 'Blue Team'
  - 'Cybersecurity'
description: 'Windows Essentials dan Active Directory untuk defender: struktur domain, Kerberos TGT/TGS, event log, Sysmon, persistence, serta lab Samba AD DC di Docker dan analisis EVTX asli.'
seoTitle: 'Windows Essentials dan Active Directory untuk Blue Team'
seoDescription: 'Belajar Windows dan Active Directory: domain, OU, GPO, Kerberos, event log 4624/4625/4768/4771, Sysmon, persistence, plus lab Samba AD DC dan parsing EVTX.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/00-cover.png'
---

Sampai di sini kita sudah membahas networking, LDAP, dan SMB. Ketiganya bertemu di satu tempat yang mendominasi lingkungan enterprise: **Windows dan Active Directory**.

Di Part 4 ini kita masuk ke Phase 2 dari [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap): Windows Essentials. Fokusnya bukan menjadi administrator Windows, tetapi menjadi defender yang bisa membaca bukti: event log, proses, service, registry, tiket Kerberos, dan struktur domain.

Karena VPS ini tidak memiliki Windows/KVM, lab praktik memakai **Samba AD DC** di Docker—implementasi Active Directory yang kompatibel dengan LDAP, Kerberos, DNS, SMB, dan GPO. Untuk event log, kita akan mem-parsing **file EVTX asli** dari dataset publik. Bagian GUI Windows, registry, dan Sysmon dijelaskan sebagai teori dan perintah yang bisa dijalankan di VM Windows.

## Windows Essentials: apa yang perlu diketahui defender

Windows modern punya beberapa lapisan yang sering muncul di investigasi:

- **Kernel mode dan user mode** — driver berjalan di kernel; aplikasi di user mode.
- **Process dan token** — setiap proses berjalan dengan token berisi SID user, group, privilege, dan integrity level.
- **Services** — proses yang dijalankan Service Control Manager, sering menjadi lokasi persistence.
- **Scheduled tasks dan WMI** — mekanisme otomatis yang juga sering disalahgunakan.
- **Registry** — database konfigurasi; run key adalah lokasi persistence klasik.
- **Local SAM vs domain AD** — akun lokal disimpan di SAM; akun domain di Active Directory.

### Registry dan persistence

Registry hive utama:

| Hive | Isi |
|---|---|
| `HKLM\SYSTEM` | Konfigurasi sistem, service, driver |
| `HKLM\SOFTWARE` | Aplikasi dan konfigurasi global |
| `HKCU` | Konfigurasi user |
| `HKCR` | Asosiasi file dan COM |
| `HKU` | Profil user yang dimuat |

Lokasi persistence yang wajib dicek:

```text
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKLM\SYSTEM\CurrentControlSet\Services
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp
```

Selain registry: **services**, **scheduled tasks**, **WMI event subscription**, dan **startup folder**. Defender perlu menghubungkan pembuatan service/task dengan proses induk dan user yang melakukannya.

### PowerShell untuk investigasi

Perintah berikut dijalankan di Windows:

```powershell
# Event log keamanan terbaru
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} |
  Select-Object TimeCreated, Message -First 20

# Proses dengan CPU tertinggi
Get-Process | Sort-Object CPU -Descending | Select-Object -First 20

# Koneksi TCP yang established
Get-NetTCPConnection -State Established |
  Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess

# Scheduled task yang aktif
Get-ScheduledTask | Where-Object {$_.State -ne 'Disabled'}

# Startup programs
Get-CimInstance Win32_StartupCommand |
  Select-Object Name, Command, Location, User

# Service yang baru dibuat
Get-WinEvent -FilterHashtable @{LogName='System'; Id=7045} |
  Select-Object TimeCreated, Message
```

Tujuannya bukan menghafal cmdlet, tetapi tahu **pertanyaan** yang harus dijawab: proses apa, dijalankan oleh siapa, dari parent mana, membuka koneksi ke mana, dan meninggalkan file apa.

## Event log: sumber bukti utama

Windows menyimpan event di beberapa log:

| Log | Isi |
|---|---|
| Security | Logon, logoff, akses objek, perubahan akun, privilege |
| System | Service, driver, boot, hardware |
| Application | Aplikasi dan crash |
| Microsoft-Windows-Sysmon/Operational | Telemetri endpoint dari Sysmon |
| Microsoft-Windows-PowerShell/Operational | Script block logging, module logging |

Event ID yang wajib dikenal:

| Event ID | Log | Arti | Mengapa penting |
|---:|---|---|---|
| `4624` | Security | Logon berhasil | Siapa mengakses apa |
| `4625` | Security | Logon gagal | Brute force, spraying |
| `4634` | Security | Logoff | Durasi sesi |
| `4648` | Security | Explicit credential logon | Lateral movement |
| `4672` | Security | Special privileges | Admin access |
| `4688` | Security | Process created | Eksekusi malware |
| `4689` | Security | Process exited | Lifecycle proses |
| `4720` | Security | User created | Persistence |
| `4724` | Security | Password reset | Privilege escalation |
| `4728` | Security | Member added to global group | Eskalasi akses |
| `4732` | Security | Member added to local group | Local admin |
| `1102` | Security | Audit log cleared | Anti-forensics |
| `7045` | System | Service installed | Persistence |
| `4104` | PowerShell | Script block logging | PowerShell malicious |
| `1` | Sysmon | Process creation | Process tree detail |
| `3` | Sysmon | Network connection | C2, lateral movement |
| `11` | Sysmon | File created | Dropped file |
| `22` | Sysmon | DNS query | DNS C2, DGA |

Logon type pada `4624`/`4625` juga penting:

| Type | Arti |
|---:|---|
| 2 | Interactive (console) |
| 3 | Network (SMB, share) |
| 5 | Service |
| 10 | RemoteInteractive (RDP) |
| 11 | CachedInteractive |

Catatan penting: **4768/4769/4771 adalah event KDC** (Key Distribution Center), sedangkan **4624/4625 adalah event logon di host**. Keduanya bisa menceritakan serangan yang sama dari sisi berbeda: KDC melihat permintaan tiket, host melihat sesi logon.

Pola serangan yang sering dibaca dari event log:

- Banyak **4625** lalu satu **4624** = brute force berhasil.
- **4720** + **4728** ke Domain Admins = akun baru yang langsung dipromosikan.
- **4688** dengan `powershell.exe`, `cmd.exe`, `certutil.exe` = eksekusi mencurigakan.
- **1102** = log dibersihkan; hampir selalu perlu eskalasi.
- **7045** + akses `ADMIN$` = indikasi lateral movement via service.

### Praktik: membaca EVTX asli

Kita memakai sample publik dari repo [EVTX-ATTACK-SAMPLES](https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES), file `kerberos_pwd_spray_4771.evtx`. File ini berisi event Kerberos dari simulasi password spraying.

Parser sederhana dengan `python-evtx`:

```python
import sys
import xml.etree.ElementTree as ET
from Evtx.Evtx import Evtx

NS = {'e': 'http://schemas.microsoft.com/win/2004/08/events/event'}
path = sys.argv[1]

with Evtx(path) as log:
    for record in log.records():
        root = ET.fromstring(record.xml())
        eid = root.findtext('.//e:EventID', namespaces=NS)
        time = root.find('.//e:TimeCreated', NS).attrib.get('SystemTime', '')
        data = {d.attrib.get('Name', ''): (d.text or '')
                for d in root.findall('.//e:Data', NS)}
        user = data.get('TargetUserName') or data.get('SubjectUserName') or ''
        ip = data.get('IpAddress') or ''
        status = data.get('Status') or ''
        print(f"{time}  id={eid:<4} user={user:<18} ip={ip:<16} status={status}")
```

Jalankan:

```bash
pip install python-evtx
python parse.py kerberos_pwd_spray_4771.evtx
```

![Analisis EVTX password spray|1102 (log cleared), 4768 dengan status 0x6, 4771 dengan status 0x18, lalu satu login berhasil.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/07-evtx.png)

Urutan event-nya bercerita:

1. **1102** — audit log dibersihkan pada 20:29:27. Ini langkah anti-forensics.
2. **4768 status 0x6** — permintaan TGT untuk banyak user (HD01, admin, svc-02, dan seterusnya). Status `0x6` adalah `KDC_ERR_C_PRINCIPAL_UNKNOWN`: user tidak ditemukan. Attacker sedang memetakan nama akun.
3. **4771 status 0x18** — pre-authentication gagal untuk `Administrator` dan `backdoor`. Status `0x18` adalah `KDC_ERR_PREAUTH_FAILED`: password salah.
4. **4768 status 0x0** — TGT berhasil untuk `normal`.

Pola ini bukan satu login gagal biasa. Ini kombinasi **log clearing + username enumeration + password spraying**. Deteksi yang baik menggabungkan ketiganya, bukan hanya menghitung satu event.

## Active Directory: struktur dan istilah

Active Directory adalah directory service sekaligus sistem identitas. Beberapa istilah yang harus jelas:

| Istilah | Arti |
|---|---|
| Forest | Kumpulan domain yang berbagi schema dan configuration |
| Domain | Batas administratif dan keamanan, misalnya `lab.local` |
| Tree | Hierarki domain dalam satu namespace |
| OU | Organizational Unit, folder untuk delegasi dan GPO |
| Trust | Hubungan kepercayaan antar-domain/forest |
| Domain Controller | Server yang menjalankan AD DS, DNS, Kerberos, LDAP |
| Global Catalog | Index sebagian untuk pencarian lintas domain |
| FSMO | Flexible Single Master Operations, peran khusus di AD |
| SYSVOL | Folder bersama untuk GPO dan script logon |
| GPO | Group Policy Object, kumpulan kebijakan |

Struktur lab:

```text
LAB.LOCAL
├── CN=Users
│   ├── alice
│   ├── bob
│   ├── carol
│   ├── svc-sql
│   └── Administrator
├── CN=SOC Team (group)
└── OU=Domain Controllers
    └── DC$
```

Di AD, user dan group adalah objek LDAP. Group membership dibaca lewat atribut `memberOf`. Aplikasi biasanya melakukan:

```text
1. Bind ke AD (LDAP/LDAPS atau Kerberos)
2. Cari user berdasarkan sAMAccountName/UPN
3. Baca memberOf atau query group
4. Putuskan akses
```

Ini persis pola yang kita praktikkan di [Part 2: LDAP](/blog/blue-team-journey-part-2), tetapi sekarang objectClass dan atributnya mengikuti schema AD.

## Kerberos: tiket, bukan password

Kerberos adalah protokol autentikasi utama AD. Alurnya:

```text
1. Client → KDC: AS-REQ (minta TGT)
2. KDC → Client: AS-REP (TGT, dienkripsi dengan kunci krbtgt)
3. Client → KDC: TGS-REQ (minta tiket untuk service/SPN)
4. KDC → Client: TGS-REP (service ticket, dienkripsi dengan kunci service)
5. Client → Service: service ticket
```

Istilah penting:

- **TGT (Ticket Granting Ticket)** — tiket awal, disimpan di cache client.
- **TGS (Ticket Granting Service)** — tiket untuk service tertentu.
- **SPN (Service Principal Name)** — nama service, misalnya `MSSQLSvc/dc.lab.local:1433`.
- **krbtgt** — akun khusus yang kuncinya dipakai untuk menandatangani TGT.
- **PAC** — data otorisasi berisi SID dan group di dalam tiket.

Mengapa attacker menyukai Kerberos:

- **Kerberoasting** — user domain mana pun bisa meminta service ticket untuk SPN; tiket dienkripsi dengan hash password service account, lalu di-crack offline. Tidak perlu admin.
- **AS-REP roasting** — akun tanpa pre-authentication bisa dimintai AS-REP yang dienkripsi dengan hash password user, lalu di-crack offline.
- **Golden Ticket** — jika krbtgt hash dikuasai, attacker bisa membuat TGT palsu untuk user/group apa pun.
- **Pass-the-ticket** — tiket curian bisa dipakai tanpa password.

NTLM masih ada untuk kompatibilitas. NTLMv2 tidak mengirim password, tetapi responsnya bisa direlay atau di-pass-the-hash. Karena itu, prioritaskan Kerberos, matikan NTLMv1, dan terapkan signing/channel binding pada LDAP/SMB.

## Serangan AD dan bukti yang ditinggalkan

| Serangan | Cara kerja | Event/bukti |
|---|---|---|
| Password spray | Satu password ke banyak user | 4625, 4771, 4768 status 0x6/0x18 |
| Kerberoasting | Minta TGS untuk SPN, crack offline | 4769 dengan enkripsi lemah/RC4, volume SPN |
| AS-REP roasting | Minta AS-REP tanpa preauth | 4768 tanpa preauth, AS-REP |
| DCSync | Replikasi kredensial dari DC | 4662, DRSUAPI, akses dari host bukan DC |
| Golden Ticket | Forge TGT dengan krbtgt hash | 4769 anomali, TGT tanpa AS-REQ wajar |
| ACL abuse | Ubah ACL objek AD | 5136, 4662, perubahan owner |
| GPO abuse | Ubah GPO untuk eksekusi | 5136, SYSVOL, 4688 di banyak host |
| Lateral movement | SMB/admin share, service, RDP | 4624 type 3/10, 5140/5145, 7045 |

Deteksi AD bukan hanya soal event ID. Yang penting adalah **baseline**: siapa biasanya melakukan apa, dari host mana, pada jam berapa. Alert baru bermakna jika dibandingkan dengan baseline itu.

## Lab: Samba AD DC di Docker

Lab terdiri dari:

- **dc** — Samba AD DC di `172.31.0.10`, domain `LAB.LOCAL`.
- **ad-client** — Debian dengan `kinit`, `ldapsearch`, `smbclient`, `dig`.

### Dockerfile

```dockerfile
FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN echo "wireshark-common/install-setuid boolean false" | debconf-set-selections \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      samba samba-ad-dc samba-ad-provision samba-common-bin smbclient \
      ldap-utils krb5-user dnsutils libsasl2-modules-gssapi-mit \
      tcpdump tshark iproute2 netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 53 88 389 445 464 636 3268
ENTRYPOINT ["/entrypoint.sh"]
```

### entrypoint.sh

```sh
#!/bin/sh
set -e

if [ ! -f /var/lib/samba/private/sam.ldb ]; then
  rm -f /etc/samba/smb.conf
  samba-tool domain provision \
    --realm=LAB.LOCAL --domain=LAB \
    --adminpass="${ADMIN_PASS:-AdminPass123!}" \
    --dns-backend=SAMBA_INTERNAL --server-role=dc --use-rfc2307 \
    --option="dns forwarder=1.1.1.1" \
    --option="vfs objects = acl_tdb"
  cp /var/lib/samba/private/krb5.conf /etc/krb5.conf
fi

mkdir -p /srv/labshare
chmod 0777 /srv/labshare

if ! grep -q '^\[labshare\]' /etc/samba/smb.conf; then
  cat >> /etc/samba/smb.conf <<'SMBEOF'

[labshare]
   path = /srv/labshare
   read only = no
   valid users = alice
SMBEOF
fi

exec samba --foreground --no-process-group --debug-stdout
```

Catatan penting:

- **`samba-ad-dc` dan `samba-ad-provision`** dibutuhkan untuk modul AD dan schema.
- **`vfs objects = acl_tdb`** adalah workaround lab karena filesystem container tidak mendukung penyimpanan NT ACL dengan `acl_xattr`. Di VM/server biasa, gunakan default `acl_xattr`.
- **`--dns 127.0.0.1`** pada container DC membuat Samba DNS menjadi resolver dirinya sendiri; client memakai `--dns 172.31.0.10`.

### Menjalankan

```bash
docker network create --subnet=172.31.0.0/24 ad-lab

docker build -t ad-lab:1.4 ./image

docker run -d --name dc \
  --hostname dc --network ad-lab --ip 172.31.0.10 \
  --dns 127.0.0.1 -p 5353:53 \
  -e ADMIN_PASS='AdminPass123!' \
  -v ad-data:/var/lib/samba \
  ad-lab:1.4

docker run -d --name ad-client \
  --hostname client --network ad-lab --ip 172.31.0.20 \
  --dns 172.31.0.10 --cap-add=NET_RAW --cap-add=NET_ADMIN \
  --entrypoint sleep \
  -v "$PWD/client/krb5.conf:/etc/krb5.conf:ro" \
  ad-lab:1.4 infinity
```

Client memakai `krb5.conf`:

```ini
[libdefaults]
    default_realm = LAB.LOCAL
    dns_lookup_realm = false
    dns_lookup_kdc = true
    rdns = false
    dns_canonicalize_hostname = false

[realms]
LAB.LOCAL = {
    default_domain = lab.local
}

[domain_realm]
    lab.local = LAB.LOCAL
    .lab.local = LAB.LOCAL
    dc = LAB.LOCAL
```

![Topologi lab AD|DC menyediakan DNS, Kerberos, LDAP, dan SMB; client memakai tiket Kerberos dan LDAPS.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/01-lab-topology.png)

## Praktik 1: domain dan DNS

```bash
# Di DC
samba-tool domain info 127.0.0.1

# Di client
dig +short _kerberos._tcp.lab.local SRV
dig +short _ldap._tcp.lab.local SRV
```

![Domain dan DNS SRV|Domain LAB.LOCAL, DC dc.lab.local, dan SRV record untuk Kerberos serta LDAP.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/02-domain.png)

SRV record adalah alasan client bisa menemukan KDC dan LDAP tanpa konfigurasi manual. Jika DNS AD rusak, autentikasi domain sering ikut gagal.

## Praktik 2: user dan group

```bash
samba-tool user create carol 'CarolPass123!' \
  --given-name=Carol --surname=Lee

samba-tool group addmembers 'SOC Team' carol
samba-tool group listmembers 'SOC Team'
samba-tool user list
```

![User dan group AD|Carol dibuat, ditambahkan ke SOC Team, dan daftar user domain terlihat.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/03-users.png)

Praktik nyata di AD:

- OU dipakai untuk delegasi dan GPO, bukan sekadar folder.
- Group adalah unit otorisasi; aplikasi membaca `memberOf`.
- User baru + group privileged adalah pola persistence/privilege escalation yang harus diawasi.

## Praktik 3: Kerberos TGT dan service ticket

```bash
kinit alice@LAB.LOCAL
klist
kvno MSSQLSvc/dc.lab.local:1433
klist
```

![TGT dan service ticket|kinit menghasilkan TGT; kvno meminta service ticket untuk SPN MSSQLSvc.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/04-kerberos.png)

Yang terjadi:

- `kinit` melakukan AS-REQ dan menyimpan TGT `krbtgt/LAB.LOCAL@LAB.LOCAL`.
- `kvno` melakukan TGS-REQ untuk `MSSQLSvc/dc.lab.local:1433`.
- `klist` menunjukkan service ticket untuk SPN tersebut.

Service ticket dienkripsi dengan kunci service account `svc-sql`. Jika password service account lemah, attacker bisa meminta tiket ini (sebagai user domain biasa) lalu melakukan **Kerberoasting**—crack offline tanpa perlu login ke server SQL. Mitigasi: password service account panjang dan acak, gunakan gMSA, audit SPN, dan pantau 4769.

## Praktik 4: LDAP ke AD

AD membutuhkan TLS untuk simple bind. Di lab, sertifikat Samba self-signed dan tanpa SAN, jadi kita memakai `LDAPTLS_REQCERT=never`—**hanya untuk lab**. Di produksi, gunakan CA tepercaya dan verifikasi sertifikat.

```bash
LDAPTLS_REQCERT=never ldapsearch -LLL -x -H ldaps://dc.lab.local \
  -D "alice@LAB.LOCAL" -w "AlicePass123!" \
  -b "dc=lab,dc=local" "(sAMAccountName=alice)" \
  sAMAccountName memberOf

LDAPTLS_REQCERT=never ldapsearch -LLL -x -H ldaps://dc.lab.local \
  -D "Administrator@LAB.LOCAL" -w "AdminPass123!" \
  -b "dc=lab,dc=local" "(sAMAccountName=svc-sql)" \
  sAMAccountName servicePrincipalName
```

![LDAP ke Active Directory|Alice memiliki memberOf SOC Team; svc-sql memiliki SPN MSSQLSvc yang bisa menjadi target Kerberoasting.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/05-ldap.png)

Query SPN adalah teknik recon yang umum:

```text
(&(objectClass=user)(servicePrincipalName=*))
```

Hasilnya adalah daftar akun yang bisa menjadi target Kerberoasting. Defender perlu mengetahui akun mana yang punya SPN, apakah passwordnya kuat, dan apakah SPN-nya masih diperlukan.

## Praktik 5: SMB dengan tiket Kerberos

```bash
kinit alice@LAB.LOCAL
smbclient -k //dc.lab.local/labshare -c 'ls'
```

![SMB dengan Kerberos|Setelah kinit, smbclient memakai tiket Kerberos tanpa mengirim password ke SMB.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-4/06-smb.png)

Ini menyambung Part 3: SMB bisa memakai NTLM atau Kerberos. Dengan Kerberos, client meminta service ticket untuk `cifs/dc.lab.local`, lalu mengirimkannya ke server. Password tidak dikirim ulang, dan tiket bisa diaudit.

## Sysmon dan persistence

Sysmon adalah service Windows yang menambahkan telemetri detail:

| Event ID | Isi |
|---:|---|
| `1` | Process creation (image, command line, parent, hash) |
| `3` | Network connection (source, destination, port, process) |
| `7` | Image loaded (DLL) |
| `8` | CreateRemoteThread (injection) |
| `10` | ProcessAccess (LSASS access) |
| `11` | FileCreate |
| `13` | RegistryEvent (value set) |
| `22` | DNS query |

Instalasi Sysmon:

```powershell
Sysmon64.exe -accepteula -i sysmonconfig.xml
```

Gunakan konfigurasi yang sudah dituning, misalnya SwiftOnSecurity atau Olaf Hartong, lalu sesuaikan dengan environment. Tanpa tuning, Sysmon bisa membanjiri SIEM.

Lokasi persistence yang perlu dipantau:

- Registry Run/RunOnce.
- Service baru (`7045`, Sysmon 13).
- Scheduled task baru.
- WMI event subscription.
- Startup folder.
- DLL sideloading di folder aplikasi.

## Deteksi dan hardening AD

### Deteksi

- **1102** — audit log dibersihkan; eskalasi segera.
- **4768/4771** — pola enumeration dan preauth gagal; korelasi dengan IP dan user.
- **4769** — permintaan service ticket; pantau volume, enkripsi RC4, dan akun service.
- **4662** — akses directory service; waspadai DCSync dari host bukan DC.
- **5136** — perubahan objek AD; ACL abuse, GPO abuse.
- **4624 type 3/10** — network/RDP logon; korelasi dengan 5140/5145.
- **4720/4728/4732** — pembuatan user dan penambahan group privileged.
- **7045** — service baru; sering muncul pada lateral movement.

### Hardening

- [ ] Terapkan tiered administration; jangan pakai Domain Admin untuk tugas harian.
- [ ] Gunakan LAPS untuk password admin lokal.
- [ ] Nonaktifkan NTLMv1; prioritaskan Kerberos.
- [ ] Terapkan SMB signing/encryption dan LDAP signing/channel binding.
- [ ] Lindungi akun privileged dengan Protected Users.
- [ ] Gunakan gMSA untuk service account; audit SPN.
- [ ] Rotasi password krbtgt sesuai prosedur.
- [ ] Batasi akses ke DC dan port 88/389/636/445.
- [ ] Aktifkan audit policy yang tepat dan kirim ke SIEM.
- [ ] Deploy Sysmon dengan konfigurasi yang dituning.
- [ ] Uji backup dan restore AD.

## Membersihkan lab

```bash
docker rm -f dc ad-client
docker volume rm ad-data
docker network rm ad-lab
```

Sample EVTX dan script parser bisa disimpan untuk latihan ulang. Jangan memakai password lab di lingkungan nyata.

## Checklist Phase 2

- [ ] Memahami forest, domain, OU, group, dan GPO.
- [ ] Bisa menjelaskan alur Kerberos: AS-REQ/AS-REP, TGT, TGS, service ticket.
- [ ] Hafal event ID penting: 4624, 4625, 4688, 4720, 4728, 1102, 7045, 4104.
- [ ] Bisa membaca urutan event dan menceritakan serangannya.
- [ ] Bisa memakai perintah PowerShell investigasi dasar.
- [ ] Memahami Sysmon dan event ID 1, 3, 11, 22.
- [ ] Mengetahui lokasi persistence: registry, service, scheduled task, WMI.
- [ ] Bisa melakukan query LDAP ke AD dan membaca SPN.
- [ ] Bisa menjelaskan Kerberoasting, AS-REP roasting, DCSync, Golden Ticket.
- [ ] Bisa memetakan serangan ke event log dan telemetri.

## Kesimpulan

Windows dan Active Directory adalah lapisan identitas yang menyatukan networking, LDAP, SMB, dan Kerberos. Bagi defender, kekuatannya bukan pada hafal nama fitur, tetapi pada kemampuan menghubungkan bukti: tiket Kerberos, event logon, akses share, perubahan group, dan proses yang dijalankan.

Di part ini kita mempraktikkan AD secara nyata dengan Samba AD DC: domain dan DNS SRV, user/group, TGT dan service ticket, LDAP ke AD, SMB dengan Kerberos, serta parsing EVTX asli yang menunjukkan log clearing, username enumeration, dan password spraying. Bagian Windows GUI, registry, dan Sysmon dijelaskan sebagai teori dan perintah untuk dijalankan di VM Windows.

Part berikutnya akan masuk ke **Linux Command Line** (Phase 3): shell, proses, permission, log, dan tool investigasi yang dipakai defender sehari-hari.
