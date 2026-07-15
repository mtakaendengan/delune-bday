# Undangan Ulang Tahun Digital

Starter kit untuk membuat undangan ulang tahun digital dengan:

- **GitHub Pages** sebagai hosting frontend statis;
- **Google Apps Script** sebagai API;
- **Google Sheets** untuk konfigurasi, RSVP, ucapan, moderasi, dan log;
- **Google Drive** untuk galeri dan unggahan foto tamu.

Layout mempertahankan pola umum template referensi: cover pembuka, panel foto tetap pada desktop, konten satu kolom pada ponsel, kartu berujung membulat, section bergelombang, navigasi bawah, galeri, RSVP, ucapan, dan musik. Implementasinya dibuat ulang tanpa ketergantungan proses build.

## Struktur proyek

```text
undangan-ulang-tahun-digital/
├── frontend/                  # Dipublikasikan ke GitHub Pages
│   ├── index.html
│   ├── css/styles.css
│   ├── js/config.js
│   ├── js/api.js
│   ├── js/app.js
│   └── assets/
├── apps-script/               # Disalin ke editor Google Apps Script
├── sheets-template/           # Referensi struktur sheet
├── .github/workflows/         # Deployment otomatis GitHub Pages
├── IMPLEMENTASI.md            # Langkah implementasi lengkap
├── SHEET_SCHEMA.md            # Penjelasan tabel Google Sheets
├── SECURITY.md                # Catatan keamanan dan privasi
└── DEPLOYMENT_CHECKLIST.md     # Checklist sebelum undangan dibagikan
```

## Uji cepat tanpa backend

1. Buka terminal pada folder proyek.
2. Jalankan server lokal:

   ```bash
   python -m http.server 8080 --directory frontend
   ```

3. Buka `http://localhost:8080/?to=Nama%20Tamu`.

Frontend tetap tampil menggunakan konfigurasi fallback walaupun Apps Script belum dihubungkan.

## Alur implementasi ringkas

1. Siapkan Google Sheet kosong.
2. Buka **Extensions → Apps Script**.
3. Salin seluruh file `.gs` dan `appsscript.json` dari folder `apps-script/`.
4. Jalankan `setupProject()` dan berikan izin.
5. Salin `PUBLIC_ACCESS_KEY` yang ditampilkan.
6. Deploy Apps Script sebagai **Web App**, execute as **Me**, access **Anyone**.
7. Isi URL `/exec` dan access key ke `frontend/js/config.js`.
8. Isi konten acara di sheet `Config`.
9. Push folder proyek ke GitHub.
10. Aktifkan GitHub Pages melalui workflow yang disediakan.

Instruksi lengkap tersedia pada [IMPLEMENTASI.md](./IMPLEMENTASI.md).

## Personalisasi tautan tamu

```text
https://username.github.io/nama-repo/?to=Bapak%20Andi
```

Tautan dengan token opsional:

```text
https://username.github.io/nama-repo/?to=Bapak%20Andi&token=TAMU-001
```

`token` dapat dipakai untuk identifikasi RSVP dan pembatasan spam ringan. Token ini tetap terlihat oleh penerima tautan dan bukan secret.

## Moderasi

- Ucapan baru masuk ke sheet `Wishes` dengan status `PENDING`.
- Pilih baris ucapan lalu gunakan menu **Birthday App → Setujui Ucapan pada Baris Aktif**.
- Foto tamu masuk ke sheet `Uploads` dan folder Drive privat.
- Pilih baris upload lalu gunakan menu **Birthday App → Setujui Upload pada Baris Aktif**.
- Setelah disetujui, file dipindahkan ke folder galeri, dibuka untuk siapa saja yang memiliki tautan, dan otomatis ditambahkan ke sheet `Gallery`.

## Catatan penting

- Jangan menaruh password, credential, atau API key rahasia di frontend.
- `PUBLIC_ACCESS_KEY` hanya identifier publik untuk memisahkan aplikasi, bukan pengamanan rahasia.
- Google Drive bukan CDN. Kompres foto sebelum dipublikasikan.
- Gunakan musik yang memiliki izin penggunaan.
- Untuk undangan dengan trafik tinggi, pertimbangkan Cloudflare Workers, Firebase, atau backend lain yang memiliki kontrol CORS dan rate limiting lebih kuat.

## Dashboard kustomisasi

Versi ini menyediakan dashboard yang dijalankan langsung oleh Apps Script agar operasi admin tidak bergantung pada CORS GitHub Pages.

1. Jalankan `setupProject()` dari Apps Script. Pada setup pertama akan ditampilkan password admin acak.
2. Deploy sebagai Web App.
3. Buka `URL_WEB_APP/exec?page=dashboard`, atau buka `dashboard.html` pada situs GitHub Pages setelah `webAppUrl` diisi.
4. Dashboard dapat mengubah seluruh baris `Config`, melihat statistik, menyetujui/menolak ucapan, dan menyetujui/menolak foto tamu.
5. Jika password terlupa, gunakan menu **Birthday App > Reset Password Dashboard** pada Google Sheets.

Token dashboard hanya disimpan pada `sessionStorage` browser dan berlaku selama empat jam. Password disimpan di Script Properties dalam bentuk hash dan salt, bukan teks biasa.

## Dua metode GitHub Pages

- **Disarankan — GitHub Actions:** workflow mengunggah folder `frontend` sebagai akar situs, sehingga `frontend/index.html` menjadi halaman utama URL repository.
- **Deploy from branch:** file `index.html` di akar repository akan mengarahkan pengunjung ke folder `frontend`. Untuk URL tanpa `/frontend/`, gunakan metode GitHub Actions.
