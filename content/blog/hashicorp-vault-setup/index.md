---
title: 'Setup HashiCorp Vault: dari Development hingga Integrasi Aplikasi di VPS'
date: '2026-04-22'
template: 'post'
draft: false
slug: 'hashicorp-vault-setup'
category: 'Technology'
tags:
  - 'Vault'
  - 'DevOps'
  - 'Docker'
  - 'Security'
  - 'Next.js'
description: 'Panduan lengkap setup HashiCorp Vault dari mode development hingga production, termasuk inisialisasi, unseal, konfigurasi AppRole, Vault Agent, dan integrasi secrets ke aplikasi Next.js di VPS.'
seoTitle: 'Setup HashiCorp Vault: Dev, Production & Integrasi VPS'
seoDescription: 'Panduan setup HashiCorp Vault dengan Docker: inisialisasi, unseal, AppRole authentication, Vault Agent sidecar, dan integrasi secrets ke aplikasi Next.js di VPS.'
socialImage: ''
---

## Intro

**HashiCorp Vault** adalah tool manajemen secrets yang memungkinkan kita menyimpan, mengakses, dan mendistribusikan credentials (API key, database URL, token) secara aman tanpa harus hardcode di environment variable atau file `.env` yang rawan ter-expose.

Di catatan ini saya setup Vault mulai dari mode development menggunakan Docker, lalu ke mode production dengan konfigurasi file, kemudian mengintegrasikannya ke aplikasi Next.js yang berjalan di VPS menggunakan **Vault Agent** dan **AppRole authentication**.

---

## 1. Setup Development dengan Docker Compose

Untuk development, Vault bisa dijalankan dalam mode `dev` yang otomatis unsealed dan tidak perlu inisialisasi. Root token default adalah `root`.

Buat `docker-compose.yml`:

```yaml
services:
  vault-dev:
    hostname: vault
    container_name: vault-dev
    image: hashicorp/vault:latest
    environment:
      VAULT_ADDR: "http://0.0.0.0:8200"
      VAULT_API_ADDR: "http://0.0.0.0:8200"
    ports:
      - "8200:8200"
    cap_add:
      - IPC_LOCK
    entrypoint: vault server -dev -dev-listen-address="0.0.0.0:8200" -dev-root-token-id="root"
```

Jalankan dan akses shell container:

```bash
docker compose up -d
docker exec -t vault-dev sh
```

UI tersedia di `http://0.0.0.0:8200`, login dengan token `root`.

---

## 2. Instalasi Vault CLI di Linux

Untuk berinteraksi dengan Vault dari terminal, install binary CLI-nya:

```bash
wget -O - https://apt.releases.hashicorp.com/gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com \
  $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update && sudo apt install vault -y
vault version
```

Set environment agar CLI tahu ke mana harus konek:

```bash
export VAULT_ADDR=http://192.168.1.10:8200
export VAULT_TOKEN=root
```

---

## 3. Fix Permission Error pada Volume

Kalau saat menjalankan container production muncul error `permission denied` di `/vault/data`, jalankan container Alpine sementara untuk fix ownership volume:

```bash
docker compose down
docker run --rm -v vault-data:/vault/data alpine chown -R 100:1000 /vault/data
docker compose up -d
docker ps
docker logs vault
```

---

## 4. Konfigurasi Production

### config.hcl

Buat direktori `conf/` lalu buat file `conf/config.hcl`:

```hcl
ui            = true
disable_mlock = true

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

api_addr = "http://0.0.0.0:8200"
```

### docker-compose.yml (Production)

```yaml
services:
  vault:
    hostname: vault
    container_name: vault
    image: hashicorp/vault:latest
    restart: unless-stopped
    entrypoint: vault server -config=/vault/config/config.hcl
    ports:
      - "8200:8200"
    environment:
      VAULT_ADDR: "http://0.0.0.0:8200"
    volumes:
      - "./conf:/vault/config"
      - "vault-data:/vault/data"
    cap_add:
      - IPC_LOCK

volumes:
  vault-data:
    driver: local
    name: vault-data
```

---

## 5. Inisialisasi dan Unseal Vault

Vault production perlu diinisialisasi sekali setelah pertama kali dijalankan. Proses ini menghasilkan **unseal keys** dan **root token** — simpan dengan sangat aman karena tidak bisa direcovery.

```bash
export VAULT_ADDR='http://127.0.0.1:8200'

# Simpan output ke file yang aman
vault operator init > vault-init.txt
```

Output berisi 5 unseal key dan 1 root token. Vault butuh minimal 3 key untuk dibuka (threshold default). Unseal satu per satu:

```bash
vault operator unseal <Unseal_Key_1>
vault operator unseal <Unseal_Key_2>
vault operator unseal <Unseal_Key_3>
```

Verifikasi status:

```bash
vault status
```

Login dengan root token:

```bash
vault login <Root_Token>
```

> Vault harus di-unseal ulang setiap kali container restart. Pertimbangkan **auto-unseal** menggunakan cloud KMS untuk production yang lebih serius.

---

## 6. Setup AppRole Authentication

**AppRole** adalah metode autentikasi yang cocok untuk aplikasi dan service. Menggunakan `role-id` (identitas publik) dan `secret-id` (kredensial rahasia) yang dipisah, sehingga tidak ada satu titik kegagalan tunggal.

### Enable AppRole dan buat policy

```bash
vault auth enable approle
```

Buat policy yang membatasi akses hanya ke path secrets yang diperlukan:

```bash
vault policy write napskytech - <<EOF
path "secret/data/napskytech/production" {
  capabilities = ["read", "list"]
}
EOF
```

### Buat role dan ambil credentials

```bash
# Buat role dengan TTL token
vault write auth/approle/role/napskytech \
  token_ttl=1h \
  token_max_ttl=4h \
  policies="napskytech"

# Ambil role-id
vault read auth/approle/role/napskytech/role-id

# Generate secret-id
vault write -f auth/approle/role/napskytech/secret-id
```

### Simpan credentials ke file

File ini akan di-mount ke container Vault Agent:

```bash
vault read auth/approle/role/napskytech/role-id \
  -format=json | jq '.data.role_id' > vault-agent/role-id

vault write -f auth/approle/role/napskytech/secret-id \
  -format=json | jq '.data.secret_id' > vault-agent/secret-id
```

---

## 7. Konfigurasi Vault Agent

**Vault Agent** berjalan sebagai sidecar container yang otomatis autentikasi ke Vault, mengambil secrets, dan merendernya ke file `.env` di shared volume yang bisa dibaca aplikasi.

### vault-agent/agent.hcl

```hcl
vault {
  address = "http://<VAULT_IP>:8200"
}

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path   = "/vault/config/role-id"
      secret_id_file_path = "/vault/config/secret-id"
    }
  }
}

template {
  source      = "/vault/config/app.env.tpl"
  destination = "/secrets/.env"
}
```

### vault-agent/app.env.tpl

Template ini di-render oleh Vault Agent menjadi file `.env` yang berisi nilai secrets aktual:

```
{{ with secret "secret/data/napskytech/production" }}
DATABASE_URL={{ .Data.data.DATABASE_URL }}
API_KEY={{ .Data.data.API_KEY }}
NEXTAUTH_SECRET={{ .Data.data.NEXTAUTH_SECRET }}
{{ end }}
```

Sesuaikan path `secret/data/napskytech/production` dan nama field dengan secrets yang sudah disimpan di Vault.

---

## 8. Integrasi ke Aplikasi di VPS

Gabungkan Vault Agent dan aplikasi Next.js dalam satu `docker-compose.yml` menggunakan **shared volume** untuk meneruskan secrets:

```yaml
services:
  vault-agent:
    image: hashicorp/vault:latest
    container_name: vault-agent
    restart: unless-stopped
    entrypoint: vault agent -config=/vault/config/agent.hcl
    volumes:
      - "./vault-agent:/vault/config"
      - "secrets-vol:/secrets"
    environment:
      VAULT_ADDR: "http://<VAULT_IP>:8200"

  napskytech:
    image: ghcr.io/naffsisky/napskytech:latest
    container_name: napskytech
    restart: unless-stopped
    depends_on:
      - vault-agent
    ports:
      - "3000:3000"
    volumes:
      - "secrets-vol:/secrets:ro"
    command: >
      sh -c "export $(cat /secrets/.env | xargs) && node server.js"

volumes:
  secrets-vol:
```

Poin penting dari konfigurasi ini:

- `vault-agent` membaca `role-id` dan `secret-id` dari `./vault-agent/`, autentikasi ke Vault, lalu render template ke `/secrets/.env`
- `napskytech` mount volume yang sama sebagai **read-only**, lalu inject isi `.env` ke environment sebelum server start
- `depends_on` memastikan Vault Agent sudah jalan sebelum aplikasi start

---

## Alur Lengkap

```
Vault Server (production)
      │  AppRole auth (role-id + secret-id)
      ▼
Vault Agent (sidecar container)
      │  render template → /secrets/.env
      ▼
shared volume (secrets-vol)
      │  mount read-only
      ▼
Aplikasi Next.js
      │  export $(cat /secrets/.env | xargs)
      ▼
node server.js berjalan dengan secrets di environment
```

---

## Struktur Direktori

```
~/vault-setup/
├── conf/
│   └── config.hcl          ← konfigurasi Vault server
├── vault-agent/
│   ├── agent.hcl           ← konfigurasi Vault Agent
│   ├── app.env.tpl         ← template secrets
│   ├── role-id             ← AppRole role-id (jangan di-commit!)
│   └── secret-id           ← AppRole secret-id (jangan di-commit!)
├── docker-compose.yml      ← Vault server (production)
└── vault-init.txt          ← unseal keys & root token (simpan offline!)
```

---

## Recap

| Komponen | Fungsi |
|---|---|
| Vault Server | Menyimpan dan mengamankan secrets |
| AppRole | Autentikasi aplikasi ke Vault tanpa password hardcode |
| Vault Agent | Sidecar yang auto-renew token dan render secrets ke file |
| Shared Volume | Jembatan secrets antara Vault Agent dan aplikasi |
| Template `.env.tpl` | Mendefinisikan secrets apa yang di-inject ke aplikasi |
