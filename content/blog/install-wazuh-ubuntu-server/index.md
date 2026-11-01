---
title: 'Install Wazuh di Ubuntu Server: Dari Nol Sampai Masuk Dashboard'
date: '2026-11-01'
template: 'post'
draft: false
slug: 'install-wazuh-ubuntu-server'
category: 'Cybersecurity'
tags:
  - 'Wazuh'
  - 'SIEM'
  - 'Ubuntu'
  - 'Docker'
  - 'Blue Team'
description: 'Panduan lengkap install Wazuh single-node dengan Docker Compose di Ubuntu Server, mulai dari instalasi Docker, generate certificate, sampai login ke dashboard. Semua command sudah diuji langsung.'
seoTitle: 'Tutorial Install Wazuh Single-Node di Ubuntu Server (Docker)'
seoDescription: 'Langkah demi langkah install Wazuh 4.14 di Ubuntu Server pakai Docker Compose: prasyarat, generate certificate, running stack, troubleshooting, sampai masuk dashboard.'
socialImage: '/blog/install-wazuh-ubuntu-server/images/02-dashboard-overview.png'
---

## Kenapa Wazuh?

**Wazuh** adalah platform keamanan open source yang menggabungkan tiga hal dalam satu paket:

- **SIEM** — mengumpulkan dan menganalisis log dari endpoint, server, dan perangkat jaringan.
- **XDR / HIDS** — mendeteksi perubahan file (FIM), malware, rootkit, dan anomali di endpoint.
- **Compliance** — punya aturan bawaan untuk PCI DSS, HIPAA, GDPR, dan CIS Benchmark.

Kalau biasanya kita cuma punya `auth.log` yang menumpuk tanpa pernah dibaca, Wazuh mengubah tumpukan itu jadi alert yang bisa ditindaklanjuti.

Di artikel ini kita akan install **Wazuh single-node** memakai **Docker Compose** — cara tercepat untuk mencoba Wazuh tanpa harus mengurus satu per satu service-nya.

### Catatan versi

Tutorial ini diuji langsung pada:

| Komponen | Versi |
|---|---|
| OS | Ubuntu Server 24.04 LTS (kernel 6.8) |
| Wazuh | 4.14.9 |
| Docker Engine | 27.5.1 |
| Docker Compose | v2.33.0 |

Semua langkah di bawah berlaku sama untuk **Ubuntu Server 26.04 LTS** — tidak ada paket atau path yang berubah antar keduanya.

---

## Arsitektur yang akan kita bangun

Single-node Wazuh terdiri dari tiga container:

```
┌─────────────────────────────────────────────────┐
│                   Ubuntu Server                 │
│                                                 │
│  ┌──────────────┐   ┌──────────────┐            │
│  │   Wazuh      │   │   Wazuh      │            │
│  │  Dashboard   │──▶│   Indexer    │            │
│  │  (port 443)  │   │  (port 9200) │            │
│  └──────┬───────┘   └──────▲───────┘            │
│         │                  │                    │
│         ▼                  │                    │
│  ┌─────────────────────────┴────────┐           │
│  │        Wazuh Manager             │           │
│  │  API 55000 · Agent 1514/1515     │           │
│  └──────────────────────────────────┘           │
└─────────────────────────────────────────────────┘
```

- **Indexer** (OpenSearch fork) — menyimpan alert dan event.
- **Manager** — otak deteksinya: decoder, rules, dan API.
- **Dashboard** — UI berbasis OpenSearch Dashboards di port 443.

---

## Prasyarat

Minimal spesifikasi yang nyaman untuk single-node:

- **2 vCPU** (4 lebih baik)
- **4 GB RAM** minimum — **8 GB disarankan**, karena indexer (JVM) cukup rakus
- **50 GB disk**
- Ubuntu Server 24.04 / 26.04 LTS dengan akses `sudo`
- Port `443`, `1514`, `1515`, `55000` tidak dipakai service lain

> Kalau RAM cuma 2 GB, indexer biasanya mati sendiri (OOM). Jangan buang waktu debugging — tambah RAM dulu.

---

## Step 1 — Update sistem dan paket dasar

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl ca-certificates gnupg lsb-release git
```

Pastikan timezone dan hostname rapi, karena log akan memakai keduanya:

```bash
sudo timedatectl set-timezone Asia/Jakarta
hostnamectl
```

---

## Step 2 — Install Docker Engine

Kita pakai repo resmi Docker, bukan `docker.io` dari repo Ubuntu, supaya versi Compose plugin-nya terbaru.

```bash
# 1. Tambahkan GPG key resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 2. Tambahkan repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Supaya tidak perlu sudo tiap kali
sudo usermod -aG docker $USER
newgrp docker
```

Verifikasi:

```bash
docker version --format '{{.Server.Version}}'
docker compose version
```

Output yang kita dapat saat pengujian:

```text
27.5.1
Docker Compose version v2.33.0
```

---

## Step 3 — Naikkan `vm.max_map_count`

Ini langkah yang **paling sering terlewat**. Indexer butuh `vm.max_map_count` minimal `262144`; kalau kurang, container indexer akan crash dengan error `max virtual memory areas vm.max_map_count [65530] is too low`.

```bash
sudo sysctl -w vm.max_map_count=262144
```

Agar permanen setelah reboot:

```bash
echo "vm.max_map_count=262144" | sudo tee /etc/sysctl.d/99-wazuh.conf
sudo sysctl --system
```

Cek hasilnya:

```bash
sysctl vm.max_map_count
```

```text
vm.max_map_count = 262144
```

---

## Step 4 — Ambil Wazuh Docker

Repo resmi Wazuh menyediakan versi yang sudah tersusun rapi per release. Selalu pin ke tag versi, jangan `master`, supaya konfigurasi tidak berubah tiba-tiba.

```bash
git clone https://github.com/wazuh/wazuh-docker.git -b v4.14.9 --depth 1
cd wazuh-docker/single-node
```

Isi direktorinya:

```text
README.md
config/
docker-compose.yml
generate-indexer-certs.yml
```

---

## Step 5 — Generate certificate

Ketiga komponen saling berkomunikasi lewat TLS, jadi sertifikat harus dibuat lebih dulu. Wazuh sudah menyediakan container generator khusus:

```bash
docker compose -f generate-indexer-certs.yml run --rm generator
```

Output suksesnya kurang lebih:

```text
INFO: Generating the root certificate.
INFO: Generating Admin certificates.
INFO: Admin certificates created.
INFO: Generating Wazuh indexer certificates.
INFO: Wazuh indexer certificates created.
INFO: Generating Filebeat certificates.
INFO: Wazuh Filebeat certificates created.
INFO: Generating Wazuh dashboard certificates.
INFO: Wazuh dashboard certificates created.
Moving created certificates to the destination directory
Changing certificate permissions
Setting UID indexer and dashboard
Setting UID for wazuh manager and worker
```

Sertifikat akan muncul di folder `config/wazuh_indexer_ssl_certs/`.

> Pesan `find: command not found` di akhir proses bisa diabaikan — itu hanya pembersihan file sementara di dalam container generator, sertifikat tetap dibuat dengan benar.

---

## Step 6 — Jalankan stack

```bash
docker compose up -d
```

First run akan mengunduh sekitar **4,5 GB** image, jadi sabar. Total ukuran image setelah selesai:

```text
wazuh/wazuh-manager:4.14.9     1.65GB
wazuh/wazuh-indexer:4.14.9     1.46GB
wazuh/wazuh-dashboard:4.14.9   1.35GB
wazuh/wazuh-certs-generator:0.0.4  270MB
```

Cek status container:

```bash
docker compose ps
```

```text
NAME                            IMAGE                          STATUS
single-node-wazuh.dashboard-1   wazuh/wazuh-dashboard:4.14.9   Up 36 minutes
single-node-wazuh.indexer-1     wazuh/wazuh-indexer:4.14.9     Up 36 minutes
single-node-wazuh.manager-1     wazuh/wazuh-manager:4.14.9     Up 36 minutes
```

Port yang terbuka di host:

```bash
ss -tlnp | grep -E '443|9200|1514|55000'
```

| Port | Service | Keterangan |
|---|---|---|
| 443 | Dashboard | UI web (HTTPS) |
| 9200 | Indexer | REST API, **jangan** diekspos ke publik |
| 1514/1515 | Manager | Registrasi & komunikasi agent |
| 55000 | Manager API | Dipakai dashboard |

Kalau ada container yang langsung mati, lihat log-nya:

```bash
docker compose logs --tail=50 wazuh.indexer
docker compose logs --tail=50 wazuh.manager
```

---

## Step 7 — Buka dashboard

Akses dari browser:

```
https://IP-SERVER-ANDA
```

Browser akan protes sertifikat karena certificate-nya self-signed. Klik **Advanced → Proceed** (di production, ganti dengan sertifikat Let's Encrypt).

Halaman login akan terlihat seperti ini:

![Halaman login Wazuh Dashboard](/blog/install-wazuh-ubuntu-server/images/01-login-wazuh.png)

Kredensial default dari `docker-compose.yml`:

```text
Username: admin
Password: SecretPassword
```

> Password default ini **wajib** diganti sebelum server dipakai serius. Caranya ada di bagian hardening di bawah.

Setelah login, Wazuh akan melakukan health check dulu (API connection, index pattern, dan seterusnya). Proses ini bisa memakan **beberapa menit** pada first boot, karena indexer masih membuat index awal. Jangan buru-buru menganggapnya error.

Kalau semua centang hijau, kita akan masuk ke halaman **Overview**:

![Dashboard overview Wazuh setelah login berhasil](/blog/install-wazuh-ubuntu-server/images/02-dashboard-overview.png)

Di screenshot di atas terlihat:

- **Agents summary** masih kosong — normal, belum ada endpoint yang terdaftar.
- **Last 24 hours alerts** sudah menampilkan **46 medium** dan **140 low severity**. Ini bukan serangan; ini event bawaan hasil monitoring manager itu sendiri (misalnya rule SSH, autentikasi, dan file integrity).
- **Threat intelligence** dan **Security operations** sudah aktif dan siap dipakai begitu agent terpasang.

Sampai titik ini, SIEM-nya sudah jalan. 🎉

---

## Step 8 — (Opsional) Deploy agent pertama

Supaya dashboard tidak kosong, daftarkan satu endpoint. Di dashboard klik **Deploy new agent**, pilih OS, lalu jalankan perintah yang diberikan di endpoint tersebut. Bentuknya kira-kira:

```bash
curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.14.9-1_amd64.deb
sudo WAZUH_MANAGER='IP-SERVER' WAZUH_AGENT_NAME='server-01' dpkg -i ./wazuh-agent.deb
sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-agent
```

Setelah beberapa menit, agent akan muncul di daftar **Agents management** dengan status **Active**, dan grafik di Overview mulai terisi.

---

## Troubleshooting

Beberapa masalah yang paling sering muncul, plus penyebab aslinya:

### 1. Indexer crash: `max virtual memory areas too low`

```text
bootstrap checks failed
max virtual memory areas vm.max_map_count [65530] is too low
```

Solusi: ulangi **Step 3**, lalu restart:

```bash
docker compose restart wazuh.indexer
```

### 2. `bind: address already in use` di port 443

Sering terjadi kalau server sudah punya Nginx/Apache. Cek dulu:

```bash
sudo ss -tlnp | grep ':443'
```

Pilihannya: matikan service tersebut, atau ubah mapping port di `docker-compose.yml`:

```yaml
ports:
  - "8443:5601"
```

Setelah diubah, akses lewat `https://IP-SERVER:8443`.

### 3. Container tidak bisa resolve DNS

Kalau server memakai resolver internal (misalnya di dalam cluster atau di belakang VPN), container bisa gagal melakukan `git clone` atau menarik image. Tes dari dalam container:

```bash
docker run --rm alpine nslookup github.com
```

Kalau gagal, set DNS eksplisit di `/etc/docker/daemon.json`:

```json
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
```

lalu:

```bash
sudo systemctl restart docker
```

> Ini kejadian nyata saat pengujian: container tidak bisa resolve `api.github.com` sampai DNS-nya di-set eksplisit. Jangan langsung menyalahkan Wazuh.

### 4. Dashboard stuck di "Loading ..."

Biasanya cuma soal waktu. Cek apakah indexer sudah benar-benar siap:

```bash
curl -k -u admin:SecretPassword https://localhost:9200/_cluster/health
```

Kalau `"status":"red"` atau koneksi ditolak, indexer belum siap — lihat lognya, jangan restart berulang kali.

### 5. Lupa password admin

Reset lewat securityadmin di container indexer:

```bash
docker exec -it single-node-wazuh.indexer-1 bash
cd /usr/share/wazuh-indexer/plugins/opensearch-security/tools
./hash.sh -p 'PasswordBaruAnda#123'
```

Lalu update hash di `internal_users.yml` dan jalankan `securityadmin.sh`. Simpan hasilnya di password manager.

---

## Hardening sebelum dipakai serius

Tiga hal yang tidak boleh dilewat kalau server ini akan menghadap internet:

1. **Ganti semua password default** di `docker-compose.yml` (`INDEXER_PASSWORD`, `API_PASSWORD`, `DASHBOARD_PASSWORD`), lalu generate ulang sertifikat dan restart stack.
2. **Batasi akses port.** Jangan biarkan `9200` dan `55000` terbuka ke publik:

   ```bash
   sudo ufw allow from 103.x.x.x to any port 443 proto tcp
   sudo ufw allow from 103.x.x.x to any port 1514 proto tcp
   sudo ufw enable
   ```

3. **Pasang TLS yang valid** (Let's Encrypt) di depan dashboard, dan pertimbangkan reverse proxy seperti Nginx atau Traefik.

Wazuh adalah alat yang mengumpulkan **seluruh log** server — termasuk informasi yang sensitif. Perlakukan dashboard-nya setara dengan akses root.

---

## Penutup

Dengan Docker Compose, Wazuh single-node bisa jalan dalam hitungan menit: tiga container, satu perintah `docker compose up -d`, dan kita sudah punya SIEM lengkap dengan dashboard.

Langkah selanjutnya yang menarik untuk dieksplorasi:

- Menambahkan **file integrity monitoring** di folder kritis (`/etc`, `/var/www`).
- Membuat **custom rule** untuk log aplikasi sendiri.
- Mengirim alert Wazuh ke **Telegram** atau Slack lewat integrasi manager.
- Naik ke arsitektur **cluster** (multi-node) kalau endpoint sudah banyak.

Selamat membangun home lab-nya. Kalau ada langkah yang macet, bagian troubleshooting di atas biasanya sudah menutup 90% kasus.
