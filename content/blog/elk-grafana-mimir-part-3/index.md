---
title: 'Observability Stack - Part 3: Kombinasi ELK dengan Grafana Mimir untuk Metrik Jangka Panjang'
date: '2026-11-15'
template: 'post'
draft: false
slug: 'elk-grafana-mimir-part-3'
category: 'Technology'
tags:
  - 'Grafana Mimir'
  - 'Prometheus'
  - 'Grafana'
  - 'Elasticsearch'
  - 'Observability'
  - 'remote_write'
  - 'Docker'
description: 'Menghubungkan Prometheus ke Grafana Mimir lewat remote_write, menyimpan metrik jangka panjang, lalu menyatukan log ELK dan metrik dalam satu dashboard Grafana.'
seoTitle: 'Kombinasi ELK dan Grafana Mimir untuk Metrik Jangka Panjang - Part 3'
seoDescription: 'Tutorial Grafana Mimir: deploy Mimir monolithic, konfigurasi Prometheus remote_write, query metrik dari Grafana, dan dashboard unified ELK + Mimir.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/00-cover.png'
---

Ini adalah **Part 3**, bagian terakhir dari seri observability stack. Sampai di sini kita punya log Nginx di Elasticsearch dan metrik host di Prometheus. Masalahnya, Prometheus di lab hanya menyimpan data dua jam. Untuk pertanyaan seperti “bagaimana tren CPU seminggu terakhir?” atau “kapan disk mulai penuh bulan lalu?”, dua jam tidak cukup.

Di part ini metrik dikirim ke **Grafana Mimir** untuk penyimpanan jangka panjang, lalu log ELK dan metrik Mimir disatukan dalam satu dashboard.

Rangkaian artikel:

- [Part 1](/blog/elk-grafana-mimir-part-1) — install dan integrasi ELK.
- [Part 2](/blog/elk-grafana-mimir-part-2) — Grafana dan dashboard log serta metrik host.
- **Part 3 (ini)** — kombinasi dengan Grafana Mimir.

## Kenapa Mimir

Prometheus sangat baik untuk scrape dan query, tetapi penyimpanannya lokal dan terikat satu proses. Keterbatasannya muncul saat:

- Retensi harus lebih dari beberapa minggu.
- Data harus tetap ada walaupun server Prometheus diganti.
- Beberapa Prometheus perlu dikirim ke satu tempat.
- Query harus tetap cepat saat jumlah series besar.
- Butuh pemisahan data antar tim atau tenant.

**Grafana Mimir** adalah time series database yang kompatibel dengan PromQL dan API Prometheus. Ia menyimpan blok metrik di object storage (S3, GCS, atau Azure Blob), sehingga penyimpanan bisa tumbuh tanpa menambah disk lokal. Mimir juga mendukung multi-tenancy dan komponen yang bisa diskalakan terpisah.

Arsitektur part ini:

```text
node-exporter ◄── scrape ── Prometheus ── remote_write ──► Mimir
                                                             │
                                                             ▼
                                                     object storage
                                                     (lab: filesystem)

Grafana ──query metrik──► Mimir
   │
   └──query log──► Elasticsearch
```

Log tetap di Elasticsearch. Mimir hanya menangani metrik. Grafana menjadi lapisan yang menyatukan keduanya.

## Mode Mimir

Mimir bisa dijalankan dalam dua bentuk:

- **Monolithic** — semua komponen dalam satu proses (`-target=all`). Cocok untuk lab, development, atau deployment kecil.
- **Distributed** — distributor, ingester, querier, store-gateway, compactor, dan ruler berjalan terpisah. Dipakai untuk produksi dan skala besar.

Lab ini memakai monolithic agar jumlah container tetap wajar. Konsep yang dipelajari tetap sama: `remote_write`, object storage, dan query lewat Grafana.

## Menambahkan service Mimir

Tambahkan ke `docker-compose.yml`:

```yaml
  mimir:
    image: grafana/mimir:3.2.5
    container_name: elk-mimir
    profiles: ["mimir"]
    ports:
      - "9009:9009"
    volumes:
      - ./mimir/mimir.yaml:/etc/mimir/mimir.yaml:ro
      - mimirdata:/data
    command:
      - -config.file=/etc/mimir/mimir.yaml
      - -target=all
```

Tambahkan volume:

```yaml
volumes:
  esdata:
  promdata:
  grafanadata:
  mimirdata:
```

Port `9009` adalah port HTTP Mimir. Di produksi, port ini **tidak boleh** dibuka ke publik; akses query dan push harus lewat gateway yang menangani autentikasi dan tenant.

## Konfigurasi Mimir

`mimir/mimir.yaml`:

```yaml
multitenancy_enabled: false

server:
  http_listen_port: 9009
  grpc_listen_port: 9095
  log_level: info

common:
  storage:
    backend: filesystem
    filesystem:
      dir: /data/common

blocks_storage:
  backend: filesystem
  filesystem:
    dir: /data/blocks
  tsdb:
    dir: /data/tsdb
  bucket_store:
    sync_dir: /data/tsdb-sync

compactor:
  data_dir: /data/compactor
  sharding_ring:
    kvstore:
      store: memberlist

distributor:
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: memberlist

ingester:
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: memberlist
    replication_factor: 1

store_gateway:
  sharding_ring:
    replication_factor: 1

ruler_storage:
  backend: filesystem
  filesystem:
    dir: /data/ruler

alertmanager_storage:
  backend: filesystem
  filesystem:
    dir: /data/alertmanager
```

Penjelasan:

- **`multitenancy_enabled: false`** menyederhanakan lab: tidak perlu header `X-Scope-OrgID`. Di produksi, aktifkan multitenancy dan kirim tenant lewat gateway.
- **`blocks_storage.backend: filesystem`** menyimpan blok metrik di volume lokal. Ini hanya untuk lab; produksi memakai object storage.
- **`replication_factor: 1`** cukup karena hanya ada satu instance. Produksi memakai faktor 3 agar data tetap aman saat satu node hilang.
- **`common.storage`** dipakai ruler dan alertmanager. Di lab, keduanya juga memakai filesystem.
- **`memberlist`** menjadi kvstore ring antar komponen. Dalam mode monolithic semuanya berada di proses yang sama, tetapi konfigurasi ring tetap diperlukan.

## Menjalankan Mimir

```bash
docker compose --profile mimir up -d mimir
```

Mimir butuh sekitar 15 detik sebelum ingester siap. Selama itu, endpoint `/ready` mengembalikan **503** dengan pesan `Ingester not ready: waiting for 15s after being ready`. Ini normal.

```bash
curl -s localhost:9009/ready
```

![Mimir siap menerima trafik|Endpoint /ready mengembalikan "ready" dan query menampilkan jumlah series aktif.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/01-mimir-ready.png)

Buka `http://localhost:9009` untuk melihat **Grafana Mimir Admin**:

![Halaman admin Mimir|Ring, tenant, config, dan status komponen bisa dilihat dari satu halaman.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/04-mimir-admin.png)

Semua komponen utama berjalan dalam satu proses:

![Services status Mimir|Distributor, ingester, querier, compactor, store-gateway, dan ruler berstatus Running.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/05-mimir-services.png)

## Prometheus remote_write ke Mimir

Tambahkan blok `remote_write` dan job scrape Mimir ke `prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

remote_write:
  - url: http://mimir:9009/api/v1/push
    name: mimir

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: node-exporter
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: mimir
    static_configs:
      - targets: ["mimir:9009"]
```

`remote_write` mengirim sampel yang sudah di-scrape Prometheus ke Mimir. Prometheus tetap menyimpan data lokal sesuai retensinya, sehingga query bisa dilayani dari storage lokal atau dari Mimir, tergantung data source yang dipilih di Grafana.

Reload Prometheus tanpa restart:

```bash
curl -s -X POST localhost:9090/-/reload
```

![Konfigurasi remote_write|Blok remote_write mengarah ke endpoint /api/v1/push milik Mimir.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/02-remote-write.png)

Setelah beberapa scrape, query Mimir untuk memastikan data masuk:

```bash
curl -s localhost:9009/prometheus/api/v1/query \
  --data-urlencode 'query=up{job="node-exporter"}' \
  | jq -r '.data.result[] | "\(.metric.job)  \(.metric.instance)  \(.value[1])"'
```

![Query metrik dari Mimir|Mimir mengembalikan series up untuk node-exporter dengan nilai 1.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/03-mimir-query.png)

Perhatikan path query Mimir: `/prometheus/api/v1/query`. Mimir mengekspos API yang kompatibel dengan Prometheus di bawah prefix `/prometheus`.

Mimir juga mengekspos metrik internalnya sendiri, dan Prometheus ikut melakukan scrape ke Mimir. Beberapa query yang berguna:

```promql
sum(rate(cortex_distributor_samples_in_total[5m]))
sum(cortex_ingester_memory_series)
sum(up{job="mimir"})
```

Prefix `cortex_` masih dipakai karena Mimir berasal dari proyek Cortex. Jangan bingung kalau nama metriknya tidak diawali `mimir_`.

## Menambahkan Mimir ke Grafana

Tambahkan data source baru ke `grafana/provisioning/datasources/datasources.yml`:

```yaml
  - name: Mimir
    uid: mimir
    type: prometheus
    access: proxy
    url: http://mimir:9009/prometheus
    jsonData:
      httpMethod: POST
      timeInterval: "15s"
```

Lalu restart Grafana agar provisioning data source dibaca ulang:

```bash
docker compose restart grafana
```

Di halaman data source, URL Mimir harus berakhiran `/prometheus`:

![Data source Mimir di Grafana|URL http://mimir:9009/prometheus dan tipe Prometheus.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/06-grafana-datasource-mimir.png)

Grafana akan menampilkan pesan **Successfully queried the Prometheus API** kalau koneksi dan path sudah benar.

## Dashboard metrik jangka panjang

Dashboard **Metrik Jangka Panjang — Mimir** memakai data source Mimir:

![Dashboard metrik dari Mimir|Ingestion rate, active series, CPU, load, dan network dibaca dari Mimir.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/07-dashboard-mimir.png)

Panel utamanya:

| Panel | Query |
|---|---|
| Samples Masuk / detik | `sum(rate(cortex_distributor_samples_in_total[5m]))` |
| Active Series | `sum(cortex_ingester_memory_series)` |
| Mimir Up | `sum(up{job="mimir"})` |
| Target Aktif | `count(up)` |
| CPU Usage | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |
| Load Average | `node_load1` |
| Tren Samples Masuk | `sum(rate(cortex_distributor_samples_in_total[5m]))` |
| Network Receive | `rate(node_network_receive_bytes_total{device="eth0"}[5m])` |

Karena data source-nya Mimir, dashboard ini bisa memakai rentang waktu berjam-jam, berhari-hari, atau berminggu-minggu tanpa bergantung pada disk Prometheus. Di lab, data baru terkumpul beberapa menit; di produksi, inilah yang membuat tren jangka panjang mungkin.

## Dashboard unified: log dan metrik dalam satu layar

Dashboard **Unified Observability — ELK + Mimir** menggabungkan dua data source:

- Panel log memakai Elasticsearch: total log, error 5xx, volume per status, path teratas, dan log mentah.
- Panel metrik memakai Mimir: CPU dan load average.

![Dashboard unified ELK dan Mimir|Log dari Elasticsearch dan metrik dari Mimir tampil dalam satu dashboard.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-3/08-dashboard-unified.png)

Inilah nilai dari kombinasi ini. Saat error 5xx naik, kita bisa langsung melihat apakah penyebabnya ada di aplikasi (log) atau di resource host (metrik). Tidak perlu membuka dua aplikasi dan mencocokkan timestamp secara manual.

Yang perlu ditegaskan: **data tidak dicampur di satu database**. Log tetap di Elasticsearch, metrik tetap di Mimir. Grafana hanya melakukan query ke masing-masing sumber dan menampilkan hasilnya berdampingan. Pemisahan ini penting karena karakteristik log dan metrik berbeda: log itu besar, detail, dan mahal untuk diindeks; metrik itu ringkas, time series, dan cocok untuk retensi panjang.

## Catatan untuk produksi

Konfigurasi lab ini belum siap produksi. Sebelum dipakai di lingkungan nyata:

- **Gunakan object storage.** Ganti `filesystem` dengan S3, GCS, atau Azure Blob. Object storage adalah sumber kebenaran Mimir; node Mimir bisa diganti tanpa kehilangan data.
- **Jalankan mode distributed.** Pisahkan distributor, ingester, querier, store-gateway, dan compactor. Setiap komponen bisa diskalakan sesuai beban.
- **Gunakan replication factor 3.** Dengan satu replika, kehilangan satu node berarti kehilangan data.
- **Aktifkan multitenancy.** Kirim `X-Scope-OrgID` dari gateway yang sudah terautentikasi. Jangan biarkan client memilih tenant sendiri tanpa kontrol.
- **Batasi retensi dan cardinality.** Atur retention lewat compactor dan limits per tenant. Label dengan cardinality tinggi (user ID, request ID, URL lengkap) bisa menghabiskan memori dan storage.
- **Tuning remote_write.** Atur `queue_config`, `max_samples_per_send`, dan `capacity` sesuai volume. Pantau metrik `prometheus_remote_storage_*`.
- **Jalankan Prometheus berpasangan** dengan `external_labels` yang sama dan deduplikasi di Mimir bila butuh HA.
- **Jangan expose port 9009.** Letakkan Mimir di belakang gateway/internal load balancer.
- **Backup object storage.** Mimir mengandalkan object storage; perlakukan bucket seperti database.
- **Pantau Mimir itu sendiri.** Ingestion rate, active series, query latency, disk compactor, dan error remote_write adalah metrik operasional wajib.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `/ready` 503 | Ingester belum siap | Tunggu 15–30 detik, cek log Mimir |
| remote_write 404 | URL salah | Gunakan `http://mimir:9009/api/v1/push` |
| remote_write 401/403 | Multitenancy aktif tanpa header | Kirim `X-Scope-OrgID` lewat gateway |
| Mimir tidak menerima data | Prometheus belum reload | `curl -X POST localhost:9090/-/reload`, cek target |
| Query Mimir kosong | Data belum ter-ingest atau time range salah | Tunggu satu scrape, cek `/prometheus/api/v1/query` |
| Grafana data source gagal | URL tidak memakai `/prometheus` | Perbaiki URL dan restart Grafana |
| Samples ditolak | Melebihi limit tenant atau out-of-order | Cek limit dan `out_of_order_time_window` |
| Compactor kehabisan disk | Retensi terlalu panjang / disk kecil | Perbesar disk, atur retensi |
| Memory naik terus | Cardinality tinggi | Relabel, drop label yang tidak perlu |
| Mimir restart loop | Config atau permission volume salah | Cek `docker compose logs mimir` |

## Checklist akhir

- [ ] Mimir berjalan dan `/ready` mengembalikan `ready`.
- [ ] Halaman admin Mimir menampilkan semua komponen Running.
- [ ] `remote_write` ditambahkan ke Prometheus dan config sudah direload.
- [ ] Query `up` dari Mimir mengembalikan series.
- [ ] Data source Mimir di Grafana sehat.
- [ ] Dashboard Mimir menampilkan metrik.
- [ ] Dashboard unified menampilkan log Elasticsearch dan metrik Mimir.
- [ ] Retensi dan cardinality sudah direncanakan.
- [ ] Port Mimir tidak terbuka ke publik.
- [ ] Object storage dan replication factor disiapkan untuk produksi.

## Kesimpulan

Mimir melengkapi lapisan metrik: Prometheus tetap bertugas scrape dan menyimpan data jangka pendek, sementara Mimir menyimpan salinan jangka panjang di object storage dan melayani query PromQL dalam skala besar. Dengan `remote_write`, integrasinya tidak mengubah cara kerja Prometheus; cukup menambah satu blok konfigurasi.

Kombinasi akhir seri ini memisahkan tanggung jawab dengan jelas: **Elasticsearch untuk log, Prometheus dan Mimir untuk metrik, Grafana untuk visualisasi**. Kibana tetap berguna untuk eksplorasi log mendalam, tetapi dashboard operasional harian bisa berada di satu tempat. Struktur inilah yang membuat observability terasa seperti sistem, bukan kumpulan alat yang berdiri sendiri.

Kalau ingin melanjutkan, langkah berikutnya adalah menambahkan alerting: aturan di Grafana atau Mimir untuk error rate dan resource, lalu mengirim notifikasi ke Slack, email, atau Telegram.

Itu dia seri observability stack dari instalasi ELK, dashboard Grafana, sampai metrik jangka panjang dengan Mimir. Semoga labnya bisa jadi titik awal yang praktis untuk stack di server Anda.
