---
title: 'Home Lab Kubernetes Agent dengan Jenkins CI/CD - Part 1: Setup Jenkins Controller'
date: '2026-04-22'
template: 'post'
draft: false
slug: 'jenkins-cicd-k3s-part-1'
category: 'Technology'
tags:
  - 'Jenkins'
  - 'DevOps'
  - 'CI/CD'
  - 'Docker'
  - 'Kubernetes'
description: 'Panduan lengkap setup Jenkins Controller menggunakan Docker di home lab, konfigurasi build agent via SSH, hingga validasi pipeline pertama di atas Kubernetes K3s.'
seoTitle: 'Setup Jenkins Controller & Build Agent via SSH – Part 1'
seoDescription: 'Panduan setup Jenkins Controller dengan Docker di home lab: registrasi build agent via SSH, instalasi plugin, dan validasi pipeline Groovy pertama di Kubernetes K3s.'
socialImage: '/blog/jenkins-cicd-k3s-part-1/images/02-jenkins-suggested-plugins.png'
---

## Intro

Ini adalah **Part 1** dari seri tutorial membangun infrastruktur CI/CD di home lab menggunakan **Jenkins** dan **Kubernetes (K3s)**. Di part ini fokusnya adalah menyiapkan **Jenkins Controller** di atas Docker dan menghubungkannya dengan **build agent** via SSH.

Topologi yang dipakai:

- `lab-worker` — Jenkins Controller (`192.168.1.200`)
- `lab-worker-1` — Build Agent (`192.168.1.201`)

![Spesifikasi Hardware VM](/blog/jenkins-cicd-k3s-part-1/images/01-hardware-specs.png)

---

## Step 1: Verifikasi VM lab-worker

Masuk ke VM via SSH dan cek resource yang tersedia:

```bash
ssh user@192.168.1.200
```

```bash
lsb_release -a
free -h && nproc && df -h /
docker --version
```

---

## Step 2: Install Docker Engine

Hapus package lama yang mungkin konflik:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y $pkg 2>/dev/null
done
```

Tambah Docker repository:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Install Docker dan tambah user ke group:

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

Verifikasi:

```bash
docker --version
docker compose version
```

---

## Step 3: Setup Jenkins Controller

Buat struktur direktori:

```bash
mkdir -p ~/jenkins/{data,certs}
cd ~/jenkins
```

Buat `docker-compose.yml`:

```yaml
services:
  jenkins:
    image: jenkins/jenkins:lts-jdk21
    container_name: jenkins-controller
    restart: "no"
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - ./data:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=true
    networks:
      - jenkins-net

networks:
  jenkins-net:
    driver: bridge
```

Buat `start.sh`:

```bash
#!/bin/bash
set -e

cd ~/jenkins

echo "[+] Starting Jenkins Controller..."
docker compose up -d

echo "[+] Waiting for Jenkins to be ready..."
until curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/login 2>/dev/null | grep -q "200"; do
  printf "."
  sleep 3
done

echo ""
echo "[✓] Jenkins ready → http://192.168.1.200:8080"

if [ -f ~/jenkins/data/secrets/initialAdminPassword ]; then
  echo "[i] Initial Admin Password:"
  cat ~/jenkins/data/secrets/initialAdminPassword
fi
```

Buat `stop.sh`:

```bash
#!/bin/bash
cd ~/jenkins
echo "[+] Stopping Jenkins..."
docker compose down
echo "[✓] Jenkins stopped. Data tersimpan di ~/jenkins/data"
```

Jadikan executable dan jalankan:

```bash
chmod +x start.sh stop.sh
./start.sh
```

Ambil initial password:

```bash
cat ~/jenkins/data/secrets/initialAdminPassword
```

---

## Konfigurasi Awal Jenkins UI

1. Buka browser ke `http://192.168.1.200:8080`
2. Masukkan initial admin password
3. Pilih **"Install suggested plugins"** — tunggu 2–5 menit
4. Isi form untuk membuat admin user pertama
5. Konfirmasi URL `http://192.168.1.200:8080/` lalu klik **Save and Finish**

![Jenkins Install Suggested Plugins](/blog/jenkins-cicd-k3s-part-1/images/02-jenkins-suggested-plugins.png)

![Jenkins Create Admin User](/blog/jenkins-cicd-k3s-part-1/images/03-jenkins-admin-form.png)

![Jenkins Ready](/blog/jenkins-cicd-k3s-part-1/images/04-jenkins-ready.png)

---

## Instalasi Plugin Tambahan

Masuk ke **Manage Jenkins → Plugins → Available plugins**, install plugin berikut:

| Plugin | Kegunaan |
|---|---|
| SSH Build Agents | Koneksi SSH ke build agent |
| Docker Pipeline | Integrasi Docker di Jenkinsfile |
| GitHub Integration | Trigger webhook dari GitHub |
| Credentials Binding | Injeksi secret ke environment variable |

Setelah memilih semua plugin, klik **Install** dan centang **"Restart Jenkins when installation is complete"**.

---

## Setup lab-worker-1 (Build Agent)

Spesifikasi VM: 2 CPU, 2GB RAM, 20GB disk, Ubuntu 22.04, IP statis `192.168.1.201`.

Update sistem dan install Java:

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y openjdk-21-jdk
```

Install Docker (sama seperti di controller):

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt-get remove -y $pkg 2>/dev/null
done

sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

Buat workspace Jenkins dan verifikasi:

```bash
mkdir -p ~/jenkins-agent
java -version
docker --version
```

---

## Konfigurasi SSH Key Authentication

Generate SSH keypair di `lab-worker` (Controller):

```bash
ssh-keygen -t ed25519 -C "jenkins-controller" -f ~/.ssh/jenkins_agent -N ""
```

Salin public key ke `lab-worker-1` dan test koneksi:

```bash
ssh-copy-id -i ~/.ssh/jenkins_agent.pub ubuntu@192.168.1.201
ssh -i ~/.ssh/jenkins_agent ubuntu@192.168.1.201 "echo 'SSH OK'"
```

Tampilkan private key untuk dipakai di Jenkins:

```bash
cat ~/.ssh/jenkins_agent
```

---

## Tambah SSH Credential di Jenkins UI

Masuk ke **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**, isi form:

- **Kind:** SSH Username with private key
- **ID:** `jenkins-agent-ssh`
- **Description:** SSH key for lab-worker-1
- **Username:** `ubuntu`
- **Private Key:** pilih *Enter directly* → paste isi private key lengkap

Klik **Create**.

![SSH Credentials Form](/blog/jenkins-cicd-k3s-part-1/images/05-ssh-credential-form.png)

---

## Register lab-worker-1 sebagai Agent Node

Masuk ke **Manage Jenkins → Nodes → New Node**, isi:

- **Node name:** `lab-worker-1`
- **Type:** Permanent Agent → klik **Create**

![Agent Node Type](/blog/jenkins-cicd-k3s-part-1/images/07-agent-node-type.png)

Konfigurasi node:

- **Number of executors:** `1`
- **Remote root directory:** `/home/ubuntu/jenkins-agent`
- **Labels:** `build-agent`
- **Usage:** Only build jobs with label expressions matching this node
- **Launch method:** Launch agents via SSH
  - **Host:** `192.168.1.201`
  - **Credentials:** `ubuntu (jenkins-agent-ssh)`
  - **Host Key Verification Strategy:** Non verifying Verification Strategy

Klik **Save**.

![Agent Node Config](/blog/jenkins-cicd-k3s-part-1/images/08-agent-node-config.png)

---

## Test Pipeline

Masuk ke **Dashboard → New Item**, buat item baru:

- **Item name:** `test-pipeline`
- **Type:** Pipeline → klik **OK**

Isi pipeline script berikut:

```groovy
pipeline {
    agent { label 'build-agent' }

    stages {
        stage('Verify Node') {
            steps {
                sh 'hostname && whoami'
                sh 'uname -a'
            }
        }
        stage('Verify Java') {
            steps {
                sh 'java -version'
            }
        }
        stage('Verify Docker') {
            steps {
                sh 'docker --version'
                sh 'docker ps'
            }
        }
        stage('Verify Workspace') {
            steps {
                sh 'pwd && ls -la'
                sh 'echo "Build agent OK - $(date)"'
            }
        }
    }

    post {
        success { echo 'Agent verified successfully!' }
        failure { echo 'Something went wrong!' }
    }
}
```

Klik **Save** → **Build Now** → klik nomor build → **Console Output**.

![Pipeline Result - Console Output](/blog/jenkins-cicd-k3s-part-1/images/09-pipeline-result.png)

Hasil yang diharapkan:

| Check | Expected |
|---|---|
| Running on | `lab-worker-1` (bukan Built-in Node) |
| Hostname | `worker-1` |
| Java | OpenJDK 21 |
| Docker | 29.4.0+ |
| Workspace | `/home/ubuntu/jenkins-agent/workspace/test-pipeline` |
| Result | `SUCCESS` |

---

## Recap Part 1

| Komponen | Status | Detail |
|---|---|---|
| Jenkins Controller | Selesai | Docker containerized di `lab-worker` |
| Build Agent | Selesai | SSH-connected `lab-worker-1` |
| SSH Credential | Selesai | `jenkins-agent-ssh` terkonfigurasi |
| Test Pipeline | Sukses | Semua stage verifikasi passed |

Part selanjutnya: **Deploy Kubernetes K3s Cluster** dan menghubungkan Jenkins dengan cluster.
