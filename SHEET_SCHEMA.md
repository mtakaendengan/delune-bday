# Struktur Google Sheets

## Config

| Kolom | Tipe | Keterangan |
|---|---|---|
| Key | string | Nama konfigurasi unik |
| Value | string | Nilai konfigurasi |
| Type | string | string, number, boolean, json |
| Public | boolean | Apakah nilai dapat dikirim ke frontend |
| UpdatedAt | datetime | Waktu pembaruan |

`autoApproveWishes` disetel `Public = FALSE` karena hanya dipakai backend.

## Wishes

| Kolom | Keterangan |
|---|---|
| Id | UUID ucapan |
| Timestamp | Waktu diterima |
| Name | Nama pengirim |
| Message | Isi ucapan |
| Attendance | Informasi kehadiran opsional |
| GuestCount | Jumlah tamu opsional |
| Status | PENDING, APPROVED, REJECTED |
| GuestToken | Token pada URL tamu |
| Source | Hostname frontend |
| UserAgent | Disediakan untuk audit bila diaktifkan |

Hanya ucapan berstatus `APPROVED` yang dikirim ke frontend.

## RSVP

| Kolom | Keterangan |
|---|---|
| Id | UUID RSVP |
| Timestamp | Waktu diterima |
| Name | Nama tamu |
| Attendance | Hadir, Tidak Hadir, Masih Ragu |
| GuestCount | Jumlah orang |
| Notes | Catatan tamu |
| GuestToken | Token tamu |
| Source | Sumber permintaan |

## Gallery

| Kolom | Keterangan |
|---|---|
| Id | UUID item |
| SortOrder | Urutan foto |
| FileId | ID file Google Drive |
| Url | URL foto penuh |
| ThumbnailUrl | URL thumbnail |
| Caption | Keterangan foto |
| Alt | Teks alternatif aksesibilitas |
| Active | TRUE agar tampil |
| CreatedAt | Waktu ditambahkan |

## Uploads

| Kolom | Keterangan |
|---|---|
| Id | UUID upload |
| Timestamp | Waktu upload |
| Name | Nama pengirim |
| Caption | Caption dari tamu |
| FileId | ID file Drive |
| Url | URL internal atau publik setelah disetujui |
| MimeType | image/jpeg, image/png, image/webp |
| Size | Ukuran byte |
| Status | PENDING, APPROVED, REJECTED |
| GuestToken | Token tamu |

## Logs

Digunakan untuk mencatat setup, write operation, approval, dan error. Jangan menyimpan password, token autentikasi rahasia, atau isi file pada log.
