---
title: 'Home Lab Kubernetes Agent dengan Jenkins CI/CD - Part 2: Setup Kubernetes K3s Cluster'
date: '2026-04-22'
template: 'post'
draft: false
slug: 'jenkins-cicd-k3s-part-2'
category: 'Technology'
tags:
  - 'Kubernetes'
  - 'K3s'
  - 'DevOps'
  - 'CI/CD'
  - 'Jenkins'
description: 'Panduan setup cluster Kubernetes K3s dengan satu control plane dan tiga worker node, lalu konfigurasi kubectl di Jenkins build agent agar siap menjalankan deployment dari pipeline.'
seoTitle: 'Setup K3s Cluster: Control Plane & Worker Node – Part 2'
seoDescription: 'Tutorial deploy cluster Kubernetes K3s dengan satu control plane dan tiga worker node, serta konfigurasi kubectl di Jenkins build agent untuk deployment pipeline.'
socialImage: ''
---

## Intro

Ini adalah **Part 2** dari seri tutorial membangun infrastruktur CI/CD di home lab. Setelah di [Part 1](/blog/jenkins-cicd-k3s-part-1) Jenkins Controller dan build agent sudah berjalan, sekarang saatnya membangun **Kubernetes cluster** menggunakan K3s.

Topologi cluster yang akan dibuat:

| Node | Role | IP |
|---|---|---|
| `lab2` | K3s Control Plane | `192.168.1.102` |
| `lab1` | K3s Worker | `192.168.1.101` |
| `lab3` | K3s Worker | `192.168.1.103` |
| `lab4` | K3s Worker | `192.168.1.104` |
| `lab-worker-1` | Jenkins Agent + kubectl | `192.168.1.201` |

---

## Verifikasi VM lab2

Masuk ke VM dan pastikan resource mencukupi:

```bash
ssh ubuntu@192.168.1.102
lsb_release -a && free -h && nproc && df -h /
```

---

## Setup lab2 — K3s Control Plane

### Step 1: Tambah Swap

etcd dan API server bisa spike memory usage saat load tinggi, jadi swap membantu menjaga stabilitas:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

### Step 2: Install K3s Server

Traefik didisable karena kita akan deploy Nginx Ingress Controller sendiri di Part 3:

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --disable traefik \
  --node-name lab2-control \
  --bind-address 192.168.1.102 \
  --advertise-address 192.168.1.102 \
  --node-ip 192.168.1.102 \
  --cluster-cidr 10.42.0.0/16 \
  --service-cidr 10.43.0.0/16
```

### Step 3: Verifikasi Instalasi

```bash
sudo systemctl status k3s
sudo kubectl get nodes
```

### Step 4: Ambil Node Token

Token ini diperlukan untuk join worker node ke cluster:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

Simpan output tokennya, contoh formatnya:

```
K104b1dfd09261346fe99a5059401f8017ef799b7458bc82b8e18afc520f83f1cb5::server:5ebe7a679a30f9e9109013f7418ef61c
```

---

## Join Worker Nodes

Lakukan di masing-masing worker node via SSH. Set variabel token dan URL control plane terlebih dahulu:

```bash
K3S_TOKEN="<isi-token-dari-lab2>"
K3S_URL="https://192.168.1.102:6443"
```

**lab1** (`192.168.1.101`):

```bash
curl -sfL https://get.k3s.io | K3S_URL=$K3S_URL K3S_TOKEN=$K3S_TOKEN sh -s - agent \
  --node-name lab1-worker \
  --node-ip 192.168.1.101
```

**lab3** (`192.168.1.103`):

```bash
curl -sfL https://get.k3s.io | K3S_URL=$K3S_URL K3S_TOKEN=$K3S_TOKEN sh -s - agent \
  --node-name lab3-worker \
  --node-ip 192.168.1.103
```

**lab4** (`192.168.1.104`):

```bash
curl -sfL https://get.k3s.io | K3S_URL=$K3S_URL K3S_TOKEN=$K3S_TOKEN sh -s - agent \
  --node-name lab4-worker \
  --node-ip 192.168.1.104
```

Setelah semua node join, verifikasi dari `lab2`:

```bash
sudo kubectl get nodes -o wide
```

Semua node harus berstatus `Ready`.

---

## Setup kubectl di lab-worker-1

Jenkins build agent (`lab-worker-1`) perlu punya akses `kubectl` ke cluster agar bisa menjalankan deployment dari pipeline.

### Install kubectl

Jalankan di `lab-worker-1`:

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl
mkdir -p ~/.kube
```

### Copy Kubeconfig dari lab2

Jalankan perintah ini dari `lab2`. Perintah `sed` mengganti `127.0.0.1` dengan IP asli lab2 agar bisa diakses dari node lain:

```bash
sudo cat /etc/rancher/k3s/k3s.yaml | \
  sed 's/127.0.0.1/192.168.1.102/g' | \
  ssh ubuntu@192.168.1.201 "cat > ~/.kube/config"

ssh ubuntu@192.168.1.201 "chmod 600 ~/.kube/config"
```

### Verifikasi dari lab-worker-1

```bash
kubectl get nodes
```

Jika semua node muncul, `lab-worker-1` sudah siap digunakan Jenkins untuk deploy ke cluster.

---

## Recap Part 2

| Komponen | Status | Detail |
|---|---|---|
| `lab2-control` | Selesai | K3s control plane `192.168.1.102` |
| `lab1-worker` | Selesai | K3s worker `192.168.1.101` |
| `lab3-worker` | Selesai | K3s worker `192.168.1.103` |
| `lab4-worker` | Selesai | K3s worker `192.168.1.104` |
| `lab-worker-1` | Selesai | kubectl terkonfigurasi `192.168.1.201` |

Cluster menggunakan pod CIDR `10.42.0.0/16` dan service CIDR `10.43.0.0/16` dengan semua node berkomunikasi lewat subnet `192.168.1.0/24`.

Part selanjutnya: **Deploy Nginx Ingress Controller** dan expose aplikasi ke luar cluster.
