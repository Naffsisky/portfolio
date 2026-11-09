---
title: 'Cara Pasang SSL di Windows Server: HTTPS Gratis dengan win-acme dan IIS'
date: '2026-11-09'
template: 'post'
draft: false
slug: 'ssl-windows-server'
category: 'Technology'
tags:
  - 'Windows Server'
  - 'IIS'
  - 'SSL'
  - "Let's Encrypt"
  - 'DevOps'
description: 'Panduan langkah demi langkah memasang SSL/HTTPS di Windows Server memakai IIS dan win-acme (Let''s Encrypt): dari instalasi role, membuka port 443, menerbitkan sertifikat, binding HTTPS, redirect HTTP, sampai renewal otomatis.'
seoTitle: 'Pasang SSL di Windows Server dengan IIS dan win-acme — Panduan Lengkap'
seoDescription: 'Tutorial HTTPS gratis di Windows Server: instal IIS, buka port 80/443, terbitkan sertifikat Let''s Encrypt dengan win-acme, pasang binding, redirect HTTP ke HTTPS, dan pastikan renewal otomatis.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/cover.png'
---

Memasang SSL di Windows Server sering terdengar rumit karena dua hal: IIS punya banyak menu, dan sertifikat berbayar butuh proses verifikasi. Padahal untuk kebutuhan website biasa, kamu bisa mendapatkan HTTPS gratis dari **Let's Encrypt** dan memasangnya dalam hitungan menit lewat **win-acme** — tanpa membeli sertifikat dan tanpa konfigurasi manual yang berulang setiap 90 hari.

Artikel ini mencatat alur lengkapnya: menyiapkan IIS, membuka port, menerbitkan sertifikat, memasang binding HTTPS, memaksa redirect dari HTTP, sampai memastikan perpanjangan sertifikat berjalan otomatis.

> **Catatan gambar:** gambar di artikel ini adalah ilustrasi alur kerja yang dibuat ulang, bukan tangkapan layar langsung dari mesin Windows Server. Alur, nama menu, dan perintahnya mengikuti tampilan IIS dan win-acme yang sebenarnya.

## Yang dibutuhkan

- Windows Server 2016/2019/2022 (2019 atau 2022 lebih disarankan).
- Akses **RDP dengan akun Administrator**.
- Domain yang **A record-nya sudah mengarah ke IP publik server**. Tanpa ini, validasi Let's Encrypt akan gagal.
- Port **80 dan 443 terbuka** dari internet — di firewall Windows *dan* di security group/firewall cloud provider.
- IIS sudah terpasang, atau siap dipasang di langkah pertama.

Kalau salah satu prasyarat di atas belum siap, selesaikan dulu. Sisanya akan jauh lebih lancar.

---

## Langkah 1 — Pastikan IIS terpasang dan situs bisa diakses

Kalau IIS belum ada, buka **Server Manager → Add Roles and Features**, lalu centang **Web Server (IIS)**.

![Ilustrasi Add Roles and Features Wizard dengan role Web Server (IIS) dipilih|Langkah 1 — centang Web Server (IIS) di Server Manager.](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/01-iis-role.png)

Lewat PowerShell, proses yang sama bisa dilakukan dengan satu perintah:

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
Get-WindowsFeature Web-Server
```

Setelah IIS terpasang, pastikan situsmu sudah punya **binding HTTP untuk domain** yang akan dipasangi SSL:

1. Buka **IIS Manager**.
2. Pilih **Sites → Default Web Site** (atau situs yang kamu pakai).
3. Klik **Bindings** di panel kanan → **Add**.
4. Isi Type `http`, Port `80`, Host name `domainkamu.com`.
5. Simpan, lalu buka `http://domainkamu.com` dari browser.

Kalau halaman masih gagal dibuka, jangan lanjut ke langkah berikutnya. Cek dulu DNS dan firewall.

```powershell
# Pastikan domain sudah mengarah ke IP server ini
Resolve-DnsName domainkamu.com -Type A

# Tes dari server itu sendiri
Invoke-WebRequest http://domainkamu.com -UseBasicParsing
```

---

## Langkah 2 — Buka port 80 dan 443

Let's Encrypt memakai port **80** untuk validasi HTTP-01, dan port **443** untuk melayani HTTPS. Keduanya harus terbuka.

Cara tercepat lewat PowerShell (jalankan sebagai Administrator):

```powershell
New-NetFirewallRule -DisplayName "HTTP (TCP 80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS (TCP 443)" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

![Ilustrasi New Inbound Rule Wizard di Windows Defender Firewall untuk port 443|Langkah 2 — buka port 443 untuk HTTPS; ulangi untuk port 80.](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/02-firewall.png)

Kalau server berada di Azure, AWS, GCP, atau VPS dengan panel, **jangan lupa membuka port yang sama di security group/firewall cloud**. Firewall Windows saja tidak cukup — banyak kasus "validasi gagal" ternyata karena port 80 masih tertutup di sisi provider.

---

## Langkah 3 — Unduh dan siapkan win-acme

**win-acme** adalah klien ACME untuk Windows yang menangani penerbitan, pemasangan ke IIS, dan renewal otomatis dalam satu alat.

1. Unduh versi terbaru dari halaman rilis resminya: `https://github.com/win-acme/win-acme/releases/latest`
2. Pilih file **x64 pluggable** (contoh nama: `win-acme.v2.x.x.x64.pluggable.zip`).
3. Ekstrak ke folder sederhana, misalnya `C:\win-acme`.
4. Jangan jalankan dari folder unduhan atau folder sementara — renewal nanti memakai path yang sama.

Tidak ada installer. Cukup ekstrak, lalu jalankan `wacs.exe` **as Administrator**. Kalau tidak dijalankan sebagai Administrator, win-acme tidak bisa menulis binding dan sertifikat ke IIS.

---

## Langkah 4 — Terbitkan sertifikat dengan win-acme

Buka **Command Prompt sebagai Administrator**, masuk ke folder win-acme, lalu jalankan:

```powershell
cd C:\win-acme
.\wacs.exe
```

Akan muncul menu seperti ini:

![Ilustrasi menu utama win-acme dengan pilihan M dipilih|Langkah 4 — pilih M: Create certificate (full options).](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/03-win-acme-menu.png)

Pilih **M: Create certificate (full options)** — bukan `N`. Mode default memang lebih cepat, tetapi mode full options memberi kamu kendali atas sumber domain, metode validasi, dan langkah instalasi ke IIS.

Ikuti pilihan berikut:

1. **Source of domains** → pilih **IIS**.
2. **Website** → pilih situs yang tadi sudah punya binding domain (misalnya `Default Web Site`).
3. **Domain** → pilih `domainkamu.com` (tambahkan `www.domainkamu.com` juga kalau dipakai).
4. **Validation** → pilih **http-01 (SelfHosting)**.
5. **Certificate store** → pilih **Windows Certificate Store (Local Computer)**.
6. **Installation** → pilih **IIS Site**, lalu biarkan win-acme membuat atau memperbarui binding HTTPS.
7. Setujui penyimpanan setting ke folder win-acme agar renewal berikutnya konsisten.

Proses validasi akan terlihat seperti ini:

![Ilustrasi proses validasi HTTP-01 win-acme yang berhasil|Langkah 4 — validasi HTTP-01 berhasil, sertifikat langsung diterbitkan.](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/04-win-acme-validation.png)

Kalau muncul `Authorization result: valid`, sertifikat sudah terbit dan dipasang. Kalau gagal, lihat bagian troubleshooting di bawah — penyebab paling umum adalah port 80 tertutup atau DNS belum mengarah ke server.

> Saat masih menguji, gunakan opsi `--test` agar win-acme memakai server staging Let's Encrypt. Ini menghindari rate limit sertifikat produksi ketika kamu melakukan percobaan berulang.

---

## Langkah 5 — Cek binding HTTPS di IIS

Setelah win-acme selesai, binding HTTPS seharusnya sudah otomatis ada. Verifikasinya:

1. Buka **IIS Manager → Sites → Default Web Site → Bindings**.
2. Pastikan ada baris `https`, port `443`, host name domainmu, dengan sertifikat yang sesuai.

![Ilustrasi jendela Site Bindings dengan binding https 443 dan sertifikat Let's Encrypt|Langkah 5 — binding https :443 dibuat otomatis oleh win-acme.](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/05-iis-binding.png)

Dari PowerShell, kamu bisa memastikan sertifikat benar-benar tersimpan di computer store:

```powershell
Get-ChildItem Cert:\LocalMachine\My |
  Where-Object { $_.Subject -like "*domainkamu.com*" } |
  Select-Object Subject, NotAfter, Thumbprint
```

Kalau binding HTTPS belum ada, buka **Bindings → Add**, pilih Type `https`, port `443`, host name domain, lalu pilih sertifikat Let's Encrypt yang baru diterbitkan. Jangan membuat binding manual kalau win-acme sudah membuatnya — dua binding dengan host dan port yang sama justru membingungkan IIS.

---

## Langkah 6 — Verifikasi di browser

Buka `https://domainkamu.com` di browser. Yang harus terlihat:

- Alamat berubah menjadi `https://`.
- Ada ikon **gembok** di address bar.
- Klik ikon gembok → sertifikat valid, diterbitkan oleh Let's Encrypt, dan berlaku sekitar 90 hari.

![Ilustrasi browser dengan address bar https dan informasi sertifikat valid|Langkah 6 — gembok hijau dan sertifikat valid menandakan HTTPS aktif.](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/06-browser-padlock.png)

Beberapa hal yang sering terlewat:

- **Buka di jendela incognito** agar tidak tertipu cache atau HSTS lama.
- Jika halaman tampil tetapi tanpa gembok, pastikan benar-benar membuka `https://`, bukan `http://`.
- Jika gembok muncul tetapi ada peringatan **mixed content**, berarti masih ada gambar/script yang dimuat lewat `http://`. Ubah URL aset tersebut ke `https://` atau URL relatif.
- Untuk pemeriksaan menyeluruh, uji domain di **SSL Labs** (`https://www.ssllabs.com/ssltest/`). Target yang wajar untuk konfigurasi standar IIS + Let's Encrypt adalah grade **A**.

---

## Langkah 7 — Redirect HTTP ke HTTPS

Sertifikat sudah aktif, tetapi pengunjung yang mengetik `http://domainkamu.com` masih bisa masuk lewat koneksi tidak terenkripsi. Supaya semua trafik dipaksa ke HTTPS, gunakan modul **URL Rewrite**.

1. Unduh dan pasang **URL Rewrite** dari `https://www.iis.net/downloads/microsoft/url-rewrite`.
2. Buka **IIS Manager → Default Web Site → URL Rewrite**.
3. Klik **Add Rule(s) → Blank rule**.
4. Isi sesuai gambar berikut.

![Ilustrasi Edit Inbound Rule URL Rewrite untuk redirect HTTP ke HTTPS|Langkah 7 — aturan redirect: pattern (.*), kondisi HTTPS off, aksi 301 ke https.](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/07-url-rewrite.png)

Detail aturannya:

- **Name:** `Redirect to HTTPS`
- **Requested URL:** `Matches the Pattern`
- **Using:** `Regular Expressions`
- **Pattern:** `(.*)`
- **Condition:** input `{HTTPS}`, pattern `off`
- **Action type:** `Redirect`
- **Redirect URL:** `https://{HTTP_HOST}/{R:1}`
- **Redirect type:** `Permanent (301)`

Kalau kamu lebih suka menyimpan konfigurasi di `web.config`, tambahkan bagian `<rewrite>` berikut ke dalam `<system.webServer>`. **Gabungkan** dengan konfigurasi yang sudah ada — jangan menimpa seluruh file.

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Redirect to HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

Tes hasilnya:

```powershell
Invoke-WebRequest http://domainkamu.com -MaximumRedirection 0 -UseBasicParsing
```

Kalau redirect benar, respons akan berupa `301` dengan header `Location: https://domainkamu.com/`.

---

## Langkah 8 — Pastikan renewal otomatis

Sertifikat Let's Encrypt hanya berlaku **90 hari**. Kabar baiknya, win-acme membuat **Scheduled Task** untuk memperpanjangnya otomatis sekitar 30 hari sebelum kedaluwarsa.

![Ilustrasi Task Scheduler dengan tugas renewal win-acme|Langkah 8 — task renewal otomatis buatan win-acme, berjalan setiap hari.](https://is3.cloudhost.id/public-data/project-images/blog/ssl-windows-server/08-task-scheduler.png)

Cek tugasnya dengan PowerShell:

```powershell
Get-ScheduledTask -TaskName "win-acme*" | Select-Object TaskName, State
```

Nama tugasnya biasanya `win-acme renew (acme-v02.api.letsencrypt.org)`. Statusnya harus **Ready** dan jangan dinonaktifkan.

Untuk memicu pemeriksaan renewal secara manual:

```powershell
C:\win-acme\wacs.exe --renew
```

Kalau belum waktunya renewal, win-acme akan melaporkan bahwa tidak ada sertifikat yang jatuh tempo — itu normal. Yang penting tugasnya tetap aktif dan port 80 tetap terbuka, karena renewal juga memakai validasi HTTP-01.

> Jangan mengandalkan pengingat manual. Sertifikat yang kedaluwarsa membuat situs menampilkan peringatan keamanan di semua browser, dan pemulihannya biasanya baru disadari setelah pengunjung mengeluh.

---

## Kalau memakai sertifikat berbayar (PFX)

Alurnya sedikit berbeda, tetapi tetap sederhana:

1. Dapatkan file `.pfx` dan password-nya dari CA.
2. Buka **IIS Manager → klik nama server → Server Certificates → Import**.
3. Pilih file `.pfx`, masukkan password, lalu OK.
4. Buka **Sites → Default Web Site → Bindings → Add**.
5. Pilih Type `https`, port `443`, host name domain, lalu pilih sertifikat yang baru diimpor.

Untuk wildcard certificate, satu sertifikat bisa dipakai beberapa subdomain — pastikan host name di binding sesuai dengan domain yang dicakup.

---

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `Authorization result: invalid` | Port 80 tertutup, DNS salah, atau ada redirect di path challenge | Cek firewall Windows + security group cloud, pastikan A record benar, dan path `/.well-known/acme-challenge/` tidak diblokir |
| `No site found` | Situs IIS berhenti atau binding domain belum ada | Jalankan situsnya dan tambahkan binding HTTP untuk domain tersebut |
| Sertifikat terbit tapi browser tetap "Not secure" | Masih membuka `http://`, cache, atau mixed content | Buka `https://` di incognito, pasang redirect, ubah aset `http://` menjadi `https://` |
| `Too many certificates already issued` | Rate limit Let's Encrypt karena percobaan berulang | Tunggu, atau uji dulu dengan `wacs.exe --test` (staging) |
| Renewal gagal | Scheduled task nonaktif atau port 80 ditutup lagi | Aktifkan task, buka port 80, lalu jalankan `wacs.exe --renew` |
| Error sertifikat di Windows lama | Root certificate ISRG Root X1 belum ada | Update Windows; ini masalah klien, bukan server |
| Cloudflare terpasang | Mode proxy/Keamanan memblokir HTTP-01 | Izinkan path challenge atau gunakan validasi DNS-01 |

---

## Checklist akhir

- [ ] Domain mengarah ke IP server dan bisa diakses lewat HTTP.
- [ ] Port 80 dan 443 terbuka di Windows Firewall **dan** firewall cloud.
- [ ] IIS punya binding HTTP untuk domain.
- [ ] win-acme dijalankan sebagai Administrator.
- [ ] Sertifikat Let's Encrypt terbit dan tersimpan di `LocalMachine\My`.
- [ ] Binding HTTPS port 443 memakai sertifikat tersebut.
- [ ] `https://domainkamu.com` menampilkan gembok hijau.
- [ ] Redirect HTTP → HTTPS aktif dan mengembalikan `301`.
- [ ] Scheduled task renewal win-acme berstatus **Ready**.
- [ ] Tidak ada mixed content di halaman.

Kalau semua poin di atas terpenuhi, website di Windows Server kamu sudah berjalan dengan HTTPS yang terenkripsi dan diperbarui otomatis. Tidak ada biaya sertifikat, dan tidak ada langkah manual yang perlu diulang setiap tiga bulan.
