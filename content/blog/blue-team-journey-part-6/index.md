---
title: 'Blue Team Journey - Part 6: Scripting & Automation dengan Python dan Bash'
date: '2026-11-18'
template: 'post'
draft: false
slug: 'blue-team-journey-part-6'
category: 'Cybersecurity'
tags:
  - 'Python'
  - 'Bash'
  - 'Automation'
  - 'Regex'
  - 'SQL'
  - 'Blue Team'
  - 'Cybersecurity'
description: 'Scripting untuk defender: parsing log dengan Python, regex IOC, hash checker, API reputation, SQL GROUP BY, dan Bash alert—semuanya dipraktikkan di container.'
seoTitle: 'Scripting & Automation untuk Blue Team: Python, Regex, Bash, SQL'
seoDescription: 'Belajar scripting untuk Blue Team: Python log parser, regex IOC, hashlib, requests API, SQLite, Bash threshold alert, dan automation hygiene.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/00-cover.png'
---

Setelah bisa membaca log dan proses secara manual di [Part 5](/blog/blue-team-journey-part-5), langkah berikutnya adalah membuat alat kecil yang **bisa dijalankan berulang**. Di sinilah scripting menjadi pengganda kekuatan: satu script yang membaca ribuan baris log bisa menggantikan pekerjaan manual yang membosankan dan rawan salah.

Artikel ini adalah **Part 6** dari seri **Blue Team Journey**, masuk ke Phase 4 dari [Blue Team Roadmap](https://github.com/keraattin/Blue-Team-Roadmap): **Scripting & Automation**. Kita akan membangun enam tool kecil di container Python: log parser, IOC extractor, hash checker, API reputation checker, SQL report, dan Bash alert.

## Yang perlu dikuasai (dan yang tidak)

Kita tidak perlu menjadi software engineer. Yang perlu adalah **functional scripting**:

- Membaca file log dan memproses baris.
- Memakai regex untuk mengambil IP, hash, URL, dan email.
- Memanggil API dan menangani JSON.
- Menyimpan hasil ke JSON/CSV.
- Menulis query SQL sederhana.
- Membuat script Bash yang punya exit code dan bisa dijadwalkan.

Yang tidak perlu di fase ini: framework web, microservices, atau arsitektur kompleks.

## Python: konsep inti

### Variabel, tipe data, dan kontrol alur

```python
ip = "203.0.113.50"
attempts = 5
is_tor = True

if attempts >= 5 and is_tor:
    print(f"{ip} mencurigakan: {attempts} percobaan")
```

Tipe yang paling sering dipakai:

| Tipe | Contoh | Kegunaan |
|---|---|---|
| `str` | `"failed"` | Teks log |
| `int` | `42` | Counter, port |
| `float` | `0.85` | Score, latency |
| `bool` | `True` | Flag |
| `list` | `["alice", "bob"]` | Urutan data |
| `dict` | `{"ip": "...", "score": 90}` | Record |
| `set` | `{"203.0.113.50"}` | Deduplikasi |

### List, dict, dan set

```python
events = []
events.append({"ip": "203.0.113.50", "status": "Failed"})

seen_ips = {e["ip"] for e in events}   # set, otomatis unik
print(len(seen_ips))
```

Untuk menghitung frekuensi, `collections.Counter` lebih ringkas:

```python
from collections import Counter

counts = Counter(e["ip"] for e in events)
print(counts.most_common(5))
```

### File I/O dan error handling

```python
from pathlib import Path

try:
    lines = Path("/app/data/auth.log").read_text().splitlines()
except FileNotFoundError:
    print("log tidak ditemukan")
    raise SystemExit(1)
```

`with open(...)` lebih aman karena file otomatis ditutup:

```python
with open("/app/data/auth.log", "r", errors="replace") as handle:
    for line in handle:
        if "Failed password" in line:
            print(line.strip())
```

### Fungsi dan modul

```python
def parse_line(line: str) -> dict | None:
    if "Failed password" not in line:
        return None
    return {"raw": line.strip()}
```

Fungsi kecil yang punya satu tugas lebih mudah dites dan dipakai ulang. Pisahkan parsing, enrichment, dan output.

## Library yang sering dipakai defender

| Library | Fungsi | Contoh |
|---|---|---|
| `re` | Regex | Ekstrak IP, hash, URL |
| `json` | Baca/tulis JSON | Output API, report |
| `csv` | Baca/tulis CSV | Export event |
| `hashlib` | Hash file | MD5/SHA256 IOC |
| `requests` | HTTP API | Reputation, enrichment |
| `sqlite3` | SQL lokal | Analisis event |
| `argparse` | CLI argument | `--log`, `--json-out` |
| `collections` | Counter, defaultdict | Agregasi |

## Lab: Python 3.12 dan mock API

Dockerfile:

```dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1
RUN pip install --no-cache-dir requests
WORKDIR /app
COPY scripts /app/scripts
COPY data /app/data
RUN mkdir -p /app/output
CMD ["sleep", "infinity"]
```

Jalankan:

```bash
docker build -t script-lab:1.0 ./image
docker run -d --name script-client script-lab:1.0
docker exec -d script-client python /app/scripts/mock_api.py
docker exec -it script-client bash
cd /app/scripts
```

Lab memakai **mock reputation API** di `127.0.0.1:8080`, sehingga tidak perlu API key dan tidak mengirim data ke internet. Pola `requests` yang dipelajari sama dengan API nyata seperti VirusTotal atau AbuseIPDB.

![Pipeline tool|Input log/IOC/file, script Python dan Bash, lalu output JSON/CSV/alert.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/01-lab-topology.png)

> Data lab memakai IP dokumentasi (`203.0.113.0/24`, `198.51.100.0/24`, `192.0.2.0/24`) dan file EICAR sebagai sampel aman. Jangan mengirim data pelanggan ke API publik tanpa kebijakan yang jelas.

## Tool 1: log parser

Inti parser ada di regex dan agregasi:

```python
LINE = re.compile(
    r"^(?P<ts>\w+\s+\d+\s+\d{2}:\d{2}:\d{2}).*?"
    r"(?P<status>Failed|Accepted)\s+(?:password|publickey)\s+for\s+"
    r"(?:invalid user\s+)?(?P<user>[A-Za-z0-9._-]+)\s+from\s+"
    r"(?P<ip>\d{1,3}(?:\.\d{1,3}){3})"
)

failed = [e for e in events if e["status"] == "Failed"]
ip_counts = Counter(e["ip"] for e in failed)
user_counts = Counter(e["user"] for e in failed)
```

Script juga menulis JSON dan CSV, sehingga hasilnya bisa dipakai tool lain:

```bash
python parse_auth.py --log /app/data/auth.log \
  --json-out /app/output/auth_report.json \
  --csv-out /app/output/auth_events.csv
```

![Log parser|12 failed login, top IP, user yang paling sering dicoba, dan login berhasil setelah kegagalan.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/02-parse.png)

Yang dibuat script ini:

- **Ringkasan** jumlah event, failed, dan accepted.
- **Top IP** dan **top user** dari kegagalan.
- **Success after failure**—pola yang paling penting untuk investigasi.
- **JSON** untuk automation, **CSV** untuk spreadsheet.

`argparse` membuat script bisa dipakai ulang:

```bash
python parse_auth.py --help
```

## Tool 2: ekstraksi IOC dan regex

Regex yang sering dipakai:

| Pattern | Matches | Catatan |
|---|---|---|
| `\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}` | IPv4 | Bisa cocok dengan 999.999.999.999; validasi dengan `ipaddress` |
| `[a-fA-F0-9]{32}` | MD5 | Bisa cocok dengan bagian SHA256; filter |
| `[a-fA-F0-9]{64}` | SHA256 | Hash 64 karakter |
| `https?://[^\s"']+` | URL | Ambil sampai whitespace/quote |
| `[\w.-]+@[\w.-]+\.\w+` | Email | Validasi lebih lanjut jika perlu |
| `([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}` | MAC | Format colon |

Contoh implementasi:

```python
PATTERNS = {
    "sha256": re.compile(r"\b[a-fA-F0-9]{64}\b"),
    "md5": re.compile(r"\b[a-fA-F0-9]{32}\b"),
    "ipv4": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "url": re.compile(r"https?://[^\s\"']+"),
    "email": re.compile(r"[\w.-]+@[\w.-]+\.\w+"),
}

def defang(value: str) -> str:
    return value.replace("http", "hxxp").replace(".", "[.]").replace("@", "[@]")
```

![Ekstraksi IOC|IP, URL, MD5, SHA256, dan email diekstrak dari teks lalu di-defang.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/03-ioc.png)

Defang berguna saat berbagi IOC di tiket/chat agar tidak menjadi link aktif: `203[.]0[.]113[.]50`, `hxxp://malicious[.]example/...`, `attacker[@]example[.]com`.

Catatan regex:

- Gunakan **raw string** (`r"..."`) agar backslash tidak diproses Python.
- Gunakan **non-capturing group** `(?:...)` jika tidak butuh group.
- `re.findall` mengembalikan list; jika ada group, hasilnya bisa berubah menjadi tuple.
- Compile regex yang dipakai berulang untuk performa.
- Regex bukan validator sempurna; validasi IP dengan `ipaddress.ip_address()` dan URL dengan parser bila perlu.

## Tool 3: hash checker

`hashlib` membaca file dalam chunk agar tidak memuat file besar ke memori:

```python
def digest(path, algo):
    h = hashlib.new(algo)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()
```

Bandingkan dengan daftar hash known-bad, lalu gunakan exit code:

```python
verdict = "MALICIOUS" if sha256 in known or md5 in known else "UNKNOWN"
sys.exit(1 if verdict == "MALICIOUS" else 0)
```

![Hash checker|File EICAR menghasilkan verdict MALICIOUS dan exit code 1.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/04-hash.png)

Exit code penting untuk automation:

- `0` = bersih/unknown.
- `1` = malicious (atau error yang disepakati).
- `2` = alert threshold, jika memakai konvensi sendiri.

Jangan mengandalkan MD5 untuk keamanan modern; tetap hitung untuk kompatibilitas IOC, tetapi prioritaskan SHA256.

## Tool 4: API reputation checker

`requests` dengan timeout, retry, dan penanganan error:

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(total=2, backoff_factor=0.2, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retry))

try:
    response = session.get(f"{BASE}/{ip}", timeout=3)
    if response.status_code != 200:
        print(f"{ip}: HTTP {response.status_code}")
        continue
    data = response.json()
except requests.RequestException as exc:
    print(f"{ip}: error {exc}")
```

![API reputation|Empat IP dicek ke mock API; satu IP tidak ditemukan dan ditangani sebagai 404.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/05-reputation.png)

Pelajaran penting:

- **Timeout wajib.** Tanpa timeout, script bisa menggantung.
- **Retry dengan backoff** untuk error sementara (5xx, rate limit).
- **Tangani 404/401/429** sebagai kondisi berbeda, bukan crash.
- **Jangan hardcode API key.** Gunakan environment variable atau secret manager.
- **Hormati rate limit** dan terms of service API.
- **Cache hasil** jika query berulang untuk IP yang sama.

## Tool 5: SQL report

SQLite cukup untuk analisis lokal. Script memasukkan event ke tabel lalu menjalankan query:

```python
con.execute("CREATE TABLE events (ts TEXT, status TEXT, user TEXT, ip TEXT)")
con.executemany("INSERT INTO events VALUES (:ts, :status, :user, :ip)", events)
```

Query yang dipakai:

```sql
SELECT ip, COUNT(*) AS attempts
FROM events
WHERE status = 'Failed'
GROUP BY ip
HAVING attempts >= 3
ORDER BY attempts DESC;
```

![SQL report|Query GROUP BY/HAVING menemukan IP dengan minimal 3 kegagalan dan login berhasil dari IP tersebut.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/06-sql.png)

SQL dasar yang perlu dikuasai:

| Klausa | Fungsi |
|---|---|
| `SELECT` | Kolom yang diambil |
| `WHERE` | Filter baris |
| `GROUP BY` | Kelompokkan untuk agregasi |
| `HAVING` | Filter setelah agregasi |
| `ORDER BY` | Urutkan hasil |
| `JOIN` | Gabungkan tabel |

Contoh `JOIN` untuk memperkaya event dengan daftar aset:

```sql
SELECT e.ip, e.user, a.owner
FROM events e
JOIN assets a ON a.ip = e.ip
WHERE e.status = 'Failed';
```

Pola SQL ini mirip dengan query SIEM (Splunk SPL, KQL, Elastic DSL, SQL). Memahami `GROUP BY` dan `HAVING` membuat transisi ke SIEM lebih mudah.

## Tool 6: Bash alert

Bash cocok untuk wrapper tipis di sekitar tool Python atau perintah sistem:

```bash
#!/bin/bash
set -euo pipefail

LOG="${1:-/app/data/auth.log}"
THRESHOLD="${2:-10}"

count=$(grep -c "Failed password" "$LOG" || true)
echo "[*] failed SSH logins: $count"

if [ "$count" -gt "$THRESHOLD" ]; then
  echo "[ALERT] threshold exceeded (limit: $THRESHOLD)"
  grep "Failed password" "$LOG" | grep -oE 'from [0-9.]+' \
    | awk '{print $2}' | sort | uniq -c | sort -rn | head -5
  exit 2
fi

echo "[OK] below threshold"
```

![Bash threshold alert|12 kegagalan melewati threshold 10; script menampilkan top IP dan keluar dengan kode 2.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-6/07-monitor.png)

Detail Bash yang penting:

- **`set -euo pipefail`** menghentikan script saat error, variabel kosong, atau pipe gagal.
- **Quote variabel** (`"$LOG"`) agar path dengan spasi aman.
- **`grep -c ... || true`** mencegah `set -e` berhenti saat tidak ada match.
- **Exit code** bisa dipakai cron, CI, atau SOAR untuk memicu aksi.
- **Jangan parsing `ls`**; gunakan `find`, glob, atau tool khusus.

Contoh cron:

```cron
*/5 * * * * /app/scripts/monitor.sh /var/log/auth.log 10 >> /var/log/ssh-monitor.log 2>&1
```

## PowerShell untuk endpoint Windows

Di Windows, pola yang sama bisa dibuat dengan PowerShell:

```powershell
$suspicious = @('mimikatz', 'psexec', 'bloodhound', 'sharphound', 'lazagne')
Get-Process | Where-Object {
    $name = $_.Name.ToLower()
    $suspicious | Where-Object { $name -like "*$_*" }
} | Select-Object Name, Id, Path, StartTime
```

Untuk event log:

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} |
  Group-Object {$_.Properties[5].Value} |
  Sort-Object Count -Descending |
  Select-Object -First 10
```

PowerShell scripting di Windows memakai objek, bukan teks. Ini lebih kuat untuk properti event, tetapi tetap perlu validasi dan error handling.

## Automation hygiene

Script yang berjalan otomatis harus aman dan bisa dipercaya:

- **Validasi input.** Jangan langsung memasukkan argumen ke shell atau query.
- **Gunakan `argparse`**, bukan parsing manual `sys.argv`.
- **Timeout dan retry** untuk API.
- **Logging** ke stderr/file, bukan hanya `print`.
- **Exit code** yang konsisten.
- **Jangan hardcode secret.** Gunakan env/secret manager.
- **Batasi permission file output.**
- **Idempotent** jika dijalankan berulang.
- **Test dengan fixture kecil** sebelum data produksi.
- **Jangan menjalankan `curl | bash` dari sumber tidak tepercaya.**
- **Patuhi hukum, privasi, dan ToS API.**

## Checklist Phase 4

- [ ] Bisa menulis Python untuk membaca dan mem-parsing log.
- [ ] Bisa memakai regex untuk IP, hash, URL, dan email.
- [ ] Bisa menulis JSON/CSV dari script.
- [ ] Bisa memanggil API dengan `requests`, timeout, dan error handling.
- [ ] Bisa menghitung hash file dengan `hashlib`.
- [ ] Bisa memakai SQLite dan query `GROUP BY`/`HAVING`.
- [ ] Bisa menulis Bash script dengan exit code dan threshold.
- [ ] Bisa menjadwalkan script dengan cron.
- [ ] Bisa menjelaskan risiko hardcoded secret dan input tidak tervalidasi.
- [ ] Sudah membuat minimal dua tool keamanan kecil.

## Kesimpulan

Scripting bukan tentang menulis kode yang rumit, tetapi tentang mengubah pekerjaan manual yang berulang menjadi tool kecil yang konsisten. Enam tool di part ini—log parser, IOC extractor, hash checker, reputation checker, SQL report, dan Bash alert—mencakup pola yang akan dipakai berulang di SOC: baca, filter, enrich, analisis, dan keluarkan hasil.

Dengan Python, regex, API, SQL, dan Bash, kita sudah punya fondasi untuk Phase 5: **Security Fundamentals**—kriptografi, CIA triad, kontrol akses, jaringan aman, dan konsep risiko yang membuat tool ini punya konteks.

Lab Docker sudah dibersihkan setelah screenshot. Script dan data bisa disimpan untuk latihan ulang; jangan memakai kredensial atau data produksi di lab.
