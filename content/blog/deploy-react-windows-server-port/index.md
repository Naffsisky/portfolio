---
title: 'Deploy ReactJS (Frontend Only) di Windows Server — Akses lewat Port 8080'
date: '2026-11-11'
template: 'post'
draft: false
slug: 'deploy-react-windows-server-port'
category: 'Technology'
tags:
  - 'React'
  - 'IIS'
  - 'Windows Server'
  - 'Deployment'
  - 'DevOps'
description: 'Panduan deploy ReactJS frontend-only ke Windows Server memakai IIS: build produksi, copy ke server, buat site di port 8080, buka firewall, SPA fallback, dan troubleshooting.'
seoTitle: 'Deploy ReactJS Frontend Only di Windows Server (Port 8080)'
seoDescription: 'Tutorial deploy ReactJS frontend-only di Windows Server: build Vite/CRA, konfigurasi IIS di port 8080, firewall, SPA fallback React Router, dan solusi error umum.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/react-windows-server-port/05-react-home.png'
---

React yang dibangun untuk produksi hanyalah kumpulan file statis: HTML, CSS, JavaScript, dan aset gambar. Tidak ada Node.js yang perlu berjalan di server. Artinya, frontend React bisa disajikan oleh web server apa pun — termasuk **IIS di Windows Server** — dan dibuka lewat port khusus seperti `http://IP-SERVER:8080`.

Pola ini berguna ketika port 80 sudah dipakai aplikasi lain, ketika kamu ingin memisahkan frontend dan backend, atau ketika frontend hanya boleh diakses lewat port internal tertentu.

Artikel ini mencatat alurnya dari build sampai aplikasi benar-benar terbuka di port 8080, termasuk jebakan paling umum: **route React Router yang 404 saat di-refresh**.

> **Catatan gambar:** screenshot build dan browser di artikel ini diambil dari praktik nyata di container terisolasi. Tampilan IIS Manager dan Windows Firewall berupa ilustrasi alur, karena lingkungan praktiknya berbasis Linux dan tidak bisa menjalankan Windows Server.

## Arsitektur singkat

- **React + Vite** menghasilkan folder `dist/` (Create React App menghasilkan `build/`).
- **IIS** menyajikan isi folder tersebut sebagai situs statis.
- **Binding** situs diarahkan ke port `8080`.
- **Windows Firewall** membuka port `8080`.
- **URL Rewrite** mengarahkan semua route ke `index.html` agar React Router tetap bekerja.

Node.js hanya dibutuhkan saat build. Di server, yang perlu ada hanyalah IIS dan file hasil build.

## Yang dibutuhkan

- Windows Server 2019/2022 dengan akses Administrator.
- IIS terpasang.
- Node.js 20+ di mesin build (bisa di laptop, bisa juga di server).
- Port `8080` tersedia dan tidak dipakai aplikasi lain.
- Akses ke IP publik server (kalau ingin diakses dari luar).

---

## Langkah 1 — Build aplikasi React

Di folder project:

```bash
npm install
npm run build
```

Untuk Vite, hasilnya ada di `dist/`. Untuk Create React App, hasilnya di `build/`.

![Terminal menjalankan npm run build dan menampilkan isi folder dist|Build produksi dengan Vite: output ada di dist/ dan siap dipindah ke IIS.](https://is3.cloudhost.id/public-data/project-images/blog/react-windows-server-port/04-npm-build.png)

Build boleh dilakukan di laptop, lalu hasilnya diunggah ke server. Server tidak perlu Node.js dan tidak perlu `node_modules`. Yang dipindah hanya isi folder hasil build.

Kalau aplikasi memakai environment variable (`VITE_API_URL`, `REACT_APP_API_URL`), ingat bahwa nilainya **dibekukan saat build**. Jadi build ulang setiap kali konfigurasi berubah.

---

## Langkah 2 — Siapkan folder di Windows Server

Buat folder, misalnya:

```text
C:\inetpub\react-app
```

Salin **isi** folder `dist/` (atau `build/`) ke folder tersebut. Pastikan strukturnya seperti ini:

```text
C:\inetpub\react-app\
├── index.html
├── assets\
│   ├── index-xxxx.css
│   └── index-xxxx.js
└── fonts\
```

Kesalahan paling sering: menyalin folder `dist`-nya, sehingga yang terjadi adalah `C:\inetpub\react-app\dist\index.html`. Kalau `index.html` tidak berada langsung di folder situs, IIS akan mengembalikan 404.

Beri izin baca untuk IIS:

```powershell
icacls "C:\inetpub\react-app" /grant "IIS_IUSRS:(OI)(CI)R"
```

Kalau memakai application pool khusus, beri izin ke identitasnya juga:

```powershell
icacls "C:\inetpub\react-app" /grant "IIS AppPool\react-app:(OI)(CI)R"
```

---

## Langkah 3 — Pastikan IIS terpasang

Kalau IIS belum ada, buka **Server Manager → Add Roles and Features**, lalu centang **Web Server (IIS)**. Lewat PowerShell:

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

Setelah selesai, buka **IIS Manager** (`inetmgr`).

---

## Langkah 4 — Buat website dengan port 8080

Di IIS Manager:

1. Klik kanan **Sites** → **Add Website**.
2. Isi nama situs, misalnya `react-app`.
3. Physical path: `C:\inetpub\react-app`.
4. Pada bagian **Binding**, pilih Type `http`, IP address `All Unassigned`, dan Port `8080`.
5. Biarkan Host name kosong.
6. Centang **Start Website immediately**, lalu OK.

![Ilustrasi dialog Add Website dengan port 8080|Ilustrasi Add Website di IIS Manager: port 8080, host name kosong, physical path ke folder hasil build.](https://is3.cloudhost.id/public-data/project-images/blog/react-windows-server-port/01-iis-add-website.png)

Hasilnya, situs punya binding seperti ini:

![Ilustrasi Site Bindings dengan http port 8080|Ilustrasi Site Bindings: http port 8080 tanpa host name.](https://is3.cloudhost.id/public-data/project-images/blog/react-windows-server-port/02-iis-binding-port.png)

Kenapa port 8080? Karena port 80 biasanya sudah dipakai `Default Web Site` atau aplikasi lain. Dengan binding terpisah, React app bisa hidup berdampingan tanpa mengganggu situs yang sudah ada.

Kalau port 8080 juga sudah dipakai, pilih port lain yang bebas — misalnya 8081 — dan sesuaikan semua langkah berikutnya.

---

## Langkah 5 — Buka port 8080 di firewall

Dari PowerShell sebagai Administrator:

```powershell
New-NetFirewallRule -DisplayName "React App (TCP 8080)" `
  -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

![Ilustrasi aturan inbound firewall untuk port 8080|Ilustrasi New Inbound Rule Wizard: TCP port 8080.](https://is3.cloudhost.id/public-data/project-images/blog/react-windows-server-port/03-firewall-8080.png)

Kalau server berada di Azure, AWS, GCP, atau VPS dengan panel, buka juga port `8080` di **security group/firewall cloud**. Membuka di Windows Firewall saja tidak cukup.

---

## Langkah 6 — Akses aplikasi lewat port

Dari browser:

```text
http://IP-SERVER:8080
```

Atau dari server itu sendiri:

```text
http://localhost:8080
```

![Aplikasi React yang berjalan di port 8080|Aplikasi React yang benar-benar disajikan di port 8080.](https://is3.cloudhost.id/public-data/project-images/blog/react-windows-server-port/05-react-home.png)

Kalau halaman ini terbuka, bagian utama deployment sudah selesai. Masalah yang tersisa biasanya hanya seputar routing, aset, atau cache.

---

## Langkah 7 — SPA fallback untuk React Router

React Router memakai history API. Saat kamu membuka `/fitur` langsung — atau me-refresh halaman itu — browser meminta `/fitur` ke IIS. IIS akan mencari file atau folder bernama `fitur`, tidak menemukannya, lalu mengembalikan **404**. Padahal route itu ditangani React di sisi client.

Solusinya: arahkan semua request yang bukan file/folder ke `index.html`.

1. Pasang **URL Rewrite** dari `https://www.iis.net/downloads/microsoft/url-rewrite`.
2. Buat file `web.config` di `C:\inetpub\react-app`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

Setelah itu, buka route langsung:

```text
http://IP-SERVER:8080/fitur
```

![Route /fitur dibuka langsung dan tetap tampil|Route /fitur dibuka langsung dari URL; SPA fallback mengembalikannya ke index.html.](https://is3.cloudhost.id/public-data/project-images/blog/react-windows-server-port/06-react-spa-route.png)

Kalau halaman ini tampil dan tetap tampil setelah refresh, aturan rewrite sudah benar. Kalau masih 404, cek apakah URL Rewrite benar-benar terpasang dan `web.config` berada di root situs.

> Alternatif tanpa URL Rewrite adalah `HashRouter` (`/#/fitur`). URL-nya kurang rapi, tetapi tidak membutuhkan konfigurasi server. Untuk aplikasi publik, SPA fallback dengan BrowserRouter biasanya lebih disukai.

---

## Langkah 8 — Deploy ulang dan operasional

Untuk update aplikasi:

1. Build ulang di mesin build.
2. Ganti isi `C:\inetpub\react-app` dengan hasil build baru.
3. Pastikan `web.config` tetap ada.
4. Hard refresh browser (`Ctrl + F5`) atau gunakan cache busting.

Vite dan CRA memberi nama file aset dengan hash (`index-BFvvQrLj.js`), jadi file lama dan baru tidak bentrok. Namun `index.html` biasanya tidak di-hash — pastikan tidak di-cache terlalu lama.

Beberapa catatan produksi:

- Gunakan **HTTPS** kalau aplikasi diakses publik. Tambahkan binding `https` dengan sertifikat, atau terminasi TLS di reverse proxy.
- Jangan buka port yang tidak dipakai.
- Kalau frontend memanggil API di server lain, atur base URL API saat build dan pastikan CORS di backend mengizinkan origin `http://IP-SERVER:8080`.
- Aktifkan kompresi statis di IIS kalau aset cukup besar.
- Simpan `web.config` di source control agar konfigurasi tidak hilang saat deploy.

---

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| 403 Forbidden | `IIS_IUSRS` tidak punya izin baca, atau physical path salah | Beri izin `icacls`, pastikan path ke folder yang berisi `index.html` |
| 404 di semua halaman | Physical path menunjuk ke folder induk, bukan isi `dist/` | Arahkan ke folder yang langsung berisi `index.html` |
| 404 hanya saat refresh di `/fitur` | SPA fallback belum ada | Pasang URL Rewrite dan `web.config` |
| Halaman blank putih | Path aset salah, build tidak lengkap, atau error JavaScript | Buka DevTools → Console/Network, cek `base`/`homepage` |
| Port 8080 tidak bisa diakses | Windows Firewall atau security group cloud | Buka port 8080 di keduanya |
| Hanya bisa diakses dari server | Binding memakai IP `127.0.0.1` | Gunakan `All Unassigned` dan buka firewall |
| Error MIME type untuk `.woff2`/`.json` | MIME map IIS belum lengkap | Tambahkan MIME type di IIS Manager |
| Masih tampil versi lama | Cache browser atau `index.html` ter-cache | Hard refresh, cek header cache `index.html` |
| 500 Internal Server Error | `web.config` tidak valid | Perbaiki XML, cek URL Rewrite |
| Request API gagal (CORS) | Frontend dan backend beda origin/port | Aktifkan CORS di backend atau gunakan reverse proxy |

---

## Checklist akhir

- [ ] `npm run build` berhasil dan folder hasil build berisi `index.html`.
- [ ] Isi `dist/`/`build/` disalin ke `C:\inetpub\react-app`, bukan foldernya.
- [ ] IIS terpasang dan situs dibuat di port 8080.
- [ ] Binding `http` port 8080 memakai IP `All Unassigned`.
- [ ] Port 8080 dibuka di Windows Firewall dan firewall cloud.
- [ ] `http://IP-SERVER:8080` menampilkan aplikasi.
- [ ] URL Rewrite + `web.config` membuat route React tetap hidup saat refresh.
- [ ] Izin baca `IIS_IUSRS` diberikan ke folder situs.
- [ ] Proses build ulang dan deploy ulang sudah dicatat.

Dengan susunan ini, React frontend-only berjalan sebagai situs statis biasa di IIS. Tidak ada Node.js di server, tidak ada proses yang perlu dijaga tetap hidup, dan aplikasi bisa diakses lewat port yang kamu tentukan sendiri.
