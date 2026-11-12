---
title: 'Terraform + Ansible: Provisioning dan Konfigurasi Infrastruktur dalam Satu Alur'
date: '2026-11-12'
template: 'post'
draft: false
slug: 'terraform-ansible-lab'
category: 'Technology'
tags:
  - 'Terraform'
  - 'Ansible'
  - 'Docker'
  - 'Infrastructure as Code'
  - 'DevOps'
description: 'Panduan praktis menggabungkan Terraform dan Ansible: Terraform membuat network dan dua container web, Ansible mengonfigurasi Nginx lewat SSH, lengkap dengan inventory otomatis, idempotency, dan destroy.'
seoTitle: 'Terraform + Ansible: Lab Provisioning dan Konfigurasi'
seoDescription: 'Belajar Terraform dan Ansible dalam satu alur: provisioning container dengan Docker provider, inventory otomatis, playbook Nginx, idempotency, dan terraform destroy.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/00-cover.png'
---

Terraform dan Ansible sering disebut dalam satu napas, padahal perannya berbeda. **Terraform** membangun infrastruktur: network, server, container, load balancer. **Ansible** mengonfigurasi isi server tersebut: paket, service, file konfigurasi, dan aplikasi.

Kalau dipaksakan sendiri-sendiri, hasilnya sering setengah jalan. Terraform bisa membuat server, tetapi tidak tahu cara memasang Nginx dan menaruh halaman web. Ansible bisa mengonfigurasi server, tetapi tidak bisa membuat server itu dari nol.

Artikel ini menggabungkan keduanya dalam satu alur nyata:

1. **Terraform** membuat Docker network, dua container web, dan file inventory Ansible.
2. **Ansible** terhubung lewat SSH, memasang Nginx, dan men-deploy halaman.
3. Browser membuka halaman dari kedua container.
4. **Terraform destroy** menghapus semuanya.

Lab ini berjalan di Docker, jadi tidak butuh kredensial cloud. Semua screenshot di artikel ini diambil dari eksekusi nyata di container terisolasi.

## Arsitektur lab

```text
Terraform
├── docker_network "terraform-ansible-lab"
├── docker_container "web1"  → port 8081
├── docker_container "web2"  → port 8082
└── local_file "inventory.ini"

Ansible
├── ping kedua host
├── install nginx
├── deploy index.html
└── pastikan service berjalan
```

Container web dibuat dari image Ubuntu 24.04 yang sudah memiliki `openssh-server` dan `python3`. Ansible membutuhkan keduanya: SSH untuk masuk, Python untuk menjalankan module.

## Yang dibutuhkan

- Docker Engine di mesin lokal atau server lab.
- Terraform 1.6+ (di artikel ini dijalankan lewat container `hashicorp/terraform`).
- Ansible (dijalankan lewat container `lab-ansible`).
- Tidak perlu akun cloud.

> Lab ini memakai login `root` lewat SSH key. Itu praktis untuk latihan, tetapi bukan konfigurasi produksi. Di produksi, gunakan user khusus, nonaktifkan login root, dan kelola key dengan benar.

## Struktur project

```text
tf-ansible-lab/
├── image/
│   ├── Dockerfile
│   └── authorized_keys
├── ssh/
│   ├── id_ed25519
│   └── id_ed25519.pub
├── terraform/
│   ├── main.tf
│   └── outputs.tf
├── ansible/
│   ├── ansible.cfg
│   ├── site.yml
│   └── templates/
│       └── index.html.j2
├── ansible-runner/
│   └── Dockerfile
└── shots/
```

Inventory **tidak** ditulis manual. Terraform yang membuatnya dari jumlah container, sehingga daftar host selalu sinkron dengan infrastruktur.

---

## Langkah 1 — Siapkan image Ubuntu dengan SSH

Image `ubuntu:24.04` biasa tidak menjalankan SSH server. Untuk lab Ansible, kita buat image kecil yang sudah siap:

```dockerfile
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssh-server python3 python3-apt sudo curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/sshd /root/.ssh \
    && ssh-keygen -A \
    && sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config

COPY authorized_keys /root/.ssh/authorized_keys
RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys

EXPOSE 22
CMD ["sh", "-c", "mkdir -p /run/sshd && exec /usr/sbin/sshd -D -e"]
```

Buat key pair dan build image:

```bash
ssh-keygen -t ed25519 -N "" -f ssh/id_ed25519
cp ssh/id_ed25519.pub image/authorized_keys
docker build -t lab-ubuntu-ssh:latest image/
```

`ssh-keygen -A` membuat host key SSH saat build. `PermitRootLogin prohibit-password` mengizinkan login root hanya dengan key, bukan password. Ini cukup untuk lab yang tidak terbuka ke publik.

Image runner Ansible juga dibuat terpisah:

```dockerfile
FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssh-client bash sshpass \
    && pip install --no-cache-dir ansible-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work
```

```bash
docker build -t lab-ansible:latest ansible-runner/
```

---

## Langkah 2 — Konfigurasi Terraform

Terraform memakai provider Docker dan provider Local:

```hcl
terraform {
  required_version = ">= 1.6"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "docker" {}

variable "web_count" {
  type    = number
  default = 2
}
```

Network dan container web:

```hcl
resource "docker_network" "lab" {
  name = "terraform-ansible-lab"
}

resource "docker_container" "web" {
  count    = var.web_count
  name     = "web${count.index + 1}"
  hostname = "web${count.index + 1}"
  image    = "lab-ubuntu-ssh:latest"

  networks_advanced {
    name = docker_network.lab.name
  }

  ports {
    internal = 80
    external = 8081 + count.index
  }
}
```

Bagian yang menyambungkan Terraform ke Ansible adalah inventory otomatis:

```hcl
resource "local_file" "inventory" {
  filename = "${path.module}/../ansible/inventory.ini"
  content = join("\n", concat(
    ["[web]"],
    [for i in range(var.web_count) :
      "web${i + 1} ansible_host=web${i + 1} ansible_user=root ansible_ssh_private_key_file=/work/ssh/id_ed25519"
    ]
  ))
}
```

Output-nya berguna untuk verifikasi:

```hcl
output "web_urls" {
  value = [for i in range(var.web_count) : "http://localhost:${8081 + i}"]
}

output "container_names" {
  value = [for c in docker_container.web : c.name]
}
```

Terraform dijalankan dari container, dengan Docker socket dimount agar provider bisa membuat container di host:

```bash
docker run --rm -it --hostname terraform \
  -v "$PWD":/work \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /work/terraform --entrypoint sh \
  hashicorp/terraform:latest
```

> Mounting Docker socket memberi container akses setara root ke Docker daemon. Itu wajar untuk lab lokal, tetapi jangan dilakukan sembarangan di server bersama.

---

## Langkah 3 — Init, plan, dan apply

Di dalam container Terraform:

```bash
terraform init -input=false
```

![Terraform init mengunduh provider Docker dan Local|Terraform init: provider Docker dan Local terpasang, lock file dibuat.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/01-terraform-init.png)

`terraform init` mengunduh provider dan membuat `.terraform.lock.hcl`. Lock file ini **harus di-commit** agar versi provider konsisten di mesin lain. Folder `.terraform/` tidak perlu di-commit.

Lihat rencana perubahan:

```bash
terraform plan -input=false
```

![Terraform plan menunjukkan 4 resource akan dibuat|Terraform plan: 4 resource akan dibuat, termasuk inventory Ansible.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/02-terraform-plan.png)

Plan menunjukkan empat resource: satu network, dua container, dan satu file inventory. Perhatikan bahwa `local_file.inventory` ikut dibuat — inilah jembatan ke Ansible.

Terapkan:

```bash
terraform apply -auto-approve -input=false
```

![Terraform apply membuat network, dua container, dan inventory|Terraform apply: 4 resource dibuat, output berisi URL web1 dan web2.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/03-terraform-apply.png)

Setelah apply selesai, container `web1` dan `web2` berjalan, port 8081 dan 8082 terbuka, dan `ansible/inventory.ini` sudah terisi.

---

## Langkah 4 — Inventory dan tes koneksi Ansible

Isi inventory yang dihasilkan Terraform:

```ini
[web]
web1 ansible_host=web1 ansible_user=root ansible_ssh_private_key_file=/work/ssh/id_ed25519
web2 ansible_host=web2 ansible_user=root ansible_ssh_private_key_file=/work/ssh/id_ed25519
```

Nama `web1` dan `web2` bisa dipakai sebagai alamat karena Ansible berjalan di Docker network yang sama, dan Docker menyediakan DNS internal untuk nama container.

Jalankan runner Ansible:

```bash
docker run --rm -it --hostname ansible \
  --network terraform-ansible-lab \
  -v "$PWD":/work -w /work/ansible \
  lab-ansible:latest bash
```

Tes koneksi:

```bash
ansible -i inventory.ini web -m ping
```

![Ansible ping berhasil ke web1 dan web2|Ansible ping: kedua host merespons pong lewat SSH.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/04-ansible-ping.png)

Kalau ping gagal, biasanya masalahnya ada di key, permission file key, atau container yang belum siap menerima SSH. Bagian troubleshooting di bawah merangkum urutannya.

---

## Langkah 5 — Playbook Ansible

Buat `ansible.cfg`:

```ini
[defaults]
host_key_checking = False
interpreter_python = auto_silent
deprecation_warnings = False
```

`host_key_checking = False` hanya untuk lab. Di produksi, kelola `known_hosts` dengan benar.

Playbook `site.yml`:

```yaml
- name: Konfigurasi web server
  hosts: web
  become: true
  gather_facts: true

  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name:
          - nginx
          - python3-apt
        state: present
        update_cache: true
        cache_valid_time: 3600

    - name: Deploy halaman index
      ansible.builtin.template:
        src: templates/index.html.j2
        dest: /var/www/html/index.html
        mode: "0644"

    - name: Pastikan nginx berjalan
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
```

Template halaman mengambil nama host dan fakta sistem:

```html
<h1>Halo dari <span>{{ inventory_hostname }}</span></h1>
<dl>
  <div><dt>Hostname</dt><dd>{{ inventory_hostname }}</dd></div>
  <div><dt>Dikelola oleh</dt><dd>Ansible</dd></div>
  <div><dt>Distribusi</dt><dd>{{ ansible_distribution }} {{ ansible_distribution_version }}</dd></div>
  <div><dt>Web server</dt><dd>Nginx</dd></div>
</dl>
```

Jalankan playbook:

```bash
ansible-playbook -i inventory.ini site.yml
```

![Playbook pertama memasang Nginx dan men-deploy halaman|Run pertama: changed=3 per host — install Nginx, deploy template, start service.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/05-ansible-playbook.png)

Hasilnya: `ok=4 changed=3 failed=0` untuk setiap host. Tiga perubahan itu berasal dari instalasi Nginx, deploy template, dan start service. Task `Gathering Facts` hanya membaca data, jadi tidak dihitung sebagai perubahan.

---

## Langkah 6 — Verifikasi dari browser

Buka kedua URL:

```text
http://localhost:8081
http://localhost:8082
```

![Halaman web1 yang disajikan Nginx hasil konfigurasi Ansible|Halaman web1: dibuat Terraform, dikonfigurasi Ansible, disajikan Nginx.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/06-browser-web1-card.png)

Halaman yang sama muncul di web2 dengan hostname berbeda. Kalau halaman ini terbuka, seluruh rantainya sudah bekerja: Terraform membuat container, Ansible masuk lewat SSH, Nginx menyajikan file, dan port mapping Docker meneruskan request dari host.

---

## Langkah 7 — Uji idempotency

Ansible bukan sekadar kumpulan perintah shell. Module-nya memeriksa keadaan sebelum mengubah apa pun. Jalankan playbook yang sama sekali lagi:

```bash
ansible-playbook -i inventory.ini site.yml
```

![Run kedua menunjukkan changed=0 untuk semua task|Run kedua: changed=0 — tidak ada perubahan yang tidak perlu.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/07-ansible-idempotent.png)

Hasilnya `changed=0` untuk kedua host. Inilah **idempotency**: menjalankan playbook berkali-kali menghasilkan keadaan yang sama, bukan menumpuk perubahan. Sifat ini yang membuat Ansible aman dijalankan dari CI setiap kali deploy.

Kalau run kedua masih `changed`, biasanya ada task yang memakai `command`/`shell` tanpa `creates` atau `changed_when`, atau template yang isinya berubah karena variabel dinamis.

---

## Langkah 8 — Destroy

Setelah selesai, hapus semua resource:

```bash
terraform destroy -auto-approve -input=false
```

![Terraform destroy menghapus container, network, dan inventory|Terraform destroy: 4 resource dihapus, termasuk file inventory.](https://is3.cloudhost.id/public-data/project-images/blog/terraform-ansible-lab/08-terraform-destroy.png)

Terraform menghapus container, network, dan file inventory berdasarkan state. Image `lab-ubuntu-ssh:latest` tetap ada karena tidak dikelola sebagai resource — hapus manual kalau sudah tidak dipakai.

Kalau destroy gagal karena network masih dipakai, pastikan container Ansible sudah keluar. Container yang masih terhubung ke network akan menahan proses penghapusan.

---

## Praktik terbaik

- **Pisahkan peran.** Terraform untuk resource yang dibuat/dihapus; Ansible untuk konfigurasi di dalam resource.
- **Commit lock file, jangan commit state.** `.terraform.lock.hcl` masuk repo; `terraform.tfstate` dan kredensial tidak.
- **Gunakan remote state** (S3, GCS, atau Terraform Cloud) dengan locking untuk tim.
- **Jangan simpan private key di repo.** Di lab ini key ada di folder project hanya untuk latihan.
- **Kelola secret dengan Ansible Vault** atau secret manager, bukan plaintext di playbook.
- **Urutan CI:** `terraform apply` selesai → inventory terbaru → `ansible-playbook` → verifikasi.
- **Jalankan `terraform fmt` dan `terraform validate`** sebelum plan.
- **Hati-hati dengan `-target`.** Ia berguna untuk debugging, tetapi bisa membuat state tidak konsisten kalau dipakai terus-menerus.
- **Gunakan module dan variable** saat konfigurasi mulai dipakai di lebih dari satu environment.
- **Untuk produksi, hindari root SSH** dan batasi akses Docker socket.

---

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Terraform gagal connect ke Docker | Socket tidak dimount atau `DOCKER_HOST` salah | Mount `/var/run/docker.sock`, cek `docker info` di container |
| `image not found` saat apply | Image `lab-ubuntu-ssh` belum dibuild | Jalankan `docker build -t lab-ubuntu-ssh:latest image/` |
| Ansible `UNREACHABLE` | Container belum siap, network salah, atau nama host tidak resolve | Cek `docker ps`, pastikan runner memakai `--network terraform-ansible-lab` |
| `Permission denied (publickey)` | Key tidak cocok atau permission file key terlalu terbuka | Pastikan public key ada di `authorized_keys`, private key `chmod 600` |
| `apt` gagal / lock | Proses apt lain masih berjalan | Tunggu, lalu ulangi playbook |
| Nginx tidak berjalan | Service module gagal di container tanpa systemd | Cek `nginx -t`, jalankan `service nginx start` manual untuk diagnosis |
| Inventory kosong | `terraform apply` belum dijalankan | Jalankan apply, cek `ansible/inventory.ini` |
| Destroy gagal: network in use | Masih ada container yang terhubung | Keluar dari container Ansible, lalu destroy lagi |
| State lock | Proses Terraform sebelumnya terhenti | Pastikan tidak ada proses aktif, lalu `terraform force-unlock <ID>` |

---

## Checklist akhir

- [ ] Image Ubuntu dengan SSH dan Python sudah dibuild.
- [ ] Key pair dibuat dan public key masuk ke image.
- [ ] Terraform provider Docker dan Local terpasang.
- [ ] `terraform plan` menunjukkan network, dua container, dan inventory.
- [ ] `terraform apply` selesai dan inventory terisi.
- [ ] Ansible ping berhasil ke semua host.
- [ ] Playbook memasang Nginx dan men-deploy halaman.
- [ ] Halaman bisa dibuka di port 8081 dan 8082.
- [ ] Run kedua menghasilkan `changed=0`.
- [ ] `terraform destroy` menghapus semua resource.
- [ ] State, key, dan secret tidak masuk repository.

## Kesimpulan

Terraform dan Ansible bukan pengganti satu sama lain; keduanya mengisi lapisan yang berbeda. Terraform memastikan infrastruktur dibuat dan dihapus secara konsisten, sementara Ansible memastikan isi server sesuai konfigurasi dan aman dijalankan berulang kali. Dengan inventory yang dihasilkan Terraform, kedua alat ini bisa bekerja sebagai satu alur: provisioning, konfigurasi, verifikasi, lalu cleanup. Pola inilah yang membuat infrastructure as code terasa utuh, bukan sekadar kumpulan script.
