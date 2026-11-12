---
title: 'Race Condition di Go: Contoh Nyata, Deteksi dengan -race, dan Cara Mengatasinya'
date: '2026-11-12'
template: 'post'
draft: false
slug: 'race-condition-golang'
category: 'Technology'
tags:
  - 'Go'
  - 'Concurrency'
  - 'Testing'
  - 'Race Condition'
  - 'Backend'
description: 'Panduan praktis race condition di Go: contoh counter yang salah, deteksi dengan go test -race, perbaikan memakai mutex, atomic, dan channel, plus stress test yang benar-benar dijalankan di container.'
seoTitle: 'Race Condition di Go: Contoh, Deteksi -race, dan Solusinya'
seoDescription: 'Pelajari race condition di Go dari contoh nyata: counter yang kehilangan update, laporan WARNING: DATA RACE, perbaikan dengan sync.Mutex, sync/atomic, channel, dan concurrent map.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/race-condition-golang/00-cover.png'
---

Race condition adalah salah satu bug yang paling mahal: kode terlihat benar, test kadang lulus, lalu di produksi angka jadi salah dan sulit direproduksi. Di Go, goroutine membuat concurrency sangat mudah — dan justru karena mudah, race condition juga mudah muncul.

Artikel ini tidak cuma menjelaskan teori. Saya membuat project Go kecil, menjalankannya di container terisolasi, membuktikan bug-nya dengan **race detector**, lalu memperbaikinya dengan tiga pendekatan: **mutex**, **atomic**, dan **channel**. Semua screenshot di bawah ini diambil dari eksekusi nyata, bukan mockup.

## Apa itu race condition?

Race condition terjadi ketika hasil program bergantung pada urutan eksekusi yang tidak bisa diprediksi. Dalam konteks memori, bentuk paling umum adalah **data race**: dua goroutine mengakses variabel yang sama secara bersamaan, minimal satu di antaranya menulis, dan tidak ada sinkronisasi.

Contoh klasiknya adalah operasi `value += 1`. Di level mesin, operasi itu bukan satu langkah:

1. Baca `value` dari memori.
2. Tambahkan 1.
3. Tulis kembali ke memori.

Kalau dua goroutine melakukan ketiga langkah itu bersamaan, keduanya bisa membaca nilai yang sama. Satu penulisan menimpa penulisan lainnya, dan satu increment hilang.

Go mendeteksi data race lewat **race detector** yang diaktifkan dengan flag `-race`. Alat ini tidak mencegah race, tetapi melaporkan akses yang tidak tersinkronisasi saat program berjalan.

## Struktur project demo

Project kecil ini berisi beberapa package:

```text
race-demo/
├── bad/          # counter tanpa sinkronisasi
├── mutex/        # counter dengan sync.Mutex
├── atomic/       # counter dengan sync/atomic
├── channel/      # counter dengan satu goroutine pemilik data
├── countertest/  # test helper yang dipakai semua package
├── cmd/race/     # program untuk menunjukkan hasil yang salah
├── mapdemo/      # concurrent map writes (fatal error)
└── mapfixed/     # versi map dengan mutex
```

Semua dijalankan dengan Go 1.25 di container `golang:1.25-bookworm`.

## Langkah 1 — Reproduksi bug

Versi pertama sengaja dibuat tanpa sinkronisasi:

```go
package bad

// Counter tidak punya sinkronisasi. Jangan dipakai di produksi.
type Counter struct {
	value int
}

func (c *Counter) Add(n int) {
	c.value += n
}

func (c *Counter) Value() int {
	return c.value
}
```

Test-nya menjalankan 200 goroutine, masing-masing menambah 2.000 kali. Total yang seharusnya adalah 400.000:

```go
package countertest

import (
	"sync"
	"testing"
)

type Counter interface {
	Add(int)
	Value() int
}

func Run(t *testing.T, c Counter) {
	t.Helper()

	var wg sync.WaitGroup
	for i := 0; i < 200; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 2000; j++ {
				c.Add(1)
			}
		}()
	}
	wg.Wait()

	const want = 400000
	if got := c.Value(); got != want {
		t.Fatalf("got %d, want %d", got, want)
	}
}
```

Program `cmd/race` menjalankan counter tersebut lima kali:

```go
func run() int {
	c := &bad.Counter{}
	var wg sync.WaitGroup

	for i := 0; i < 200; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 2000; j++ {
				c.Add(1)
			}
		}()
	}
	wg.Wait()

	return c.Value()
}
```

Hasilnya:

![Lima kali run counter menghasilkan total yang jauh di bawah 400.000|Hasil 5 kali run: total selalu di bawah 400.000 karena update yang hilang.](https://is3.cloudhost.id/public-data/project-images/blog/race-condition-golang/01-wrong-total.png)

Totalnya bukan 400.000, melainkan 142.621, 167.563, dan seterusnya. Selisihnya bukan sedikit — ratusan ribu increment hilang karena saling menimpa.

## Langkah 2 — Deteksi dengan `go test -race`

Jalankan test dengan race detector:

```bash
go test -race ./bad
```

Output-nya langsung menunjuk ke sumber masalah:

![Laporan race detector dengan WARNING: DATA RACE dan stack trace|Laporan race detector: WARNING: DATA RACE, lengkap dengan lokasi baca dan tulis.](https://is3.cloudhost.id/public-data/project-images/blog/race-condition-golang/02-race-warning.png)

Cara membaca laporannya:

- **`Read at ... by goroutine 9`** — goroutine 9 membaca alamat memori tersebut.
- **`Previous write at ... by goroutine 8`** — goroutine 8 menulis ke alamat yang sama tanpa sinkronisasi.
- **`race-demo/bad.(*Counter).Add()`** — lokasi kode penyebabnya, yaitu `counter.go:9`.
- **`Goroutine 8 (finished) created at ...`** — jejak siapa yang membuat goroutine tersebut.

Urutan `Read at` dan `Previous write at` bisa berbeda antar-run; yang penting adalah dua akses ke alamat yang sama tanpa sinkronisasi.

Di bagian bawah, test berubah menjadi gagal:

![Test gagal dengan got 261091, want 400000, dan race detected|Test gagal: got 261091, want 400000, dan race detected during execution of test.](https://is3.cloudhost.id/public-data/project-images/blog/race-condition-golang/03-race-fail.png)

Pesan `race detected during execution of test` penting: test tidak hanya gagal karena angka salah, tetapi karena race detector menemukan akses memori yang tidak aman. Ini membuat bug concurrency jauh lebih mudah dilacak daripada menunggu produksi.

> Race detector hanya melaporkan race yang benar-benar terjadi selama eksekusi. Test yang lulus dengan `-race` bukan bukti bebas race secara matematis — tetapi jauh lebih baik daripada tidak memeriksa sama sekali.

## Solusi 1 — `sync.Mutex`

Cara paling langsung adalah mengunci critical section:

```go
package mutex

import "sync"

type Counter struct {
	mu    sync.Mutex
	value int
}

func (c *Counter) Add(n int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.value += n
}

func (c *Counter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.value
}
```

Yang perlu diperhatikan:

- **Kunci harus mencakup seluruh read-modify-write.** Kalau `Lock()` hanya membungkus penulisan, race tetap ada.
- **`Value()` juga perlu lock.** Membaca tanpa lock saat ada penulisan tetap merupakan data race.
- **Jaga scope lock tetap kecil.** Jangan menahan lock saat melakukan I/O, memanggil API, atau operasi yang bisa lama.
- **Konsisten urutan lock** kalau ada lebih dari satu mutex, untuk menghindari deadlock.

Untuk kasus read-heavy, `sync.RWMutex` bisa dipakai: banyak reader boleh masuk bersamaan, tetapi writer tetap eksklusif.

## Solusi 2 — `sync/atomic`

Kalau yang dilindungi hanya satu nilai skalar, atomic operation lebih ringan:

```go
package atomic

import "sync/atomic"

type Counter struct {
	value atomic.Int64
}

func (c *Counter) Add(n int) {
	c.value.Add(int64(n))
}

func (c *Counter) Value() int {
	return int(c.value.Load())
}
```

`atomic.Int64` menjamin operasi `Add` dan `Load` tidak terpotong oleh goroutine lain. Tidak ada lock, tidak ada blocking, dan biasanya lebih cepat untuk counter atau flag sederhana.

Batasan penting: atomic hanya aman untuk **satu nilai**. Kalau kamu perlu menjaga invariant yang melibatkan beberapa field sekaligus — misalnya saldo dan riwayat transaksi harus konsisten — mutex lebih tepat.

## Solusi 3 — Channel dan satu pemilik data

Pendekatan ketiga adalah tidak berbagi memori sama sekali. Satu goroutine menjadi pemilik data, dan goroutine lain berkomunikasi lewat channel:

```go
package channel

type Counter struct {
	adds  chan int
	value chan int
}

func New() *Counter {
	c := &Counter{
		adds:  make(chan int),
		value: make(chan int),
	}
	go c.run()
	return c
}

func (c *Counter) run() {
	total := 0
	for {
		select {
		case n := <-c.adds:
			total += n
		case c.value <- total:
		}
	}
}

func (c *Counter) Add(n int) {
	c.adds <- n
}

func (c *Counter) Value() int {
	return <-c.value
}
```

Di sini `total` hanya diakses oleh goroutine `run()`. Tidak ada dua goroutine yang menyentuh variabel yang sama, jadi tidak ada data race.

Ini adalah penerapan prinsip Go: *don't communicate by sharing memory; share memory by communicating.* Cocok untuk worker pool, pipeline, atau saat satu komponen memang harus menjadi pemilik state. Konsekuensinya, semua operasi diserialisasi dan bisa lebih lambat daripada atomic untuk counter yang sangat panas.

## Semua perbaikan lulus `-race`

Test yang sama dijalankan untuk ketiga versi:

```bash
go test -race -v ./mutex ./atomic ./channel
```

![Mutex, atomic, dan channel lulus go test -race|Mutex, atomic, dan channel semuanya PASS di bawah race detector.](https://is3.cloudhost.id/public-data/project-images/blog/race-condition-golang/04-fixed-tests.png)

Ketiganya menghasilkan total 400.000 dan tidak memicu race detector. Pilihan di antara ketiganya bergantung pada bentuk state dan pola aksesnya, bukan pada mana yang paling populer.

## Contoh lain: concurrent map writes

Race condition tidak selalu berakhir dengan angka yang sedikit salah. Map di Go tidak aman untuk penulisan bersamaan:

```go
m := make(map[int]int)
var wg sync.WaitGroup

for i := 0; i < 100; i++ {
	wg.Add(1)
	go func(worker int) {
		defer wg.Done()
		for j := 0; j < 1000; j++ {
			m[worker*1000+j] = j
		}
	}(i)
}

wg.Wait()
fmt.Println("len:", len(m))
```

Hasilnya bukan error biasa, melainkan **fatal error** yang tidak bisa di-recover:

![Fatal error concurrent map writes, lalu versi mutex menghasilkan 100.000 entri|Concurrent map writes membuat runtime panic; versi dengan mutex menghasilkan 100.000 entri.](https://is3.cloudhost.id/public-data/project-images/blog/race-condition-golang/05-map-crash.png)

Perbaikannya bisa memakai mutex:

```go
var mu sync.Mutex

mu.Lock()
m[worker*1000+j] = j
mu.Unlock()
```

atau `sync.Map` kalau pola aksesnya sesuai — misalnya key ditulis sekali lalu dibaca berkali-kali, atau setiap goroutine bekerja pada key yang terpisah. `sync.Map` bukan pengganti umum `map`; untuk banyak kasus, mutex lebih mudah dipahami dan cukup cepat.

## Stress test

Satu kali lulus belum tentu cukup. Race condition sering muncul hanya pada interleaving tertentu. Jalankan test berulang kali:

```bash
go test -race -count=20 ./mutex ./atomic ./channel
```

![Stress test 20 iterasi per package tetap PASS|Stress test 20 iterasi per package: semuanya tetap PASS.](https://is3.cloudhost.id/public-data/project-images/blog/race-condition-golang/06-stress-test.png)

Strategi pengujian yang saya pakai:

- **`-race`** untuk mendeteksi akses memori yang tidak tersinkronisasi.
- **`-count=20`** atau lebih untuk mengulang test dan memperbesar peluang interleaving bermasalah.
- **`-cpu=1,2,4`** untuk mengubah jumlah `GOMAXPROCS` dan pola penjadwalan.
- **`GORACE=halt_on_error=1`** kalau ingin test langsung berhenti pada race pertama.
- **CI** harus menjalankan `go test -race ./...`; race detector membutuhkan cgo dan C toolchain (gcc).

Di production, jangan mengaktifkan `-race` untuk binary utama karena overhead-nya besar. Gunakan di test dan lingkungan staging.

## Race condition vs data race

Keduanya berkaitan, tetapi tidak identik:

- **Data race** adalah akses memori bersamaan tanpa sinkronisasi, dengan minimal satu penulisan. Ini yang dilaporkan `-race`.
- **Race condition** lebih luas: hasil bergantung pada timing. Bisa terjadi tanpa data race, misalnya pola *check-then-act* yang masing-masing langkahnya sudah dilindungi lock, tetapi keputusan di antaranya sudah basi.

Karena itu, `-race` yang bersih belum tentu berarti logika bisnis bebas race. Tetap pikirkan invariant dan urutan operasi.

## Checklist pencegahan

- [ ] Identifikasi semua state yang diakses lebih dari satu goroutine.
- [ ] Hindari shared mutable state kalau bisa — salin data atau gunakan satu pemilik.
- [ ] Lindungi read-modify-write dengan mutex, atomic, atau channel.
- [ ] Jangan menahan lock saat I/O atau operasi lambat.
- [ ] Gunakan `defer Unlock()` agar lock selalu dilepas, termasuk saat panic.
- [ ] Jangan menyalin nilai yang mengandung `sync.Mutex` atau `sync.WaitGroup`.
- [ ] Jalankan `go test -race ./...` di CI.
- [ ] Tambahkan `-count` dan variasi `-cpu` untuk test concurrency.
- [ ] Pahami perbedaan data race dan race condition pada logika bisnis.
- [ ] Dokumentasikan siapa pemilik data dan siapa yang boleh menulis.

Race condition tidak hilang hanya karena kode "kelihatan jalan". Ia menunggu momen yang tepat untuk muncul. Race detector dan test yang agresif adalah cara termurah untuk menemukannya sebelum pengguna menemukannya.
