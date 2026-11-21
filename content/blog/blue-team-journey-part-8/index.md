---
title: 'Blue Team Journey - Part 8: Blue Team Tools - SIEM, EDR, NDR, Sigma, dan SOAR'
date: '2026-11-21'
template: 'post'
draft: false
slug: 'blue-team-journey-part-8'
category: 'Cybersecurity'
tags:
  - 'SIEM'
  - 'EDR'
  - 'Suricata'
  - 'Sigma'
  - 'YARA'
  - 'SOAR'
  - 'Blue Team'
  - 'Cybersecurity'
description: 'Blue Team tools untuk defender: SIEM, EDR/XDR, network detection, Sigma, YARA, forensics, threat intel, dan SOAR, dengan lab Suricata, Sigma, YARA, dan playbook Python.'
seoTitle: 'Blue Team Tools: SIEM, EDR, NDR, Sigma, YARA, SOAR'
seoDescription: 'Belajar tools Blue Team: SIEM/SPL/KQL, EDR, Suricata IDS, Sigma, YARA, forensics, threat intel, dan SOAR dengan praktik langsung di Docker.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-8/00-cover.png'
---

Setelah memahami konsep di [Part 7](/blog/blue-team-journey-part-7), pertanyaan berikutnya: **alat apa yang dipakai sehari-hari di SOC?** Phase 6 dari [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap) membahas SIEM, EDR/XDR, network detection, forensics, threat intelligence, dan SOAR.

Artikel ini adalah **Part 8** dari seri **Blue Team Journey**. Kita akan membahas peran tiap kategori tool, lalu mempraktikkan komponen yang bisa dijalankan ringan di lab: **Suricata** untuk network detection, **Sigma** untuk detection-as-code, **YARA** untuk pattern matching file, dan **SOAR** sederhana untuk enrichment serta response.

## SIEM: ruang kerja utama SOC

**SIEM (Security Information and Event Management)** mengumpulkan log dari banyak sumber, menormalkan formatnya, menyimpan, mengorelasikan, dan menghasilkan alert.

Alur dasar:

```text
Endpoint / server / firewall / cloud / aplikasi
        ↓
Log collection (agent, syslog, API, HEC)
        ↓
Parsing & normalization (field mapping)
        ↓
Index / storage + retention
        ↓
Correlation / detection rules
        ↓
Alert → dashboard / case / SOAR
```

SIEM yang umum:

| SIEM | Query language | Catatan |
|---|---|---|
| Splunk | SPL | Banyak dipakai di enterprise; ada free tier |
| Microsoft Sentinel | KQL | Kuat di ekosistem Microsoft |
| Elastic Security | Lucene/KQL | Open source, fleksibel |
| Wazuh | Query sendiri + API | Open source, SIEM + XDR |
| IBM QRadar | AQL | Enterprise/regulated |

Contoh **SPL** (Splunk):

```spl
index=windows EventCode=4625 earliest=-24h
| stats count by src_ip, user
| where count > 10
| sort -count
```

Contoh **KQL** (Sentinel):

```kql
SigninLogs
| where ResultType != 0
| summarize FailedAttempts = count() by UserPrincipalName, IPAddress
| where FailedAttempts > 10
| order by FailedAttempts desc
```

Yang perlu dipahami dari SIEM bukan hanya query-nya, tetapi **model data**: field apa yang tersedia, bagaimana log dinormalisasi, dan rule apa yang berjalan di atasnya.

> Lab artikel ini tidak men-deploy Splunk/Wazuh penuh karena lisensi dan resource. Fokus praktik ada pada komponen detection yang ringan. Untuk latihan SIEM, gunakan Splunk Free (dengan menerima lisensinya sendiri) atau Wazuh di VM terpisah.

## EDR dan XDR

**EDR (Endpoint Detection and Response)** memasang agent di endpoint untuk merekam proses, command line, file, registry, network connection, dan perilaku mencurigakan. EDR bisa mengisolasi host, menghentikan proses, dan mengambil bukti.

**XDR** memperluas korelasi ke endpoint, network, email, identity, dan cloud.

| Tool | Fokus |
|---|---|
| CrowdStrike Falcon | Cloud-native EDR/XDR |
| Microsoft Defender for Endpoint | Integrasi Windows/M365 |
| SentinelOne | Behavioral AI dan autonomous response |
| Carbon Black | Behavioral analysis dan application control |
| Cortex XDR | Korelasi network + endpoint |

Yang perlu ditanyakan saat memilih EDR:

- Telemetri apa yang direkam (process tree, command line, DNS, file hash)?
- Bisa isolasi host dan kill process?
- Retensi dan pencarian historis?
- Integrasi SIEM/SOAR?
- Dukungan OS dan agent overhead?

## Network detection

Network detection menjawab pertanyaan yang tidak terlihat di endpoint: traffic apa yang melintas, ke mana, dan apakah polanya berbahaya.

| Tool | Fungsi |
|---|---|
| Wireshark | Analisis paket mendalam |
| Suricata | IDS/IPS berbasis signature, multi-threaded |
| Snort | IDS/IPS signature-based |
| Zeek | Ekstraksi metadata jaringan (conn, dns, http, files) |
| Arkime | Pencarian PCAP skala besar |
| tcpdump | Capture ringan di server |

**IDS** mendeteksi dan memberi alert; **IPS** berada inline dan bisa memblokir. Signature cocok untuk pola yang diketahui; anomaly detection membantu untuk pola baru, tetapi lebih berisik.

## Detection engineering: Sigma dan YARA

**Sigma** adalah format rule vendor-agnostic. Satu rule bisa dikonversi ke SPL, KQL, Elastic, atau backend lain.

**YARA** mencocokkan pola di file atau memori: string, byte sequence, kondisi boolean. YARA dipakai untuk malware classification dan scanning IOC.

Keduanya adalah inti **detection-as-code**:

```text
ide → rule → test dengan data → deploy → monitor false positive → tune
```

## Forensics dan incident response

| Tool | Fungsi |
|---|---|
| Volatility 3 | Analisis memory dump |
| Autopsy | Disk forensics |
| FTK Imager | Imaging dan collection |
| KAPE | Rapid artifact collection |
| Velociraptor | Investigasi endpoint skala besar |
| Eric Zimmerman tools | Parsing artifact Windows (MFT, ShellBags) |
| Chainsaw | Hunting event log Windows dengan Sigma |

Urutan volatilitas bukti (dari paling cepat hilang):

```text
Registers/cache → RAM/swap → network state → disk → remote logs/backup
```

Prinsip forensics: **preserve** sebelum **analyze**. Gunakan write blocker, hash bukti, catat chain of custody, dan dokumentasikan setiap langkah.

## Threat intelligence

Threat intelligence memberi konteks: IP ini dikenal jahat atau tidak, hash ini pernah terlihat di kampanye apa, domain ini baru dibuat atau tidak.

| Sumber | Kegunaan |
|---|---|
| VirusTotal | File/URL/IP reputation |
| AbuseIPDB | Reputasi IP |
| URLScan.io | Analisis URL |
| MISP | Sharing IOC dan threat intel |
| OpenCTI | Knowledge graph CTI |
| Sandbox (ANY.RUN/Hybrid Analysis) | Analisis perilaku malware |

Jangan langsung memblokir berdasarkan satu sumber. Cek umur IOC, confidence, konteks, dan false positive.

## SOAR: otomasi respons

**SOAR (Security Orchestration, Automation and Response)** menjalankan playbook: enrich alert, cek reputasi, buat ticket, block IP, isolasi host, dan dokumentasi.

| Tool | Tipe |
|---|---|
| Splunk SOAR | Enterprise |
| Sentinel Logic Apps | Cloud-native |
| Shuffle | Open source |
| Tines | No-code |
| n8n | Workflow automation umum |

Playbook yang baik punya **guardrail**: allowlist, approval untuk aksi destruktif, logging, dan rollback.

## Lab: Suricata, Sigma, YARA, SOAR

Lab memakai Ubuntu 24.04 dengan:

- `tools-client` — Suricata, Sigma CLI, YARA, Python.
- `tools-web` — HTTP server target.

Dockerfile ringkas:

```dockerfile
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      suricata yara python3 python3-pip tcpdump curl ca-certificates jq \
 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --break-system-packages \
      sigma-cli pysigma-backend-splunk
WORKDIR /lab
CMD ["sleep", "infinity"]
```

Jalankan:

```bash
docker network create --subnet=172.35.0.0/24 tools-lab
docker build -t tools-lab:1.0 ./image

docker run -d --name tools-web --network tools-lab --ip 172.35.0.20 \
  -v "$PWD/www:/lab/www:ro" \
  tools-lab:1.0 python3 -m http.server 8080 --directory /lab/www

docker run -d --name tools-client --network tools-lab --ip 172.35.0.10 \
  --cap-add=NET_RAW --cap-add=NET_ADMIN \
  -v "$PWD/image/rules:/lab/rules:ro" \
  -v "$PWD/image/data:/lab/data:ro" \
  tools-lab:1.0 sleep infinity
```

![Detection pipeline|Telemetry masuk ke SIEM/EDR/NDR, rule mendeteksi, lalu SOAR/IR merespons.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-8/01-lab-topology.png)

## Praktik 1: Suricata mendeteksi HTTP scanning

Rule custom:

```text
alert http any any -> any any (msg:"LAB suspicious admin access"; flow:to_server,established; content:"GET"; http_method; content:"/admin"; http_uri; nocase; sid:1000001; rev:1;)
alert http any any -> any any (msg:"LAB dotenv access"; flow:to_server,established; content:"GET"; http_method; content:"/.env"; http_uri; nocase; sid:1000002; rev:1;)
```

Buat traffic, capture, lalu replay ke Suricata:

```bash
tcpdump -i eth0 -nn -s0 -w /lab/http.pcap 'tcp port 8080' &
curl -s -o /dev/null http://172.35.0.20:8080/admin
curl -s -o /dev/null http://172.35.0.20:8080/.env
curl -s -o /dev/null http://172.35.0.20:8080/
kill -INT %1

suricata -r /lab/http.pcap -c /etc/suricata/suricata.yaml \
  -S /lab/rules/lab.rules -l /lab/log -k none
```

![Suricata alert|Dua rule mendeteksi akses /admin dan /.env dari PCAP; EVE JSON memberi field terstruktur.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-8/02-suricata.png)

Yang bisa dibaca:

- **`fast.log`** — alert ringkas untuk manusia.
- **`eve.json`** — JSON terstruktur: timestamp, src/dest, signature, severity.
- **Rule SID** — identitas rule; gunakan rentang lokal untuk rule sendiri.
- **`flow:to_server,established`** — rule hanya untuk request yang sudah established.

Di produksi, Suricata bisa berjalan inline (IPS), menerima mirror/SPAN, atau membaca PCAP. Rule harus diuji agar tidak memblokir traffic sah.

## Praktik 2: Sigma ke query SIEM

Rule Sigma:

```yaml
title: SSH Failed Password
id: 8f2b7c1e-4d2a-4c3b-9f10-000000000001
status: experimental
logsource:
  product: linux
  service: sshd
detection:
  selection:
    message: 'Failed password'
  condition: selection
level: medium
```

Konversi ke Splunk:

```bash
sigma convert -t splunk --without-pipeline /lab/rules/ssh_failed.yml
```

Hasil:

```text
message="Failed password"
```

![Sigma conversion|Rule vendor-agnostic dikonversi menjadi query Splunk; pipeline biasanya dipakai untuk mapping field produksi.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-8/03-sigma.png)

Catatan:

- `--without-pipeline` menghasilkan query mentah; di produksi gunakan pipeline backend (misalnya `splunk_cim`) agar field sesuai model data.
- Rule harus punya **UUID valid**, metadata, level, dan test case.
- Konversi bukan jaminan rule benar; uji dengan data nyata dan ukur false positive.

## Praktik 3: YARA mendeteksi file

Rule YARA:

```yara
rule EICAR_Test
{
    meta:
        author = "Blue Team Lab"
        description = "Detects the EICAR antivirus test string"
    strings:
        $a = "EICAR-STANDARD-ANTIVIRUS-TEST-FILE" ascii
    condition:
        $a
}
```

Scan:

```bash
yara /lab/rules/eicar.yar /lab/data/eicar.com
```

![YARA scan|Rule mencocokkan string EICAR dan melaporkan nama rule serta file yang cocok.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-8/04-yara.png)

YARA cocok untuk:

- Klasifikasi malware dan keluarga malware.
- Scan IOC string/byte di file atau memory.
- Validasi sample sebelum dianalisis lebih jauh.

YARA bukan pengganti EDR; ia hanya mencocokkan pola. Attacker bisa mengubah string atau menggunakan packing.

## Praktik 4: playbook SOAR sederhana

Script membaca `eve.json`, mengambil alert, mengekstrak source IP, dan memutuskan aksi:

```python
import json
import sys
from pathlib import Path

alerts = []
for line in Path(sys.argv[1]).read_text().splitlines():
    event = json.loads(line)
    if event.get("event_type") == "alert":
        alerts.append({
            "signature": event["alert"]["signature"],
            "src_ip": event["src_ip"],
            "dest_ip": event["dest_ip"],
        })

blocklist = sorted({a["src_ip"] for a in alerts if a["src_ip"]})
ticket = {"title": f"IDS alerts: {len(alerts)}", "action": "block_src_ip",
          "alerts": alerts, "blocklist": blocklist}
```

Jalankan:

```bash
python3 /lab/rules/soar.py /lab/log/eve.json
```

![SOAR playbook|Dua alert IDS diringkas menjadi ticket dan daftar blocklist.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-8/05-soar.png)

Di lab, `src_ip` adalah client uji sendiri, jadi memblokirnya akan memblokir alat uji. Di produksi, playbook harus punya:

- **Allowlist** untuk scanner resmi, monitoring, dan partner.
- **Approval** untuk aksi berisiko (isolasi host, blokir IP).
- **Idempotency** agar alert berulang tidak menggandakan ticket.
- **Audit log** untuk setiap aksi.
- **Rollback** jika keputusan salah.

## SOC workflow: dari alert ke keputusan

1. **Triage** — validasi alert, cek severity, apakah true positive.
2. **Enrichment** — reputasi IP/hash, asset owner, jam kerja, baseline.
3. **Scope** — user/host lain yang terlibat, apakah ada persistence.
4. **Containment** — blokir, isolasi, revoke session.
5. **Eradication** — hapus malware, patch, reset kredensial.
6. **Recovery** — pulihkan layanan, monitor reinfeksi.
7. **Post-incident** — update rule, dokumentasi, lessons learned.

Case management (TheHive, Jira, ServiceNow) menjaga bukti dan komunikasi tetap rapi. Threat intel (MISP/OpenCTI) memberi konteks, tetapi tidak menggantikan analisis.

## Memilih tool

| Kebutuhan | Mulai dari | Catatan |
|---|---|---|
| Log terpusat | Wazuh/Elastic/Splunk Free | Mulai satu sumber log |
| Endpoint | EDR bawaan OS / Wazuh agent | Cek telemetri dan response |
| Network | Suricata/Zeek | Mulai dari mirror/PCAP |
| Detection | Sigma | Vendor-agnostic |
| File/malware | YARA | Pattern matching |
| Threat intel | MISP/OpenCTI/VT | Jangan blokir dari satu sumber |
| Automation | n8n/Shuffle/Python | Guardrail wajib |

## Checklist Phase 6

- [ ] Bisa menulis query SPL/KQL dasar.
- [ ] Memahami peran SIEM, EDR, dan NDR.
- [ ] Bisa menjelaskan IDS vs IPS.
- [ ] Bisa membaca alert Suricata dan EVE JSON.
- [ ] Bisa menulis dan mengonversi rule Sigma.
- [ ] Bisa menulis rule YARA dan melakukan scan.
- [ ] Memahami tool forensics dan urutan volatilitas.
- [ ] Memahami sumber threat intelligence dan batasannya.
- [ ] Bisa merancang playbook SOAR dengan guardrail.
- [ ] Mengerti workflow triage SOC.

## Kesimpulan

Tool Blue Team bukan daftar produk, tetapi rantai kerja: telemetry → detection → enrichment → response. SIEM menyatukan log, EDR melihat endpoint, NDR melihat jaringan, Sigma/YARA mendefinisikan deteksi, forensics mengumpulkan bukti, threat intel memberi konteks, dan SOAR menjalankan respons.

Di part ini kita mempraktikkan komponen inti rantai tersebut: Suricata mendeteksi scanning HTTP dari PCAP, Sigma dikonversi menjadi query Splunk, YARA mencocokkan sample EICAR, dan playbook Python mengubah alert menjadi ticket serta blocklist. SIEM/EDR penuh butuh deployment dan lisensi sendiri; pola yang dipelajari tetap sama.

Part berikutnya adalah **Certifications (Phase 7)**: memilih sertifikasi yang relevan, urutan belajar, biaya, dan bagaimana menyiapkannya tanpa terjebak mengoleksi sertifikat.
