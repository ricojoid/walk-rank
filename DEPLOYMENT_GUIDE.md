# 🚀 WalkRank Docker Deployment Guide (VPS)

Panduan lengkap untuk men-deploy aplikasi **WalkRank** menggunakan Docker di server VPS (`43.157.212.14`).

---

## 🗄️ Status Database Saat Ini
Database terpisah bernama **`walkrank`** telah berhasil dibuat secara otomatis di PostgreSQL VPS (`43.157.212.14:5432`) dengan detail:
- **Host**: `43.157.212.14`
- **Port**: `5432`
- **User**: `admin`
- **Password**: `admin123`
- **Database Baru**: `walkrank` *(terisolasi & aman, tidak mengganggu database `POSTGRES_DB` atau tabel sistem lain)*
- **Tabel**: Telah disinkronkan otomatis (`users`, `step_logs`)
- **Initial Data**: Telah di-seed dengan akun Super Admin & User demo.

---

## 📋 Pilihan Skenario Deployment

### Skenario 1: Deploy App Saja (Rekomendasi jika Container PostgreSQL sudah berjalan di VPS)
Jika di server VPS Anda container `postgres_db` sudah berjalan di port `5432`:

1. Copy folder project ke VPS:
   ```bash
   scp -r "Walk Rank" user@43.157.212.14:/home/user/walkrank
   ```
2. Masuk ke direktori project di VPS:
   ```bash
   cd /home/user/walkrank
   ```
3. Jalankan container aplikasi dengan file compose app-only:
   ```bash
   docker compose -f docker-compose.app-only.yml up -d --build
   ```
4. Cek log container untuk memastikan database & server berjalan lancar:
   ```bash
   docker logs -f walkrank_app
   ```

---

### Skenario 2: Deploy Full-Stack (Aplikasi + PostgreSQL Bersama-sama)
Jika Anda ingin Docker Compose mengelola PostgreSQL dan Next.js secara bersamaan dalam 1 file compose:

1. Jalankan perintah:
   ```bash
   docker compose up -d --build
   ```
2. Container PostgreSQL (`postgres_db`) dan WalkRank (`walkrank_app`) akan otomatis menyala.
3. Script `docker-entrypoint.sh` akan otomatis:
   - Memastikan database `walkrank` tersedia.
   - Melakukan `prisma db push` untuk membuat tabel.
   - Melakukan seeding data akun admin & demo.
   - Menjalankan Next.js di port `3000`.

---

## 🌐 Mengakses Aplikasi
Setelah container berjalan:
- Buka browser: **`http://43.157.212.14:3000`**

### Kredensial Demo:
- **Super Admin**:
  - Email: `admin@walkrank.com`
  - Password: `admin123`
- **User Karyawan Demo**:
  - Email: `budi@walkrank.com` | Password: `user123`
  - Email: `siti@walkrank.com` | Password: `user123`
  - Email: `andi@walkrank.com` | Password: `user123`

---

## 🛠️ Perintah Berguna Lainnya

- **Melihat log container aplikasi**:
  ```bash
  docker logs -f walkrank_app
  ```
- **Restart aplikasi**:
  ```bash
  docker restart walkrank_app
  ```
- **Menghentikan aplikasi**:
  ```bash
  docker compose down
  ```
- **Rebuild ulang setelah ada perubahan kode**:
  ```bash
  docker compose up -d --build
  ```
