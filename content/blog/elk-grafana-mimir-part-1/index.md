---
title: 'Observability Stack - Part 1: Install dan Integrasi ELK (Elasticsearch, Logstash, Kibana)'
date: '2026-11-15'
template: 'post'
draft: false
slug: 'elk-grafana-mimir-part-1'
category: 'Technology'
tags:
  - 'Elasticsearch'
  - 'Logstash'
  - 'Kibana'
  - 'Filebeat'
  - 'ELK'
  - 'Observability'
  - 'Docker'
description: 'Panduan praktis install dan integrasi ELK: Elasticsearch, Kibana, Logstash, dan Filebeat mengolah log Nginx di Docker, lengkap dengan grok, data view, dan verifikasi di Discover.'
seoTitle: 'Install dan Integrasi ELK Stack dengan Docker - Part 1'
seoDescription: 'Tutorial ELK Stack: install Elasticsearch, Kibana, Logstash, dan Filebeat di Docker, parsing log Nginx dengan grok, lalu verifikasi log di Kibana Discover.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/00-cover.png'
---

Ini adalah **Part 1** dari seri membangun observability stack di lab Docker. Tujuannya sederhana: log aplikasi tidak lagi tersebar di file server, tetapi bisa dicari, difilter, dan divisualisasikan dari satu tempat.

Rangkaian artikel:

- **Part 1 (ini)** — install dan integrasi ELK: Elasticsearch, Logstash, Kibana, dan Filebeat.
- [Part 2](/blog/elk-grafana-mimir-part-2) — monitoring Grafana dan dashboard log serta metrik host.
- [Part 3](/blog/elk-grafana-mimir-part-3) — kombinasi metrik dengan Grafana Mimir untuk retensi jangka panjang.

Di part ini alurnya:

```text
Nginx (container)
└── /var/log/nginx/access.log
        │
        ▼
Filebeat ──► Logstash ──► Elasticsearch ──► Kibana
             grok, date,   index            Discover,
             useragent     nginx-logs-*     data view
```

Semua langkah di artikel ini dijalankan nyata di lab Docker. Screenshot yang tampil diambil dari eksekusi tersebut, bukan mockup.

## Kenapa ELK

ELK adalah singkatan dari tiga komponen utama:

- **Elasticsearch** — mesin pencarian dan analitik yang menyimpan log dalam index.
- **Logstash** — pipeline yang menerima, mem-parsing, dan memperkaya log sebelum dikirim ke Elasticsearch.
- **Kibana** — antarmuka untuk membuat data view, menjelajahi log di Discover, dan membangun visualisasi.

Ditambah **Filebeat** sebagai shipper ringan yang membaca file log dan mengirimkannya ke Logstash. Dalam praktiknya, stack ini sering disebut **Elastic Stack** karena Beats menjadi bagian dari ekosistemnya.

Pembagian perannya penting:

| Komponen | Tugas | Tidak cocok untuk |
|---|---|---|
| Filebeat | Membaca file log dan mengirim event | Parsing kompleks |
| Logstash | Parsing, transformasi, enrichment | Membaca file di setiap server |
| Elasticsearch | Menyimpan dan mencari | Menyimpan log tanpa batas retensi |
| Kibana | Eksplorasi dan visualisasi | Menjalankan pipeline data |

## Prasyarat

- Docker Engine dan Docker Compose.
- RAM minimal 4 GB. Lab ini memakai heap Elasticsearch 1 GB, Logstash 512 MB, dan Kibana sekitar 1 GB.
- Port `9200`, `5601`, `8080`, dan `5044` belum dipakai.
- Di Linux, naikkan `vm.max_map_count`:

```bash
sudo sysctl -w vm.max_map_count=262144
```

Elasticsearch membutuhkan nilai tersebut untuk mmap. Kalau tidak, container akan berhenti dengan pesan `max virtual memory areas vm.max_map_count [65530] is too low`.

## Struktur project

```text
elk-lab/
├── docker-compose.yml
├── nginx/
│   └── default.conf
├── delay/
│   └── server.py
├── filebeat/
│   └── filebeat.yml
├── logstash/
│   └── pipeline/
│       └── logstash.conf
└── logs/
    └── nginx/          # access.log dan error.log dari container Nginx
```

## docker-compose.yml

Versi yang dipakai di lab: Elasticsearch, Kibana, Logstash, dan Filebeat **9.5.6**, Nginx 1.27.

```yaml
name: elk-lab

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:9.5.6
    container_name: elk-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
      - bootstrap.memory_lock=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:9200/_cluster/health >/dev/null || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 30

  kibana:
    image: docker.elastic.co/kibana/kibana:9.5.6
    container_name: elk-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - XPACK_SECURITY_ENABLED=false
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy

  nginx:
    image: nginx:1.27-alpine
    container_name: elk-nginx
    ports:
      - "8080:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - delay

  delay:
    image: python:3.12-alpine
    container_name: elk-delay
    command: python /app/server.py
    volumes:
      - ./delay/server.py:/app/server.py:ro

  logstash:
    image: docker.elastic.co/logstash/logstash:9.5.6
    container_name: elk-logstash
    environment:
      - LS_JAVA_OPTS=-Xms512m -Xmx512m
      - XPACK_MONITORING_ENABLED=false
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
    ports:
      - "5044:5044"
    depends_on:
      elasticsearch:
        condition: service_healthy

  filebeat:
    image: docker.elastic.co/beats/filebeat:9.5.6
    container_name: elk-filebeat
    user: root
    command: filebeat -e --strict.perms=false
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - ./logs/nginx:/var/log/nginx:ro
    depends_on:
      - logstash

volumes:
  esdata:
```

Beberapa keputusan yang perlu dijelaskan:

- **`discovery.type=single-node`** cocok untuk lab. Di produksi, Elasticsearch dijalankan sebagai cluster minimal tiga node.
- **`xpack.security.enabled=false`** membuat lab bisa diakses tanpa TLS dan login. Ini **hanya untuk latihan**; jangan dipakai di server yang terbuka ke internet.
- **`bootstrap.memory_lock=true`** mencegah heap Elasticsearch di-swap. Heap 1 GB cukup untuk lab; di produksi ukurannya mengikuti RAM dan beban.
- **Healthcheck** membuat Kibana dan Logstash menunggu Elasticsearch benar-benar siap, bukan hanya container-nya `Up`.
- **Volume `esdata`** menyimpan index agar data tidak hilang saat container di-recreate.

## Konfigurasi Nginx dan sumber log

Agar ada log yang bisa diolah, lab memakai Nginx dengan beberapa endpoint: halaman utama, health check, login, produk, error 500, dan endpoint lambat. Endpoint `/slow` diteruskan ke container Python kecil yang menambah delay acak 40–420 ms, sehingga dashboard nanti punya variasi `request_time`.

```nginx
log_format lab '$remote_addr - $remote_user [$time_local] '
               '"$request" $status $body_bytes_sent '
               '"$http_referer" "$http_user_agent" '
               '"$http_x_forwarded_for" $request_time';

server {
    listen 80;
    server_name _;

    # Lab: ambil client IP dari X-Forwarded-For agar traffic generator
    # bisa mensimulasikan beberapa alamat IP.
    set_real_ip_from 0.0.0.0/0;
    real_ip_header X-Forwarded-For;

    access_log /var/log/nginx/access.log lab;
    error_log  /var/log/nginx/error.log warn;
    default_type text/plain;

    location = / {
        return 200 "OK: halaman utama\n";
    }

    location = /api/health {
        default_type application/json;
        return 200 '{"status":"ok","service":"demo-api"}';
    }

    location = /login {
        default_type text/html;
        return 200 "<h1>Login</h1><form><input name=email><button>Masuk</button></form>";
    }

    location /produk/ {
        default_type application/json;
        return 200 '{"produk":"contoh","stok":12}';
    }

    location = /error {
        return 500 "Internal Server Error\n";
    }

    location /slow {
        proxy_pass http://delay:8081;
        proxy_set_header Host $host;
    }
}
```

Isi `delay/server.py` adalah HTTP server kecil yang menunda respons secara acak:

```python
from http.server import BaseHTTPRequestHandler, HTTPServer
import random
import time


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        time.sleep(random.uniform(0.04, 0.42))
        body = b'{"status":"slow-ok"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


HTTPServer(("0.0.0.0", 8081), Handler).serve_forever()
```

Format log sengaja dibuat menyerupai **combined log** Nginx, dengan dua tambahan:

- `$http_x_forwarded_for` — menyimpan IP asli saat Nginx berada di belakang proxy.
- `$request_time` — durasi request dalam detik, dipakai untuk panel latency.

File log ditulis ke volume `./logs/nginx`, yang nanti dibaca Filebeat. Karena Filebeat berjalan sebagai `root` di dalam container, ia bisa membaca file yang dibuat Nginx.

`set_real_ip_from 0.0.0.0/0` sengaja dipakai agar traffic generator bisa memalsukan IP lewat header `X-Forwarded-For`. Di produksi, batasi direktif ini hanya ke IP reverse proxy yang tepercaya; jangan pernah mempercayai `X-Forwarded-For` dari semua sumber.

## Filebeat: mengirim log ke Logstash

`filebeat/filebeat.yml`:

```yaml
filebeat.inputs:
  - type: filestream
    id: nginx-access
    enabled: true
    paths:
      - /var/log/nginx/access.log
    fields:
      log_source: nginx
    fields_under_root: true

output.logstash:
  hosts: ["logstash:5044"]

logging.level: info
logging.to_files: false
```

`filestream` adalah input modern Filebeat. Ia menyimpan state pembacaan, jadi event tidak terkirim ulang setelah Filebeat restart.

Filebeat sengaja diarahkan ke **Logstash**, bukan langsung ke Elasticsearch, karena Logstash yang akan mem-parsing format log Nginx. Di server produksi, Filebeat biasanya dipasang sebagai service di setiap host; container hanya memudahkan lab.

## Logstash: parsing log dengan grok

`logstash/pipeline/logstash.conf`:

```ruby
input {
  beats {
    port => 5044
  }
}

filter {
  grok {
    match => {
      "message" => "%{IPORHOST:client_ip} - %{DATA:remote_user} \[%{HTTPDATE:log_timestamp}\] \"%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}\" %{NUMBER:status:int} %{NUMBER:bytes:int} \"%{DATA:referrer}\" \"%{DATA:user_agent}\" \"%{DATA:forwarded_for}\" %{NUMBER:request_time:float}"
    }
  }

  date {
    match => ["log_timestamp", "dd/MMM/yyyy:HH:mm:ss Z"]
    target => "@timestamp"
  }

  useragent {
    source => "user_agent"
    target => "ua"
  }

  mutate {
    remove_field => ["log_timestamp", "event", "host", "agent", "ecs", "input", "tags"]
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "nginx-logs-%{+YYYY.MM.dd}"
  }

  stdout {
    codec => rubydebug
  }
}
```

Alurnya:

1. **`beats` input** menerima event dari Filebeat di port 5044.
2. **`grok`** memecah satu baris log menjadi field: `client_ip`, `method`, `request`, `status`, `bytes`, `user_agent`, `request_time`, dan lainnya.
3. **`date`** mengganti `@timestamp` dengan waktu asli dari log, bukan waktu Filebeat mengirim event. Ini penting agar urutan dan filter waktu di Kibana benar.
4. **`useragent`** menambahkan field `ua.name`, `ua.os.name`, dan `ua.device.name`.
5. **`mutate`** membuang field bawaan Beats yang tidak diperlukan agar dokumen lebih ramping.
6. **`elasticsearch` output** menulis ke index harian `nginx-logs-YYYY.MM.dd`.

Output `stdout` dengan `rubydebug` berguna saat belajar karena setiap event yang diproses tercetak di log container. Di produksi, output ini bisa dihapus agar tidak membanjiri disk.

## Menjalankan stack

```bash
docker compose up -d elasticsearch kibana nginx delay logstash filebeat
docker compose ps --format "table {{.Name}}\t{{.Service}}\t{{.Status}}" elasticsearch kibana logstash filebeat nginx
```

![Lima container ELK berjalan|Elasticsearch dan Kibana berstatus healthy; Logstash, Filebeat, dan Nginx berjalan.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/01-docker-compose.png)

Tunggu hingga Elasticsearch dan Kibana sehat. Kibana biasanya butuh 1–2 menit pada jalan pertama.

Cek cluster:

```bash
curl -s localhost:9200/_cluster/health?pretty
```

![Cluster Elasticsearch berstatus green|Cluster single-node dengan 51 shard aktif dan 100% shard teralokasi.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/02-cluster-health.png)

Kalau statusnya **yellow** di lab single-node, penyebabnya biasanya replica. Elasticsearch membuat satu replica untuk setiap shard, tetapi replica tidak bisa ditempatkan di node yang sama. Untuk lab, matikan replica:

```bash
curl -s -X PUT 'localhost:9200/_all/_settings' \
  -H 'Content-Type: application/json' \
  -d '{"index":{"number_of_replicas":0}}'
```

Di produksi, jangan matikan replica. Tambahkan node kedua dan ketiga, lalu biarkan cluster menempatkan replica di node yang berbeda.

## Membuat traffic

Setelah Nginx hidup, buat request agar log terisi. Contoh generator sederhana:

```bash
for i in $(seq 1 300); do
  case $((RANDOM % 10)) in
    0) path="/missing-page" ;;
    1) path="/error" ;;
    2) path="/slow" ;;
    3) path="/api/health" ;;
    *) path="/produk/$((RANDOM % 5 + 1))" ;;
  esac

  ip="203.0.113.$((RANDOM % 200 + 10))"
  curl -s -o /dev/null \
    -H "X-Forwarded-For: $ip" \
    -A "Mozilla/5.0 (X11; Linux x86_64) Firefox/146.0" \
    "http://localhost:8080${path}"

  sleep 0.3
done
```

Lab yang dipakai untuk artikel ini menjalankan 1.200 request dengan 12 IP, 6 user agent, dan variasi path. Hasilnya lebih dari 1.100 dokumen di index.

Cek index:

```bash
curl -s "localhost:9200/_cat/indices/nginx-logs-*?v&h=index,docs.count,store.size"
```

![Index nginx-logs terbentuk|Index harian nginx-logs-2026.11.15 berisi 1.135 dokumen.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/03-index-nginx.png)

Kalau index belum muncul, cek pipeline satu per satu:

```bash
docker compose logs -f filebeat
docker compose logs -f logstash
```

Filebeat harus menampilkan `files_matched: 1` dan `harvester` yang berjalan. Logstash harus menampilkan `Pipelines running`.

## Memastikan log sudah diparse

Ambil satu dokumen terbaru dari Elasticsearch:

```bash
curl -s "localhost:9200/nginx-logs-*/_search?size=1&sort=@timestamp:desc" \
  | jq '.hits.hits[0]._source | {client_ip, method, request, status, request_time, ua: .ua.name, os: .ua.os.name}'
```

![Dokumen hasil parsing Logstash|Field client_ip, method, request, status, request_time, dan user agent sudah terpisah.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/07-parsed-document.png)

Kalau `client_ip`, `status`, dan `request_time` sudah menjadi field sendiri, berarti rantai **Nginx → Filebeat → Logstash → Elasticsearch** bekerja. Kalau dokumen hanya punya `message` dan `tags` berisi `_grokparsefailure`, pola grok tidak cocok dengan format log.

## Kibana: membuat data view

Buka `http://localhost:5601`. Kibana 9 memakai istilah **data view** untuk apa yang dulu disebut index pattern.

Langkahnya:

1. Buka **Stack Management → Data Views**.
2. Klik **Create data view**.
3. Isi nama `Nginx Logs`.
4. Isi index pattern `nginx-logs-*`.
5. Pilih time field `@timestamp`.
6. Simpan.

![Data view Nginx Logs|Data view nginx-logs-* dengan time field @timestamp.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/04-kibana-data-view.png)

Data view bisa juga dibuat lewat API:

```bash
curl -s -X POST localhost:5601/api/data_views/data_view \
  -H 'kbn-xsrf: true' -H 'Content-Type: application/json' \
  -d '{"data_view":{"title":"nginx-logs-*","name":"Nginx Logs","timeFieldName":"@timestamp"}}'
```

## Menjelajahi log di Discover

Buka **Discover**, pilih data view **Nginx Logs**, lalu atur rentang waktu ke **Last 1 hour**. Tambahkan kolom `client_ip`, `method`, `request`, `status`, `request_time`, dan `ua.name` agar tabel langsung menunjukkan field hasil parsing.

![Discover menampilkan log Nginx|Lebih dari 1.100 dokumen dengan kolom hasil parsing Logstash.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/05-kibana-discover.png)

Untuk mencari error server, ketik query KQL di kolom pencarian:

```text
status:500
```

![Filter status 500 di Discover|Query KQL status:500 menyaring 80 request error dari total 1.135 dokumen.](https://is3.cloudhost.id/public-data/project-images/blog/elk-grafana-mimir-part-1/06-kibana-errors.png)

Beberapa query yang sering dipakai:

| Kebutuhan | Query KQL |
|---|---|
| Error server | `status:500` |
| Error 4xx | `status >= 400 and status < 500` |
| Path tertentu | `request:"/api/health"` |
| IP tertentu | `client_ip:"203.0.113.91"` |
| Request lambat | `request_time > 0.2` |
| User agent Chrome | `ua.name:"Chrome"` |

Dengan field yang sudah terpisah, Kibana tidak perlu lagi mencari di dalam string panjang. Ini alasan utama parsing dilakukan di Logstash, bukan dibiarkan di Kibana.

## Catatan untuk produksi

Lab ini sengaja dibuat sederhana. Sebelum dipakai di server nyata, pertimbangkan:

- **Aktifkan security.** Elasticsearch 9 mengaktifkan TLS dan autentikasi secara default. Jangan menonaktifkannya di server yang bisa diakses publik. Gunakan password kuat, TLS, dan role yang dibatasi.
- **Jangan expose port 9200 dan 5044 ke internet.** Cukup Kibana di belakang reverse proxy dengan autentikasi.
- **Gunakan minimal tiga node Elasticsearch** dan replica minimal satu. Single-node hanya untuk lab.
- **Atur retensi dengan ILM.** Tanpa kebijakan retensi, index harian akan terus tumbuh. Tentukan berapa lama log disimpan, lalu hapus atau pindahkan ke storage yang lebih murah.
- **Ukur heap.** Heap Elasticsearch sebaiknya tidak lebih dari 50% RAM dan tidak melebihi batas compressed oops (sekitar 32 GB); untuk sebagian besar deployment, 8–16 GB sudah cukup.
- **Jalankan Filebeat di host**, bukan sebagai container yang membaca bind mount, agar tetap hidup saat Docker bermasalah.
- **Pantau pipeline-nya sendiri.** Perhatikan lag Logstash, jumlah event yang ditolak, dan status cluster.
- **Pin versi image.** Gunakan versi Elasticsearch, Kibana, Logstash, dan Filebeat yang sama; ketidakcocokan versi bisa menyebabkan masalah kompatibilitas.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Elasticsearch langsung mati | `vm.max_map_count` terlalu kecil | `sudo sysctl -w vm.max_map_count=262144` |
| Kibana `server is not ready yet` | Elasticsearch belum sehat | Tunggu, cek `docker compose logs elasticsearch` |
| Cluster status yellow | Replica tidak punya node kedua | Lab: set `number_of_replicas: 0`; produksi: tambah node |
| Filebeat `files_matched: 0` | Path log salah atau file belum dibuat | Pastikan Nginx menulis ke `./logs/nginx/access.log` |
| Filebeat permission denied | Container tidak bisa membaca file | Jalankan dengan `user: root` atau samakan permission |
| Index tidak terbentuk | Logstash gagal connect ke Elasticsearch | Cek `docker compose logs logstash`, pastikan ES healthy |
| `_grokparsefailure` | Format log tidak cocok dengan pola | Bandingkan `message` dengan pola grok, uji di Grok Debugger |
| Discover kosong | Data view atau time range salah | Pilih `nginx-logs-*`, time field `@timestamp`, Last 1 hour |
| `status` tidak bisa difilter angka | Field masih string | Pastikan konversi `%{NUMBER:status:int}` |
| Kibana lambat saat pertama dibuka | Kibana membuat index sistem | Tunggu proses inisialisasi selesai |

## Checklist akhir

- [ ] `vm.max_map_count` sudah dinaikkan.
- [ ] Elasticsearch, Kibana, Logstash, Filebeat, dan Nginx berjalan.
- [ ] Cluster health minimal yellow, idealnya green.
- [ ] `access.log` Nginx terisi request.
- [ ] Filebeat membaca file dan mengirim event ke Logstash.
- [ ] Logstash memproses event tanpa `_grokparsefailure`.
- [ ] Index `nginx-logs-*` terbentuk dan bertambah.
- [ ] Data view `Nginx Logs` dibuat dengan time field `@timestamp`.
- [ ] Discover menampilkan kolom hasil parsing.
- [ ] Query `status:500` mengembalikan hasil yang benar.
- [ ] Port Elasticsearch dan Logstash tidak terbuka ke publik.

## Kesimpulan

ELK bukan satu aplikasi, melainkan rantai komponen dengan tugas yang jelas: Filebeat membaca, Logstash mem-parsing, Elasticsearch menyimpan dan mencari, lalu Kibana menampilkan. Kunci integrasinya ada di format log yang konsisten dan pipeline grok yang benar; begitu field seperti `client_ip`, `status`, dan `request_time` terpisah, log berubah dari tumpukan teks menjadi data yang bisa dianalisis.

Di part berikutnya, data yang sama akan dipakai untuk membangun dashboard di Grafana. Kita juga akan menambahkan Prometheus dan node-exporter agar log dan metrik host bisa dilihat dalam satu layar.

Lanjut ke [Part 2: Monitoring Grafana dan Dashboard](/blog/elk-grafana-mimir-part-2).
