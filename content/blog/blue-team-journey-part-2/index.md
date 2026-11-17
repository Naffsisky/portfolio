---
title: 'Blue Team Journey - Part 2: LDAP - Setup, Cara Kerja, dan Penggunaan'
date: '2026-11-17'
template: 'post'
draft: false
slug: 'blue-team-journey-part-2'
category: 'Cybersecurity'
tags:
  - 'LDAP'
  - 'OpenLDAP'
  - 'phpLDAPadmin'
  - 'Active Directory'
  - 'Blue Team'
  - 'Docker'
  - 'Cybersecurity'
description: 'Panduan lengkap LDAP untuk defender: konsep DIT, DN, bind, search, LDIF, TLS, ACL, integrasi aplikasi, LDAP injection, dan deteksi dari log, semuanya dipraktikkan dengan OpenLDAP di Docker.'
seoTitle: 'LDAP untuk Blue Team: Setup, Cara Kerja, dan Praktik'
seoDescription: 'Belajar LDAP dari nol: setup OpenLDAP dan phpLDAPadmin di Docker, bind dan search, LDIF, LDAPS, ACL, integrasi Python ldap3, LDAP injection, dan deteksi log.'
socialImage: 'https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/00-cover.png'
---

Di [Part 1](/blog/blue-team-journey-part-1) kita membahas networking: paket, port, DNS, TLS, dan cara membaca traffic. Sekarang kita naik satu lapisan ke tempat banyak keputusan identitas terjadi: **directory service**.

LDAP sering terasa membosankan sampai kita melihat alert yang menyebut `ldap_bind`, `invalidCredentials`, atau “banyak search ke directory”. Di titik itu, pemahaman LDAP berubah dari teori menjadi kemampuan investigasi. Siapa yang bind? Dari IP mana? User mana yang dicari? Berapa kali? Apakah berhasil?

Artikel ini adalah **Part 2** dari seri **Blue Team Journey**. LDAP adalah deep dive yang menjembatani networking dan Windows/Active Directory: port 389/636 sudah muncul di Phase 1, dan LDAP adalah salah satu protokol yang dipakai AD. Setelah part ini, seri kembali ke jalur roadmap dengan Windows Essentials.

Kita akan membangun lab LDAP lengkap di Docker: OpenLDAP, phpLDAPadmin, dan aplikasi Python yang melakukan bind dan search. Setiap konsep diberi praktik langsung, termasuk TLS, ACL, LDAP injection, dan deteksi dari log.

## Kenapa LDAP penting untuk Blue Team

Identity sering disebut “perimeter baru”. Di banyak organisasi, aplikasi tidak lagi menyimpan password sendiri; mereka memanggil directory service untuk memverifikasi user dan mengambil group. VPN, SSO, email, GitLab, Jenkins, Grafana, dan Linux SSSD bisa memakai LDAP.

Bagi defender, LDAP adalah sumber sinyal yang kaya:

- **Brute force dan password spraying** terlihat sebagai banyak bind gagal (`err=49`).
- **Enumeration** terlihat sebagai banyak search dengan filter wildcard atau scope luas.
- **LDAP injection** muncul saat input user masuk ke filter tanpa escaping.
- **Penyalahgunaan service account** terlihat dari pola bind dan search yang berbeda dari baseline.
- **Pergerakan lateral di Active Directory** sering melibatkan LDAP untuk membaca struktur domain.

LDAP juga jembatan menuju Active Directory. AD bukan sekadar LDAP; ia menggabungkan directory, Kerberos, DNS, dan policy. Tetapi LDAP adalah salah satu protokol utama yang dipakai untuk membaca dan mengelola AD. Memahami LDAP membuat AD jauh lebih mudah dipelajari.

## LDAP versus Active Directory

Perbedaan yang sering membingungkan:

| Aspek | LDAP | Active Directory |
|---|---|---|
| Jenis | Protokol akses directory | Directory service milik Microsoft |
| Port | 389 (LDAP), 636 (LDAPS) | 389/636 untuk LDAP, 88 untuk Kerberos, 53 untuk DNS |
| Autentikasi | Bind (simple/SASL) | Kerberos, NTLM, LDAP bind |
| Struktur | DIT berbasis DN | Domain, OU, forest, site |
| Fokus artikel | Protokol dan directory generik | Implementasi Microsoft dengan fitur tambahan |

Di lab ini kita memakai OpenLDAP, implementasi directory server open source. Konsep DN, objectClass, bind, search, dan filter yang dipelajari berlaku juga saat membaca AD.

## Directory Information Tree

LDAP menyimpan data dalam struktur hierarkis bernama **Directory Information Tree (DIT)**. Setiap node adalah **entry**, dan setiap entry punya:

- **DN (Distinguished Name)** — alamat lengkap entry, misalnya `uid=alice,ou=people,dc=example,dc=local`.
- **RDN (Relative Distinguished Name)** — komponen nama pada level itu, misalnya `uid=alice`.
- **Attributes** — pasangan nama-nilai, misalnya `cn: Alice Doe`, `mail: alice@example.local`.
- **ObjectClass** — jenis entry dan aturan schema yang berlaku.

Struktur lab:

```text
dc=example,dc=local
├── ou=people
│   ├── uid=alice
│   ├── uid=bob
│   ├── uid=carol
│   └── uid=dave
├── ou=groups
│   ├── cn=developers
│   ├── cn=finance
│   └── cn=vpn-users
└── cn=svc-ldap
```

`dc=example,dc=local` adalah **base DN**. Setiap search dimulai dari base tertentu dan menentukan **scope**:

- `base` — hanya entry itu sendiri.
- `one` — anak langsung.
- `sub` — seluruh subtree.

### ObjectClass dan schema

`objectClass` menentukan atribut wajib dan opsional. Contoh:

| ObjectClass | Fungsi | Atribut wajib |
|---|---|---|
| `top` | Root semua entry | `objectClass` |
| `person` | Data orang | `cn`, `sn` |
| `organizationalPerson` | Data organisasi | Turunan `person` |
| `inetOrgPerson` | User internet | Turunan `organizationalPerson` |
| `organizationalUnit` | Folder/OU | `ou` |
| `groupOfNames` | Group dengan member | `cn`, `member` |
| `organizationalRole` | Role atau service account | `cn` |
| `simpleSecurityObject` | Menambahkan `userPassword` | `userPassword` |

Entry user di lab memakai `inetOrgPerson`. Group memakai `groupOfNames`. Service account memakai kombinasi `organizationalRole` + `simpleSecurityObject`.

Schema menentukan tipe atribut dan aturan validasi. Kalau menambahkan atribut yang tidak diizinkan schema, server menolak dengan `objectClassViolation` atau `invalidAttributeSyntax`. Ini bukan gangguan; ini yang menjaga konsistensi directory.

## Operasi LDAP yang perlu dipahami

LDAP bukan database relasional. Ia dioptimalkan untuk **read** dan **search**, bukan transaksi kompleks. Operasi utamanya:

| Operasi | Fungsi | Contoh |
|---|---|---|
| `bind` | Autentikasi ke server | Bind sebagai admin, service account, atau user |
| `search` | Mencari entry | Cari user dengan `(uid=alice)` |
| `add` | Menambah entry | Tambah user atau group |
| `modify` | Mengubah atribut | Ganti title atau password |
| `delete` | Menghapus entry | Hapus user yang sudah keluar |
| `compare` | Membandingkan nilai atribut | Cek apakah attribute bernilai tertentu |
| `extended` | Operasi khusus | StartTLS, password modify |

### Bind

Bind adalah proses autentikasi. Ada beberapa jenis:

- **Anonymous bind** — tanpa DN dan password. Biasanya hanya boleh membaca root DSE atau schema.
- **Simple bind** — mengirim DN dan password. Password dikirim dalam koneksi; **wajib dilindungi TLS**.
- **SASL bind** — mekanisme seperti EXTERNAL (sertifikat client) atau GSSAPI (Kerberos).

Hasil bind punya kode:

| Kode | Arti | Relevansi |
|---:|---|---|
| `0` | Success | Bind berhasil |
| `32` | No such object | Base DN tidak ada atau tidak terlihat karena ACL |
| `49` | Invalid credentials | Password salah atau user tidak ada |
| `50` | Insufficient access | Bind berhasil, tetapi tidak boleh operasi itu |
| `65` | Object class violation | Schema tidak cocok |

Di log, `err=49` adalah teman sehari-hari defender. Satu `49` bisa berarti user salah ketik; ratusan `49` dalam satu menit bisa berarti brute force.

### Search

Search punya empat parameter penting:

1. **Base DN** — titik awal pencarian.
2. **Scope** — `base`, `one`, atau `sub`.
3. **Filter** — kondisi yang harus cocok.
4. **Attributes** — atribut yang ingin dikembalikan.

Contoh:

```bash
ldapsearch -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -b "ou=people,dc=example,dc=local" \
  "(&(objectClass=person)(uid=a*))" dn cn mail title
```

Artinya: mulai dari `ou=people`, telusuri subtree, cari person yang `uid`-nya diawali `a`, dan kembalikan DN, CN, mail, serta title.

Filter LDAP punya sintaks sendiri:

| Filter | Arti |
|---|---|
| `(uid=alice)` | Persis alice |
| `(uid=a*)` | Diawali a |
| `(&(objectClass=person)(uid=alice))` | AND |
| `(\|(uid=alice)(uid=bob))` | OR |
| `(!(uid=alice))` | NOT |
| `(mail=*@example.local)` | Wildcard pada mail |
| `(createTimestamp>=20261101000000Z)` | Perbandingan waktu |

## Lab: OpenLDAP di Docker

Lab terdiri dari tiga container di network terisolasi:

```bash
docker network create --subnet=172.29.0.0/24 ldap-lab
```

### 1. Sertifikat TLS

Buat CA lokal dan sertifikat server dengan SAN `ldap`, `localhost`, dan `127.0.0.1`:

```bash
mkdir -p certs && cd certs

openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/CN=LDAP Lab CA" -out ca.crt

openssl genrsa -out ldap.key 2048
openssl req -new -key ldap.key -subj "/CN=ldap" -out ldap.csr

printf "subjectAltName=DNS:ldap,DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n" > ext.cnf
openssl x509 -req -in ldap.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out ldap.crt -days 3650 -sha256 -extfile ext.cnf
```

### 2. Container OpenLDAP

```bash
docker run -d --name ldap \
  --network ldap-lab --ip 172.29.0.10 \
  -p 389:389 -p 636:636 \
  -e LDAP_ORGANISATION="Example Corp" \
  -e LDAP_DOMAIN="example.local" \
  -e LDAP_ADMIN_PASSWORD="AdminPass123!" \
  -e LDAP_CONFIG_PASSWORD="ConfigPass123!" \
  -e LDAP_TLS=true \
  -e LDAP_TLS_VERIFY_CLIENT=never \
  -v "$PWD/certs:/container/service/slapd/assets/certs" \
  osixia/openldap:1.5.0
```

Image ini membuat base DN `dc=example,dc=local`, admin `cn=admin,dc=example,dc=local`, dan mengaktifkan LDAPS di port 636. File `ldap.crt`, `ldap.key`, dan `ca.crt` dibaca dari direktori certs.

> Di produksi, jangan mount private key CA ke container LDAP. Cukup berikan `ldap.crt`, `ldap.key`, dan `ca.crt`; simpan `ca.key` di mesin offline atau secret manager. Pisahkan direktori sertifikat server dari kunci CA.

### 3. phpLDAPadmin

```bash
docker run -d --name phpldapadmin \
  --network ldap-lab --ip 172.29.0.20 \
  -p 8080:80 \
  -e PHPLDAPADMIN_LDAP_HOSTS=ldap \
  -e PHPLDAPADMIN_HTTPS=false \
  osixia/phpldapadmin:0.9.0
```

### 4. Container Python

```bash
docker run -d --name ldap-client \
  --network ldap-lab --ip 172.29.0.30 \
  -v "$PWD/python:/app" -w /app \
  python:3.12-slim sleep infinity

docker exec ldap-client pip install ldap3
docker exec ldap-client mkdir -p /certs
docker cp certs/ca.crt ldap-client:/certs/ca.crt
```

![Topologi lab LDAP|Browser ke phpLDAPadmin, aplikasi Python ke LDAPS, dan OpenLDAP sebagai pusat directory.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/01-lab-topology.png)

> Semua password di artikel ini adalah kredensial lab. Di produksi, gunakan secret manager, password acak, rotasi berkala, dan jangan pernah menaruh password di repository.

### 5. Membuat struktur directory

Simpan LDIF berikut sebagai `ldif/01-base.ldif` di host. Isinya membuat OU, tiga user, tiga group, dan satu service account:

```ldif
dn: ou=people,dc=example,dc=local
objectClass: organizationalUnit
ou: people

dn: ou=groups,dc=example,dc=local
objectClass: organizationalUnit
ou: groups

dn: uid=alice,ou=people,dc=example,dc=local
objectClass: inetOrgPerson
cn: Alice Doe
sn: Doe
givenName: Alice
uid: alice
mail: alice@example.local
title: Security Engineer
userPassword: {SSHA}6m5uSSlfKz0oBkdDltt83s+OdFfQ0hgq

dn: uid=bob,ou=people,dc=example,dc=local
objectClass: inetOrgPerson
cn: Bob Smith
sn: Smith
givenName: Bob
uid: bob
mail: bob@example.local
title: DevOps Engineer
userPassword: {SSHA}Ak6riWrg9q5o2E7x8TtEw3qxDv+ndadh

dn: uid=carol,ou=people,dc=example,dc=local
objectClass: inetOrgPerson
cn: Carol Lee
sn: Lee
givenName: Carol
uid: carol
mail: carol@example.local
title: Finance Analyst
userPassword: {SSHA}Lb6J++frQiFuXllUmrrTmnORTM4JFIjl

dn: cn=developers,ou=groups,dc=example,dc=local
objectClass: groupOfNames
cn: developers
description: Application developers
member: uid=alice,ou=people,dc=example,dc=local
member: uid=bob,ou=people,dc=example,dc=local

dn: cn=finance,ou=groups,dc=example,dc=local
objectClass: groupOfNames
cn: finance
description: Finance team
member: uid=carol,ou=people,dc=example,dc=local

dn: cn=vpn-users,ou=groups,dc=example,dc=local
objectClass: groupOfNames
cn: vpn-users
description: Users allowed to access the VPN
member: uid=alice,ou=people,dc=example,dc=local
member: uid=carol,ou=people,dc=example,dc=local

dn: cn=svc-ldap,dc=example,dc=local
objectClass: organizationalRole
objectClass: simpleSecurityObject
cn: svc-ldap
description: Read-only service account for application bind
userPassword: {SSHA}V/UEE1A+U87QmLN8AbwJettZpmHaaGLN
```

Copy ke container dan import:

```bash
docker cp ldif/01-base.ldif ldap:/tmp/01-base.ldif
docker exec ldap ldapadd -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -f /tmp/01-base.ldif
```

Cek hasilnya:

```bash
docker exec ldap ldapsearch -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -b "ou=people,dc=example,dc=local" "(objectClass=person)" dn cn mail
```

Kalau ingin memakai password berbeda, buat hash baru dengan `docker exec ldap slappasswd -s 'PasswordBaru'` lalu ganti nilai `userPassword` di LDIF. Jangan pernah menyimpan password plaintext di LDIF produksi.

## Melihat directory lewat phpLDAPadmin

Buka `http://localhost:8080`, klik **login**, lalu masuk dengan:

- **Login DN:** `cn=admin,dc=example,dc=local`
- **Password:** `AdminPass123!`

![phpLDAPadmin: tree dan entry user|Tree DIT di kiri, detail user Alice di kanan, termasuk objectClass dan password SSHA.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/02-phpldapadmin.png)

Yang bisa dilihat:

- **Tree** menunjukkan hierarki `dc=example,dc=local → ou=people → uid=alice`.
- **DN** di bagian atas adalah alamat unik entry.
- **objectClass** menunjukkan schema yang dipakai (`inetOrgPerson`).
- **Password** disimpan sebagai hash SSHA, bukan plaintext.

phpLDAPadmin berguna untuk eksplorasi dan laboratorium. Di produksi, UI seperti ini harus berada di belakang autentikasi, HTTPS, dan akses terbatas; jangan diekspos ke internet.

## Bind dan search dari command line

Masuk ke container LDAP:

```bash
docker exec -it ldap bash
```

### Anonymous bind

```bash
ldapwhoami -x -H ldap://localhost
ldapsearch -x -H ldap://localhost -b "dc=example,dc=local" "(uid=alice)"
```

![Anonymous bind tidak mendapat data|Anonymous bind diterima, tetapi search ke base DN gagal karena ACL menolak akses.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/03-anonymous.png)

`ldapwhoami` mengembalikan `dn:` kosong: anonymous. Search mengembalikan `result: 32 No such object`. Dari sudut client, directory tampak tidak ada. Ini efek ACL: anonymous memang boleh bind, tetapi tidak boleh membaca directory. Pesan `32` juga mengurangi information disclosure dibandingkan memberi tahu bahwa entry ada tetapi akses ditolak.

### Authenticated search

```bash
ldapsearch -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -b "ou=people,dc=example,dc=local" \
  "(&(objectClass=person)(uid=a*))" dn cn mail title
```

![Search dengan filter|Filter AND dan wildcard mengembalikan Alice beserta atribut yang diminta.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/04-search-auth.png)

Cari group yang memiliki Alice:

```bash
ldapsearch -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -b "ou=groups,dc=example,dc=local" \
  "(member=uid=alice,ou=people,dc=example,dc=local)" cn description
```

Hasilnya `developers` dan `vpn-users`. Inilah pola yang dipakai aplikasi untuk authorization: user diautentikasi lewat bind, lalu group-nya dibaca lewat search.

## LDIF: bahasa untuk mengelola entry

**LDIF (LDAP Data Interchange Format)** adalah format teks untuk add, modify, dan delete. Contoh menambah user:

```ldif
dn: uid=dave,ou=people,dc=example,dc=local
objectClass: inetOrgPerson
cn: Dave Brown
sn: Brown
givenName: Dave
uid: dave
mail: dave@example.local
title: Junior Analyst
userPassword: {SSHA}...
```

Simpan sebagai `ldif/03-add-dave.ldif`, copy ke container, lalu tambahkan:

```bash
docker cp ldif/03-add-dave.ldif ldap:/tmp/03-add-dave.ldif
docker exec ldap ldapadd -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -f /tmp/03-add-dave.ldif
```

![Menambah user dengan ldapadd|Entry Dave dibuat, lalu dibaca kembali lewat service account.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/05-ldapadd.png)

Ubah title, tambah description, dan reset password:

```ldif
dn: uid=dave,ou=people,dc=example,dc=local
changetype: modify
replace: title
title: SOC Analyst
-
replace: userPassword
userPassword: {SSHA}...
-
add: description
description: Promoted to SOC Analyst
```

```bash
docker cp ldif/04-modify-dave.ldif ldap:/tmp/04-modify-dave.ldif
docker exec ldap ldapmodify -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -f /tmp/04-modify-dave.ldif
```

![Modify dan reset password|Title berubah menjadi SOC Analyst dan bind dengan password baru berhasil.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/06-ldapmodify.png)

Hapus entry:

```bash
ldapdelete -x -H ldap://localhost \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  "uid=dave,ou=people,dc=example,dc=local"
```

### Password hashing

Jangan menyimpan password plaintext. Di lab, hash dibuat dengan:

```bash
slappasswd -h '{SSHA}' -s 'DavePass123!'
```

Hasilnya `{SSHA}...`, yaitu salted SHA-1. SSHA lebih baik daripada plaintext, tetapi bukan algoritma modern. Di produksi, gunakan mekanisme hashing yang didukung platform (misalnya Argon2 bila tersedia), password policy yang kuat, dan pertimbangkan SASL/Kerberos untuk autentikasi yang lebih aman.

## TLS dan LDAPS

Simple bind mengirim DN dan password. Tanpa TLS, password bisa dilihat oleh siapa pun yang bisa menangkap traffic. Karena itu, LDAP di port 389 harus dilindungi dengan **StartTLS** atau diganti **LDAPS** di port 636.

Lab ini memakai LDAPS dengan CA lokal. Verifikasi:

```bash
LDAPTLS_CACERT=/container/service/slapd/assets/certs/ca.crt \
  ldapsearch -x -H ldaps://localhost:636 \
  -D "cn=admin,dc=example,dc=local" -w "AdminPass123!" \
  -b "dc=example,dc=local" -s base dn o
```

![LDAPS dengan verifikasi CA|Koneksi ke port 636 berhasil karena sertifikat server diverifikasi dengan CA lab.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/07-ldaps.png)

Di produksi:

- Gunakan sertifikat dari CA tepercaya, bukan self-signed.
- Jangan memakai `LDAPTLS_REQCERT=never`; itu mematikan verifikasi sertifikat.
- Matikan atau batasi port 389; jika tetap dipakai, paksa StartTLS.
- Gunakan TLS 1.2+ dan cipher suite yang kuat.
- Pantau certificate expiry dan handshake failure.

## ACL dan least privilege

Secara default, OpenLDAP di lab ini membatasi akses:

- Anonymous hanya boleh melakukan bind.
- User hanya bisa membaca entry dirinya sendiri.
- Admin bisa menulis.
- Service account belum bisa membaca apa pun.

Ini bagus, tetapi aplikasi butuh service account yang bisa membaca user dan group. Tambahkan ACL:

```ldif
dn: olcDatabase={1}mdb,cn=config
changetype: modify
delete: olcAccess
-
add: olcAccess
olcAccess: {0}to * by dn.exact=gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth manage by * break
olcAccess: {1}to attrs=userPassword,shadowLastChange by self write by dn="cn=admin,dc=example,dc=local" write by anonymous auth by * none
olcAccess: {2}to * by dn.exact="cn=svc-ldap,dc=example,dc=local" read by * break
olcAccess: {3}to * by self read by dn="cn=admin,dc=example,dc=local" write by * none
```

Simpan sebagai `ldif/02-acl.ldif`, copy ke container, lalu terapkan dengan SASL EXTERNAL:

```bash
docker cp ldif/02-acl.ldif ldap:/tmp/02-acl.ldif
docker exec ldap ldapmodify -Y EXTERNAL -H ldapi:/// -f /tmp/02-acl.ldif
```

Urutan ACL penting. Rule `{2}` memberi service account akses **read**, lalu `by * break` melanjutkan evaluasi untuk entity lain. Rule `{1}` tetap melindungi `userPassword`: service account bisa membaca profil user, tetapi tidak bisa membaca hash password.

Buktinya:

![Service account read-only|svc-ldap bisa membaca profil, tidak melihat userPassword, dan ditolak saat mencoba menulis.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/09-acl.png)

Praktik terbaik:

- Aplikasi memakai service account **read-only**, bukan admin.
- Satu service account per aplikasi; jangan berbagi kredensial.
- Batasi ACL per OU atau atribut.
- Rotasi password service account dan simpan di secret manager.
- Audit bind dan search yang dilakukan service account.

## Integrasi aplikasi dengan Python

Alur autentikasi yang umum:

```text
1. Service account bind  → cari DN user berdasarkan uid
2. User bind             → verifikasi password user
3. Service account search → ambil group untuk authorization
```

Contoh dengan `ldap3`:

```python
import ssl
from ldap3 import Server, Connection, Tls
from ldap3.core.exceptions import LDAPBindError

LDAP_HOST = "ldap"
BASE_DN = "dc=example,dc=local"
PEOPLE_DN = f"ou=people,{BASE_DN}"
GROUPS_DN = f"ou=groups,{BASE_DN}"

tls = Tls(validate=ssl.CERT_REQUIRED, ca_certs_file="/certs/ca.crt")
server = Server(LDAP_HOST, use_ssl=True, port=636, tls=tls)

svc = Connection(
    server,
    user=f"cn=svc-ldap,{BASE_DN}",
    password="SvcPass123!",
    auto_bind=True,
)
svc.search(PEOPLE_DN, "(uid=alice)", attributes=["cn", "mail", "title"])
entry = svc.entries[0]
user_dn = entry.entry_dn
svc.search(GROUPS_DN, f"(member={user_dn})", attributes=["cn"])
groups = [g.cn.value for g in svc.entries]
svc.unbind()

try:
    user = Connection(server, user=user_dn, password="AlicePass123!", auto_bind=True)
    print("bind OK:", user.extend.standard.who_am_i())
    print("groups:", groups)
    user.unbind()
except LDAPBindError:
    print("invalid credentials")
```

![Autentikasi LDAP dari Python|Service bind, search user, user bind, dan group lookup berhasil lewat LDAPS.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/08-python-auth.png)

Mengapa tidak langsung bind sebagai admin? Karena aplikasi tidak butuh hak tulis. Service account read-only mengurangi dampak jika aplikasi disusupi. Password user hanya dipakai untuk bind dan tidak disimpan.

Pola ini dipakai banyak aplikasi: Grafana LDAP, GitLab, Jenkins, VPN, Linux SSSD, dan layanan internal lainnya. Detail konfigurasinya berbeda, tetapi alurnya sama: cari DN, bind user, baca group.

## LDAP injection

LDAP injection terjadi saat input user dimasukkan langsung ke filter. Contoh rentan:

```python
uid = sys.argv[1]
filter_vulnerable = f"(&(objectClass=person)(uid={uid}))"
conn.search(PEOPLE_DN, filter_vulnerable)
```

Jika user mengirim `*`, filter menjadi `(uid=*)` dan mengembalikan **semua** user. Jika aplikasi memakai filter ini untuk login, penyerang bisa melewati autentikasi atau melakukan enumerasi.

Demo:

![LDAP injection|Input * mengembalikan tiga user pada filter rentan; escaping membuatnya tidak cocok dengan apa pun.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/10-injection.png)

Perbaikannya:

```python
from ldap3.utils.conv import escape_filter_chars

safe = f"(&(objectClass=person)(uid={escape_filter_chars(uid)}))"
```

`escape_filter_chars` mengubah `*`, `(`, `)`, `\`, dan karakter khusus lain menjadi escape sequence. Prinsip lainnya:

- Validasi input dengan allowlist (misalnya hanya huruf, angka, titik, dan garis bawah).
- Jangan menyusun filter dari input mentah.
- Gunakan service account read-only agar dampak injeksi terbatas.
- Catat input yang mengandung metakarakter filter.
- Terapkan rate limit dan monitoring pada endpoint autentikasi.

## Sisi defender: log, deteksi, dan hardening

OpenLDAP bisa mencatat bind dan search. Contoh log setelah tiga percobaan password salah dan satu search service account:

![Log bind dan search OpenLDAP|err=49 menandai kredensial salah; bind sukses dan search service account terlihat jelas.](https://is3.cloudhost.id/public-data/project-images/blog/blue-team-journey-part-2/11-logs.png)

Skenario deteksi:

| Skenario | Pola log | Tindakan |
|---|---|---|
| Brute force | Banyak `err=49` untuk satu user/IP dalam waktu singkat | Blokir/rate limit, cek apakah ada `err=0` setelahnya |
| Password spraying | Sedikit percobaan untuk banyak user dari satu IP | Kolerasi dengan geo/IP reputation, cek user yang berhasil |
| Enumeration | Banyak `SRCH` dengan scope luas atau filter wildcard | Baseline volume, alert jika di luar pola normal |
| LDAP injection | Filter mengandung `*`, `)`, `(`, atau escape aneh | Cek log aplikasi, validasi input, review kode |
| Service account anomaly | Bind/search di luar jam kerja atau scope normal | Bandingkan dengan baseline per aplikasi |
| LDAP relay (AD) | Bind tanpa TLS, NTLM relay | Wajibkan LDAP signing dan channel binding |

Telemetri yang perlu dikumpulkan:

- Log OpenLDAP/AD dengan level yang memadai.
- Network flow ke port 389/636: source, destination, volume, waktu.
- Log aplikasi yang melakukan bind (jangan log password).
- Log endpoint untuk proses yang membuka koneksi LDAP.
- SIEM correlation: user, IP, service account, result code, search base.

Hardening checklist:

- [ ] TLS untuk semua bind; jangan simple bind di 389 tanpa StartTLS.
- [ ] Matikan anonymous bind jika tidak dibutuhkan.
- [ ] ACL least privilege; service account read-only.
- [ ] Password policy dan rotasi kredensial.
- [ ] Batasi akses port 389/636 dengan firewall.
- [ ] Patch OpenLDAP dan aplikasi LDAP.
- [ ] Monitor `err=49`, volume search, dan pola service account.
- [ ] Di AD: LDAP signing, channel binding, protected users, tiered admin.

## Membersihkan lab

```bash
docker rm -f ldap phpldapadmin ldap-client
docker network rm ldap-lab
```

Sertifikat, LDIF, dan script bisa disimpan untuk latihan ulang. Jangan pernah memakai kredensial lab di lingkungan nyata.

## Checklist praktik

- [ ] Bisa menjelaskan DIT, DN, RDN, dan objectClass.
- [ ] Bisa melakukan anonymous bind dan menjelaskan hasilnya.
- [ ] Bisa melakukan bind sebagai admin dan service account.
- [ ] Bisa memakai filter AND, OR, wildcard, dan scope yang tepat.
- [ ] Bisa menambah, mengubah, dan menghapus entry dengan LDIF.
- [ ] Bisa mengaktifkan LDAPS dan memverifikasi sertifikat dengan CA.
- [ ] Bisa menulis ACL read-only untuk service account.
- [ ] Bisa mengintegrasikan bind dan search ke aplikasi Python.
- [ ] Bisa menjelaskan dan mencegah LDAP injection.
- [ ] Bisa membaca log `err=49` dan pola enumeration.

## Kesimpulan

LDAP adalah protokol untuk membaca dan mengelola directory identitas. Kekuatannya ada pada struktur hierarkis, filter yang fleksibel, dan integrasi yang luas. Risikonya juga jelas: bind yang tidak dilindungi TLS, ACL yang terlalu longgar, service account dengan hak berlebih, dan input yang masuk ke filter tanpa escaping.

Di part ini kita sudah mempraktikkan seluruh alurnya: membangun OpenLDAP dan phpLDAPadmin di Docker, membuat CA dan LDAPS, mengelola user dan group dengan LDIF, membatasi service account lewat ACL, melakukan bind dan search dari Python, mendemonstrasikan LDAP injection, dan membaca log `err=49` dari sisi defender.

Part berikutnya akan masuk ke **Windows Essentials dan Active Directory**: event log, proses, service, registry, serta bagaimana LDAP dan Kerberos dipakai di lingkungan AD. Setelah memahami LDAP generik, konsep AD akan terasa jauh lebih masuk akal.
