---
title: 'Deploy Laravel + Queue Worker dengan Apache2 di Ubuntu 24.04'
date: '2026-11-10'
template: 'post'
draft: false
slug: 'deploy-laravel-queue-apache'
category: 'Technology'
tags:
  - 'Laravel'
  - 'Apache'
  - 'Queue'
  - 'Ubuntu'
  - 'DevOps'
description: 'Panduan deploy Laravel 12 dengan Apache2, PHP 8.3, dan queue worker yang dikelola Supervisor. Lengkap dengan contoh job, konfigurasi virtual host, pengujian end-to-end, dan catatan produksi.'
seoTitle: 'Deploy Laravel + Queue Worker dengan Apache2 di Ubuntu 24.04'
seoDescription: 'Tutorial deploy Laravel 12 di Ubuntu 24.04: Apache2, PHP 8.3, virtual host, database queue, job worker via Supervisor, pengujian, dan troubleshooting.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/04-done.png'
---

Queue adalah salah satu komponen yang paling sering ditunda saat deploy Laravel. Aplikasi jalan, halaman terbuka, tetapi begitu ada pekerjaan berat — kirim email, generate PDF, sinkronisasi API — request jadi lambat dan akhirnya timeout.

Artikel ini mencatat proses deploy **Laravel 12 + Apache2 + PHP 8.3 + queue worker** di Ubuntu 24.04. Semua langkah benar-benar dijalankan di container Ubuntu terisolasi, dan **screenshot di artikel ini diambil dari terminal serta browser asli**, bukan mockup.

Sebagai contoh, saya membuat aplikasi demo sederhana: dashboard pesanan dengan tombol **Buat Pesanan**. Request hanya menyimpan data dan melempar job ke queue; worker di belakang layar yang mengerjakan proses 5 detik. Status pesanan berubah dari **Menunggu → Diproses → Selesai** tanpa membuat browser menunggu.

## Arsitektur yang dipakai

- **Apache2 + mod_php 8.3** melayani request HTTP.
- **Laravel 12** sebagai aplikasi.
- **SQLite** sebagai database demo.
- **Database queue** (`jobs` dan `failed_jobs`) sebagai antrean.
- **Supervisor** menjalankan dan mengawasi `php artisan queue:work`.
- **Ubuntu 24.04** sebagai sistem operasi.

Untuk produksi dengan trafik tinggi, SQLite bisa diganti MySQL/PostgreSQL dan mod_php bisa diganti PHP-FPM. Saya bahas catatannya di bagian akhir.

## Yang dibutuhkan

- Ubuntu 24.04 (22.04 juga bisa, sesuaikan versi PHP).
- Akses `sudo`.
- Domain (opsional untuk pengujian lokal).
- Port 80 terbuka.

---

## Langkah 1 — Pasang Apache2, PHP 8.3, Composer, dan Supervisor

```bash
sudo apt update
sudo apt install -y apache2 libapache2-mod-php8.3 \
  php8.3-cli php8.3-common php8.3-sqlite3 php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-intl php8.3-bcmath php8.3-gd \
  composer supervisor unzip curl sqlite3
```

Pastikan semuanya terpasang:

```bash
php -v
apache2 -v
composer -V
```

![Terminal menampilkan versi PHP, Apache, Composer, dan status worker|Stack terpasang: PHP 8.3.6, Apache 2.4.58, Composer 2.7.1, dan worker sudah berjalan di Supervisor.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/05-stack.png)

Yang sering terlewat: `libapache2-mod-php8.3` dan ekstensi `php8.3-sqlite3`. Tanpa modul Apache, PHP tidak dijalankan; tanpa SQLite, Laravel gagal membuka database.

---

## Langkah 2 — Buat project Laravel

```bash
cd /var/www
sudo composer create-project laravel/laravel:^12.0 laravel
```

Setelah selesai, atur permission folder yang ditulis Laravel:

```bash
sudo chown -R www-data:www-data /var/www/laravel/storage /var/www/laravel/bootstrap/cache
sudo chmod -R ug+rwX /var/www/laravel/storage /var/www/laravel/bootstrap/cache
```

Cek versinya:

```bash
cd /var/www/laravel
php artisan --version
```

> Menjalankan Composer sebagai `root` memang memunculkan peringatan. Untuk server produksi, lebih rapi memakai user deploy khusus. Untuk latihan, cara ini aman selama permission `storage` dan `bootstrap/cache` diberikan ke `www-data`.

---

## Langkah 3 — Konfigurasi virtual host Apache2

Buat file `/etc/apache2/sites-available/laravel.conf`:

```apache
<VirtualHost *:80>
    ServerName laravel-demo.local
    DocumentRoot /var/www/laravel/public

    <Directory /var/www/laravel/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/laravel-error.log
    CustomLog ${APACHE_LOG_DIR}/laravel-access.log combined
</VirtualHost>
```

Aktifkan modul dan situsnya:

```bash
sudo a2enmod rewrite
sudo a2dissite 000-default
sudo a2ensite laravel
sudo apachectl configtest
sudo systemctl reload apache2
```

![Konfigurasi virtual host Laravel dan hasil configtest|Virtual host Laravel dan hasil apachectl configtest: Syntax OK.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/06-apache-config.png)

Tiga hal yang wajib benar di tahap ini:

1. **DocumentRoot** menunjuk ke `public`, bukan folder project.
2. **AllowOverride All** aktif, supaya `public/.htaccess` bisa mengarahkan route ke `index.php`.
3. **mod_rewrite** aktif. Tanpa ini, hanya halaman depan yang terbuka dan route lain menghasilkan 404.

Kalau memakai domain asli, ganti `ServerName` dan arahkan A record domain ke IP server.

---

## Langkah 4 — Konfigurasi `.env` dan database

Laravel 12 sudah memakai SQLite dan database queue secara default. Sesuaikan `.env`:

```dotenv
APP_NAME="Laravel Queue Demo"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://domainkamu.com

DB_CONNECTION=sqlite
# DB_DATABASE=/var/www/laravel/database/database.sqlite

QUEUE_CONNECTION=database
```

Lalu siapkan database dan jalankan migration:

```bash
cd /var/www/laravel
touch database/database.sqlite
php artisan key:generate
php artisan migrate --force
```

Laravel 11/12 sudah menyertakan migration `jobs`, `job_batches`, dan `failed_jobs`. Kalau kamu memakai versi lebih lama, jalankan `php artisan queue:table` sebelum migrate.

Pastikan file database bisa ditulis oleh Apache dan worker:

```bash
sudo chown -R www-data:www-data database storage bootstrap/cache
sudo chmod -R ug+rwX database storage bootstrap/cache
```

---

## Langkah 5 — Buat contoh job dan halaman demo

Buat model, migration, dan job:

```bash
php artisan make:model Order -m
php artisan make:job ProcessOrder
```

Isi migration `create_orders_table`:

```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->string('customer_name');
    $table->string('status')->default('queued');
    $table->timestamp('processed_at')->nullable();
    $table->timestamps();
});
```

Isi `app/Jobs/ProcessOrder.php`:

```php
namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessOrder implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(public int $orderId)
    {
    }

    public function handle(): void
    {
        $order = Order::find($this->orderId);

        if (! $order) {
            return;
        }

        $order->update(['status' => 'processing']);

        // Simulasi pekerjaan berat: kirim email, generate PDF, panggil API.
        sleep(5);

        $order->update([
            'status' => 'done',
            'processed_at' => now(),
        ]);
    }
}
```

Lalu route di `routes/web.php`:

```php
use App\Jobs\ProcessOrder;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome', [
        'orders' => Order::latest()->take(10)->get(),
        'total' => Order::count(),
        'queued' => Order::where('status', 'queued')->count(),
        'done' => Order::where('status', 'done')->count(),
    ]);
});

Route::post('/orders', function (Request $request) {
    $data = $request->validate([
        'customer_name' => ['required', 'string', 'max:100'],
    ]);

    $order = Order::create([
        'customer_name' => $data['customer_name'],
        'status' => 'queued',
    ]);

    ProcessOrder::dispatch($order->id);

    return redirect('/')->with('status', "Pesanan #{$order->id} masuk antrean.");
});
```

Di Blade, bagian inti tabel statusnya seperti ini:

```blade
@foreach ($orders as $order)
  <tr>
    <td>#{{ $order->id }}</td>
    <td>{{ $order->customer_name }}</td>
    <td>
      <span class="badge {{ $order->status }}">
        {{ ['queued' => 'Menunggu', 'processing' => 'Diproses', 'done' => 'Selesai'][$order->status] }}
      </span>
    </td>
    <td>{{ $order->processed_at?->format('H:i:s') ?? '—' }}</td>
  </tr>
@endforeach
```

Terakhir, jalankan migration:

```bash
php artisan migrate --force
```

Di aplikasi nyata, isi `handle()` bukan `sleep(5)`, melainkan pekerjaan sebenarnya. `sleep` hanya dipakai supaya transisi statusnya terlihat jelas saat pengujian.

---

## Langkah 6 — Jalankan worker dengan Supervisor

Membuka SSH lalu mengetik `php artisan queue:work` memang bisa, tetapi worker akan mati begitu sesi ditutup. Di server, worker harus diawasi proses manager. Supervisor adalah pilihan paling umum.

Buat `/etc/supervisor/conf.d/laravel-worker.conf`:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/laravel-worker.log
stdout_logfile_maxbytes=10MB
stopwaitsecs=3600
```

Muat konfigurasinya:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

Status yang benar kurang lebih:

```text
laravel-worker:laravel-worker_00   RUNNING   pid 857, uptime 0:01:06
```

Log worker menunjukkan setiap job yang dijalankan:

![Log worker menampilkan job ProcessOrder berjalan dan selesai|Log worker: setiap ProcessOrder berjalan 5 detik lalu DONE.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/07-worker-log.png)

Beberapa detail penting:

- **`user=www-data`** harus sama dengan user yang menulis `storage` dan database.
- **`--max-time=3600`** membuat worker restart setiap jam untuk membatasi kebocoran memori.
- **`--tries=3`** memberi tiga percobaan sebelum job masuk ke `failed_jobs`.
- **`numprocs=1`** untuk SQLite. Penjelasannya ada di bagian catatan produksi — ini bukan angka yang bisa asal dinaikkan.

Setelah setiap deploy, jalankan:

```bash
php artisan queue:restart
```

Worker menyimpan kode di memori. Tanpa restart, worker bisa terus menjalankan versi lama aplikasi.

---

## Langkah 7 — Uji alur queue dari browser

Kondisi awal: belum ada pesanan.

![Dashboard demo sebelum ada pesanan|Tampilan awal dashboard demo sebelum ada pesanan.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/01-empty.png)

Saya membuat tiga pesanan saat worker sengaja dihentikan, supaya status **Menunggu** terlihat. Di operasi normal, worker akan mengambil job dalam hitungan detik.

![Tiga pesanan menunggu di antrean|Tiga pesanan masuk antrean; worker sengaja dihentikan agar status Menunggu terlihat.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/02-queued.png)

Setelah worker dijalankan, satu job langsung diproses dan dua sisanya masih menunggu:

![Satu pesanan diproses, dua masih menunggu|Worker memproses satu job; dua pesanan lain masih menunggu.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/03-processing.png)

Sekitar 15 detik kemudian, ketiganya selesai dengan timestamp masing-masing:

![Semua pesanan selesai diproses|Semua pesanan selesai, lengkap dengan waktu pemrosesan.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/04-done.png)

Yang perlu diperhatikan: request `POST /orders` selesai hampir instan. Waktu 5 detik per pesanan dihabiskan oleh worker, bukan oleh browser.

---

## Langkah 8 — Verifikasi queue dan failed jobs

Setelah semua job selesai, pastikan tidak ada job yang tertinggal atau gagal:

```bash
php artisan queue:failed
php artisan queue:monitor database:default
```

![Verifikasi failed jobs dan ukuran queue|Tidak ada failed job; queue kosong dan berstatus OK.](https://is3.cloudhost.id/public-data/project-images/blog/laravel-queue-apache/08-verify.png)

Kalau ada job gagal, periksa detailnya:

```bash
php artisan queue:failed
php artisan queue:retry all
```

Sebelum retry, baca dulu exception-nya. Retry tanpa memperbaiki penyebab hanya akan mengulang kegagalan yang sama.

---

## Catatan produksi

### SQLite tidak cocok untuk banyak worker

Ini pengalaman nyata saat pengujian: dengan **2 worker** dan SQLite, dua proses menulis database bersamaan dan muncul:

```text
PDOException: SQLSTATE[HY000]: General error: 5 database is locked
```

Job yang terkena langsung pindah ke `failed_jobs`. Solusinya:

- **SQLite:** gunakan `numprocs=1`.
- **MySQL/PostgreSQL:** boleh `numprocs=2` atau lebih, dengan database yang memang dirancang untuk konkurensi.

Untuk aplikasi produksi, gunakan MySQL atau PostgreSQL. SQLite bagus untuk demo dan aplikasi kecil dengan satu worker.

### Setelah deploy

Urutan yang aman:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart
sudo systemctl reload apache2
```

Ingat: setelah `config:cache`, perubahan `.env` tidak akan terbaca sampai cache dibersihkan (`php artisan config:clear`) atau di-cache ulang.

### Keamanan dan operasional

- Set `APP_ENV=production` dan `APP_DEBUG=false`.
- Pasang HTTPS (Certbot) dan arahkan `APP_URL` ke `https://`.
- Batasi akses ke `storage` dan file `.env`.
- Pantau `failed_jobs`, log worker, dan ukuran queue.
- Pastikan job **idempoten** — job bisa dijalankan ulang setelah timeout.
- Gunakan `--timeout` dan `$timeout` yang realistis; job yang terlalu lama sebaiknya dipecah.
- Untuk trafik tinggi, pertimbangkan PHP-FPM + `mpm_event` daripada mod_php.

---

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Halaman 500 setelah deploy | Permission `storage`/`bootstrap/cache`, atau `APP_KEY` kosong | `chown -R www-data:www-data storage bootstrap/cache`, lalu `php artisan key:generate` |
| Semua route 404 kecuali `/` | `mod_rewrite` mati atau `AllowOverride` bukan `All` | `a2enmod rewrite`, perbaiki vhost, reload Apache |
| 403 Forbidden | DocumentRoot salah atau direktori tidak bisa dibaca | Arahkan ke `/var/www/laravel/public`, cek permission |
| Job tetap `queued` | Supervisor mati, `QUEUE_CONNECTION` salah, atau config cache basi | `supervisorctl status`, cek `.env`, `php artisan config:clear` |
| `database is locked` | Banyak worker menulis ke SQLite | Set `numprocs=1` atau pindah ke MySQL/PostgreSQL |
| Perubahan kode tidak dipakai worker | Worker masih memegang kode lama | `php artisan queue:restart` setiap selesai deploy |
| Job timeout | Proses terlalu lama atau `--timeout` terlalu kecil | Naikkan timeout secara wajar atau pecah job |
| Job terus retry | Bug di job atau dependensi eksternal down | Baca `failed_jobs`, perbaiki, baru `queue:retry` |
| `.env` berubah tapi tidak efek | `config:cache` masih menyimpan konfigurasi lama | `php artisan config:clear && php artisan config:cache` |
| Log worker tidak muncul | Path log salah atau Supervisor tidak jalan | Cek `supervisorctl status` dan `/var/log/laravel-worker.log` |

---

## Checklist akhir

- [ ] Apache2, PHP 8.3, Composer, dan Supervisor terpasang.
- [ ] DocumentRoot mengarah ke `public` dan `mod_rewrite` aktif.
- [ ] `.env` memakai `QUEUE_CONNECTION=database` (atau Redis).
- [ ] Migration `jobs` dan `failed_jobs` sudah berjalan.
- [ ] Permission `storage`, `bootstrap/cache`, dan database diberikan ke `www-data`.
- [ ] Supervisor menjalankan `queue:work` sebagai `www-data`.
- [ ] `numprocs=1` kalau memakai SQLite.
- [ ] Job berhasil diproses dan status berubah di browser.
- [ ] `queue:failed` dan `queue:monitor` bersih.
- [ ] `queue:restart` masuk ke langkah deploy.

Dengan susunan ini, Laravel tidak lagi mengerjakan tugas berat di dalam request. Apache2 tetap ringan, worker menangani antrean di belakang, dan Supervisor memastikan worker hidup kembali kalau mati.
