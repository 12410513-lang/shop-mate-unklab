# Changelog – Perbaikan Autentikasi dan Navigasi

## Perubahan
- Penambahan pegawai baru kini membuat akun `users` secara otomatis dengan role `user`, email pegawai, password sementara `user123`, status yang mengikuti data pegawai, dan `employeeId` yang sama.
- Email ganda dicegah pada tabel pegawai maupun akun pengguna.
- Edit pegawai menyinkronkan nama, email, `employeeId`, role, dan status akun User terkait.
- Pegawai yang dinonaktifkan juga memiliki akun User yang dinonaktifkan. Penghapusan dari UI menjadi soft-delete/nonaktif agar riwayat absensi dan cuti tidak kehilangan referensi pegawai.
- Akun lama tanpa `employeeId` diperbaiki saat login dengan mencocokkan email ke data pegawai.
- Pegawai lama yang belum memiliki akun `users` dapat memperoleh akun kompatibilitas saat login pertama dengan password sementara `user123` jika email cocok dan pegawai tidak Nonaktif.
- Login User memvalidasi akun, status, dan hubungan dengan data pegawai sebelum membuat sesi.
- Error koneksi/API kini menampilkan pesan yang lebih jelas.
- Route Admin yang tidak dikenal diarahkan kembali ke Overview. Link internal dashboard menggunakan React Router agar navigasi tidak memuat ulang aplikasi.
- Database awal diperbaiki untuk memastikan akun Fajar memiliki `employeeId: EMP007` dan status/nama/email seluruh akun User selaras dengan master pegawai.

## Pengujian yang dilakukan
- JSON database berhasil diparse dan relasi delapan akun User ke delapan pegawai diperiksa.
- Source JSX berhasil diproses oleh TypeScript JSX transpiler tanpa diagnostic syntax.
- Pemeriksaan build Vite penuh belum dapat dilakukan di lingkungan penyusunan karena `npm install` mengalami timeout saat mengakses registry npm. Jalankan `npm install` pada komputer lokal sebelum `npm start`.

## Catatan
Autentikasi ini tetap untuk prototipe akademik dengan JSON Server. Endpoint JSON Server tidak memberikan otorisasi backend; jangan gunakan untuk data/password produksi.
