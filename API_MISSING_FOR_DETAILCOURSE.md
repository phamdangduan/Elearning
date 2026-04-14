# 🚨 DANH SÁCH API CẦN BỔ SUNG CHO DETAILCOURSE

## ❌ API THIẾU - CẦN ANH LÀM

### 1. **Instructor Statistics API**
**Endpoint:** `GET /instructor/stats?instructorId={instructorId}`

**Mục đích:** Lấy thống kê của giảng viên để hiển thị trong phần "Giảng viên"

**Response mong muốn:**
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "instructorId": "instructor-001",
    "totalStudents": 12450,
    "totalCourses": 5,
    "averageRating": 4.9,
    "totalReviews": 2340
  }
}
```

**Sử dụng ở đâu:**
- Hiển thị trong phần "Giảng viên" (Instructor section)
- Số học viên: `12,450 học viên`
- Số khóa học: `5 khóa học`

---

### 2. **Course Fields Cần Bổ Sung**

Trong response của `GET /course/{courseId}`, cần thêm các fields sau:

#### a) **outcomes** (array of strings)
```json
"outcomes": [
  "Nắm vững nền tảng Java OOP và lập trình hướng đối tượng",
  "Xây dựng REST API hoàn chỉnh với Spring Boot",
  "Kết nối và thao tác cơ sở dữ liệu với JPA/Hibernate",
  "Xác thực và phân quyền với Spring Security + JWT"
]
```
**Hiển thị ở:** Section "Bạn sẽ học được gì?"

#### b) **requirements** (array of strings)
```json
"requirements": [
  "Kiến thức cơ bản về lập trình (bất kỳ ngôn ngữ nào)",
  "Máy tính có cài đặt JDK 17+ và IntelliJ IDEA",
  "Hiểu biết cơ bản về SQL và cơ sở dữ liệu quan hệ"
]
```
**Hiển thị ở:** Section "Yêu cầu đầu vào"

#### c) **level** (string)
```json
"level": "Trung cấp"
```
**Giá trị:** "Cơ bản" | "Trung cấp" | "Nâng cao" | "Tất cả"
**Hiển thị ở:** Hero meta row

#### d) **totalDuration** (string hoặc number)
```json
"totalDuration": "32 giờ"
```
hoặc
```json
"totalDurationSeconds": 115200
```
**Hiển thị ở:** Hero meta row

#### e) **originalPrice** (number - optional)
```json
"originalPrice": 2500000
```
**Mục đích:** Tính % giảm giá
**Hiển thị ở:** Buy card (giá gạch ngang)

---

### 3. **Lesson Fields Cần Bổ Sung**

Trong response của `GET /section/course/{courseId}`, mỗi lesson cần có:

#### a) **isFree** hoặc **isPreview** (boolean)
```json
{
  "id": "lesson-001",
  "title": "Giới thiệu khóa học",
  "duration": 522,
  "type": "VIDEO",
  "isFree": true,  // <-- CẦN THÊM
  "order": 1
}
```
**Mục đích:** Đánh dấu bài học xem thử miễn phí
**Hiển thị:** Tag "Miễn phí" và icon unlock

#### b) **type** (string)
```json
"type": "VIDEO" | "DOCUMENT" | "QUIZ"
```
**Mục đích:** Hiển thị icon phù hợp (play/file/question)

---

## ✅ API ĐÃ CÓ - ĐANG SỬ DỤNG

1. ✅ `GET /course/{courseId}` - Lấy thông tin khóa học
2. ✅ `GET /section/course/{courseId}` - Lấy danh sách sections & lessons
3. ✅ `GET /review/course/{courseId}?page=0&size=10` - Lấy reviews
4. ✅ `GET /course/search?categoryId={id}&page=0&size=5` - Lấy khóa học liên quan
5. ✅ `GET /enrollment/status?userId={userId}&courseId={courseId}` - Kiểm tra đã đăng ký
6. ✅ `POST /enrollment` - Đăng ký khóa học miễn phí

---

## 📝 TÓM TẮT CÔNG VIỆC CẦN LÀM

### Backend (Anh làm):
1. Tạo API `GET /instructor/stats?instructorId={id}`
2. Thêm fields vào Course entity/DTO:
   - `outcomes` (List<String>)
   - `requirements` (List<String>)
   - `level` (String)
   - `totalDuration` (String hoặc Long)
   - `originalPrice` (Double)
3. Thêm fields vào Lesson entity/DTO:
   - `isFree` hoặc `isPreview` (Boolean)
   - `type` (String enum: VIDEO/DOCUMENT/QUIZ)

### Frontend (Em đã làm xong):
- ✅ Tạo file `detailcourse.js`
- ✅ Load và render tất cả data từ API
- ✅ Xử lý enrollment logic
- ✅ Hiển thị curriculum, reviews, related courses
- ✅ Setup event listeners

---

## 🔄 SAU KHI ANH HOÀN THÀNH API

Em sẽ:
1. Test lại toàn bộ trang detailcourse.html
2. Xử lý các edge cases (thiếu data, error...)
3. Tối ưu UI/UX nếu cần

---

**Anh check và làm các API trên giúp em nhé! 🙏**
