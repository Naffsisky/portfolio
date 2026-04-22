---
title: 'Deploy Kubernetes K3s Med-Small untuk Aplikasi Frontend'
date: '2026-04-13'
template: 'post'
draft: false
slug: 'deploy-kubernetes-k3s-med-small'
category: 'Technology'
tags:
  - 'Kubernetes'
  - 'DevOps'
  - 'Cloud Computing'
  - 'K3s'
description: 'Tutorial deploy cluster Kubernetes K3s skala menengah-kecil untuk aplikasi frontend, mulai dari setup control plane, join worker node, membuat namespace, deployment, service NodePort, hingga monitoring pod dengan metrics-server.'
seoTitle: 'Deploy Kubernetes K3s Cluster untuk Aplikasi Frontend'
seoDescription: 'Setup cluster K3s ringan: install control plane, join worker node, deploy aplikasi frontend dengan NodePort, dan monitoring resource menggunakan metrics-server.'
socialImage: ''
---

## Intro

Pada catatan ini saya melakukan deployment cluster **Kubernetes K3s** untuk kebutuhan **med-small deployment**, dengan pendekatan yang cukup ringan tetapi tetap cocok untuk menjalankan aplikasi frontend secara terpisah di worker node.

K3s dipilih karena lebih ringan dibanding instalasi Kubernetes standar, lebih cepat untuk disiapkan, dan cukup nyaman dipakai untuk environment development, staging, maupun production kecil sampai menengah.

Di tutorial ini alurnya adalah:

- Menyiapkan **control plane**
- Menonaktifkan **swap**
- Menginstall **containerd** dan **K3s**
- Mengambil **node token**
- Menambahkan **worker node**
- Membuat **namespace**
- Melakukan deployment aplikasi frontend
- Mengekspos aplikasi dengan **NodePort**
- Mengecek resource dengan **metrics-server**

## Persiapan

Sebelum mulai, siapkan beberapa hal berikut:

- 1 server untuk **control plane**
- 1 atau lebih server untuk **worker**
- Akses `sudo`
- Image aplikasi yang sudah tersedia di registry
- Koneksi antar node yang bisa saling terhubung

Jika ingin menempatkan workload frontend pada node tertentu, pastikan hostname node memang sudah sesuai dengan konfigurasi `nodeSelector`.

## Setup Control Plane

### Nonaktifkan Memory Swap

Kubernetes tidak menyarankan penggunaan swap aktif karena bisa memengaruhi penjadwalan resource dan perilaku node. Karena itu, langkah awal yang saya lakukan adalah menonaktifkan swap:

```bash
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab
```

Perintah pertama menonaktifkan swap untuk sesi saat ini, sedangkan perintah kedua mengomentari konfigurasi swap di `fstab` agar tidak aktif kembali saat reboot.

### Install Dependency Dasar

Sebelum memasang K3s, saya menginstall `containerd` terlebih dahulu:

```bash
sudo apt-get update
sudo apt-get install -y containerd
sudo systemctl status containerd
```

`containerd` berfungsi sebagai container runtime. Status service perlu dicek untuk memastikan runtime sudah berjalan normal sebelum K3s dipasang.

### Install K3s

Setelah dependency siap, install K3s di node control plane:

```bash
curl -sfL https://get.k3s.io | sh -
```

Lalu cek apakah node sudah berhasil terdaftar:

```bash
sudo k3s kubectl get node
```

Jika output sudah menampilkan node control plane dalam status `Ready`, berarti instalasi dasar sudah berhasil.

### Ambil Node Token

Token ini diperlukan saat worker node akan bergabung ke cluster:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

Simpan token tersebut dengan aman. Jangan publish token asli ke artikel, repository, atau screenshot publik, karena token ini bisa dipakai untuk mendaftarkan node ke cluster.

## Membuat Namespace

Supaya resource frontend lebih rapi dan terpisah dari workload lain, saya membuat namespace khusus:

```bash
sudo kubectl create namespace frontend
sudo kubectl get namespaces
```

Dengan namespace ini, deployment, service, dan resource lain bisa dikelompokkan dengan lebih jelas.

## Membuat Deployment Aplikasi Frontend

Berikut contoh file `frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: react-aksa
  namespace: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: react-aksa
  template:
    metadata:
      labels:
        app: react-aksa
    spec:
      nodeSelector:
        kubernetes.io/hostname: frontend
      containers:
        - name: react-aksa-container
          image: your-dockerhub-username/your-image:latest
          ports:
            - containerPort: 80
```

Beberapa poin penting dari konfigurasi di atas:

- `replicas: 2` berarti aplikasi dijalankan dalam dua pod
- `namespace: frontend` memastikan resource masuk ke namespace yang benar
- `nodeSelector` digunakan agar workload diarahkan ke node dengan hostname tertentu
- `image` harus diganti dengan image aplikasi yang benar dan sudah tersedia di registry
- `containerPort: 80` cocok untuk aplikasi frontend yang diserve melalui Nginx atau web server lain di port 80

Jika hostname worker bukan `frontend`, maka bagian `nodeSelector` harus disesuaikan.

## Membuat Service untuk Ekspos Aplikasi

Setelah deployment siap, langkah berikutnya adalah membuat service. Pada catatan ini saya menggunakan tipe `NodePort`.

Berikut file `frontend-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: react-aksa-service
  namespace: frontend
spec:
  selector:
    app: react-aksa
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: NodePort
```

Penjelasannya:

- `selector` menghubungkan service ke pod dengan label `app: react-aksa`
- `port: 80` adalah port service di dalam cluster
- `targetPort: 80` adalah port container tujuan
- `NodePort` membuat aplikasi bisa diakses dari IP node dan port tertentu

Pendekatan ini cukup praktis untuk deployment sederhana. Untuk environment yang lebih rapi, biasanya service ini nantinya dipadukan dengan **Ingress**.

## Join Worker Node ke Cluster

Pada server worker, jalankan instalasi K3s agent dengan mengarah ke control plane:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<CONTROL_PLANE_IP>:6443 K3S_TOKEN=<NODE_TOKEN> sh -
```

Ganti:

- `<CONTROL_PLANE_IP>` dengan IP server control plane
- `<NODE_TOKEN>` dengan token yang diambil dari control plane

Pastikan worker bisa terhubung ke control plane, firewall mengizinkan port yang dibutuhkan, dan hostname node sesuai jika ingin dipakai di `nodeSelector`.

## Deploy Resource dari Control Plane

Jika file YAML sudah siap, deploy resource dari node control plane:

```bash
sudo kubectl apply -f frontend-deployment.yaml
sudo kubectl apply -f frontend-service.yaml
```

Lanjutkan dengan pengecekan:

```bash
sudo kubectl get pods -n frontend
sudo kubectl get svc -n frontend
kubectl get pods -n frontend -o wide
```

Perintah tersebut membantu memastikan:

- pod berhasil dibuat
- service berhasil terbentuk
- pod benar-benar berjalan di node yang diharapkan

## Monitoring dan Observability Dasar

Untuk melihat penggunaan resource pod, install `metrics-server`:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Lalu cek metrik pod:

```bash
sudo kubectl top pod -n frontend
sudo kubectl get hpa -n frontend
```

Walaupun pada catatan ini belum ada konfigurasi `HorizontalPodAutoscaler`, perintah `get hpa` tetap berguna untuk memastikan apakah autoscaling sudah dibuat atau belum.

## Akses Aplikasi

Karena service menggunakan tipe `NodePort`, aplikasi bisa diakses melalui:

```text
http://<IP_NODE_FRONTEND>:<NODEPORT>
```

Contohnya, jika node frontend memiliki IP publik dan service mendapatkan port `31841`, maka aksesnya menjadi:

```text
http://<IP_NODE_FRONTEND>:31841
```

Jika ingin memakai HTTPS atau domain yang lebih rapi, sebaiknya tambahkan **Ingress Controller** dan terminasi TLS di layer ingress, bukan langsung mengandalkan NodePort.

## Perintah Tambahan untuk Troubleshooting

Berikut beberapa perintah yang berguna saat mengecek kondisi cluster:

```bash
kubectl get svc -A
kubectl get ingress -A
kubectl get pods -A -o wide
kubectl get pods
kubectl get svc
kubectl get hpa
```

Perintah-perintah ini membantu untuk:

- melihat seluruh service di semua namespace
- memastikan ingress sudah dibuat atau belum
- mengecek lokasi pod berjalan
- memverifikasi resource utama yang sedang aktif

## Catatan Penting

- Jangan publish **token cluster** asli ke internet
- Jangan menaruh IP sensitif produksi jika tidak diperlukan
- Pastikan image container sudah tersedia dan dapat di-pull dari node worker
- Jika pod tidak masuk ke worker yang diinginkan, cek `nodeSelector` dan hostname node
- Jika service tidak bisa diakses, cek firewall server, security group, dan port `NodePort`

## Penutup

Dengan pendekatan ini, K3s bisa menjadi solusi yang ringan untuk membangun cluster Kubernetes skala kecil sampai menengah. Struktur deployment seperti ini sudah cukup untuk memisahkan control plane dan worker, menjalankan aplikasi frontend dengan beberapa replica, serta memberi visibilitas dasar terhadap resource pod.

Jika kebutuhan deployment semakin kompleks, langkah berikutnya biasanya adalah menambahkan:

- Ingress Controller
- HTTPS/TLS
- Autoscaling
- CI/CD pipeline
- Monitoring dan logging yang lebih lengkap

## Selesai
