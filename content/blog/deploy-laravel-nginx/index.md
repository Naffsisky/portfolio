---
title: 'Deploy Laravel With Nginx'
date: '2025-03-04'
template: 'post'
draft: false
slug: 'deploy-laravel-nginx'
category: 'Technology'
tags:
  - 'Web Development'
  - 'Cloud Computing'
  - 'Nginx'
description: ''
socialImage: '/blog/cloudrun-deploy/images/cloudrun.png'
---

## Clone Project

`git clone https://github.com/Naffsisky/submission-laravel.git`

## Pindahkan Folder

Pindahkan folder menggunakan `sudo`

Pindahkan ke: `/var/www/html`

## Installation

### Install Composer

1. Check php version `php -v`

   Contoh response:

   ```
   PHP 8.1.2-1ubuntu2.20 (cli) (built: Dec  3 2024 20:14:35) (NTS)
   Copyright (c) The PHP Group
   Zend Engine v4.1.2, Copyright (c) Zend Technologies
       with Zend OPcache v8.1.2-1ubuntu2.20, Copyright (c), by Zend Technologies
   ```

2. Jika dibutuhkan bisa install library yang dibutuhkan

   `sudo apt install php-mbstring php-xml php-bcmath php-curl`

3. Memberikan Izin atau Permission pada folder

   ```
   sudo chown -R www-data:www-data /var/www/html/submission-laravel/

   sudo chmod -R 777 /var/www/html/submission-laravel/
   ```

4. Lalu install composer

   `sudo apt install composer`

5. Install php-fps **Sesuaikan dengan versi php**

   `sudo apt install php8.1-fpm`

   Check apakah sudah berjalan

   `sudo systemctl status php8.1-fpm`

### Configuration App

Sekarang membuat konfigurasi aplikasi terlebih dahulu

1. Membuat `.env` bisa juga di copy dari `.env.example`

   `sudo cp .env.example .env`

   Merubah `.env` untuk production dan sesuaikan database

   ```
   APP_NAME="Blog Management"
   APP_ENV=production
   APP_KEY=
   APP_DEBUG=false
   APP_URL=http://submission.prinafsika.world
   ```

   Sesuaikan dengan kebutuhan, dan siapkan juga untuk subdomainnya

2. Membuat Key Application

   `php artisan key:generate`

3. Build Aplikasi

   Jika menggunakan library javascript bisa melakukan

   `npm install && npm run build`

4. Migrasi Database

   Install php mysql **Versi Mysql di sesuaikan**

   `sudo apt-get install php8.1-mysql`

   Lalu migrate

   `php artisan migrate`

   Jika ada seed, silahkan di seed

   `php artisan db:seed`

5. Link Storage Application

   `php artisan storage:link`

### Configuration Nginx

1. Siapkan domain atau sub domain terlebih dahulu di platform domain masing-masing.

2. Install nginx

   `sudo apt install nginx`

3. Konfigurasi Sites-Available

   `sudo vim /etc/nginx/sites-available/submission`

   Disini saya menggunakan subdomain submisson dan domain prinafsika.world. Sesuaikan juga versi dari `fpm.sock`

   bisa cek di `sudo vim /etc/php/8.3/fpm/pool.d/www.conf` lalu temukan baris `listen = /run/php/php8.1-fpm.sock`

   Contoh konfigurasi nginx `/etc/nginx/sites-available/submission`

   ```
   server {

       listen 80;
       listen [::]:80;
       server_name submission.prinafsika.world;
       root /var/www/html/submission-laravel/public;

       add_header X-Frame-Options "SAMEORIGIN";
       add_header X-Content-Type-Options "nosniff";

       index index.php;

       charset utf-8;

       location / {
           try_files $uri $uri/ /index.php?query_string;
       }

       location = /favicon.ico { access_log off; log_not_found off; }
       location = /robots.txt { access_log off; log_not_found off; }

       error_page 404 /index.php;

       location ~ \.php$ {
           fastcgi_pass unix:/run/php/php8.1-fpm.sock;
           fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
           include fastcgi_params;
       }

       location ~ /\.(?!well-known).* {
           deny all;
       }

   }
   ```

4. Symbolic Link ke Sites-Enabled

   `sudo ln -s /etc/nginx/sites-available/submission /etc/nginx/sites-enabled/`

5. Check Konfigurasi Nginx

   Memastikan konfigurasi sudah berjalan dengan benar

   `sudo nginx -t`

   Contoh response tanpa masalah

   ```
   nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
   nginx: configuration file /etc/nginx/nginx.conf test is successful
   ```

   Lalu restart nginx

   `sudo systemctl restart nginx`

6. Memasang SSL untuk HTTPS

   Menggunakan certbot

   `sudo apt install certbot python3-certbot-nginx`

   Pasang SSL

   `sudo certbot --nginx -d submission.prinafsika.world`

   Contoh response jika SSL berhasil terpasang

   ```
   Saving debug log to /var/log/letsencrypt/letsencrypt.log
   Requesting a certificate for submission.prinafsika.world

   Successfully received certificate.
   Certificate is saved at: /etc/letsencrypt/live/submission.prinafsika.world/fullchain.pem
   Key is saved at:         /etc/letsencrypt/live/submission.prinafsika.world/privkey.pem
   This certificate expires on 2025-06-02.
   These files will be updated when the certificate renews.
   Certbot has set up a scheduled task to automatically renew this certificate in the background.

   Deploying certificate
   Successfully deployed certificate for submission.prinafsika.world to /etc/nginx/sites-enabled/submission
   Congratulations! You have successfully enabled HTTPS on https://submission.prinafsika.world

   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   If you like Certbot, please consider supporting our work by:
   * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   * Donating to EFF:                    https://eff.org/donate-le
   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
   ```

## Testing

Kunjungi situs yang telah berhasil di deploy, dan lakukan pengujian untuk semua fitur apakah sudah berjalan dengan baik.

## Selesai
