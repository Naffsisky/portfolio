---
title: 'Blue Team Journey - Part 1: Networking Fundamentals untuk Defender'
date: '2026-11-17'
template: 'post'
draft: false
slug: 'blue-team-journey-part-1'
category: 'Cybersecurity'
tags:
  - 'Blue Team'
  - 'Networking'
  - 'TCP/IP'
  - 'Wireshark'
  - 'tcpdump'
  - 'Docker'
  - 'Cybersecurity'
description: 'Part 1 seri Blue Team Journey: dasar networking untuk defender, dari OSI/TCP-IP, IP dan subnetting, protokol dan port, perangkat jaringan, sampai Wireshark dan latihan mendeteksi port scan di lab Docker.'
seoTitle: 'Blue Team Journey Part 1: Networking Fundamentals untuk Defender'
seoDescription: 'Belajar networking untuk Blue Team: OSI/TCP-IP, subnetting, protokol dan port, perangkat jaringan, Wireshark, serta lab mendeteksi port scan dengan tcpdump dan tshark.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/00-cover.png'
---

Blue Team bekerja dengan bukti. Sebelum bisa menulis deteksi, membaca alert, atau merespons insiden, kita harus paham bagaimana data bergerak: dari aplikasi di layer paling atas, turun menjadi segmen TCP, paket IP, frame Ethernet, lalu bit di kabel atau udara.

Itulah sebabnya networking selalu menjadi fase pertama. Tanpa dasar ini, alert seperti “koneksi ke 203.0.113.10:443” hanya terlihat seperti deretan angka. Dengan dasar ini, kita bisa bertanya: siapa yang memulai koneksi, port apa yang dituju, protokol apa yang dipakai, dan apakah polanya normal.

Artikel ini adalah **Part 1** dari seri **Blue Team Journey**. Kerangka 10 fase dan daftar topiknya mengikuti [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap) karya keraattin. Penjelasan, contoh, dan screenshot di artikel ini adalah hasil praktik di lab Docker yang terisolasi.

## Peta 10 fase

Roadmap ini membagi perjalanan menjadi 10 fase yang saling tumpang tindih:

| Fase | Topik | Timeline | Prasyarat |
|:---:|---|---|---|
| **01** | Networking Fundamentals | Minggu 1–4 | Tidak ada |
| **02** | Windows Essentials | Minggu 3–6 | Networking dasar |
| **03** | Linux Command Line | Minggu 4–7 | Tidak ada |
| **04** | Scripting & Automation | Minggu 5–8 | OS dasar |
| **05** | Security Fundamentals | Minggu 6–10 | Fase 1–4 |
| **06** | Blue Team Tools | Minggu 8–14 | Fase 5 |
| **07** | Certifications | Bulan 3–6 | Fase 1–6 |
| **08** | Hands-On Practice | Bulan 4–8 | Fase 6 |
| **09** | Build Your Portfolio | Bulan 5–9 | Fase 8 |
| **10** | Get Hired | Bulan 8–12 | Semua fase |

Total estimasi 6–12 bulan dengan 2–3 jam belajar per hari. Fase boleh tumpang tindih; konsistensi lebih penting daripada kecepatan.

Seri ini akan mengikuti urutan tersebut. **Part 1** membahas Fase 1: Networking Fundamentals. Part berikutnya akan masuk ke Windows Essentials, Linux, scripting, security fundamentals, tools, sertifikasi, latihan, portfolio, dan job hunting.

## Cara belajar di seri ini

Setiap topik dibagi menjadi tiga bagian:

1. **Teori singkat** — konsep yang perlu dipahami, bukan sekadar dihafal.
2. **Praktik** — contoh nyata dengan perintah yang bisa dijalankan.
3. **Sudut pandang defender** — bagaimana konsep itu muncul di log, alert, atau investigasi.

Lab memakai Docker agar tidak mengubah konfigurasi host. Dua container dijalankan di network terisolasi:

```bash
docker network create --subnet=172.28.0.0/24 blue-lab

docker run -d --name blue-web \
  --network blue-lab --ip 172.28.0.10 \
  nginx:alpine

docker run -d --name blue-client \
  --network blue-lab --ip 172.28.0.20 \
  --cap-add=NET_RAW --cap-add=NET_ADMIN \
  nicolaka/netshoot sleep infinity

docker exec -it blue-client bash
```

`nicolaka/netshoot` sudah berisi `tcpdump`, `tshark`, `nmap`, `dig`, `curl`, dan `nc`, sehingga alat tidak perlu dipasang di host. Capability `NET_RAW` dan `NET_ADMIN` dibutuhkan untuk packet capture dan SYN scan.

![Topologi lab: satu bridge, dua container|Client dan web berada di subnet yang sama; gateway 172.28.0.1 mengarah keluar melalui NAT host.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/01-lab-topology.png)

Kalau memakai Linux langsung tanpa container, pasang paket yang setara: `tcpdump`, `tshark`, `nmap`, `dnsutils`, `netcat`, dan `curl`. Perintah di artikel ini bisa dijalankan dengan penyesuaian nama interface.

## 1.1 OSI model dan TCP/IP stack

Model OSI membagi komunikasi menjadi tujuh layer. Model TCP/IP merangkumnya menjadi empat layer. Yang penting bukan hafal nomornya, tetapi tahu **apa yang terjadi di tiap layer dan bukti apa yang tertinggal di sana**.

| OSI | TCP/IP | Contoh | Bukti untuk defender |
|---|---|---|---|
| 7 Application | Application | HTTP, DNS, TLS, SMB | URL, query DNS, SNI, nama file |
| 6 Presentation | Application | TLS, encoding, serialization | Certificate, content type |
| 5 Session | Application | Sesi login, token | Cookie, session ID |
| 4 Transport | Transport | TCP, UDP, port | Port, flags, ukuran segmen |
| 3 Network | Internet | IP, ICMP | Source/destination IP, TTL |
| 2 Data Link | Link | Ethernet, ARP, VLAN | MAC address, VLAN ID |
| 1 Physical | Link | Kabel, fiber, radio | Interface counters, signal |

Saat aplikasi mengirim data, terjadi **enkapsulasi**:

```text
Data (HTTP)
  └── Segment (TCP: port + flags)
        └── Packet (IP: source + destination)
              └── Frame (Ethernet: MAC source + destination)
                    └── Bits (kabel/radio)
```

Di sisi penerima, prosesnya dibalik: frame dilepas, paket diteruskan, segmen diurutkan, lalu data diserahkan ke aplikasi.

### Praktik: membaca enkapsulasi dari capture

Jalankan capture di container client, buat satu request HTTP, lalu hentikan capture:

```bash
tcpdump -i eth0 -nn -s0 -w /tmp/http.pcap 'tcp port 80' &
curl -s -o /dev/null http://blue-web/
kill -INT %1
```

Baca tiga paket pertama dengan header link-layer:

```bash
tcpdump -nn -e -r /tmp/http.pcap -c 3
```

![Frame, paket, dan segmen di satu capture|MAC address di layer 2, IP di layer 3, port dan flags TCP di layer 4.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/06-layers-http.png)

Perhatikan tiga baris pertama:

- `76:3a:9b:... > 62:94:a5:...` adalah **MAC address** — layer 2.
- `172.28.0.20.47586 > 172.28.0.10.80` adalah **IP dan port** — layer 3 dan 4.
- `Flags [S]`, `[S.]`, `[.]` adalah **TCP flags**: SYN, SYN-ACK, lalu ACK.

Itulah **TCP three-way handshake**. Koneksi tidak langsung mengirim data; client dan server menyepakati sequence number dan parameter TCP terlebih dahulu.

Lalu lihat isi layer 7:

```bash
tshark -r /tmp/http.pcap -Y 'http.request' \
  -T fields -e ip.src -e ip.dst -e tcp.dstport \
  -e http.request.method -e http.host -e http.request.uri
```

Hasilnya:

```text
172.28.0.20	172.28.0.10	80	GET	blue-web	/
```

Satu capture yang sama memuat MAC, IP, port, flags, dan HTTP. Inilah yang dimaksud dengan enkapsulasi: setiap layer menambahkan header, dan setiap header bisa menjadi bukti.

**Sudut pandang defender:** saat menerima alert, tanyakan layer-nya. “Koneksi ke IP berbahaya” adalah layer 3. “Port 445 terbuka” adalah layer 4. “PowerShell mengunduh file” adalah layer 7. Jawaban itu menentukan log mana yang perlu dibuka: firewall, flow, IDS, proxy, atau endpoint.

## 1.2 IP addressing dan subnetting

IPv4 adalah alamat 32-bit yang ditulis dalam empat oktet desimal, misalnya `172.28.0.20`. Setiap perangkat di jaringan butuh alamat, dan alamat itu harus unik dalam satu network.

Rentang private IPv4 yang tidak boleh dirutekan langsung di internet:

| Rentang | CIDR | Jumlah alamat |
|---|---|---|
| `10.0.0.0` – `10.255.255.255` | `10.0.0.0/8` | 16.777.216 |
| `172.16.0.0` – `172.31.255.255` | `172.16.0.0/12` | 1.048.576 |
| `192.168.0.0` – `192.168.255.255` | `192.168.0.0/16` | 65.536 |
| `127.0.0.0` – `127.255.255.255` | `127.0.0.0/8` | Loopback |
| `169.254.0.0` – `169.254.255.255` | `169.254.0.0/16` | Link-local |

Alamat di luar rentang private tersebut umumnya adalah alamat publik yang bisa dirutekan di internet.

CIDR menunjukkan berapa bit yang dipakai untuk network. `/24` berarti 24 bit network dan 8 bit host: 256 alamat, 254 di antaranya bisa dipakai (network dan broadcast tidak dipakai host). `/26` berarti 26 bit network dan 6 bit host: 64 alamat, 62 host.

Subnet mask menuliskannya dalam bentuk desimal:

| CIDR | Subnet mask | Alamat | Host usable |
|---|---|---|---|
| `/24` | `255.255.255.0` | 256 | 254 |
| `/25` | `255.255.255.128` | 128 | 126 |
| `/26` | `255.255.255.192` | 64 | 62 |
| `/27` | `255.255.255.224` | 32 | 30 |

**NAT (Network Address Translation)** memungkinkan banyak alamat private memakai satu atau beberapa alamat publik. Router NAT mengganti source IP saat paket keluar, lalu mengembalikannya saat respons masuk. Di lab ini, container memakai `172.28.0.0/24`; lalu lintas keluar melewati gateway `172.28.0.1` dan di-NAT oleh Docker di host.

**IPv6** memakai 128 bit dan ditulis dalam heksadesimal, misalnya `2001:db8::1`. IPv6 tidak selalu membutuhkan NAT seperti IPv4, tetapi tetap punya alamat link-local `fe80::/10` dan aturan firewall yang harus dikonfigurasi.

### Praktik: membaca alamat, route, DNS, dan ARP

Di dalam container client:

```bash
ip -br addr
ip route
grep nameserver /etc/resolv.conf
ip neigh
```

![Alamat, route, DNS, dan ARP|eth0 172.28.0.20/24, default gateway 172.28.0.1, DNS Docker 127.0.0.11.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/02-addressing.png)

Yang bisa dibaca:

- `172.28.0.20/24` — alamat client di network lab.
- `default via 172.28.0.1` — gateway untuk tujuan di luar subnet.
- `172.28.0.0/24 dev eth0` — network lokal langsung terhubung.
- `nameserver 127.0.0.11` — Docker DNS internal.
- `ip neigh` — pasangan IP dan MAC di layer 2; `172.28.0.1` adalah gateway, `172.28.0.10` adalah web.

Cek definisi network dari sisi host:

```bash
docker network inspect blue-lab --format '{{json .IPAM.Config}}'
```

```json
[{"Subnet":"172.28.0.0/24","Gateway":"172.28.0.1"}]
```

### Praktik: menghitung subnet

Hafalan CIDR lebih mudah kalau dihitung dengan alat. Contoh script kecil:

```python
import ipaddress

for cidr in ["172.28.0.0/24", "192.168.10.37/26"]:
    net = ipaddress.ip_network(cidr, strict=False)
    hosts = list(net.hosts())
    print(f"{cidr}")
    print(f"  network   : {net.network_address}")
    print(f"  netmask   : {net.netmask}")
    print(f"  broadcast : {net.broadcast_address}")
    print(f"  hosts     : {len(hosts)} ({hosts[0]} - {hosts[-1]})")
```

![Perhitungan subnet|/24 menghasilkan 254 host; 192.168.10.37/26 berada di network 192.168.10.0 dengan 62 host.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/03-subnet.png)

Untuk `192.168.10.37/26`, hasilnya:

- Network: `192.168.10.0`
- Broadcast: `192.168.10.63`
- Host usable: `192.168.10.1` – `192.168.10.62`

Artinya `.37` masih di network yang sama, tetapi `.70` sudah masuk subnet berikutnya (`192.168.10.64/26`).

**Sudut pandang defender:** alamat private di log bisa berarti traffic internal (east-west), sedangkan alamat publik bisa berarti traffic keluar (north-south). NAT membuat satu alamat publik mewakili banyak host, jadi jangan langsung menyimpulkan satu IP publik = satu pengguna. Subnet membantu memahami segmentasi: apakah server database seharusnya bisa dihubungi langsung dari laptop user?

## 1.3 Protokol dan port yang wajib dikenal

Port adalah “pintu” layanan di layer transport. Hafalkan yang sering muncul di investigasi SOC:

| Protokol | Port | Fungsi | Relevansi keamanan |
|---|---:|---|---|
| DNS | 53 | Nama domain → IP | DNS tunneling, DGA, domain hijacking |
| HTTP | 80 | Web tanpa enkripsi | Credential theft, malware delivery |
| HTTPS | 443 | Web terenkripsi | C2 tersembunyi di TLS |
| SSH | 22 | Remote shell | Brute force, akses tidak sah |
| RDP | 3389 | Remote desktop Windows | Pintu masuk ransomware yang sering dipakai |
| SMTP | 25 | Kirim email | Phishing, spoofing |
| FTP | 20/21 | Transfer file | Credential sniffing, eksfiltrasi |
| DHCP | 67/68 | Alokasi IP otomatis | Rogue DHCP, MITM |
| SMB | 445 | File sharing Windows | EternalBlue, lateral movement |
| LDAP | 389/636 | Directory service | Serangan Active Directory |
| Kerberos | 88 | Autentikasi domain | Kerberoasting, Golden Ticket |
| Syslog | 514 | Forwarding log | Bahan utama SIEM |
| SNMP | 161/162 | Manajemen perangkat | Information disclosure |

Port bukan bukti mutlak. Malware bisa memakai port 443 untuk C2, dan layanan sah bisa berjalan di port tidak biasa. Yang penting adalah **kombinasi port, proses, tujuan, waktu, dan volume**.

### Praktik: port listening, DNS, dan koneksi

Di network namespace container web, lihat port yang listening:

```bash
ss -tln 'sport = :80'
```

Dari host, padanannya adalah `docker run --rm --network container:blue-web nicolaka/netshoot ss -tln 'sport = :80'`. Screenshot di bawah menjalankan `ss` di dalam namespace container web.

Dari container client, cek DNS dan port terbuka/tertutup:

```bash
dig +short blue-web
nc -zv blue-web 80
nc -zv blue-web 22
```

![Port 80 listening, DNS, dan tes koneksi|Port 80 menerima koneksi; port 22 menolak karena tidak ada layanan SSH.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/04-ports-dns.png)

`nc -zv` melakukan TCP connect. Jika port terbuka, koneksi berhasil; jika tertutup, server mengirim RST dan `nc` menampilkan `Connection refused`.

### Praktik: satu request HTTP dari awal sampai akhir

```bash
curl -sv http://blue-web/ -o /dev/null
```

![Satu request HTTP|DNS resolution, TCP connect, request GET, lalu response 200 OK.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/05-http.png)

Output `curl -v` memperlihatkan urutan yang penting:

1. `Host blue-web:80 was resolved` — DNS.
2. `Trying 172.28.0.10:80` — TCP connect.
3. `GET / HTTP/1.1` — request HTTP.
4. `HTTP/1.1 200 OK` — response server.

Kalau koneksi gagal, urutannya membantu menentukan layer masalah: DNS gagal, TCP ditolak, TLS gagal, atau HTTP error.

### DNS: query yang terlihat, tunnel yang tersembunyi

DNS menerjemahkan nama menjadi alamat. Query normal pendek dan berulang untuk domain yang sama. DNS tunneling memanfaatkan query untuk membawa data keluar-masuk, biasanya dengan label panjang, acak, dan volume tinggi.

Capture query DNS langsung ke resolver eksternal:

```bash
tcpdump -i eth0 -nn -s0 -w /tmp/dns2.pcap 'udp port 53' &
dig @1.1.1.1 example.com
dig @1.1.1.1 TXT aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.example.com
kill -INT %1
```

Query panjang di atas sengaja tidak valid dan kemungkinan menghasilkan NXDOMAIN; yang kita analisis adalah nama yang dikirim, bukan jawabannya. Kalau resolver eksternal diblokir, arahkan query ke resolver DNS internal Anda.

Lalu baca nama yang di-query:

```bash
tshark -r /tmp/dns2.pcap -Y 'dns.flags.response == 0' \
  -T fields -e dns.qry.name | awk '{print length($0), $0}'
```

![DNS query normal dan panjang|Qname normal 11 karakter; contoh qname tunneling 72 karakter.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/10-dns-tls.png)

Heuristik yang dipakai defender:

- Panjang label atau qname jauh di atas baseline.
- Entropy tinggi (huruf/acak, bukan kata).
- Banyak subdomain unik ke domain yang sama.
- Volume query atau TXT record tidak wajar.
- Query periodik ke domain baru pada jam yang tidak biasa.

Ini heuristik, bukan vonis. CDN, telemetry, dan antivirus juga bisa memakai nama panjang. Gabungkan dengan reputasi domain, umur domain, dan pola beaconing.

### TLS: isi terenkripsi, metadata tetap terlihat

HTTPS melindungi isi HTTP, tetapi tidak semua metadata hilang. Dalam TLS handshake, client mengirim **SNI (Server Name Indication)** berisi nama host yang dituju. Capture handshake:

```bash
tcpdump -i eth0 -nn -s0 -w /tmp/tls.pcap 'tcp port 443' &
curl -sI https://example.com -o /dev/null
kill -INT %1

tshark -r /tmp/tls.pcap -Y 'tls.handshake.extensions_server_name' \
  -T fields -e ip.dst -e tls.handshake.extensions_server_name
```

Hasilnya `example.com` terlihat walaupun isi HTTP terenkripsi. Teknologi **Encrypted Client Hello (ECH)** dapat menyembunyikan SNI, tetapi belum diterapkan di semua layanan. Defender tetap bisa memakai DNS, certificate transparency, JA3/JA4 fingerprint, dan flow metadata saat SNI tidak tersedia.

**Sudut pandang defender:** port 443 bukan berarti “aman” atau “tidak bisa dianalisis”. Yang berubah adalah kedalaman visibilitas. Kita mungkin tidak melihat isi request, tetapi masih bisa melihat tujuan, volume, waktu, sertifikat, dan pola koneksi.

## 1.4 Perangkat jaringan dan arsitektur

Teori perangkat sering terasa abstrak. Padahal setiap perangkat menentukan **di mana traffic bisa dilihat dan log apa yang dihasilkan**.

| Perangkat | Layer | Fungsi | Bukti yang dihasilkan |
|---|---|---|---|
| Router | L3 | Meneruskan paket antar-network | NetFlow, syslog, NAT log |
| Switch | L2 | Meneruskan frame berdasarkan MAC | MAC table, SPAN/mirror |
| Firewall | L3–L7 | Mengizinkan/menolak koneksi | Allow/deny log, NAT |
| Proxy | L7 | Perantara client–server | URL, user, bytes, response code |
| Load balancer | L4–L7 | Membagi traffic ke backend | Access log, health check |
| IDS/IPS | L3–L7 | Mendeteksi/mencegah serangan | Alert, signature, PCAP |
| VLAN | L2 | Segmentasi logis | Membership, trunk config |
| VPN | L3–L7 | Tunnel terenkripsi | Auth log, assigned IP |
| DMZ | Arsitektur | Zona untuk layanan publik | Firewall rules, segment log |

Di lab ini:

- **Docker bridge `blue-lab`** berperan seperti switch layer 2: meneruskan frame antar-container.
- **Gateway `172.28.0.1`** berperan seperti router layer 3: tujuan di luar subnet lewat sini.
- **Docker NAT di host** mengganti alamat saat container mengakses internet.
- **`tcpdump`/`tshark`** menjadi alat visibilitas, mirip tap atau SPAN port dalam skala kecil.

Yang tidak ada di lab: firewall rules, IDS/IPS, proxy, dan VLAN. Di produksi, keempatnya adalah sumber log utama. Karena itu, pahami dulu alurnya; alat tinggal ditempelkan pada titik yang tepat.

**Sudut pandang defender:** traffic **north-south** (keluar-masuk jaringan) biasanya terlihat di firewall, proxy, dan gateway. Traffic **east-west** (antar-server) sering tidak terlihat kecuali ada segmentasi, SPAN, atau sensor di dalam network. Banyak serangan lateral terjadi di east-west, jadi visibilitas internal sama pentingnya dengan visibilitas internet.

## 1.5 Wireshark dan tcpdump

Wireshark adalah GUI packet analyzer; `tshark` adalah versi command-line-nya. `tcpdump` lebih ringan dan cocok untuk capture di server. Konsep pentingnya ada dua:

- **Capture filter** — ditentukan saat capture, memakai sintaks BPF. Contoh: `tcp port 80`, `host 172.28.0.10`, `udp port 53`.
- **Display filter** — diterapkan setelah paket tertangkap, memakai sintaks Wireshark. Contoh: `http.request`, `tcp.flags.syn == 1 && tcp.flags.ack == 0`, `dns.qry.name`.

Capture filter menghemat disk karena paket yang tidak cocok tidak disimpan. Display filter lebih fleksibel karena capture bisa dianalisis ulang dengan pertanyaan berbeda.

### Praktik: follow TCP stream

Salah satu fitur paling berguna di Wireshark adalah **Follow → TCP Stream**. Di `tshark`, padanannya:

```bash
tshark -r /tmp/http.pcap -z follow,tcp,ascii,0 -q
```

![Follow TCP stream|Request HTTP dan response server terlihat sebagai satu percakapan.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/07-follow.png)

Output ini menunjukkan `Node 0` (client `172.28.0.20:47586`) dan `Node 1` (server `172.28.0.10:80`), lalu isi request dan response. Inilah cara cepat memahami percakapan tanpa membuka satu per satu paket.

Filter yang sering dipakai:

| Tujuan | Display filter |
|---|---|
| Hanya request HTTP | `http.request` |
| Cari host tertentu | `ip.addr == 172.28.0.10` |
| SYN scan | `tcp.flags.syn == 1 && tcp.flags.ack == 0` |
| Respons RST | `tcp.flags.reset == 1` |
| Query DNS | `dns.flags.response == 0` |
| Nama DNS tertentu | `dns.qry.name contains "example"` |
| SNI TLS | `tls.handshake.extensions_server_name` |
| Stream tertentu | `tcp.stream eq 0` |

**Sudut pandang defender:** PCAP adalah ground truth, tetapi mahal. Jangan capture semua traffic tanpa batas. Gunakan capture filter, ring buffer, dan retensi sesuai kebijakan. Untuk investigasi, ambil capture terarah di titik yang relevan: firewall, server yang terlibat, atau span port.

## Latihan blue team: mendeteksi port scan

Sekarang gabungkan semua konsep. Di lab, jalankan SYN scan ke 100 port pertama:

```bash
tcpdump -i eth0 -nn -s0 -w /tmp/scan.pcap 'host 172.28.0.10 and tcp' &
nmap -sS -p 1-100 172.28.0.10
kill -INT %1
```

![Hasil SYN scan|Hanya port 80 yang terbuka; 99 port lain tertutup.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/08-scan.png)

Di host biasa, `-sS` membutuhkan raw socket sehingga perlu `sudo`; alternatif tanpa raw socket adalah `nmap -sT` (TCP connect scan). Di lab ini netshoot berjalan sebagai root dengan capability `NET_RAW`.

`nmap -sS` mengirim SYN ke setiap port. Port tertutup membalas RST; port terbuka membalas SYN-ACK. Karena ini **stealth scan**, scanner tidak menyelesaikan handshake; ia mengirim RST untuk menutup koneksi ke port 80.

Analisis capture:

```bash
tshark -r /tmp/scan.pcap -Y 'tcp.flags.syn == 1 && tcp.flags.ack == 0' \
  -T fields -e tcp.dstport | sort -n | uniq | wc -l

tshark -r /tmp/scan.pcap -Y 'tcp.flags.syn == 1 && tcp.flags.ack == 1' | wc -l
tshark -r /tmp/scan.pcap -Y 'tcp.flags.reset == 1' | wc -l
```

![Tanda port scan di capture|100 SYN ke port berurutan, 1 SYN-ACK, dan 100 RST dalam waktu singkat.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-1/09-scan-detect.png)

Pola yang terlihat:

- **100 SYN** dari satu sumber ke banyak port tujuan.
- **1 SYN-ACK** — hanya port 80 yang terbuka.
- **100 RST** — 99 dari port tertutup, ditambah RST dari scanner untuk menutup port 80.

Aturan deteksi sederhana:

```text
Jika dalam 10 detik ada:
  - lebih dari 20 port tujuan berbeda dari satu source IP, dan
  - lebih dari 50 SYN tanpa ACK,
maka tandai sebagai kemungkinan port scan.
```

Di SIEM atau IDS, tambahkan konteks:

- Apakah source IP adalah scanner resmi (vulnerability management)?
- Apakah scan diikuti koneksi ke port yang terbuka?
- Apakah source berada di subnet yang seharusnya tidak memindai server?
- Apakah ada alert lain dari IP yang sama?

**False positive** yang umum: health check load balancer (satu port berulang), monitoring (pola tetap), dan scanner internal yang terjadwal. Deteksi yang baik menggabungkan pola teknis dengan konteks aset dan otorisasi.

> **Etika dan legalitas:** port scan hanya boleh dilakukan terhadap sistem yang Anda miliki atau yang memberi izin tertulis. Latihan ini memakai network Docker terisolasi; jangan arahkan `nmap` ke jaringan publik tanpa izin.

## Membersihkan lab

Setelah selesai, hapus container dan network agar tidak meninggalkan resource:

```bash
docker rm -f blue-web blue-client
docker network rm blue-lab
```

PCAP di `/tmp` juga bisa dihapus. Simpan capture hanya jika masih dibutuhkan untuk analisis.

## Telemetri yang perlu disiapkan defender

Setelah memahami paket, pertanyaan berikutnya: data apa yang harus disimpan agar investigasi mungkin dilakukan?

- **Flow logs** (VPC Flow Logs, NetFlow, sFlow) — siapa ke siapa, port, bytes, waktu.
- **DNS logs** — query, response, client, qname length.
- **Firewall logs** — allow/deny, NAT translation.
- **Proxy/TLS metadata** — URL, SNI, user, response code, bytes.
- **IDS/IPS alerts** — signature, severity, PCAP jika tersedia.
- **Endpoint network events** — process yang membuka koneksi, parent process.
- **Packet capture terarah** — di server kritikal atau span port, dengan retensi terbatas.
- **Time sync** — NTP di semua perangkat; tanpa waktu yang konsisten, korelasi log akan menyesatkan.

Tanpa baseline, sulit membedakan “normal” dan “mencurigakan”. Catat pola normal: port yang biasanya terbuka, domain yang sering diakses, volume DNS, dan jam sibuk.

## Checklist Phase 1

- [ ] Bisa menjelaskan OSI model dan TCP/IP stack.
- [ ] Bisa menghitung subnet dan rentang host dari CIDR.
- [ ] Hafal protokol dan port penting serta relevansi keamanannya.
- [ ] Memahami peran router, switch, firewall, proxy, IDS/IPS, VLAN, VPN, dan DMZ.
- [ ] Bisa melakukan capture dan membaca traffic dasar di Wireshark/tshark.
- [ ] Bisa membedakan capture filter dan display filter.
- [ ] Bisa mengikuti TCP stream dan membaca HTTP request/response.
- [ ] Bisa menjelaskan TCP handshake dan arti flag SYN, ACK, RST.
- [ ] Bisa mendeteksi pola port scan dari capture.
- [ ] Menyelesaikan latihan networking di TryHackMe Pre-Security atau setara.

## Kesimpulan

Networking bukan hafalan port dan singkatan layer. Networking adalah cara membaca alur bukti: aplikasi menghasilkan data, TCP membungkusnya menjadi segmen, IP mengalamatkannya, Ethernet mengirimkannya sebagai frame, dan setiap layer meninggalkan jejak yang bisa dianalisis.

Di part ini kita sudah mempraktikkan lima hal: membaca alamat dan route, menghitung subnet, mengenali port dan DNS, mengikuti satu request HTTP dari handshake sampai response, dan mendeteksi port scan dari pola SYN/RST. Semua dijalankan di lab Docker yang terisolasi, dengan screenshot dari eksekusi nyata.

Di part berikutnya, kita masuk ke **Windows Essentials**: event log, proses, registry, service, dan artefak yang dipakai defender untuk memahami apa yang terjadi di endpoint. Setelah networking dan Windows, kita akan lanjut ke Linux, scripting, security fundamentals, tools, sertifikasi, latihan, portfolio, dan akhirnya job hunting.

Kalau ingin mendalami materi Phase 1, roadmap aslinya menyediakan tautan ke Professor Messer Network+, TryHackMe Pre-Security, Cisco NetAcad, dan latihan subnetting. Gunakan artikel ini sebagai pendamping praktik, bukan pengganti latihan.
