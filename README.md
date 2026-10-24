# Instagram Account Cleaner

Ekstensi Chrome/Edge berbasis Manifest V3 untuk membantu meninjau daftar akun Instagram dan menjalankan tindakan **Remove Follower** atau **Unfollow** berdasarkan username yang kamu pilih.

> **Penting:** proyek ini bukan produk resmi Instagram/Meta. Otomatisasi tindakan pada akun dapat melanggar ketentuan Instagram atau memicu pembatasan. Gunakan dengan risiko sendiri, pahami setiap tindakan, dan hentikan jika Instagram menampilkan peringatan.

## Fitur

- Dua mode: **Remove Followers** dan **Unfollow**.
- Daftar target **kosong secara default**. Tidak ada daftar username pribadi yang disertakan dalam repositori.
- Impor daftar target dari file `.txt`, satu username per baris. Awalan `@` boleh digunakan.
- Pencocokan username sebelum tindakan.
- Jeda antar tindakan, indikator progres, dan tombol berhenti.
- Pada mode Unfollow, akun privat atau berstatus `Requested` yang terdeteksi ditunda dan ditampilkan untuk konfirmasi terpisah.
- Pemrosesan data dilakukan di browser; ekstensi tidak dirancang untuk mengirim daftar akun ke server milik pengembang.

## Instalasi lokal

1. Unduh ZIP dari bagian **Releases** atau klik **Code → Download ZIP** di repositori GitHub.
2. Ekstrak ZIP ke folder lokal.
3. Buka `chrome://extensions` di Chrome atau `edge://extensions` di Microsoft Edge.
4. Aktifkan **Developer mode**.
5. Klik **Load unpacked** dan pilih folder `ig-remove-followers-v5` yang berisi `manifest.json`.
6. Buka dashboard ekstensi, lalu impor file TXT berisi username yang memang ingin kamu proses.
7. Buka Instagram dan ikuti instruksi pada dashboard/overlay ekstensi.

Jangan pilih folder ZIP atau folder induk yang tidak berisi `manifest.json`.

## Format daftar target

Contoh `targets.txt` milikmu sendiri:

```text
username_satu
@username.dua
username_tiga
```

File `targets.txt` di repositori ini sengaja kosong. Simpan daftar pribadi di file lokal dan jangan commit atau mengunggahnya ke GitHub.

## Izin ekstensi

- `storage`: menyimpan daftar target dan status kerja secara lokal menggunakan Chrome Storage.
- `tabs`: membuka atau mengaktifkan tab Instagram untuk alur kerja ekstensi.
- Host `https://www.instagram.com/*`: menjalankan content script pada halaman Instagram yang diperlukan untuk membaca elemen antarmuka dan membantu tindakan yang dipilih.

## Batasan dan risiko

- Instagram dapat mengubah antarmuka kapan saja, sehingga pencocokan atau kontrol otomatis bisa gagal.
- Pemindaian DOM hanya dapat menemukan akun yang tersedia pada halaman/daftar yang sedang dimuat. Hasilnya mungkin tidak lengkap.
- Deteksi akun privat atau status `Requested` bergantung pada teks dan elemen antarmuka yang terlihat.
- Jeda bukan jaminan bahwa tindakan tidak akan dibatasi oleh Instagram.
- Periksa daftar target dan mode yang dipilih sebelum memulai. Penghapusan pengikut dan unfollow dapat mengubah hubungan akun dan mungkin sulit dibatalkan secara massal.
- Uji dengan sejumlah kecil akun terlebih dahulu. Jangan gunakan untuk spam, pelecehan, atau tindakan yang tidak kamu izinkan.
- Kode ini disediakan apa adanya tanpa jaminan keberhasilan atau kesesuaian untuk tujuan tertentu.

## Privasi

Baca [Privacy Policy](PRIVACY_POLICY.md). Secara ringkas, ekstensi tidak memiliki backend pengembang, analitik, iklan, atau pengiriman daftar username ke server eksternal. Data yang diproses ekstensi disimpan secara lokal di browser. Instagram tetap merupakan layanan pihak ketiga dengan kebijakan privasinya sendiri.

## Pengembangan dan kontribusi

1. Fork repositori.
2. Buat branch untuk perubahan.
3. Uji pada profil dan data yang kamu kendalikan.
4. Pastikan tidak ada username pribadi, token, cookie, atau data akun dalam commit.
5. Ajukan pull request dengan penjelasan perubahan dan pengujian.

## Lisensi

Belum ada lisensi open-source yang ditetapkan. Sampai file `LICENSE` ditambahkan, jangan menganggap kode ini otomatis boleh disalin, dimodifikasi, atau didistribusikan ulang. Tambahkan lisensi yang sesuai sebelum menerima kontribusi atau menyatakan proyek ini open-source.

## Tautan

- Pengembang: [Afgadev](https://github.com/afrzxd)
- Kebijakan Privasi: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)
