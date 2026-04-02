# 🎵 TikTok Pro Tools - Chrome Extension

Extension Chrome nâng cao trải nghiệm TikTok với 5 tính năng chính.

---

## ✨ Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| ⏯ **Phát trong nền** | Video TikTok tiếp tục phát khi bạn chuyển sang tab khác |
| ⚡ **Tốc độ 0-4x** | Thanh kéo mượt từ 0 đến 4x, có preset nhanh (0.5x / 1x / 1.5x / 2x) |
| 🔊 **Âm lượng** | Điều chỉnh âm lượng bất kỳ mức nào từ 0% đến 100% |
| 🎵 **Shazam** | Nhận diện tên bài hát đang phát trong video (cần RapidAPI Key) |
| 🎨 **Custom Theme** | 6 giao diện: Mặc định, Dark Pro, Neon Pink, Midnight Blue, Sunset, Forest + Custom |

---

## 🚀 Cài đặt

### Bước 1: Tải và giải nén
Giải nén file `tiktok-pro-tools.zip` ra một thư mục.

### Bước 2: Mở Chrome Extensions
Truy cập `chrome://extensions/` trên Chrome.

### Bước 3: Bật Developer Mode
Bật công tắc **"Developer mode"** ở góc trên bên phải.

### Bước 4: Load Extension
Nhấn **"Load unpacked"** → Chọn thư mục vừa giải nén.

### Bước 5: Sử dụng
Truy cập [TikTok.com](https://tiktok.com) — panel điều khiển sẽ xuất hiện ở góc phải màn hình.

---

## 🎵 Cài đặt Shazam API

1. Truy cập [RapidAPI Shazam](https://rapidapi.com/apidojo/api/shazam)
2. Đăng ký tài khoản (miễn phí)
3. Subscribe gói **Basic (free)** — 500 requests/tháng
4. Mở popup extension → Tab **Shazam** → Nhập `X-RapidAPI-Key`
5. Nhấn **Lưu API Key**

---

## 🎮 Cách dùng Panel

Panel điều khiển nổi ở góc phải TikTok:
- **Kéo thả** header để di chuyển panel
- **−** để thu nhỏ panel
- Thanh kéo **Tốc độ**: từ 0x đến 4x với các nút preset nhanh
- Thanh kéo **Âm lượng**: từ 0% đến 100%
- Nút **Nhận diện nhạc**: ghi âm 5 giây và nhận diện qua Shazam

---

## ⚙️ Popup Settings

Nhấn icon extension trên toolbar để mở popup:
- Tab **Cài đặt**: Bật/tắt phát nền, tốc độ/âm lượng mặc định, chọn theme
- Tab **Shazam**: Nhập và lưu RapidAPI Key
- Tab **Về**: Thông tin extension

---

## 🔧 Yêu cầu

- Chrome 88+ (Manifest V3)
- Kết nối internet (để tải font & Shazam API)
- RapidAPI Key (chỉ cần cho tính năng Shazam)

---

## 📝 Lưu ý

- **Phát nền**: Hoạt động bằng cách chặn sự kiện `visibilitychange` mà TikTok dùng để tạm dừng video
- **Shazam**: Ghi âm 5 giây từ video element; nếu TikTok chặn CORS, có thể cần tải lại trang
- Extension không thu thập dữ liệu người dùng

---

*Made with ❤️ for TikTok power users*
