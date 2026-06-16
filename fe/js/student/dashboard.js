document.addEventListener('DOMContentLoaded', () => {
    loadMyCourses();
});

async function loadMyCourses() {
    const grid = document.getElementById('myCoursesGrid');
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Vui lòng đăng nhập để xem khóa học.");
        window.location.href = '../login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/v1/my-enrollment`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Lỗi khi tải dữ liệu khóa học');
        }

        const data = await response.json();
        
        // Cập nhật tên user trên Header
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            document.getElementById('userNameDisplay').textContent = user.fullName || user.username || 'Sinh viên';
        }

        renderCourses(data, grid);

    } catch (error) {
        console.error('Error loadMyCourses:', error);
        grid.innerHTML = `<p style="color: red;">Không thể tải dữ liệu: ${error.message}</p>`;
    }
}

function renderCourses(enrollments, container) {
    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <img src="../login-hero.png" alt="Empty" style="width: 150px; opacity: 0.5; margin-bottom: 20px;">
                <h3 style="color: #475569; margin-bottom: 12px;">Bạn chưa đăng ký khóa học nào</h3>
                <a href="../catalog.html" class="btn btn-primary">Khám phá khóa học ngay</a>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    enrollments.forEach(enr => {
        // Mock data nếu API chưa trả đủ thông tin khóa học. (Tuỳ thuộc vào schema Backend)
        // enr.course.title, enr.course.thumbnail, enr.progress
        const course = enr.course || {};
        const title = course.title || 'Khóa học chưa rõ tên';
        const thumbnail = course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80';
        const progress = enr.progress || 0;

        const card = document.createElement('div');
        card.className = 'course-card';

        card.innerHTML = `
            <img src="${thumbnail}" alt="Thumbnail" class="course-thumbnail">
            <div class="course-info">
                <h3 class="course-title" title="${title}">${title}</h3>
                
                <div class="course-progress-wrap">
                    <div class="progress-header">
                        <span>Tiến độ học tập</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>

                <div class="course-actions">
                    <a href="learning.html?courseId=${course.id}" class="btn btn-primary btn-sm" style="width: 100%; text-align: center;">
                        ${progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                    </a>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}
