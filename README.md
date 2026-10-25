# Ruang Kuliah — Safi Adri Maulana

Website responsif untuk menampilkan dan mengarsipkan tugas serta materi kuliah. Data file disimpan sebagai file di repository GitHub. Website publik dapat dibuka dari HP maupun laptop.

## Struktur
- `index.html`, `style.css`, `app.js`: antarmuka website.
- `api/upload.js`: menerima unggahan dengan kata sandi admin, lalu menyimpan file ke GitHub.
- `api/list.js`: membaca daftar file dari GitHub agar pengunjung bisa melihat dan mengunduhnya.
- Folder `tugas/` dan `materi/` dibuat otomatis saat unggahan pertama.

## Penting sebelum dipakai
Frontend tidak menyimpan token GitHub. Token harus disimpan sebagai Environment Variables di Vercel. Batasi kata sandi admin dan jangan membagikannya kepada orang lain. Website ini mengizinkan pengunjung melihat file, tetapi hanya orang yang mengetahui kata sandi yang bisa mengunggah.

## Cara memasang hingga online

### 1. Buat repository GitHub
1. Masuk ke https://github.com dan buat repository baru, misalnya `arsip-kuliah-safi`.
2. Pilih **Public** jika file tugas/materi memang ingin bisa dilihat orang lain. Ingat, file di repository public dapat diakses siapa saja.
3. Unggah seluruh isi folder project ini ke repository. Bisa lewat tombol **Add file → Upload files**, lalu **Commit changes**.

### 2. Buat token GitHub
1. Buka GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Buat token baru, batasi hanya untuk repository `arsip-kuliah-safi`.
3. Beri izin **Contents: Read and write**.
4. Salin token saat dibuat. Jangan menaruh token ke `index.html`, `app.js`, atau file yang akan dipublikasikan.

### 3. Deploy ke Vercel
1. Buka https://vercel.com dan masuk dengan GitHub.
2. Pilih **Add New → Project**, lalu impor repository tadi.
3. Framework preset pilih **Other** jika ditanyakan.
4. Sebelum/ketika deploy, buka **Environment Variables** dan tambahkan:
   - `GITHUB_TOKEN` = token GitHub yang dibuat.
   - `GITHUB_OWNER` = username GitHub pemilik repository.
   - `GITHUB_REPO` = nama repository, contoh `arsip-kuliah-safi`.
   - `GITHUB_BRANCH` = `main` (sesuaikan jika branch utama berbeda).
   - `ADMIN_PASSWORD` = kata sandi rahasia untuk fitur unggah.
5. Deploy. Jika menambahkan atau mengubah Environment Variables setelah deploy, lakukan **Redeploy**.

### 4. Uji website
1. Buka URL `.vercel.app` yang diberikan Vercel.
2. Coba tab Tugas dan Materi kuliah.
3. Isi kata sandi pengelola, pilih jenis file, isi keterangan (contoh `Tugas pertemuan 4`), pilih file, lalu unggah.
4. Setelah berhasil, file akan masuk ke folder `tugas/` atau `materi/` di GitHub dan muncul di daftar arsip.
5. Bagikan URL Vercel kepada orang lain. Tampilan sudah responsif untuk HP.

## Batasan dan catatan
- Ukuran file dibatasi 5 MB per file pada aplikasi ini. File besar sebaiknya dikompres atau disimpan lewat layanan lain.
- GitHub repository menyimpan file dalam riwayat commit, sehingga menghapus file dari tampilan saja tidak otomatis menghapus riwayatnya.
- Jangan unggah data pribadi, dokumen identitas, nilai, atau materi yang tidak diizinkan untuk dibagikan secara publik.
- Kata sandi unggah adalah perlindungan dasar. Untuk penggunaan yang lebih ramai, tambahkan pembatasan percobaan/rate limiting dan autentikasi yang lebih kuat.
- Fungsi API membutuhkan hosting serverless seperti Vercel; website ini tidak bisa menjalankan fitur unggah langsung dari GitHub Pages saja.
