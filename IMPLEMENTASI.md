# Langkah Implementasi Lengkap

## 1. Tentukan data acara

Siapkan data final berikut sebelum mengubah kode:

- nama lengkap dan nama panggilan;
- usia yang dirayakan;
- tanggal dan waktu dengan zona waktu;
- lokasi, alamat, dan tautan Google Maps;
- foto hero, foto profil, dan galeri;
- teks pembuka, cerita singkat, dress code, dan penutup;
- apakah musik, hadiah digital, serta upload foto tamu akan diaktifkan;
- daftar penerima undangan dan token tamu bila diperlukan.

Gunakan satu sumber data, yaitu sheet `Config`. Hindari menulis tanggal yang berbeda di beberapa bagian frontend.

---

## 2. Membuat database Google Sheets

1. Buat Google Spreadsheet baru, misalnya **Database Undangan Ulang Tahun**.
2. Buka **Extensions → Apps Script**.
3. Pada editor Apps Script:
   - buat file `Code.gs`;
   - buat file `Setup.gs`;
   - buat file `Security.gs`;
   - buat file `DataService.gs`;
   - buat file `DriveService.gs`;
   - buat file `Logging.gs`;
   - aktifkan tampilan manifest dan ganti `appsscript.json`.
4. Salin isi file yang sama dari folder `apps-script/`.
5. Simpan proyek.
6. Pada daftar fungsi, pilih `setupProject`, lalu klik **Run**.
7. Setujui permission Google Sheets dan Google Drive.
8. Kembali ke Google Sheet dan muat ulang halaman.

Fungsi setup akan membuat:

- sheet `Config`;
- sheet `Wishes`;
- sheet `RSVP`;
- sheet `Gallery`;
- sheet `Uploads`;
- sheet `Logs`;
- folder Drive utama;
- subfolder `Published Gallery`;
- subfolder `Guest Uploads - Pending`;
- Script Properties untuk ID database, ID folder, access key, batas ukuran, dan rate limit.

Setelah selesai, dialog menampilkan `PUBLIC_ACCESS_KEY`. Simpan nilai tersebut.

---

## 3. Mengisi konfigurasi acara

Buka sheet `Config`. Setiap baris terdiri atas:

| Kolom | Fungsi |
|---|---|
| `Key` | Nama konfigurasi yang dibaca frontend |
| `Value` | Nilai konfigurasi |
| `Type` | `string`, `number`, `boolean`, atau `json` |
| `Public` | `TRUE` bila boleh dikirim ke browser |
| `UpdatedAt` | Tanggal pembaruan |

Konfigurasi inti yang wajib diperbarui:

```text
celebrantName
nickname
age
eventStart
eventEnd
timezone
dateLabel
timeLabel
venue
address
mapUrl
greeting
storyTitle
storyText
dressCode
hostName
closingMessage
heroImage
portraitImage
```

Format waktu yang disarankan:

```text
2026-08-23T15:30:00+07:00
```

Gunakan offset yang sesuai:

- WIB: `+07:00`
- WITA: `+08:00`
- WIT: `+09:00`

Isi `timezone` dengan zona IANA, misalnya `Asia/Jakarta`, `Asia/Makassar`, atau `Asia/Jayapura`.

### Tema

Warna dapat diubah tanpa menyentuh CSS:

```text
themePrimary   #8b5cf6
themeSecondary #ec4899
themeAccent    #f59e0b
```

### Musik

1. Letakkan MP3 pada GitHub di `frontend/assets/audio/`, atau gunakan URL file yang dapat diakses publik.
2. Set:

```text
musicEnabled TRUE
musicUrl     ./assets/audio/birthday-song.mp3
```

Jangan memakai tautan halaman preview Google Drive sebagai `musicUrl`.

### Hadiah digital

Aktifkan bila benar-benar diperlukan:

```text
giftEnabled       TRUE
giftBank          Nama Bank
giftAccountName   Nama Pemilik
giftAccountNumber 1234567890
```

Data rekening akan terlihat oleh siapa pun yang membuka halaman.

---

## 4. Menyiapkan media Google Drive

### Foto hero dan profil

Untuk performa terbaik, foto hero dan profil sebaiknya disimpan langsung di repository GitHub:

```text
frontend/assets/images/hero.webp
frontend/assets/images/portrait.webp
```

Lalu isi:

```text
heroImage     ./assets/images/hero.webp
portraitImage ./assets/images/portrait.webp
```

Rekomendasi ukuran:

- hero: 1200 × 1600 px, WebP, 150–400 KB;
- profil: 800 × 800 px, WebP, 80–250 KB;
- galeri: sisi panjang 1600 px, 100–400 KB per foto.

### Galeri melalui Drive

Terdapat dua pilihan:

**A. Upload dari tamu**

1. Tamu mengirim foto melalui form `Titip Foto`.
2. Foto masuk ke folder `Guest Uploads - Pending` dan sheet `Uploads`.
3. Administrator memilih satu baris pada sheet `Uploads`.
4. Klik **Birthday App → Setujui Upload pada Baris Aktif**.
5. File dipindahkan ke folder publik dan ditambahkan ke sheet `Gallery`.

**B. Tambah manual**

1. Upload foto ke folder `Published Gallery`.
2. Ubah akses file menjadi **Anyone with the link – Viewer**.
3. Salin File ID dari URL Drive.
4. Tambahkan baris pada sheet `Gallery`.
5. Gunakan URL:

```text
https://drive.google.com/uc?export=view&id=FILE_ID
```

Thumbnail:

```text
https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200
```

Set `Active` menjadi `TRUE`.

---

## 5. Deploy Apps Script sebagai API

1. Pada editor Apps Script, klik **Deploy → New deployment**.
2. Pilih **Web app**.
3. Isi deskripsi deployment.
4. Pilih:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Klik **Deploy**.
6. Salin URL yang berakhir `/exec`.
7. Uji di browser:

```text
WEB_APP_URL?action=health
```

Respons yang benar menyerupai:

```json
{"ok":true,"message":"Birthday API aktif."}
```

Uji konfigurasi:

```text
WEB_APP_URL?action=config&key=PUBLIC_ACCESS_KEY
```

Setiap perubahan kode Apps Script memerlukan deployment versi baru melalui **Manage deployments → Edit → New version**.

---

## 6. Menghubungkan frontend ke Apps Script

Buka `frontend/js/config.js`, lalu ubah:

```js
webAppUrl: "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE",
publicAccessKey: "birthday-demo-2026",
```

menjadi:

```js
webAppUrl: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
publicAccessKey: "KEY_DARI_SETUP_PROJECT",
```

Jangan menambahkan slash setelah `/exec`.

---

## 7. Mengganti media lokal

Ganti file placeholder pada:

```text
frontend/assets/images/hero.svg
frontend/assets/images/portrait.svg
frontend/assets/images/gallery-1.svg
frontend/assets/images/gallery-2.svg
frontend/assets/images/gallery-3.svg
frontend/assets/images/gallery-4.svg
```

Anda dapat menggunakan ekstensi WebP/JPG dan mengubah URL di sheet `Config` atau HTML.

Perbarui metadata pada `frontend/index.html`:

- `<title>`;
- `meta description`;
- `og:title`;
- `og:description`;
- `og:image`.

Untuk preview WhatsApp, `og:image` harus berupa URL absolut setelah domain GitHub Pages diketahui.

---

## 8. Uji lokal

Jangan membuka `index.html` langsung dengan protokol `file://`, karena JavaScript module dapat diblokir browser.

Jalankan:

```bash
python -m http.server 8080 --directory frontend
```

Buka:

```text
http://localhost:8080/?to=Nama%20Tamu&token=TAMU-001
```

Periksa:

- cover dapat dibuka;
- halaman responsif pada lebar 320, 375, 768, 1024, dan 1440 px;
- countdown sesuai zona waktu;
- link kalender benar;
- link Maps benar;
- RSVP masuk ke sheet;
- ucapan masuk dengan status `PENDING`;
- ucapan muncul setelah disetujui;
- upload masuk ke Drive dan tidak langsung publik;
- foto muncul setelah disetujui;
- kegagalan Apps Script tidak memblokir tampilan undangan.

---

## 9. Deploy GitHub Pages

### Menggunakan workflow bawaan

1. Buat repository GitHub baru.
2. Upload seluruh isi folder proyek ke repository.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **GitHub Actions**.
5. Push ke branch `main`.
6. Workflow `.github/workflows/deploy-pages.yml` akan mempublikasikan folder `frontend/`.

URL biasanya:

```text
https://USERNAME.github.io/NAMA-REPOSITORY/
```

### Personalisasi link

```text
https://USERNAME.github.io/NAMA-REPOSITORY/?to=Ibu%20Maria
```

Untuk banyak tamu, buat kolom URL di Google Sheets:

```excel
="https://USERNAME.github.io/NAMA-REPOSITORY/?to="&ENCODEURL(A2)&"&token="&ENCODEURL(B2)
```

---

## 10. Moderasi operasional

### Ucapan

1. Buka sheet `Wishes`.
2. Periksa nama dan isi ucapan.
3. Pilih satu sel pada baris yang akan diproses.
4. Gunakan menu **Birthday App**.
5. Pilih setujui atau tolak.

### Upload foto

1. Buka sheet `Uploads`.
2. Buka URL internal untuk meninjau file.
3. Pilih baris.
4. Setujui hanya file yang relevan dan aman.
5. File yang disetujui menjadi publik melalui tautan.

### RSVP

Gunakan filter atau pivot table pada sheet `RSVP` untuk menghitung:

- jumlah tamu hadir;
- jumlah tamu tidak hadir;
- jumlah orang berdasarkan `GuestCount`;
- catatan khusus.

---

## 11. Backup

Sebelum acara:

1. Download Spreadsheet sebagai XLSX.
2. Download folder Drive sebagai ZIP bila dibutuhkan.
3. Simpan salinan repository GitHub.
4. Catat deployment URL dan Script Properties.

Setelah acara, tentukan kebijakan retensi. Hapus data yang tidak lagi dibutuhkan, khususnya nama tamu, RSVP, dan foto unggahan.

## Dashboard kustomisasi

Dashboard berada pada Apps Script, bukan menyimpan kredensial admin di GitHub Pages.

- URL langsung: `URL_APPS_SCRIPT/exec?page=dashboard`
- URL perantara GitHub Pages: `https://USERNAME.github.io/REPOSITORY/dashboard.html`
- Password dibuat saat pertama kali menjalankan `setupProject()`.
- Reset password melalui menu **Birthday App > Reset Password Dashboard**.

Dashboard menyediakan pengeditan `Config`, ringkasan RSVP/ucapan/galeri, moderasi ucapan, dan moderasi upload foto.

## Template spreadsheet siap pakai

Gunakan `Template-Google-Sheets-Undangan-Kania.xlsx`:

1. Upload ke Google Drive.
2. Klik kanan dan buka dengan Google Sheets.
3. Pastikan sheet `Config`, `Wishes`, `RSVP`, `Gallery`, `Uploads`, dan `Logs` tetap menggunakan nama tersebut.
4. Buka Extensions > Apps Script, salin kode backend, lalu jalankan `setupProject()`.

Nilai awal jam acara adalah 15.00–18.00 WITA dan usia 0 karena kedua data belum diberikan. Usia 0 menyebabkan label usia disembunyikan pada frontend.
