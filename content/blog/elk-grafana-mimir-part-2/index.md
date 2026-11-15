---
title: 'Observability Stack - Part 2: Monitoring Grafana dan Dashboard Log & Metrik'
date: '2026-11-15'
template: 'post'
draft: false
slug: 'elk-grafana-mimir-part-2'
category: 'Technology'
tags:
  - 'Grafana'
  - 'Prometheus'
  - 'node-exporter'
  - 'Elasticsearch'
  - 'Observability'
  - 'Dashboard'
  - 'Docker'
description: 'Lanjutan seri observability: menghubungkan Grafana ke Elasticsearch dan Prometheus, lalu membangun dashboard log Nginx dan metrik host yang terisi data nyata.'
seoTitle: 'Monitoring Grafana dan Dashboard Log & Metrik - Part 2'
seoDescription: 'Tutorial Grafana: provisioning data source Elasticsearch dan Prometheus, membuat dashboard log Nginx, metrik CPU/RAM/disk, dan panel log mentah.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/00-cover.png'
---

Ini adalah **Part 2** dari seri observability stack. Di [Part 1](/blog/elk-grafana-mimir-part-1) kita sudah membuat ELK menerima dan mem-parsing log Nginx. Sekarang log tersebut akan dibuat bisa dibaca cepat: dashboard, grafik, dan panel yang menjawab pertanyaan operasional.

Rangkaian artikel:

- [Part 1](/blog/elk-grafana-mimir-part-1) — install dan integrasi ELK.
- **Part 2 (ini)** — Grafana, data source, dan dashboard log serta metrik host.
- [Part 3](/blog/elk-grafana-mimir-part-3) — metrik jangka panjang dengan Grafana Mimir.

## Peran Grafana di stack ini

Kibana tetap dipakai untuk menjelajahi log satu per satu. Grafana mengambil peran berbeda: **dashboard operasional** yang menggabungkan beberapa sumber data.

Di part ini ada dua sumber:

```text
Elasticsearch  ──►  Grafana  ◄──  Prometheus
(log Nginx)         dashboard      (metrik host)
                                      ▲
                                      │
                                 node-exporter
```

- **Elasticsearch** menyediakan log yang sudah diparse: status, path, client IP, latency.
- **Prometheus** menyimpan metrik time series hasil scrape.
- **node-exporter** mengekspos metrik host: CPU, RAM, disk, network.
- **Grafana** menyatukan keduanya dalam satu dashboard.

Dengan pemisahan ini, log tetap ditangani ELK, sedangkan metrik ditangani Prometheus. Keduanya bertemu di Grafana.

## Tambahan service

Tambahkan tiga service berikut ke `docker-compose.yml` dari Part 1. Semuanya memakai profile `monitoring` agar tidak ikut berjalan saat lab ELK saja yang dibutuhkan.

```yaml
  node-exporter:
    image: prom/node-exporter:v1.10.2
    container_name: elk-node-exporter
    profiles: ["monitoring"]
    ports:
      - "9100:9100"
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - --path.procfs=/host/proc
      - --path.sysfs=/host/sys
      - --path.rootfs=/rootfs
      - --collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($|/)

  prometheus:
    image: prom/prometheus:v3.16.0
    container_name: elk-prometheus
    profiles: ["monitoring"]
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - promdata:/prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=2h
      - --web.enable-lifecycle
    depends_on:
      - node-exporter

  grafana:
    image: grafana/grafana:13.2.6
    container_name: elk-grafana
    profiles: ["monitoring"]
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=adminlab123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_AUTH_ANONYMOUS_ENABLED=false
      - GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/var/lib/grafana/dashboards/nginx-logs.json
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafanadata:/var/lib/grafana
    depends_on:
      - prometheus
```

Jangan lupa menambahkan volume:

```yaml
volumes:
  esdata:
  promdata:
  grafanadata:
```

Penjelasan singkat:

- **`pid: host` dan mount `/proc`, `/sys`, `/`** dibutuhkan node-exporter untuk membaca metrik host, bukan metrik container.
- **`--storage.tsdb.retention.time=2h`** membatasi retensi Prometheus di lab. Di Part 3, metrik akan dikirim ke Mimir untuk retensi yang lebih panjang.
- **`--web.enable-lifecycle`** mengizinkan reload konfigurasi lewat `POST /-/reload` tanpa restart container.
- **Provisioning** membuat data source dan dashboard tersimpan sebagai file, bukan hanya di database Grafana.

## Konfigurasi Prometheus

`prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: node-exporter
    static_configs:
      - targets: ["node-exporter:9100"]
```

Prometheus mencari dirinya sendiri dan node-exporter melalui DNS internal Docker Compose. Jangan memakai `localhost:9100` dari dalam container Prometheus, karena `localhost` merujuk ke container Prometheus sendiri.

## Provisioning data source Grafana

Grafana membaca file di `/etc/grafana/provisioning/datasources`. Buat `grafana/provisioning/datasources/datasources.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Elasticsearch Logs
    uid: es-logs
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    jsonData:
      index: "nginx-logs-*"
      timeField: "@timestamp"
      esVersion: "8.0.0"
      timeInterval: "1m"
      maxConcurrentShardRequests: 5
      logMessageField: message

  - name: Prometheus
    uid: prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    jsonData:
      httpMethod: POST
      timeInterval: "15s"
```

Beberapa detail penting:

- **`uid`** dipakai dashboard JSON untuk merujuk data source. Dengan UID tetap, dashboard tidak rusak saat dipindahkan antar environment.
- **`url` memakai nama service**, bukan `localhost`, karena Grafana berjalan di container.
- **`logMessageField: message`** memberi tahu panel Logs field mana yang harus ditampilkan. Tanpa ini, panel hanya menampilkan timestamp.
- **`esVersion: "8.0.0"`** adalah mode kompatibilitas plugin Elasticsearch Grafana. API yang dipakai kompatibel dengan Elasticsearch 9.

## Provisioning dashboard

`grafana/provisioning/dashboards/dashboards.yml`:

```yaml
apiVersion: 1

providers:
  - name: observability-lab
    orgId: 1
    folder: Observability Lab
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

Semua file JSON di `grafana/dashboards` akan dimuat ke folder **Observability Lab**. `updateIntervalSeconds: 10` membuat Grafana mengecek perubahan file secara berkala, jadi edit dashboard sebagai code tidak perlu restart.

## Dashboard log Elasticsearch

Dashboard pertama menjawab pertanyaan: berapa banyak request, berapa yang error, path apa yang paling sering dipanggil, dan siapa client-nya.

Panel yang dipakai:

| Panel | Tipe | Query |
|---|---|---|
| Total Log | stat | Elasticsearch count, query kosong |
| Error 5xx | stat | `status:500 OR status:502 OR status:503` |
| Client Error 4xx | stat | `status:400 OR status:401 OR status:403 OR status:404` |
| Latensi Rata-rata | stat | average field `request_time` |
| Volume Log per Status | timeseries | terms `status` + date histogram `@timestamp` |
| Distribusi Status | bar chart | terms `status` |
| Path Paling Sering Diakses | bar chart | terms `request.keyword` |
| Top Client IP | table | terms `client_ip.keyword` |
| Log Mentah Nginx | logs | semua dokumen, message field `message` |

Target Elasticsearch untuk panel time series di Grafana berbentuk seperti ini:

```json
{
  "datasource": { "type": "elasticsearch", "uid": "es-logs" },
  "query": "",
  "metrics": [{ "id": "1", "type": "count" }],
  "bucketAggs": [
    {
      "id": "2",
      "type": "terms",
      "field": "status",
      "settings": { "order": "desc", "size": "10" }
    },
    {
      "id": "3",
      "type": "date_histogram",
      "field": "@timestamp",
      "settings": { "interval": "auto" }
    }
  ]
}
```

Ada satu jebakan yang sempat muncul di lab: **urutan bucket aggregation**. Di plugin Elasticsearch Grafana 13, untuk grafik time series yang dipecah per status, `terms` harus berada **sebelum** `date_histogram`. Kalau urutannya dibalik, query tidak mengembalikan frame dan panel menampilkan **No data** walaupun datanya ada.

Untuk stat panel, Grafana tetap membutuhkan minimal satu bucket. Tambahkan `date_histogram` dengan interval `auto`, lalu gunakan reduce `sum` untuk total dan `mean` untuk rata-rata latency.

## Query metrik host

Dashboard kedua memakai Prometheus. Query PromQL yang dipakai:

| Panel | Query |
|---|---|
| CPU Usage | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |
| Memory Usage | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100` |
| Load Average | `node_load1` |
| Disk Usage | `(1 - node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs\|overlay"} / node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs\|overlay"}) * 100` |
| CPU per Mode | `avg by (mode) (rate(node_cpu_seconds_total{mode!="idle"}[5m])) * 100` |
| Network | `rate(node_network_receive_bytes_total{device="eth0"}[5m])` |
| Disk I/O | `rate(node_disk_read_bytes_total{device="sda"}[5m])` |

Nama device bisa berbeda tergantung host. Di VM ini `eth0` dan `sda`; di mesin lain bisa `ens5` atau `nvme0n1`. Cek label yang tersedia:

```bash
curl -s 'localhost:9090/api/v1/label/device/values?match[]=node_disk_read_bytes_total'
```

Kalau panel kosong, biasanya nama device atau mountpoint tidak cocok.

## Menjalankan monitoring stack

```bash
docker compose --profile monitoring up -d node-exporter prometheus grafana
docker compose --profile monitoring ps --format "table {{.Name}}\t{{.Service}}\t{{.Status}}" prometheus node-exporter grafana
```

![Prometheus, node-exporter, dan Grafana berjalan|Ketiga service monitoring berstatus Up.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/01-monitoring-stack.png)

Cek target Prometheus:

```bash
curl -s localhost:9090/api/v1/query --data-urlencode 'query=up{job=~"prometheus|node-exporter"}' \
  | jq -r '.data.result[] | "\(.metric.job)  \(.value[1])"'
```

![Target Prometheus UP|Job prometheus dan node-exporter mengembalikan nilai 1.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/02-prometheus-targets.png)

Atau buka `http://localhost:9090/targets`:

![Halaman target Prometheus|Kedua target UP dan di-scrape setiap 15 detik.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/03-prometheus-ui.png)

Di Grafana, buka `http://localhost:3000` dan login dengan `admin` / `adminlab123` (kredensial lab). Data source yang diprovisioning akan muncul di **Connections → Data sources**:

![Data source Grafana|Elasticsearch Logs dan Prometheus tersedia; Prometheus menjadi default.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/04-grafana-datasources.png)

## Dashboard log

Buka folder **Observability Lab → Nginx Logs — Elasticsearch**. Dashboard ini memakai data dari Part 1, jadi angka dan grafiknya terisi:

![Dashboard log Nginx di Grafana|Lebih dari 1.140 log, 80 error 5xx, 153 error 4xx, dan latency rata-rata 31 ms.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/05-dashboard-logs.png)

Yang bisa dibaca dari dashboard ini:

- **Total Log** memberi gambaran volume.
- **Error 5xx** memisahkan masalah server dari masalah client.
- **Client Error 4xx** sering menunjukkan bot, path yang salah, atau percobaan scanning.
- **Latensi Rata-rata** memakai `request_time` dari log Nginx.
- **Volume Log per Status** menunjukkan kapan error meningkat.
- **Top Client IP** membantu mendeteksi satu IP yang membanjiri server.
- **Panel log mentah** menampilkan baris asli tanpa harus pindah ke Kibana.

Panel log mentah sengaja ditaruh di dashboard agar investigasi tidak selalu berpindah aplikasi:

![Panel log mentah di Grafana|Pesan log Nginx tampil lengkap dengan timestamp dan status.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/07-logs-panel.png)

## Dashboard metrik host

Buka **Host Metrics — Prometheus**:

![Dashboard metrik host|CPU 7.4%, memory 15.2%, load 0.34, dan disk 78.7% pada lab.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-2/06-dashboard-host.png)

Dashboard ini menjawab pertanyaan yang tidak bisa dijawab log:

- Apakah CPU naik saat jumlah request meningkat?
- Apakah memory habis karena Elasticsearch atau Logstash?
- Apakah disk penuh karena index log?
- Apakah ada lonjakan network atau disk I/O?

Karena metrik dan log berada di Grafana, korelasi bisa dilakukan dengan membandingkan timestamp: lonjakan error di panel log bisa langsung dicocokkan dengan lonjakan CPU atau disk di panel metrik.

## Provisioning versus dashboard UI

Dashboard bisa dibuat lewat UI, tetapi untuk lab dan tim, provisioning lebih baik:

- **Reproducible** — dashboard ikut tersimpan di repository.
- **Reviewable** — perubahan dashboard bisa di-review seperti kode.
- **Konsisten** — UID data source dan panel tidak berubah antar environment.
- **Cepat dipulihkan** — Grafana baru langsung memiliki dashboard yang sama.

Kalau dashboard dibuat lewat UI, gunakan **Dashboard settings → JSON Model** untuk mengekspor dan menyimpannya ke folder provisioning. Jangan mengedit dashboard provisioned lewat UI kalau `allowUiUpdates: false`; perubahan akan hilang saat file dimuat ulang.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Grafana tidak bisa login | Password environment tidak terbaca | Cek `GF_SECURITY_ADMIN_PASSWORD`, restart container |
| Data source Elasticsearch merah | URL salah atau Elasticsearch belum siap | Gunakan `http://elasticsearch:9200`, cek health |
| Panel Elasticsearch “No data” | Urutan bucket agg terbalik | Letakkan `terms` sebelum `date_histogram` |
| Field `request.keyword` kosong | Mapping index tidak punya subfield keyword | Cek mapping, gunakan field yang aggregatable |
| Panel logs hanya timestamp | `logMessageField` belum diisi | Tambahkan `logMessageField: message` |
| Panel host kosong | Nama device/mountpoint berbeda | Cek label `device` dan `mountpoint` di Prometheus |
| node-exporter tidak ada metrik host | Container tidak memakai `pid: host` dan mount host | Perbaiki volume dan flag `--path.*` |
| Dashboard tidak muncul | Path provisioning salah | Cek `docker compose logs grafana` |
| Grafik kosong setelah import | UID data source berbeda | Samakan `uid` di provisioning dan dashboard JSON |
| Waktu tidak cocok | Timezone browser vs UTC | Cek `@timestamp` dan timezone dashboard |

## Checklist akhir

- [ ] Prometheus, node-exporter, dan Grafana berjalan.
- [ ] Kedua target Prometheus berstatus UP.
- [ ] Data source Elasticsearch dan Prometheus tersedia di Grafana.
- [ ] Dashboard log menampilkan total, error, latency, path, dan IP.
- [ ] Panel log mentah menampilkan pesan, bukan hanya timestamp.
- [ ] Dashboard host menampilkan CPU, memory, load, disk, dan network.
- [ ] Nama device dan mountpoint sesuai host.
- [ ] Dashboard tersimpan sebagai file provisioning.
- [ ] Kredensial admin lab sudah diganti sebelum dipakai di server nyata.

## Kesimpulan

Grafana tidak menggantikan Kibana; keduanya dipakai untuk pekerjaan yang berbeda. Kibana kuat untuk eksplorasi log dan pencarian ad-hoc, sedangkan Grafana kuat untuk dashboard operasional yang menggabungkan log dan metrik. Dengan provisioning, data source dan dashboard menjadi bagian dari repository, bukan konfigurasi manual yang mudah hilang.

Di part ini kita sudah menyatukan log Elasticsearch dan metrik Prometheus. Namun Prometheus di lab hanya menyimpan data dua jam. Di [Part 3](/blog/elk-grafana-mimir-part-3), metrik akan dikirim ke **Grafana Mimir** agar retensinya panjang dan bisa diskalakan, lalu kita satukan log ELK dan metrik Mimir dalam satu dashboard.
