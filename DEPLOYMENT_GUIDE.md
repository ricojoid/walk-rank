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

### 🚀 Cara Menjalankan di VPS (Cukup 1 Perintah)
Karena di server VPS Anda container PostgreSQL sudah aktif di port `5432`:

1. Clone project di VPS:
   ```bash
   git clone https://github.com/ricojoid/walk-rank.git
   cd walk-rank
   ```
2. Cukup jalankan perintah standar Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Cek log container untuk memastikan database & server berjalan lancar:
   ```bash
   docker logs -f walkrank_app
   ```

---

### 📦 Skenario Alternatif (Full-Stack jika PostgreSQL belum ada)
Jika Anda ingin Docker Compose membuat container PostgreSQL baru dan aplikasi secara bersamaan dari nol:
```bash
docker compose -f docker-compose.full-stack.yml up -d --build
```

---

## 🌐 Mengakses Aplikasi
Port `3000` & `3001` di VPS sudah terpakai oleh aplikasi lain, sehingga WalkRank dialihkan ke port **`3005`** agar tidak tabrakan:
- Buka browser: **`http://43.157.212.14:3005`**

### 👤 Autentikasi:
- **Pendaftaran Akun Baru**: Klik tab **Register** di halaman login untuk membuat akun karyawan baru dengan nama, email, password, dan target langkah harian.
- **Masuk**: Masukkan email dan password yang telah didaftarkan.
- **Akun Super Admin Bawaan**:
  - Email: `admin@walkrank.com`
  - Password: `admin123`

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
