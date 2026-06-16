(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        if (token && userId) {
            let dispName = localStorage.getItem('userName') || 'Sinh viên';
            let avatarUrl = localStorage.getItem('userAvatar') || '';
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const data = JSON.parse(userStr);
                    dispName = data.fullName || data.username || dispName;
                    if (!avatarUrl) {
                        avatarUrl = data.avatar || data.avatarUrl || '';
                    }
                } catch(e) {}
            }
            
            const nameEl = document.getElementById('userNameDisplay') || document.getElementById('landingUserName');
            if(nameEl) nameEl.textContent = dispName;
            
            const avatarEl = document.getElementById('navUserAvatar');
            
            const renderAvatar = (url) => {
                if (avatarEl) {
                    if (url) {
                        avatarEl.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    } else {
                        avatarEl.textContent = dispName.charAt(0).toUpperCase();
                    }
                }
            };

            if (avatarUrl) {
                renderAvatar(avatarUrl);
            } else {
                renderAvatar('');
                
                // Fetch trực tiếp từ DB để đồng bộ avatar
                const API_BASE = 'http://localhost:8080';
                fetch(`${API_BASE}/profile/me?userId=${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => {
                    if (res.ok) return res.json();
                })
                .then(json => {
                    if (json && json.result) {
                        const data = json.result;
                        const newAvatar = data.avatar || data.avatarUrl || '';
                        if (newAvatar) {
                            localStorage.setItem('userAvatar', newAvatar);
                            localStorage.setItem('user', JSON.stringify(data));
                            renderAvatar(newAvatar);
                        }
                    }
                })
                .catch(err => console.warn("Failed to sync avatar in background", err));
            }
        }
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    // API_BASE is declared in HTML inline or we declare it here if needed
    const BASE_URL = typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8080';
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        window.location.href = '../login.html';
        return;
    }
    
    loadMyCourses(userId, token, BASE_URL);
});

async function loadMyCourses(userId, token, baseUrl) {
    const grid = document.getElementById('myCoursesGrid');
    const emptyState = document.getElementById('myCoursesEmpty');
    
    try {
        const res = await fetch(`${baseUrl}/enrollment/my-enrollment?userId=${userId}&page=0&size=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Cannot fetch enrollments');
        
        const json = await res.json();
        let courses = [];
        if (json.result && json.result.content) {
            courses = json.result.content;
        } else if (json.result && Array.isArray(json.result)) {
            courses = json.result;
        }
        
        if (courses.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        // Xóa Loader
        grid.innerHTML = '';
        
        for (const c of courses) {
            // Kiểm tra trạng thái đã Review chưa
            let isReviewed = false;
            try {
                const revRes = await fetch(`${baseUrl}/review/check-reviewed?userId=${userId}&courseId=${c.courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (revRes.ok) {
                    const revJson = await revRes.json();
                    isReviewed = revJson.result === true;
                }
            } catch(e) { 
                console.warn("Could not fetch review status", e); 
            }
            
            const progressVal = c.progress || 0;
            const progressPercent = Math.round(progressVal) + '%';
            
            let thumbUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80';
            if (c.courseThumbnailUrl) {
                if (c.courseThumbnailUrl.startsWith('http')) {
                    thumbUrl = c.courseThumbnailUrl;
                } else {
                    thumbUrl = `${baseUrl}/uploads/${c.courseThumbnailUrl}`;
                }
            }
            
            const card = document.createElement('div');
            card.className = 'course-card my-course-card';
            card.innerHTML = `
                <div class="course-thumb">
                    <img src="${thumbUrl}" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'" alt="${c.courseTitle}">
                    ${isReviewed 
                        ? '<span class="review-badge reviewed"><i class="fas fa-star"></i> Đã đánh giá</span>'
                        : '<span class="review-badge pending"><i class="fas fa-edit"></i> Chưa đánh giá</span>'
                    }
                </div>
                <div class="course-content">
                    <h3 class="course-title" title="${c.courseTitle}">${c.courseTitle}</h3>
                    <p class="course-instructor"><i class="fas fa-user-tie"></i> ${c.instructorName || 'Giảng viên'}</p>
                    
                    <div class="course-progress-wrapper">
                        <div class="progress-info">
                            <span>Tiến độ học tập</span>
                            <span class="progress-percent">${progressPercent}</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${progressPercent};"></div>
                        </div>
                    </div>
                    
                    <div class="my-course-actions">
                        <a href="learning.html?courseId=${c.courseId}" class="btn btn-primary btn-sm w-100">Tiếp tục học</a>
                        ${!isReviewed 
                            ? `<button class="btn btn-outline btn-sm w-100 mt-2" onclick="window.location.href='review.html?courseId=${c.courseId}'">Đánh giá khóa học</button>` 
                            : ''}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        }
        
    } catch (e) {
        console.error(e);
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'Lỗi kết nối';
        emptyState.querySelector('p').textContent = 'Không thể tải danh sách khóa học lúc này.';
    }
}
