# Đặc Sản 3 Miền – Ecommerce & Admin Platform

Ứng dụng web quản lý và bán đặc sản ba miền Việt Nam. Dự án bao gồm **frontend Angular** và **backend Node.js/Express** với MongoDB làm database. Hệ thống hỗ trợ khách hàng đặt hàng và cung cấp bảng điều khiển dành cho admin theo dõi đơn hàng, sản phẩm, blog, liên hệ.

---

## 📁 Cấu trúc dự án

```
.
├── backend/            # REST API (Express + MongoDB)
│   ├── index.js        # Ứng dụng chính
│   ├── seed_*.js       # Script seed dữ liệu mẫu
│   ├── docs/*.md       # Hướng dẫn chuyên sâu
├── frontend/           # Ứng dụng Angular
│   ├── src/app/        # Component, service, guard ...
│   ├── angular.json    # Cấu hình Angular
└── README.md
```

---

## 🚀 Tính năng nổi bật

- **Cửa hàng trực tuyến**: danh mục sản phẩm, chi tiết sản phẩm, giỏ hàng, thanh toán.
- **Quản trị viên**:
  - Dashboard thống kê đơn hàng, doanh thu, sản phẩm sắp hết hàng, hoạt động gần đây.
  - Quản lý sản phẩm, đơn hàng, người dùng, blog, liên hệ khách hàng.
  - Tạo/trình bày hóa đơn PDF cho đơn hàng.
- **Xác thực & phân quyền**: session-based, hỗ trợ các quyền `edit all`, `sales ctrl`, `account ctrl`, `just view`.
- **Hệ sinh thái script**: seed dữ liệu mẫu, kiểm tra kết nối MongoDB, cập nhật trường `type` cho sản phẩm.

---

## 🛠 Yêu cầu môi trường

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Community Server ≥ 6 (chạy tại `mongodb://127.0.0.1:27017`)
- Angular CLI (cài đặt global): `npm install -g @angular/cli`

---

## ⚙️ Thiết lập nhanh

### 1. Clone dự án

```bash
git clone https://github.com/<username>/dacsan3mien.git
cd dacsan3mien
```

### 2. Backend

```bash
cd backend
npm install
```

Tạo file `.env` (nếu chưa có):

```
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=dacsan3mien
SESSION_SECRET=supersecret
```

Khởi động server:

```bash
node index.js
```

### 3. Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend chạy tại `http://localhost:4200`.

Backend chạy tại `http://localhost:3002`.

---

## 🌱 Seed dữ liệu mẫu

Trong thư mục `backend/`:

| Lệnh | Mục đích |
| --- | --- |
| `node seed_blogs.js` | Thêm blog mẫu |
| `node seed_contacts.js` | Thêm liên hệ/feedback mẫu |
| `node update_mongodb_products.js` | Chuẩn hóa trường `type` cho Product |
| `node verify_mongodb_update.js` | Kiểm tra kết quả cập nhật |
| `node checkMongo.js` | Kiểm tra kết nối & thống kê DB |

> ⚠️ Các script hỏi trước khi xoá dữ liệu cũ – đọc kỹ prompt và xác nhận khi chạy trên môi trường thực.

---

## 🔑 Quyền và tài khoản demo

Hệ thống lưu user trong collection `User`. Sau khi seed hoặc import dữ liệu, đảm bảo có tài khoản admin với các trường:

```json
{
  "role": "admin",
  "action": "edit all"
}
```

Đăng nhập admin tại `http://localhost:4200/login`.

---

## 📡 API chính (trích)

- `POST /user/login` – đăng nhập (session)
- `GET /dashboard/stats` – số liệu tổng quan dashboard
- `GET /dashboard/activities` – hoạt động gần đây (12 bản ghi mới nhất)
- `GET /products`, `POST /products`, `PATCH /products/:id`, ...
- `GET /orders`, `POST /orders`
- `GET /blogs`, `POST /blogs`, `PATCH /blogs/:id`
- `GET /feedback`, `PATCH /feedback/:id/status`

Cấu hình CORS cho phép frontend chạy tại `http://localhost:4200`.

---

## ✅ Kiểm tra & lint

- Frontend: `ng lint`, `ng test`
- Backend: sử dụng `npm run lint` (nếu cấu hình), hoặc `node --check index.js`
- Sau khi cập nhật Angular component/service, chạy lại `ng serve` để kiểm tra UI.

---

## 📦 Build & Deploy

### Frontend

```bash
cd frontend
ng build --configuration production
```

Output tại `frontend/dist/`. Có thể deploy bằng bất kỳ static host nào (Netlify, Vercel, S3...).

### Backend

- Cấu hình biến môi trường (PORT, MONGODB_URI, SESSION_SECRET, DB_NAME).
- Dùng process manager (PM2, forever) hoặc container hoá để chạy Node server.
- Mở port 3002 (hoặc port custom) và thiết lập reverse proxy (Nginx/Apache).

### MongoDB

- Sử dụng service managed (Atlas) hoặc cài đặt On-premises.
- Nhớ cập nhật `MONGODB_URI` và `DB_NAME` tương ứng.

---

## 🤝 Đóng góp

1. Fork repository, tạo branch mới (ví dụ: `feature/recent-activity`).
2. Commit theo chuẩn: `feat: ...`, `fix: ...`, `docs: ...`.
3. Mở Pull Request kèm mô tả, screenshot (nếu có).

---

## 📄 License

Dự án phục vụ mục đích học tập và demo nội bộ. Tùy chỉnh trước khi đưa vào sản phẩm thực tế.

---

## 📬 Liên hệ

- Email: support@dacsan3mien.vn
- Hotline: 079 2098 518

Chúc bạn trải nghiệm tốt cùng **Đặc Sản 3 Miền**! 🇻🇳🍜🍵
