# Đặc Sản 3 Miền – Ecommerce & Admin Platform

Website thương mại điện tử cho đặc sản ba miền, gồm **frontend Angular** và **backend Node.js/Express** kết nối MongoDB. Repo giúp bạn chạy thử nhanh toàn bộ hệ thống (cửa hàng, dashboard admin, quản lý nội dung).

---

## Cấu trúc dự án

```
.
├── backend/            # REST API (Express + MongoDB)
│   ├── index.js        # Ứng dụng chính
│   ├── import*.js      # Script import/seed dữ liệu
├── frontend/           # Ứng dụng Angular
│   ├── src/app/        # Component, service, guard ...
│   ├── src/proxy.conf.json
└── README.md
```

---

## Yêu cầu môi trường

- Node.js ≥ 18, npm ≥ 9
- MongoDB local hoặc MongoDB Atlas
- Angular CLI cài global: `npm install -g @angular/cli`
- Git LFS (để lấy media lớn): `git lfs install`

---

## Thiết lập nhanh

### Clone dự án

```bash
git clone https://github.com/<username>/dacsan3mien.git
cd dacsan3mien
```

### Backend

```bash
cd backend
npm install
```

Tạo file `.env` (nếu chưa có):

```
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=DACSAN3MIEN
JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
```

Khởi động server:

```bash
node index.js
```

Server chạy tại `http://localhost:3002`.

### Frontend

```bash
cd frontend
npm install
ng serve
```

Proxy mặc định `src/proxy.conf.json` chuyển tiếp `/user`, `/products`, `/orders`, `/feedback`, `/cart` sang backend `http://localhost:3002`. Ứng dụng chạy tại `http://localhost:4200`.

---

## Cấu hình MongoDB

- Dùng database `DACSAN3MIEN` (chữ hoa). Nếu muốn đổi tên, cập nhật lại `DB_NAME` và các script import.
- Có thể import dữ liệu mẫu bằng `mongoimport` hoặc script trong `backend/`.
  ```bash
  mongoimport --db DACSAN3MIEN --collection User --file path/to/users.json --jsonArray
  ```

---

## Chạy ứng dụng

1. Start MongoDB (local hoặc Atlas).
2. Chạy backend: `node index.js` (hoặc `npm start` nếu muốn dùng nodemon).
3. Ở cửa sổ khác, chạy frontend: `ng serve`.
4. Mở `http://localhost:4200`.

---

## Dữ liệu mẫu và script hỗ trợ

| Script | Chức năng |
| --- | --- |
| `backend/importAllJSON_fixed.js` | Import toàn bộ JSON vào MongoDB |
| `backend/seed_blogs.js` | Seed blog mẫu |
| `backend/seed_contacts.js` | Seed liên hệ mẫu |
| `backend/update_mongodb_products.js` | Chuẩn hóa trường `type` của sản phẩm |
| `backend/checkMongo.js` | Kiểm tra kết nối và thống kê DB |

Đọc kỹ cảnh báo trước khi chạy các script có thao tác xóa/ghi đè dữ liệu.

---

## Tài khoản mặc định

Nếu dùng dataset gốc:

- Admin: `admin@uel.edu.vn` / `112233`
- User: `user@uel.edu.vn` / `112233`
- Các tài khoản khác có thể thay phần local-part, mật khẩu giữ nguyên.

Truy cập trang đăng nhập tại `/login`. Đăng nhập admin để dùng dashboard `/admin`.

---

## Các công nghệ chính

- Backend: Node.js, Express, MongoDB, Mongoose, bcrypt, jsonwebtoken, multer, cors, express-session.
- Frontend: Angular, RxJS, Bootstrap, FontAwesome, ngx-cookie-service, ngx-spinner.

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
| --- | --- |
| Không kết nối MongoDB | Kiểm tra `MONGODB_URI`, `DB_NAME` và chắc chắn MongoDB đang chạy. |
| CORS/401 trên frontend | Bắt đầu frontend bằng `ng serve` để dùng proxy `src/proxy.conf.json`. |
| Git LFS báo “file should have been a pointer” | Chạy `git lfs install`, sau đó `git lfs pull`. |
| Đăng nhập báo sai mật khẩu | Đảm bảo backend trỏ đúng DB `DACSAN3MIEN`, seed lại user nếu cần. |

---

## Kiểm tra và build

- Frontend lint/test: `ng lint`, `ng test`.
- Build production: `ng build --configuration production`.
- Backend có thể chạy `node --check index.js` để kiểm tra syntax.

---

## Liên hệ

- Email: support@dacsan3mien.vn
- Hotline: 079 2098 518

Chúc bạn triển khai thành công dự án Đặc Sản 3 Miền.
