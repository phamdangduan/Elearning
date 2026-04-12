# 📘 Hướng Dẫn Test API Backend → Frontend

## 🎯 Tổng Quan
Backend: `http://localhost:8080`  
Frontend: `http://127.0.0.1:5500` (Live Server)

---

## 📋 Danh Sách API Được Frontend Sử Dụng

### 1️⃣ **COURSE APIs** - Quản lý khóa học

#### 🔹 Lấy danh sách khóa học (Published)
```http
GET http://localhost:8080/course/search?page=0&size=6&sort=createdAt,desc
```

**Response Format:**
```json
{
  "status": 200,
  "message": "Get courses successfully",
  "result": {
    "content": [
      {
        "id": "course-uuid",
        "title": "Lập trình Java cơ bản",
        "description": "Khóa học Java từ đầu",
        "thumbnailUrl": "https://cloudinary.com/...",
        "price": 500000,
        "averageRating": 4.5,
        "totalReviews": 10,
        "totalEnrollments": 50,
        "status": "PUBLISHED",
        "instructorName": "Nguyễn Văn A",
        "categories": [
          { "id": "cat-1", "name": "Lập trình" }
        ]
      }
    ],
    "pageNo": 0,
    "pageSize": 6,
    "totalElement": 20,
    "totalPages": 4,
    "last": false
  }
}
```

**Test trong Postman:**
- Method: `GET`
- URL: `http://localhost:8080/course/search?page=0&size=6&sort=createdAt,desc`
- Không cần body

---

#### 🔹 Tìm kiếm khóa học với filter
```http
GET http://localhost:8080/course/search?page=0&size=6&keyword=java&categoryId=cat-1
```

**Query Parameters:**
- `page`: Số trang (0, 1, 2...)
- `size`: Số item mỗi trang
- `keyword`: Từ khóa tìm kiếm (optional)
- `categoryId`: Lọc theo danh mục (optional)
- `sort`: Sắp xếp (createdAt,desc)

---

#### 🔹 Lấy chi tiết khóa học
```http
GET http://localhost:8080/course/{courseId}
```

**Example:**
```http
GET http://localhost:8080/course/abc-123-xyz
```

**Response:**
```json
{
  "status": 200,
  "message": "Get course detail successfully",
  "result": {
    "id": "abc-123-xyz",
    "title": "Lập trình Java",
    "description": "Mô tả chi tiết...",
    "thumbnailUrl": "https://...",
    "price": 500000,
    "averageRating": 4.5,
    "totalReviews": 10,
    "totalEnrollments": 50,
    "instructorName": "Nguyễn Văn A",
    "categories": [...],
    "sections": [
      {
        "id": "section-1",
        "title": "Chương 1: Giới thiệu",
        "orderIndex": 0,
        "lessons": [
          {
            "id": "lesson-1",
            "title": "Bài 1: Cài đặt",
            "contentType": "VIDEO",
            "contentUrl": "https://...",
            "durationInSeconds": 600
          }
        ]
      }
    ]
  }
}
```

---

### 2️⃣ **CATEGORY APIs** - Danh mục

#### 🔹 Lấy tất cả danh mục
```http
GET http://localhost:8080/category
```

**Response:**
```json
{
  "status": 200,
  "message": "Get categories successfully",
  "result": [
    {
      "id": "cat-1",
      "name": "Lập trình",
      "description": "Các khóa học lập trình",
      "iconUrl": "https://cloudinary.com/..."
    },
    {
      "id": "cat-2",
      "name": "Thiết kế",
      "description": "Các khóa học thiết kế"
    }
  ]
}
```

---

### 3️⃣ **PROFILE APIs** - Thông tin người dùng

#### 🔹 Lấy profile của user
```http
GET http://localhost:8080/profile/me?userId=student-001
```

**Response:**
```json
{
  "status": 200,
  "message": "Get profile successfully",
  "result": {
    "profileId": "profile-1",
    "userId": "student-001",
    "firstName": "Nguyễn",
    "lastName": "Văn A",
    "fullName": "Nguyễn Văn A",
    "avatar": "https://cloudinary.com/...",
    "email": "student@example.com",
    "phone": "0123456789",
    "bio": "Học viên nhiệt huyết"
  }
}
```

---

#### 🔹 Lấy danh sách giảng viên
```http
GET http://localhost:8080/profile/instructors
```

**Response:**
```json
{
  "status": 200,
  "message": "Get instructors successfully",
  "result": [
    {
      "profileId": "profile-2",
      "userId": "teacher-001",
      "fullName": "Trần Thị B",
      "avatar": "https://...",
      "bio": "Giảng viên 10 năm kinh nghiệm"
    }
  ]
}
```

---

### 4️⃣ **ENROLLMENT APIs** - Đăng ký khóa học

#### 🔹 Kiểm tra trạng thái đăng ký
```http
GET http://localhost:8080/enrollment/status?userId=student-001&courseId=course-123
```

**Response:**
```json
{
  "status": 200,
  "message": "Get enrollment status successfully",
  "result": {
    "isEnrolled": true,
    "enrollmentDate": "2024-01-15T10:30:00"
  }
}
```

---

#### 🔹 Đăng ký khóa học (Miễn phí)
```http
POST http://localhost:8080/enrollment
Content-Type: application/json

{
  "userId": "student-001",
  "courseId": "course-123"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Enrollment created successfully",
  "result": {
    "id": "enrollment-1",
    "userId": "student-001",
    "courseId": "course-123",
    "enrollmentDate": "2024-01-15T10:30:00"
  }
}
```

---

#### 🔹 Lấy danh sách khóa học đã đăng ký
```http
GET http://localhost:8080/enrollment/my-enrollment?userId=student-001&page=0&size=10&sort=enrollmentDate,desc
```

**Response:**
```json
{
  "status": 200,
  "message": "Get my enrollments successfully",
  "result": {
    "content": [
      {
        "id": "enrollment-1",
        "courseId": "course-123",
        "courseTitle": "Lập trình Java",
        "courseThumbnail": "https://...",
        "enrollmentDate": "2024-01-15T10:30:00",
        "progress": 45.5,
        "completedLessons": 5,
        "totalLessons": 11
      }
    ],
    "pageNo": 0,
    "pageSize": 10,
    "totalElement": 3,
    "totalPages": 1,
    "last": true
  }
}
```

---

### 5️⃣ **STUDENT STATS APIs** - Thống kê học viên

#### 🔹 Lấy thống kê học viên
```http
GET http://localhost:8080/student/stats?studentId=student-001
```

**Response:**
```json
{
  "status": 200,
  "message": "Get student stats successfully",
  "result": {
    "totalEnrolledCourses": 5,
    "totalCompletedCourses": 2,
    "totalInProgressCourses": 3,
    "totalCompletedLessons": 25
  }
}
```

---

### 6️⃣ **NOTIFICATION APIs** - Thông báo

#### 🔹 Lấy danh sách thông báo
```http
GET http://localhost:8080/notifications/my-notifications?userId=student-001&page=0&size=10
```

**Response:**
```json
{
  "status": 200,
  "message": "Get notifications successfully",
  "result": {
    "content": [
      {
        "id": "noti-1",
        "userId": "student-001",
        "title": "Thanh toán thành công",
        "message": "Bạn đã đăng ký khóa học Java thành công",
        "type": "PAYMENT_CONFIRMED",
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00"
      }
    ],
    "pageNo": 0,
    "pageSize": 10,
    "totalElement": 5,
    "totalPages": 1,
    "last": true
  }
}
```

---

#### 🔹 Đếm số thông báo chưa đọc
```http
GET http://localhost:8080/notifications/unread-count?userId=student-001
```

**Response:**
```json
{
  "status": 200,
  "message": "Get unread count successfully",
  "result": 3
}
```

---

#### 🔹 Đánh dấu đã đọc
```http
PUT http://localhost:8080/notifications/{notificationId}/mark-read?userId=student-001
```

---

### 7️⃣ **PAYMENT REQUEST APIs** - Thanh toán

#### 🔹 Lấy thông tin thanh toán cho khóa học
```http
GET http://localhost:8080/payment-requests/courses/{courseId}/payment-info
```

**Response:**
```json
{
  "status": 200,
  "message": "Get payment info successfully",
  "result": {
    "courseId": "course-123",
    "courseTitle": "Lập trình Java",
    "coursePrice": 500000,
    "instructorId": "teacher-001",
    "instructorName": "Trần Thị B",
    "bankAccounts": [
      {
        "id": "bank-1",
        "bankName": "Vietcombank",
        "accountNumber": "1234567890",
        "accountName": "TRAN THI B",
        "qrCodeUrl": "https://...",
        "isPrimary": true
      }
    ]
  }
}
```

---

## 🧪 Cách Test API với Postman

### Bước 1: Tạo Collection mới
1. Mở Postman
2. Click "New" → "Collection"
3. Đặt tên: "EduVN E-Learning APIs"

### Bước 2: Thêm các request
1. Click "Add request" trong collection
2. Đặt tên request (VD: "Get All Courses")
3. Chọn method (GET/POST/PUT/DELETE)
4. Nhập URL
5. Thêm Query Params hoặc Body nếu cần
6. Click "Send"

### Bước 3: Kiểm tra Response
- Status code: 200 (thành công)
- Response body có đúng format JSON không
- Data có đầy đủ fields không

---

## 🔍 Test Cases Quan Trọng

### ✅ Test Case 1: Lấy danh sách khóa học
```
URL: GET http://localhost:8080/course/search?page=0&size=6
Expected: Status 200, có array courses
```

### ✅ Test Case 2: Tìm kiếm khóa học
```
URL: GET http://localhost:8080/course/search?keyword=java
Expected: Chỉ trả về courses có "java" trong title/description
```

### ✅ Test Case 3: Lấy profile user
```
URL: GET http://localhost:8080/profile/me?userId=student-001
Expected: Status 200, có thông tin profile
```

### ✅ Test Case 4: Đăng ký khóa học miễn phí
```
URL: POST http://localhost:8080/enrollment
Body: {"userId": "student-001", "courseId": "course-123"}
Expected: Status 200, enrollment created
```

### ✅ Test Case 5: Kiểm tra enrollment status
```
URL: GET http://localhost:8080/enrollment/status?userId=student-001&courseId=course-123
Expected: isEnrolled = true nếu đã đăng ký
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### ❌ Lỗi 404 Not Found
**Nguyên nhân:**
- URL sai
- Resource không tồn tại (VD: userId không có trong DB)

**Giải pháp:**
- Kiểm tra lại URL
- Kiểm tra userId/courseId có tồn tại trong database không

### ❌ Lỗi 500 Internal Server Error
**Nguyên nhân:**
- Backend có exception
- Database connection lỗi

**Giải pháp:**
- Xem log trong console Spring Boot
- Kiểm tra MySQL có đang chạy không

### ❌ CORS Error (Frontend)
**Nguyên nhân:**
- Backend chưa config CORS cho frontend origin

**Giải pháp:**
- Đã có CorsConfig cho phép all origins

---

## 📊 Kiểm Tra Response Format

Tất cả API đều trả về format chuẩn:
```json
{
  "status": 200,
  "message": "Success message",
  "result": { /* data */ }
}
```

Hoặc khi lỗi:
```json
{
  "status": 404,
  "message": "Profile not found",
  "result": null
}
```

---

## 🚀 Test Flow Hoàn Chỉnh

### Scenario: Học viên đăng ký khóa học miễn phí

1. **Lấy danh sách khóa học**
   ```
   GET /course/search?page=0&size=6
   ```

2. **Xem chi tiết khóa học**
   ```
   GET /course/{courseId}
   ```

3. **Kiểm tra đã đăng ký chưa**
   ```
   GET /enrollment/status?userId=student-001&courseId={courseId}
   ```

4. **Đăng ký khóa học (nếu chưa)**
   ```
   POST /enrollment
   Body: {"userId": "student-001", "courseId": "{courseId}"}
   ```

5. **Xem danh sách khóa học đã đăng ký**
   ```
   GET /enrollment/my-enrollment?userId=student-001
   ```

6. **Xem thống kê**
   ```
   GET /student/stats?studentId=student-001
   ```

---

## 💡 Tips

1. **Sử dụng Environment Variables trong Postman**
   - Tạo variable `baseUrl` = `http://localhost:8080`
   - Dùng `{{baseUrl}}/course/search` thay vì URL đầy đủ

2. **Save Response để test**
   - Click "Save Response" để lưu example response
   - Dùng để so sánh khi test lại

3. **Test với nhiều userId khác nhau**
   - student-001, teacher-001, teacher-003
   - Kiểm tra data có đúng với từng user không

4. **Kiểm tra Pagination**
   - Test với page=0, page=1
   - Kiểm tra totalPages, last có đúng không

---

## 📝 Checklist Test API

- [ ] GET /course/search - Lấy danh sách khóa học
- [ ] GET /course/{id} - Chi tiết khóa học
- [ ] GET /category - Danh sách danh mục
- [ ] GET /profile/me - Profile user
- [ ] GET /profile/instructors - Danh sách giảng viên
- [ ] GET /enrollment/status - Kiểm tra enrollment
- [ ] POST /enrollment - Đăng ký khóa học
- [ ] GET /enrollment/my-enrollment - Khóa học đã đăng ký
- [ ] GET /student/stats - Thống kê học viên
- [ ] GET /notifications/my-notifications - Danh sách thông báo
- [ ] GET /notifications/unread-count - Số thông báo chưa đọc

---

**Chúc anh test API thành công! 🎉**
