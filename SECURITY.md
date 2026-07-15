# Keamanan dan Privasi

## Batas desain

Frontend GitHub Pages bersifat publik. Semua nilai di `frontend/js/config.js`, query string, HTML, CSS, dan JavaScript dapat dibaca siapa pun.

`PUBLIC_ACCESS_KEY` bukan secret. Fungsinya hanya sebagai identifier aplikasi dan penghalang dasar terhadap request acak. Keamanan utama tetap bergantung pada:

- validasi server;
- whitelist action;
- batas ukuran input;
- moderasi;
- rate limiting;
- permission Drive;
- minimisasi data.

## Praktik yang diterapkan

- semua input dibatasi panjangnya;
- HTML tag dan karakter kontrol dibuang;
- nilai yang dapat menjadi formula Google Sheets dinetralkan;
- action API menggunakan allowlist;
- foto dibatasi JPG, PNG, atau WebP maksimal 3 MB;
- upload tamu bersifat privat sampai disetujui;
- ucapan tidak langsung tampil kecuali auto approval diaktifkan;
- operasi append memakai `LockService`;
- GET memiliki fallback JSONP agar kompatibel dengan GitHub Pages;
- frontend meng-escape ucapan sebelum dirender.

## Keterbatasan Apps Script

Apps Script bukan API gateway penuh. Kontrol header CORS, status HTTP, IP client, dan rate limiting bersifat terbatas. `CacheService` hanya memberikan pembatasan ringan berdasarkan token/nama, bukan proteksi kuat terhadap serangan terdistribusi.

Untuk trafik besar atau data sensitif, gunakan backend dengan:

- autentikasi;
- database terkelola;
- CAPTCHA/Turnstile;
- WAF dan rate limiting per-IP;
- observability yang lebih lengkap.

## Privasi

Sebelum membagikan undangan:

1. Tambahkan pemberitahuan bahwa nama, RSVP, ucapan, dan foto akan disimpan.
2. Jelaskan bahwa foto yang disetujui akan menjadi publik melalui tautan.
3. Tentukan siapa yang dapat mengakses Google Sheet dan folder Drive.
4. Batasi editor Spreadsheet hanya kepada pengelola.
5. Hapus data setelah masa retensi selesai.
6. Jangan meminta data identitas yang tidak dibutuhkan.

## Musik, foto, dan hak cipta

Gunakan hanya media yang:

- merupakan milik sendiri;
- memiliki izin pemilik;
- atau memiliki lisensi yang sesuai.
