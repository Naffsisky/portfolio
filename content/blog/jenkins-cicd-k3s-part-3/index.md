---
title: 'Home Lab Kubernetes Agent dengan Jenkins CI/CD - Part 3: Ingress, Deploy Aplikasi & CI/CD Pipeline'
date: '2026-04-22'
template: 'post'
draft: false
slug: 'jenkins-cicd-k3s-part-3'
category: 'Technology'
tags:
  - 'Kubernetes'
  - 'Jenkins'
  - 'CI/CD'
  - 'Nginx'
  - 'DevOps'
description: 'Bagian terakhir seri Jenkins CI/CD di home lab: deploy Nginx Ingress Controller, buat Kubernetes manifest untuk aplikasi Next.js, konfigurasi Jenkinsfile, dan jalankan pipeline end-to-end dari GitHub hingga cluster K3s.'
socialImage: '/blog/jenkins-cicd-k3s-part-3/images/02-app-two-browser.png'
---

## Intro

Ini adalah **Part 3 (terakhir)** dari seri tutorial CI/CD home lab. Di part ini semua komponen digabungkan:

- [Part 1](/blog/jenkins-cicd-k3s-part-1) — Jenkins Controller + Build Agent
- [Part 2](/blog/jenkins-cicd-k3s-part-2) — K3s Cluster (Control Plane + 3 Worker)
- **Part 3 (ini)** — Nginx Ingress, deploy aplikasi, dan pipeline CI/CD end-to-end

---

## Phase 3: Install Nginx Ingress Controller

Sebelum deploy aplikasi, cluster butuh Ingress Controller sebagai entry point. Jalankan dari `lab-worker-1` atau `lab2`:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/baremetal/deploy.yaml
```

Tunggu sampai pod ready:

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

NodePort yang ter-assign setelah instalasi:

| Protocol | NodePort |
|---|---|
| HTTP | `30347` |
| HTTPS | `30493` |

Aplikasi dapat diakses via `http://192.168.1.101:30347` (atau node mana saja di cluster).

---

## Phase 4: Deploy Aplikasi

### Validasi Ingress dengan Sample App

Sebelum deploy aplikasi asli, validasi dulu routing Ingress menggunakan image `nginxdemos/hello`.

Buat manifest di `lab-worker-1`:

```bash
mkdir -p ~/k8s-test && cat > ~/k8s-test/sample-app.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: sample-app

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-one
  namespace: sample-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app-one
  template:
    metadata:
      labels:
        app: app-one
    spec:
      containers:
      - name: app-one
        image: nginxdemos/hello
        ports:
        - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: app-one-svc
  namespace: sample-app
spec:
  selector:
    app: app-one
  ports:
  - port: 80
    targetPort: 80

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-two
  namespace: sample-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app-two
  template:
    metadata:
      labels:
        app: app-two
    spec:
      containers:
      - name: app-two
        image: nginxdemos/hello
        ports:
        - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: app-two-svc
  namespace: sample-app
spec:
  selector:
    app: app-two
  ports:
  - port: 80
    targetPort: 80

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sample-ingress
  namespace: sample-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: app-one.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-one-svc
            port:
              number: 80
  - host: app-two.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-two-svc
            port:
              number: 80
EOF
```

Apply dan verifikasi:

```bash
kubectl apply -f ~/k8s-test/sample-app.yaml
kubectl get all -n sample-app
kubectl get ingress -n sample-app
```

Semua pod harus berstatus `Running`. Response 404 saat akses via IP langsung adalah normal — Ingress routing bergantung pada Host header, bukan raw IP.

### Test via hosts file (Windows)

Buka Notepad as Administrator, edit file:

```
C:\Windows\System32\drivers\etc\hosts
```

Tambahkan di baris paling bawah:

```
192.168.1.101   app-one.local
192.168.1.101   app-two.local
```

Buka browser dan akses:

- `http://app-one.local:30347`
- `http://app-two.local:30347`

![app-one.local berhasil diakses via Nginx Ingress](/blog/jenkins-cicd-k3s-part-3/images/01-app-one-browser.png)

![app-two.local berhasil diakses via Nginx Ingress](/blog/jenkins-cicd-k3s-part-3/images/02-app-two-browser.png)

Setelah validasi selesai, hapus sample app:

```bash
kubectl delete -f ~/k8s-test/sample-app.yaml
kubectl get all -n sample-app
```

Output seharusnya: `No resources found in sample-app namespace.`

---

## Buat Kubernetes Manifest untuk Aplikasi

Buat direktori manifest di `lab-worker-1`:

```bash
mkdir -p ~/k8s/{portfolio,napskytech}
```

**`~/k8s/portfolio/deployment.yaml`:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: portfolio

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portfolio
  namespace: portfolio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: portfolio
  template:
    metadata:
      labels:
        app: portfolio
    spec:
      imagePullSecrets:
      - name: ghcr-secret
      containers:
      - name: portfolio
        image: ghcr.io/naffsisky/portfolio:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "300m"
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: portfolio-svc
  namespace: portfolio
spec:
  selector:
    app: portfolio
  ports:
  - port: 80
    targetPort: 3000

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portfolio-ingress
  namespace: portfolio
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: portfolio.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: portfolio-svc
            port:
              number: 80
```

**`~/k8s/napskytech/deployment.yaml`:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: napskytech

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: napskytech
  namespace: napskytech
spec:
  replicas: 2
  selector:
    matchLabels:
      app: napskytech
  template:
    metadata:
      labels:
        app: napskytech
    spec:
      imagePullSecrets:
      - name: ghcr-secret
      containers:
      - name: napskytech
        image: ghcr.io/naffsisky/napskytech:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "300m"
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: napskytech-svc
  namespace: napskytech
spec:
  selector:
    app: napskytech
  ports:
  - port: 80
    targetPort: 3000

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: napskytech-ingress
  namespace: napskytech
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: napskytech.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: napskytech-svc
            port:
              number: 80
```

Verifikasi struktur direktori:

```bash
find ~/k8s -type f
```

---

## Buat Jenkinsfile di Masing-masing Repo

Clone kedua repo di `lab-worker-1`:

```bash
cd ~
git clone https://github.com/Naffsisky/portfolio.git
git clone https://github.com/Naffsisky/napskytech.git
```

**`Jenkinsfile` untuk portfolio:**

```groovy
pipeline {
    agent { label 'build-agent' }

    environment {
        IMAGE_NAME = 'ghcr.io/naffsisky/portfolio'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo $DOCKER_PASS | docker login ghcr.io -u $DOCKER_USER --password-stdin
                        docker push ${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${IMAGE_NAME}:latest
                    '''
                }
            }
        }

        stage('Prepare Namespace & Secret') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        kubectl create namespace portfolio --dry-run=client -o yaml | kubectl apply -f -
                        kubectl create secret docker-registry ghcr-secret \
                          --docker-server=ghcr.io \
                          --docker-username=$DOCKER_USER \
                          --docker-password=$DOCKER_PASS \
                          --namespace=portfolio \
                          --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        stage('Deploy to k3s') {
            steps {
                sh '''
                    kubectl apply -f /home/ubuntu/k8s/portfolio/deployment.yaml
                    kubectl set image deployment/portfolio \
                      portfolio=${IMAGE_NAME}:${BUILD_NUMBER} \
                      -n portfolio
                    kubectl rollout status deployment/portfolio -n portfolio --timeout=300s
                '''
            }
        }
    }

    post {
        success {
            echo "Portfolio deployed: ${IMAGE_NAME}:${BUILD_NUMBER}"
            sh 'docker image prune -f'
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            sh 'docker logout ghcr.io || true'
        }
    }
}
```

**`Jenkinsfile` untuk napskytech:**

```groovy
pipeline {
    agent { label 'build-agent' }

    environment {
        IMAGE_NAME = 'ghcr.io/naffsisky/napskytech'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo $DOCKER_PASS | docker login ghcr.io -u $DOCKER_USER --password-stdin
                        docker push ${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${IMAGE_NAME}:latest
                    '''
                }
            }
        }

        stage('Prepare Namespace & Secret') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        kubectl create namespace napskytech --dry-run=client -o yaml | kubectl apply -f -
                        kubectl create secret docker-registry ghcr-secret \
                          --docker-server=ghcr.io \
                          --docker-username=$DOCKER_USER \
                          --docker-password=$DOCKER_PASS \
                          --namespace=napskytech \
                          --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        stage('Deploy to k3s') {
            steps {
                sh '''
                    kubectl apply -f /home/ubuntu/k8s/napskytech/deployment.yaml
                    kubectl set image deployment/napskytech \
                      napskytech=${IMAGE_NAME}:${BUILD_NUMBER} \
                      -n napskytech
                    kubectl rollout status deployment/napskytech -n napskytech --timeout=300s
                '''
            }
        }
    }

    post {
        success {
            echo "Napskytech deployed: ${IMAGE_NAME}:${BUILD_NUMBER}"
            sh 'docker image prune -f'
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            sh 'docker logout ghcr.io || true'
        }
    }
}
```

Commit dan push Jenkinsfile ke masing-masing repo, lalu tambahkan `portfolio.local` ke hosts file Windows:

```
192.168.1.101   portfolio.local
192.168.1.101   napskytech.local
```

Akses di browser: `http://portfolio.local:30347`

---

## Kenapa Pakai Port 30347?

Nginx Ingress di-install dengan tipe **NodePort** karena homelab tidak punya cloud load balancer. Port di-assign otomatis saat instalasi.

Cek port yang ter-assign:

```bash
kubectl get svc -n ingress-nginx
```

Kalau ingin akses tanpa port (langsung port 80), ada beberapa opsi:

- **MetalLB** — software load balancer untuk baremetal, assign IP dedicated ke Ingress
- **HostPort** — bind langsung ke port 80 di node
- **LoadBalancer** — butuh cloud provider

---

## Kenapa Ingress Pakai Hostname?

Ingress Controller bekerja seperti virtual host di Nginx biasa. Ia membaca `Host` header dari request dan meneruskan ke service yang sesuai:

```yaml
rules:
- host: portfolio.local       # cocokkan Host header
  http:
    paths:
    - path: /
      backend:
        service:
          name: portfolio-svc # teruskan ke sini
```

Satu IP bisa melayani banyak aplikasi berbeda berdasarkan hostname. Karena tidak ada DNS server yang resolve `portfolio.local`, maka hosts file di Windows digunakan sebagai penggantinya.

---

## Arsitektur Lengkap

### Infrastruktur VM

```
lab-worker   (192.168.1.200 | 4CPU/4GB) — Jenkins Controller
lab-worker-1 (192.168.1.201 | 2CPU/2GB) — Jenkins Build Agent
lab2         (192.168.1.102 | 2CPU/4GB) — k3s Control Plane
lab1         (192.168.1.101 | 1CPU/2GB) — k3s Worker
lab3         (192.168.1.103 | 1CPU/2GB) — k3s Worker
lab4         (192.168.1.104 | 1CPU/2GB) — k3s Worker
```

### Network Flow End-to-End

```
Browser (Windows)
    │  http://portfolio.local:30347
    ▼
hosts file → 192.168.1.101
    ▼
NodePort 30347 (semua worker node listen)
    ▼
ingress-nginx-controller pod
    │  baca Host header → "portfolio.local"
    │  cocokkan Ingress rule → portfolio-svc
    ▼
portfolio-svc (ClusterIP 10.43.x.x:80)
    ▼
portfolio pod (10.42.x.x:3000) — running di lab3 atau lab4
```

### CIDR Breakdown

```
10.42.0.0/16  → Pod network (Flannel CNI)
  10.42.0.x   → pods di lab2-control
  10.42.1.x   → pods di lab1-worker
  10.42.2.x   → pods di lab3-worker
  10.42.3.x   → pods di lab4-worker

10.43.0.0/16  → Service network (virtual)
  10.43.x.x   → portfolio-svc, napskytech-svc, ingress-nginx svc
```

### CI/CD Flow

```
Push ke GitHub
      ↓
Jenkins Controller (lab-worker) terima trigger
      ↓
Spawn job di Build Agent (lab-worker-1)
      ↓
git clone repo
      ↓
docker build → image:BUILD_NUMBER + image:latest
      ↓
docker push → ghcr.io/naffsisky/[app]
      ↓
kubectl create namespace (idempotent)
kubectl create secret ghcr-secret (idempotent)
      ↓
kubectl apply -f deployment.yaml
kubectl set image deployment/[app] [app]=image:BUILD_NUMBER
      ↓
kubectl rollout status --timeout=300s
      ↓
docker image prune + docker logout
```

---

## Recap Part 3 & Keseluruhan Seri

| Komponen | Status | Detail |
|---|---|---|
| Nginx Ingress Controller | Selesai | NodePort `30347` (HTTP) / `30493` (HTTPS) |
| Sample App Validation | Selesai | `app-one.local` dan `app-two.local` berhasil diakses |
| K8s Manifest Portfolio | Selesai | 2 replicas, readiness probe, GHCR image pull secret |
| K8s Manifest Napskytech | Selesai | 2 replicas, readiness probe, GHCR image pull secret |
| Jenkinsfile Portfolio | Selesai | Build → Push → Deploy → Rollout status |
| Jenkinsfile Napskytech | Selesai | Build → Push → Deploy → Rollout status |
| Pipeline CI/CD | Selesai | End-to-end dari GitHub ke K3s cluster |

Status akhir semua pod:

```
✓ portfolio     2/2 Running  (lab3 + lab4)
✓ napskytech    2/2 Running  (lab3 + lab4)
✓ ingress-nginx 1/1 Running  (NodePort 30347/30493)
✓ kube-system   3/3 Running  (coredns, metrics, local-path)
```
