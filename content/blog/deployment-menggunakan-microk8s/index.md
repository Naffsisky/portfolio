---
title: 'Deployment menggunakan microk8s'
date: '2026-04-27'
template: 'post'
draft: false
slug: 'deployment-menggunakan-microk8s'
category: 'Technology'
tags:
  - 'Kubernetes'
  - 'MicroK8s'
  - 'DevOps'
  - 'Deployment'
description: 'Panduan deployment dan pembelajaran Kubernetes menggunakan MicroK8s, mulai dari instalasi, Pod, ReplicaSet, Deployment, Service, LoadBalancer, Ingress, hingga HTTPS dengan cert-manager dan Let''s Encrypt.'
seoTitle: 'Deployment menggunakan MicroK8s'
seoDescription: 'Belajar deployment Kubernetes dengan MicroK8s dari nol: instalasi, service exposure, MetalLB, Ingress, dan HTTPS otomatis menggunakan cert-manager.'
socialImage: ''
---

## Intro

Artikel ini disusun dari materi pada `notes.md` dan difokuskan untuk membahas proses deployment aplikasi menggunakan **MicroK8s**. Isi materinya tetap dipertahankan, lalu disesuaikan ke format blog agar lebih enak dibaca sebagai panduan belajar dan implementasi.

Di dalamnya kita akan membahas alasan memilih MicroK8s, perbandingannya dengan Minikube, instalasi, penggunaan Pod, ReplicaSet, Deployment, Service, LoadBalancer, Ingress, hingga konfigurasi HTTPS menggunakan Let's Encrypt dan cert-manager.

---

## 1. Why MicroK8s?

**MicroK8s** merupakan platform Kubernetes yang dikembangkan oleh **Canonical**, perusahaan pembuat Ubuntu.

MicroK8s banyak digunakan untuk kebutuhan belajar, development lokal, edge computing, IoT, hingga production ringan. Dibandingkan beberapa solusi Kubernetes lokal lainnya, MicroK8s dikenal ringan, cepat, dan relatif mudah digunakan.

### Mengapa Menggunakan MicroK8s?

Beberapa alasan utama menggunakan MicroK8s:

- **Ringan**
- **Mudah digunakan**
- **Cocok untuk kebutuhan belajar**
- **Dapat berjalan di Windows, Linux, dan macOS**

MicroK8s cocok digunakan ketika ingin belajar Kubernetes tanpa harus langsung membangun cluster production yang kompleks. Dengan MicroK8s, kita bisa memahami konsep inti Kubernetes seperti Pod, ReplicaSet, Deployment, Service, Ingress, dan certificate management dalam environment yang lebih sederhana.

---

## 2. Minikube vs MicroK8s

**Minikube** dan **MicroK8s** adalah dua solusi populer untuk menjalankan Kubernetes secara lokal. Keduanya sama-sama bisa digunakan untuk belajar Kubernetes, namun memiliki pendekatan arsitektur yang berbeda.

### Tabel Perbandingan Minikube vs MicroK8s

| Fitur | Minikube | MicroK8s |
|---|---|---|
| Pengembang | Komunitas Kubernetes / CNCF | Canonical, pembuat Ubuntu |
| Instalasi Utama | Binary executable | Snap Package, terutama di Linux |
| Arsitektur | Berjalan di dalam VM atau Docker container | Berjalan secara native sebagai service sistem |
| Penggunaan Resource | Lebih berat karena butuh overhead VM/Docker | Sangat ringan dengan low footprint |
| Kecepatan Startup | Cenderung lebih lambat | Sangat cepat |
| Multi-node | Mendukung melalui profil terpisah | Sangat mudah dengan native clustering |
| Kesiapan Produksi | Lebih cocok untuk development/belajar | Bisa untuk Edge, IoT, dan production ringan |

---

## 3. Perbedaan Utama dari Sisi Teknis

### 3.1 Cara Berjalan / Runtime

#### Minikube

Minikube dirancang untuk mengisolasi cluster dari sistem operasi host.

Biasanya Minikube membuat **Virtual Machine (VM)** atau menggunakan **Docker container** untuk membungkus seluruh komponen Kubernetes. Pendekatan ini membuat Minikube cukup aman dan bersih dari sisi host OS, karena seluruh cluster berjalan di lingkungan terisolasi.

Namun, konsekuensinya adalah penggunaan resource seperti RAM dan CPU menjadi lebih besar karena ada overhead tambahan dari VM atau container runtime.

#### MicroK8s

MicroK8s berjalan sebagai **system service** langsung di atas sistem operasi melalui teknologi **Snap**.

Karena tidak perlu menjalankan OS tamu di dalam VM, penggunaan CPU dan RAM menjadi lebih efisien. Inilah salah satu alasan MicroK8s cocok digunakan di server kecil, VPS, lab environment, edge device, dan mesin development.

---

### 3.2 Manajemen Add-ons

Keduanya memiliki sistem add-ons atau plugin untuk mengaktifkan fitur tambahan seperti:

- Dashboard
- DNS
- Ingress
- Storage
- Cert-manager
- GPU support

Contoh mengaktifkan Ingress di Minikube:

```bash
minikube addons enable ingress
```

Contoh mengaktifkan Ingress di MicroK8s:

```bash
microk8s enable ingress
```

MicroK8s dikenal memiliki koleksi add-on yang matang, termasuk dukungan GPU NVIDIA secara out-of-the-box.

---

### 3.3 Portabilitas OS

#### Minikube

Minikube sangat lintas platform. Pengalaman penggunaannya di Windows, macOS, dan Linux hampir identik karena berbasis virtualisasi.

#### MicroK8s

MicroK8s aslinya dibuat untuk Linux, terutama Ubuntu. Walaupun sekarang bisa diinstal di Windows dan macOS, pada sistem tersebut MicroK8s biasanya menjalankan VM kecil bernama **Multipass** di latar belakang untuk menyediakan lingkungan Linux sebelum MicroK8s diinstal di dalamnya.

Dokumentasi resmi MicroK8s:

```text
https://canonical.com/microk8s/docs/getting-started
```

---

## 4. Instalasi MicroK8s

Untuk menginstal MicroK8s di Ubuntu/Linux, gunakan perintah berikut:

```bash
sudo snap install microk8s --classic
```

Contoh output instalasi:

```bash
microk8s (1.33/stable) v1.33.9 from Canonical installed
```

Setelah instalasi, MicroK8s akan berjalan sebagai service di sistem. Pada beberapa kondisi, user perlu ditambahkan ke group `microk8s` agar tidak harus selalu menggunakan `sudo`.

Contoh:

```bash
sudo usermod -aG microk8s $USER
newgrp microk8s
```

Cek status MicroK8s:

```bash
microk8s status --wait-ready
```

---

## 5. Instalasi kubectl

`kubectl` adalah command-line tool utama untuk berinteraksi dengan Kubernetes cluster.

Dokumentasi instalasi kubectl:

```text
https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
```

### Install Dependency

```bash
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
```

### Buat Directory Keyring

```bash
sudo mkdir -p /etc/apt/keyrings
```

### Tambahkan Kubernetes Repository Key

```bash
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.33/deb/Release.key \
  | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
```

### Tambahkan Repository Kubernetes

```bash
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.33/deb/ /' \
  | sudo tee /etc/apt/sources.list.d/kubernetes.list > /dev/null
```

### Atur Permission File Repository

```bash
sudo chmod 644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg
sudo chmod 644 /etc/apt/sources.list.d/kubernetes.list
```

### Update Repository dan Install kubectl

```bash
sudo apt-get update
sudo apt-get install -y kubectl
```

---

## 6. Menghubungkan kubectl ke MicroK8s

Agar `kubectl` bisa mengakses cluster MicroK8s, kita perlu mengambil konfigurasi kubeconfig dari MicroK8s.

```bash
mkdir .kube
sudo microk8s config > .kube/config
```

Setelah itu, coba cek node:

```bash
kubectl get nodes
```

Jika konfigurasi benar, node MicroK8s akan muncul.

---

## 7. Membuat Pod Nginx

Pod adalah unit terkecil yang bisa dijalankan di Kubernetes. Di dalam Pod terdapat satu atau lebih container.

Buat file bernama `pods.yaml`.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-demo
  labels:
    app: nginx-demo
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
```

Apply konfigurasi:

```bash
kubectl apply -f pods.yaml
```

Cek Pod:

```bash
kubectl get pods
```

Untuk melihat detail Pod:

```bash
kubectl describe pod nginx-demo
```

---

## 8. Expose Pod Menggunakan NodePort

Jika Pod ingin diakses dari luar cluster, salah satu cara paling sederhana adalah membuat Service dengan type `NodePort`.

```bash
kubectl expose pod nginx-demo --type=NodePort --port=80 --name=nginx-demo-svc
```

Cek Service:

```bash
kubectl get svc
```

Akses aplikasi menggunakan format:

```text
http://<ip-address-node>:<node-port>
```

NodePort cocok digunakan untuk kebutuhan development dan testing, namun untuk production biasanya lebih baik menggunakan Ingress atau LoadBalancer.

---

## 9. ReplicaSet

ReplicaSet digunakan untuk memastikan jumlah Pod yang berjalan sesuai dengan jumlah replica yang didefinisikan.

Misalnya kita ingin menjalankan 3 Pod Nginx. Jika salah satu Pod mati, ReplicaSet akan membuat Pod baru agar jumlahnya tetap 3.

Buat file `replicaset.yaml`.

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:latest
          ports:
            - containerPort: 80
```

Apply konfigurasi:

```bash
kubectl apply -f replicaset/nginx.yaml
```

Cek ReplicaSet:

```bash
kubectl get rs
```

Cek Pod yang dibuat oleh ReplicaSet:

```bash
kubectl get pods
```

### Scale ReplicaSet

Ubah jumlah replica menjadi 5:

```bash
kubectl scale rs nginx --replicas 5
```

Turunkan kembali menjadi 3:

```bash
kubectl scale rs nginx --replicas 3
```

### Update Image pada ReplicaSet

```bash
kubectl set image rs nginx nginx=nginx:1.25
```

Namun pada ReplicaSet, image tidak otomatis terganti pada Pod yang sudah berjalan. Agar image baru digunakan, container atau Pod lama perlu dihapus sehingga ReplicaSet membuat Pod baru dengan image terbaru.

Contoh:

```bash
kubectl delete pod <nama-pod>
```

---

## 10. Deployment

Deployment adalah object Kubernetes yang lebih umum digunakan dibanding ReplicaSet secara langsung.

Deployment mengelola ReplicaSet dan menyediakan fitur penting seperti:

- Rolling update
- Rollback
- Scale replica
- Riwayat rollout
- Update image yang lebih aman

Buat file Deployment.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-deployment
  template:
    metadata:
      labels:
        app: nginx-deployment
    spec:
      containers:
        - name: nginx-deployment
          image: nginx:latest
          ports:
            - containerPort: 80
```

Apply Deployment:

```bash
kubectl apply -f deployment/nginx.yaml
```

Cek ReplicaSet yang dibuat oleh Deployment:

```bash
kubectl get rs
```

Cek Deployment:

```bash
kubectl get deploy
```

atau:

```bash
kubectl get deployment
```

### Scale Deployment

```bash
kubectl scale deploy nginx-deployment --replicas 5
```

### Cek Rollout History

```bash
kubectl rollout history deploy nginx-deployment
```

Deployment lebih direkomendasikan untuk menjalankan aplikasi di Kubernetes karena lebih fleksibel dan aman untuk proses update aplikasi.

---

## 11. Service sebagai Entry Point

Service adalah object Kubernetes yang berfungsi sebagai entry point untuk mengakses Pod.

Pod di Kubernetes bersifat dinamis. IP Pod bisa berubah ketika Pod dibuat ulang. Karena itu, Service digunakan sebagai alamat stabil untuk mengakses sekumpulan Pod berdasarkan selector label.

Terdapat beberapa type Service yang bisa digunakan. Setiap type memiliki fungsi yang berbeda.

---

## 12. Type Service di Kubernetes

### 12.1 ClusterIP

`ClusterIP` adalah type default pada Kubernetes Service.

Fungsinya untuk membuka akses hanya di dalam cluster. Biasanya digunakan untuk komunikasi antar service pada aplikasi microservice.

Contoh:

- Backend mengakses database service
- Frontend mengakses backend service
- API gateway mengakses service internal

Contoh manifest `ClusterIP`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: ClusterIP
  selector:
    app: nginx-deployment
  ports:
    - port: 8080
      targetPort: 80
      protocol: TCP
```

Pastikan Deployment sudah berjalan terlebih dahulu.

Apply Service:

```bash
kubectl apply -f services/service-cluster.yaml
```

Cek Service:

```bash
kubectl get svc
```

Contoh output:

```text
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.152.183.1    <none>        443/TCP   24h
```

Akses ClusterIP:

```bash
curl 10.152.183.1:8080
```

> Catatan: ClusterIP hanya bisa diakses dari dalam cluster atau node tertentu yang punya akses ke network cluster.

---

### 12.2 NodePort

`NodePort` membuka port di setiap node agar aplikasi bisa diakses dari luar cluster.

Format akses:

```text
http://<ip-address-node>:<node-port>
```

NodePort cocok digunakan di environment development untuk kebutuhan testing.

Contoh manifest `NodePort`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: NodePort
  selector:
    app: nginx-deployment
  ports:
    - port: 8080
      targetPort: 80
      protocol: TCP
```

Pada NodePort, Kubernetes akan membuka port di node. Client dari network yang sama bisa langsung mengakses aplikasi melalui IP node dan port tersebut.

Cek port NodePort:

```bash
kubectl get svc
```

---

### 12.3 LoadBalancer

`LoadBalancer` mirip dengan NodePort, tetapi menyediakan dedicated external IP, bukan hanya IP node.

Type ini cocok digunakan untuk expose aplikasi di environment production, terutama jika cluster berjalan di cloud provider seperti AWS, GCP, Azure, atau menggunakan MetalLB pada bare-metal/server sendiri.

Contoh manifest `LoadBalancer`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: LoadBalancer
  selector:
    app: nginx-deployment
  ports:
    - port: 8080
      targetPort: 80
      protocol: TCP
```

---

## 13. LoadBalancer dengan MetalLB di MicroK8s

Pada MicroK8s, LoadBalancer bisa digunakan dengan mengaktifkan add-on **MetalLB**.

Aktifkan MetalLB:

```bash
microk8s enable metallb
```

Saat aktivasi, sesuaikan IP range yang ingin digunakan.

Contoh prompt:

```text
Enter each IP address range delimited by comma
(e.g. '10.64.140.43-10.64.140.49,192.168.0.105-192.168.0.111'):
```

Contoh IP range:

```text
192.168.1.150-192.168.1.200
```

Setelah Service type LoadBalancer dibuat, Kubernetes akan memberikan external IP dari range tersebut.

Cek Service:

```bash
kubectl get svc
```

Akses aplikasi:

```bash
curl http://192.168.1.150:8080
```

Atau buka melalui browser:

```text
http://192.168.1.150:8080
```

> Catatan: Untuk server/VPS public, IP range MetalLB harus disesuaikan dengan network dan IP yang memang dapat digunakan. Pada environment lokal, biasanya menggunakan IP LAN.

---

## 14. Ingress sebagai Reverse Proxy

Ingress adalah object Kubernetes yang digunakan untuk mengatur routing HTTP/HTTPS ke Service di dalam cluster.

Ingress mirip seperti reverse proxy, tetapi dalam konteks Kubernetes dan dikelola secara declarative melalui object cluster.

Namun, penting dipahami:

> Ingress hanyalah rule definition. Komponen yang benar-benar menjalankan routing adalah **Ingress Controller**.

### Contoh Ingress Controller

Beberapa contoh Ingress Controller:

- Nginx Ingress Controller
- Traefik Ingress
- Cloud Provider Ingress seperti AWS ALB Ingress dan GCP Ingress

### Karakteristik Ingress

Ingress memiliki beberapa karakteristik:

- Hanya mendukung HTTP/HTTPS
- Mendukung path routing
- Dapat menangani TLS/HTTPS
- Cocok untuk akses aplikasi melalui nama domain
- Cocok untuk aplikasi web dan API

Ingress cocok digunakan jika memiliki aplikasi web atau API yang perlu diakses menggunakan nama domain seperti:

```text
https://lab.napskytech.com
```

Urutan resource yang umumnya dibutuhkan:

```text
Deployment -> Pod -> Service -> Ingress
```

Artinya, sebelum membuat Ingress, pastikan sudah memiliki:

1. Deployment atau Pod
2. Service
3. Ingress Controller
4. Ingress rule

---

## 15. Enable Ingress di MicroK8s

Untuk menggunakan Ingress di MicroK8s, aktifkan add-on Ingress:

```bash
microk8s enable ingress
```

Cek namespace:

```bash
kubectl get ns
```

Contoh output:

```text
NAME              STATUS   AGE
default           Active   7m48s
ingress           Active   56s
kube-node-lease   Active   7m48s
kube-public       Active   7m48s
kube-system       Active   7m48s
```

Cek Pod Ingress Controller:

```bash
kubectl -n ingress get pod
```

Contoh output:

```text
NAME                                      READY   STATUS    RESTARTS   AGE
nginx-ingress-microk8s-controller-c772c   1/1     Running   0          89s
```

Cek IngressClass:

```bash
kubectl get ingressclass
```

Contoh output:

```text
NAME     CONTROLLER             PARAMETERS   AGE
nginx    k8s.io/ingress-nginx   <none>       111s
public   k8s.io/ingress-nginx   <none>       111s
```

Pada MicroK8s, biasanya tersedia IngressClass bernama `public`.

---

## 16. Menambahkan HTTPS dengan Let's Encrypt

Untuk menggunakan HTTPS otomatis di Kubernetes, kita bisa menggunakan **cert-manager**.

`cert-manager` bertugas membuat, memperpanjang, dan mengelola certificate TLS dari provider seperti Let's Encrypt.

Aktifkan cert-manager di MicroK8s:

```bash
sudo microk8s enable cert-manager
```

Cek Pod cert-manager:

```bash
kubectl get pods -n cert-manager
```

Jika semua Pod berjalan, kita bisa membuat `ClusterIssuer`.

---

## 17. Konfigurasi Ingress dengan TLS

Berikut contoh konfigurasi Ingress untuk domain `lab.napskytech.com`.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: public
  tls:
    - hosts:
        - lab.napskytech.com
      secretName: lab-napskytech-tls
  rules:
    - host: lab.napskytech.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx-service
                port:
                  number: 8080
```

Penjelasan singkat:

| Bagian | Fungsi |
|---|---|
| `cert-manager.io/cluster-issuer` | Memberitahu cert-manager untuk menggunakan ClusterIssuer tertentu |
| `ingressClassName: public` | Menggunakan IngressClass bawaan MicroK8s |
| `tls.hosts` | Domain yang akan menggunakan HTTPS |
| `secretName` | Secret Kubernetes tempat certificate TLS disimpan |
| `rules.host` | Domain yang diarahkan ke service |
| `backend.service.name` | Nama Service tujuan |
| `backend.service.port.number` | Port Service tujuan |

---

## 18. Membuat ClusterIssuer Let's Encrypt

Buat file `lets-encrypt-prod.yaml`.

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: contact@napskytech.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            class: public
```

Penjelasan:

| Field | Fungsi |
|---|---|
| `email` | Email untuk notifikasi dari Let's Encrypt |
| `server` | Endpoint ACME Let's Encrypt production |
| `privateKeySecretRef` | Secret untuk menyimpan private key akun ACME |
| `solvers.http01` | Metode validasi domain menggunakan HTTP challenge |
| `ingress.class` | Ingress class yang digunakan untuk challenge |

> Untuk testing, sebaiknya gunakan Let's Encrypt staging terlebih dahulu agar tidak terkena rate limit.

Contoh server staging:

```yaml
server: https://acme-staging-v02.api.letsencrypt.org/directory
```

---

## 19. Apply Konfigurasi Let's Encrypt dan Ingress

Apply ClusterIssuer:

```bash
kubectl apply -f ingress/lets-encrypt-prod.yaml
```

Apply Ingress:

```bash
kubectl apply -f ingress/nginx.yaml
```

Cek Certificate:

```bash
kubectl get certificate
```

Cek detail Certificate:

```bash
kubectl describe certificate
```

Cek Secret TLS:

```bash
kubectl get secret
```

Jika berhasil, cert-manager akan membuat certificate dan menyimpannya ke Secret sesuai `secretName` yang didefinisikan di Ingress.

---

## 20. Alur Akses Aplikasi dengan Ingress dan HTTPS

Alur request ketika user membuka domain:

```text
User Browser
    |
    v
Domain lab.napskytech.com
    |
    v
Ingress Controller
    |
    v
Ingress Rule
    |
    v
Service nginx-service
    |
    v
Pod Nginx
```

Jika TLS aktif:

```text
User Browser HTTPS
    |
    v
Ingress Controller membaca TLS Secret
    |
    v
Routing ke Service
    |
    v
Pod Aplikasi
```

---

## 21. Ringkasan Command Penting

### MicroK8s

```bash
sudo snap install microk8s --classic
microk8s status --wait-ready
microk8s enable ingress
microk8s enable metallb
sudo microk8s enable cert-manager
```

### kubectl

```bash
kubectl get nodes
kubectl get pods
kubectl get svc
kubectl get rs
kubectl get deploy
kubectl get ingress
kubectl get ingressclass
kubectl get certificate
```

### Apply Manifest

```bash
kubectl apply -f pods.yaml
kubectl apply -f replicaset/nginx.yaml
kubectl apply -f services/service-cluster.yaml
kubectl apply -f ingress/lets-encrypt-prod.yaml
kubectl apply -f ingress/nginx.yaml
```

### Scaling

```bash
kubectl scale rs nginx --replicas 5
kubectl scale rs nginx --replicas 3
kubectl scale deploy nginx-deployment --replicas 5
```

### Rollout

```bash
kubectl rollout history deploy nginx-deployment
```

---

## 22. Catatan Best Practice

Untuk kebutuhan belajar, menjalankan Pod secara langsung memang boleh. Namun untuk aplikasi yang lebih serius, sebaiknya gunakan Deployment.

Rekomendasi struktur resource:

```text
Deployment -> Service -> Ingress -> TLS Certificate
```

Untuk production ringan, perhatikan beberapa hal berikut:

- Gunakan Deployment, bukan Pod standalone
- Gunakan Service sebagai entry point internal
- Gunakan Ingress untuk routing domain
- Gunakan cert-manager untuk HTTPS otomatis
- Gunakan resource request dan limit pada container
- Gunakan namespace untuk memisahkan environment
- Gunakan Secret untuk data sensitif
- Gunakan ConfigMap untuk konfigurasi aplikasi
- Aktifkan monitoring dan logging
- Pastikan DNS domain sudah mengarah ke IP server/LoadBalancer

Contoh tambahan resource limit:

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

---

## 23. Kesimpulan

MicroK8s adalah pilihan yang sangat baik untuk belajar Kubernetes maupun menjalankan cluster kecil. Dibandingkan Minikube, MicroK8s lebih ringan karena berjalan sebagai service native di sistem, bukan di dalam VM atau container tambahan.

Dalam materi ini, kita telah membahas:

- Alasan menggunakan MicroK8s
- Perbandingan Minikube dan MicroK8s
- Instalasi MicroK8s dan kubectl
- Membuat Pod Nginx
- Expose Pod menggunakan NodePort
- Menggunakan ReplicaSet
- Menggunakan Deployment
- Membuat Service ClusterIP, NodePort, dan LoadBalancer
- Mengaktifkan MetalLB
- Menggunakan Ingress sebagai reverse proxy
- Menambahkan HTTPS dengan Let's Encrypt dan cert-manager

Dengan memahami alur dari Deployment, Service, Ingress, hingga TLS certificate, kita sudah memiliki fondasi yang cukup kuat untuk mulai membangun dan menjalankan aplikasi di Kubernetes.
