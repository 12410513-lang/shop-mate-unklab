# Catatan Revisi ABSENPRO

## Koreksi inti
- Validasi kuota cuti dilakukan lagi ketika Admin menyetujui pengajuan.
- Pengajuan `Pending` ikut memesan kuota cuti untuk mencegah saldo dipakai ganda.
- Pengajuan izin/cuti pegawai yang sama dengan periode bertumpuk ditolak jika pengajuan lama masih `Pending` atau `Approved`.
- Ekspor CSV memakai UTF-8 BOM, CRLF, escaping tanda kutip, dan perlindungan dasar terhadap formula injection spreadsheet.
- Ekspor CSV di halaman Monitoring Kehadiran menggunakan helper yang sama.
- Grafik tren dashboard dihitung dari data attendance aktual 7 hari terakhir, bukan angka contoh.
- Informasi nama Admin di sidebar mengikuti akun yang sedang login.
- README disesuaikan dengan aturan cuti 14 hari kerja, akhir pekan/hari libur, dan fitur terbaru.

## Fitur baru
- **Employee Attendance Score:** persentase check-in tepat waktu dari catatan `Hadir` dan `Terlambat` dalam tahun yang dipilih. Izin, sakit, cuti, dan tanggal tanpa catatan tidak otomatis mengurangi skor.
- **Attendance Heatmap:** kalender bulanan per pegawai dengan status tepat waktu, terlambat, izin/sakit, cuti, atau tidak ada catatan.
- **Employee Self-Service Profile Update:** pegawai dapat memperbarui nomor telepon, alamat, dan kontak darurat. Data identitas inti tetap dikelola Admin.

## Batasan prototipe
- Attendance Score belum memperhitungkan jadwal kerja individual atau hari kerja terjadwal yang tidak memiliki record. Karena itu, tidak ada record ditampilkan sebagai "Tidak ada catatan", bukan langsung dianggap mangkir.
- JSON Server dan autentikasi frontend hanya untuk demonstrasi akademik lokal, bukan keamanan produksi.
