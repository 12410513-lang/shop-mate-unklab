# ABSENPRO — HRIS Manajemen Cuti Pegawai

Aplikasi demonstrasi HRIS berbasis **React + Vite + JSON Server**. Project ini melanjutkan dashboard ABSENPRO yang sudah ada, mempertahankan modul data pegawai, absensi, dan laporan, serta menambahkan pemisahan akses Admin/Pegawai dan alur manajemen cuti.

## Fitur

### Admin
- Dashboard ringkasan absensi dan statistik pengajuan cuti.
- CRUD data pegawai dengan pembuatan akun User otomatis saat pegawai baru ditambahkan.
- Sinkronisasi nama, email, ID pegawai, dan status antara data `employees` dan akun `users`.
- Penonaktifan pegawai menonaktifkan akun login tanpa menghapus riwayat kehadiran/cuti.
- Monitoring dan input kehadiran.
- Melihat seluruh pengajuan cuti/izin.
- Pencarian pengajuan berdasarkan nama atau ID pegawai.
- Filter status `Pending`, `Approved`, dan `Not Approved`.
- Mengubah status pengajuan dengan konfirmasi.
- Laporan dan ekspor CSV.

### Pegawai (User)
- Login ke portal pribadi menggunakan email pegawai dan password sementara `user123` saat akun dibuat Admin.
- Akun lama yang sudah ada pada `employees` tetapi belum memiliki akun `users` dapat dibuatkan akun kompatibilitas saat login pertama dengan password sementara `user123`.
- Melihat dashboard ringkasan milik sendiri.
- Check-in dan check-out.
- Melihat riwayat kehadiran sendiri.
- Mengajukan cuti/izin/sakit dengan identitas pegawai otomatis dari akun login.
- Melihat dan memfilter riwayat pengajuan serta status miliknya sendiri.
- Tidak mendapat menu Admin.

### Aturan pengajuan
- Status baru otomatis `Pending`.
- Admin dapat mengubah status menjadi `Approved` atau `Not Approved`.
- Tanggal mulai minimal hari ini.
- Tanggal selesai minimal sama dengan tanggal mulai.
- Tanggal pengajuan dicatat otomatis.
- Data pengajuan lama dipertahankan; status lama `Menunggu`, `Disetujui`, dan `Ditolak` dimigrasikan ke status standar baru.

## Persyaratan
- Node.js 18 atau lebih baru
- npm

## Cara menjalankan
1. Ekstrak ZIP.
2. Buka folder `ABSENPRO-React-JSONServer` di VS Code.
3. Buka terminal pada folder tersebut.
4. Jalankan:
   ```bash
   npm install
   ```
5. Jalankan frontend dan JSON Server bersamaan:
   ```bash
   npm start
   ```
6. Buka `http://localhost:5173`.
7. JSON Server berjalan di `http://localhost:3001`.

Jika `npm start` tidak berjalan, jalankan secara terpisah menggunakan dua terminal:
- Terminal 1: `npm run server`
- Terminal 2: `npm run dev`

Jangan tutup terminal selama aplikasi digunakan.

## Akun demo

| Role | Email | Password |
|---|---|---|
| Admin | `admin@absenpro.id` | `admin123` |
| Pegawai Aditya | `aditya@perusahaan.id` | `user123` |
| Pegawai Nadia | `nadia@perusahaan.id` | `user123` |
| Pegawai Rizky | `rizky@perusahaan.id` | `user123` |
| Pegawai Clara | `clara@perusahaan.id` | `user123` |
| Pegawai Bima | `bima@perusahaan.id` | `user123` |
| Pegawai Sarah | `sarah@perusahaan.id` | `user123` |
| Pegawai Fajar | `fajar@perusahaan.id` | `user123` |
| Pegawai Maya | `maya@perusahaan.id` | `user123` |

Pilih jenis akun yang sesuai pada halaman login. Saat Admin menambahkan pegawai, sistem otomatis membuat akun User pada endpoint `users` dengan `employeeId` yang sama. Password awal akun baru adalah `user123`. Akun lama yang belum memiliki record `users` dapat diprovisikan saat login pertama menggunakan password sementara tersebut, selama email cocok dengan data pegawai yang aktif.

Sesi demonstrasi disimpan di `localStorage`, sehingga tetap ada setelah halaman di-refresh. Gunakan tombol Keluar untuk mengakhiri sesi. Jika email pegawai diubah melalui menu Admin, email akun login ikut diperbarui. Jika pegawai dinonaktifkan, akun login juga dinonaktifkan. Penghapusan dari tabel pegawai dilakukan sebagai penonaktifan agar histori tidak terputus.

## Skenario pengujian autentikasi dan navigasi
1. Login sebagai Admin (`admin@absenpro.id` / `admin123`).
2. Buka Data Pegawai lalu klik Tambah Pegawai.
3. Isi nama, jabatan, departemen, email unik, nomor telepon, dan status Aktif.
4. Simpan. Sistem harus membuat data pegawai dan akun User terkait.
5. Logout, lalu login sebagai User menggunakan email pegawai dan password sementara `user123`.
6. Pastikan User dapat membuka Beranda, Riwayat Kehadiran, Izin & Cuti, dan Profil Saya.
7. Ubah nomor telepon/alamat/kontak darurat dari Profil Saya, simpan, lalu refresh. Perubahan harus tetap ada.
8. Login kembali sebagai Admin dan nonaktifkan pegawai tersebut.
9. Coba login sebagai User; sistem harus menolak akun Nonaktif. Riwayat lama tetap tersimpan.
10. Uji tombol tambah, edit, nonaktifkan, refresh, export CSV, notifikasi, logout, serta tombol navigasi sidebar.

## Skenario demo manajemen cuti
1. Login sebagai pegawai, misalnya Aditya.
2. Buka menu Izin & Cuti dan buat pengajuan dengan tanggal mulai hari ini atau setelahnya.
3. Pastikan status awal tampil sebagai `Pending`.
4. Logout, lalu login sebagai Admin.
5. Buka menu Izin & Cuti, cari nama pegawai, dan tinjau pengajuan.
6. Klik Setujui atau Tolak. Sistem meminta konfirmasi sebelum mengubah status.
7. Logout dan login kembali sebagai pegawai yang mengajukan. Refresh halaman atau buka riwayat untuk melihat status terbaru.

## Struktur project
```text
ABSENPRO-React-JSONServer/
├── db.json
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    └── style.css
```

## Catatan keamanan dan batasan
Project ini adalah **prototipe akademik lokal**. Login dan role guard berjalan di sisi frontend, sedangkan JSON Server tidak memiliki autentikasi/otorisasi backend. Artinya, pembatasan menu dan tampilan aplikasi membantu demonstrasi, tetapi bukan perlindungan terhadap orang yang mengakses endpoint JSON Server secara langsung atau memanipulasi browser.

Password demo tersimpan sebagai teks biasa di `db.json`. Jangan gunakan data atau password sungguhan. Untuk aplikasi produksi, autentikasi, validasi, dan pemeriksaan hak akses wajib dilakukan di backend dengan password hashing, token/session yang aman, dan API yang memverifikasi kepemilikan data pada setiap permintaan.

## Pembagian kerja kelompok (opsional)
| Anggota | Tanggung jawab |
|---|---|
| 1 | UI/UX, login, role portal, responsive |
| 2 | Data pegawai dan CRUD |
| 3 | Kehadiran, check-in/out |
| 4 | Pengajuan cuti, validasi, persetujuan |
| 5 | Laporan, integrasi JSON Server, pengujian dan dokumentasi |

## Aturan saldo cuti, validasi, dan absensi kamera

- Jatah cuti tahunan adalah tetap **14 hari kerja** per tahun kalender. Saldo kembali menjadi 14 hari pada 1 Januari dan sisa tahun sebelumnya tidak dibawa.
- Penggunaan cuti hanya menghitung Senin–Jumat. Sabtu, Minggu, dan tanggal yang dimasukkan Admin pada Kalender Hari Libur tidak mengurangi saldo.
- Pengajuan `Pending` ikut memesan kuota agar beberapa pengajuan yang menunggu tidak menggunakan saldo yang sama. Saat Admin menyetujui, sistem memeriksa kembali kuota dan benturan periode.
- Periode pengajuan untuk pegawai yang sama tidak boleh bertumpuk dengan pengajuan lain berstatus `Pending` atau `Approved`.
- User dapat check-in dan check-out melalui kamera. Browser akan meminta izin kamera, lalu foto diberi cap tanggal dan jam perangkat pada saat pengambilan.
- Foto disimpan sebagai JPEG terkompresi di record `attendance` pada properti `checkInPhoto` / `checkOutPhoto`, bersama `checkInTimestamp` / `checkOutTimestamp`.
- Kamera memerlukan izin browser dan berjalan pada `localhost` atau HTTPS. Jam pada foto berasal dari perangkat/browser untuk kebutuhan demonstrasi dan bukan bukti waktu tersertifikasi.

## Fitur analitik dan self-service tambahan

- **Employee Attendance Score:** persentase check-in tepat waktu dari seluruh catatan berstatus `Hadir` atau `Terlambat` pada tahun yang dipilih. Izin, sakit, cuti, dan tanggal tanpa catatan tidak otomatis menjadi penalti. Pegawai tanpa data check-in ditampilkan sebagai "Belum ada data".
- **Attendance Heatmap:** kalender bulanan per pegawai dengan warna untuk tepat waktu, terlambat, izin/sakit, cuti, dan tidak ada catatan. Tidak ada catatan tidak otomatis diartikan mangkir.
- **Employee Self-Service Profile Update:** pegawai dapat memperbarui nomor telepon, alamat, dan kontak darurat. Nama, email akun, ID, departemen, serta status tetap dikelola Admin.
- **Ekspor CSV:** laporan kehadiran dan pengajuan cuti tersedia dari halaman Laporan. File memakai UTF-8 BOM dan pemisah baris CRLF agar lebih kompatibel dengan spreadsheet.

## Catatan perhitungan skor

Attendance Score merupakan indikator kedisiplinan check-in, bukan penilaian kinerja pegawai secara keseluruhan. Karena prototipe ini belum memiliki kalender jadwal kerja per pegawai, sistem tidak menganggap tanggal tanpa record sebagai ketidakhadiran dan tidak menghitung absensi yang tidak tercatat sebagai penalti.
