# Checklist Deployment

## Konten

- [ ] Nama, usia, tanggal, jam, dan zona waktu sudah benar.
- [ ] Lokasi dan tautan Maps telah diuji.
- [ ] Tidak ada placeholder pada gambar atau teks.
- [ ] Metadata Open Graph menggunakan nama dan gambar final.
- [ ] Rekening hadiah, bila aktif, telah diverifikasi.
- [ ] Musik memiliki izin penggunaan.

## Apps Script

- [ ] `setupProject()` berhasil dijalankan.
- [ ] `PUBLIC_ACCESS_KEY` sama dengan frontend.
- [ ] Web App dideploy sebagai `Execute as Me` dan `Anyone`.
- [ ] URL yang digunakan berakhir `/exec`.
- [ ] Endpoint `health`, `config`, `wishes`, dan `gallery` berhasil diuji.
- [ ] Versi deployment diperbarui setelah perubahan kode.

## Google Sheets dan Drive

- [ ] Akses Spreadsheet terbatas kepada pengelola.
- [ ] Folder upload pending tidak publik.
- [ ] Hanya file galeri yang disetujui yang publik.
- [ ] Ucapan default berstatus `PENDING`.
- [ ] Sheet `Logs` tidak berisi data rahasia.

## Frontend

- [ ] Tampilan diuji pada ponsel dan desktop.
- [ ] Cover, navigasi bawah, dialog foto, dan formulir berfungsi.
- [ ] Countdown berhenti setelah acara dimulai.
- [ ] Apps Script offline tidak membuat halaman terkunci.
- [ ] File foto dan musik telah dikompresi.
- [ ] Tidak ada error kritis pada browser console.

## GitHub Pages

- [ ] Workflow Pages berhasil.
- [ ] URL produksi dapat dibuka tanpa login.
- [ ] Asset tidak menghasilkan 404.
- [ ] Tautan `?to=` menampilkan nama tamu yang benar.
- [ ] Preview WhatsApp diperiksa setelah deploy.

## Privasi

- [ ] Pemberitahuan privasi tersedia bila diperlukan.
- [ ] Kebijakan moderasi foto dan ucapan ditetapkan.
- [ ] Masa retensi RSVP dan unggahan telah ditentukan.
