(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        const guestNav = document.getElementById('navGuestActions');
        const userNav = document.getElementById('navLoggedIn');
        if (token && userId) {
            if (guestNav) guestNav.style.display = 'none';
            if (userNav) userNav.style.display = 'flex';
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
        } else {
            if (guestNav) guestNav.style.display = 'flex';
            if (userNav) userNav.style.display = 'none';
        }
    });
})();

const API_BASE = 'http://localhost:8080';

// Get instructor ID from URL query parameters
function getInstructorIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadInstructorProfile() {
    const instructorId = getInstructorIdFromURL();
    if (!instructorId) {
        alert("Không tìm thấy mã giảng viên!");
        window.location.href = "instructors.html";
        return;
    }

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 1. Fetch instructor profile info
        const profileRes = await fetch(`${API_BASE}/profile/${instructorId}`, { headers });
        if (!profileRes.ok) {
            throw new Error(`Cannot load profile: HTTP ${profileRes.status}`);
        }
        const profileJson = await profileRes.json();
        const profile = profileJson.result;

        if (!profile) {
            throw new Error("Instructor profile not found in response");
        }

        // Render profile info
        const breadcrumbEl = document.getElementById('breadcrumbInstructorName');
        if (breadcrumbEl) {
            breadcrumbEl.textContent = profile.fullName || 'Hồ sơ giảng viên';
        }
        document.getElementById('instructorName').textContent = profile.fullName || 'Giảng viên';
        document.getElementById('instructorEmail').textContent = profile.email || '';
        document.getElementById('instructorBio').textContent = profile.bio || 'Chưa có thông tin giới thiệu.';

        // Render Avatar
        const avatarEl = document.getElementById('instructorAvatar');
        if (avatarEl) {
            if (profile.avatar) {
                avatarEl.innerHTML = `<img src="${profile.avatar}" alt="${profile.fullName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                avatarEl.style.background = 'none';
            } else {
                avatarEl.textContent = (profile.fullName || 'G').charAt(0).toUpperCase();
            }
        }

        // Optional check for specialization or bio summary to show as badge
        const badgeEl = document.getElementById('instructorTitle');
        if (badgeEl) {
            // If bio is short, we can use it, else default to Giảng viên cấp cao
            const shortBio = profile.bio && profile.bio.length < 50 ? profile.bio : 'Giảng viên cấp cao';
            badgeEl.textContent = shortBio;
        }

        // 2. Fetch instructor stats (rating, reviews, students, courses)
        const statsRes = await fetch(`${API_BASE}/instructor/stats?instructorId=${instructorId}`, { headers });
        if (statsRes.ok) {
            const statsJson = await statsRes.json();
            const stats = statsJson.result;

            if (stats) {
                const avgRating = stats.averageRating !== null && stats.averageRating !== undefined 
                    ? parseFloat(stats.averageRating).toFixed(1) 
                    : '0.0';
                
                document.getElementById('statRating').textContent = avgRating;
                document.getElementById('statReviews').textContent = stats.totalReviews || 0;
                document.getElementById('statStudents').textContent = (stats.totalStudents || 0).toLocaleString('vi-VN');
                document.getElementById('statCourses').textContent = stats.totalCourses || 0;

                // Render courses
                renderInstructorCourses(stats.courseStats || []);
            }
        } else {
            console.warn("Failed to load instructor stats");
            renderInstructorCourses([]);
        }

    } catch (e) {
        console.error("Error loading instructor details:", e);
        document.getElementById('instructorBio').innerHTML = `<p style="color: #ef4444;">Đã có lỗi xảy ra khi tải hồ sơ giảng viên. Vui lòng thử lại sau.</p>`;
    }
}

function renderInstructorCourses(courses) {
    const grid = document.getElementById('instructorCoursesGrid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; background: #f8fafc; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <i class="fas fa-inbox" style="font-size: 40px; margin-bottom: 12px; color: #94a3b8; display: block;"></i>
                Chưa có khóa học nào được xuất bản bởi giảng viên này.
            </div>
        `;
        return;
    }

    grid.innerHTML = courses.map(c => {
        const thumbUrl = c.courseThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80';
        const formattedPrice = c.coursePrice ? c.coursePrice.toLocaleString('vi-VN') + 'đ' : 'Miễn phí';
        const ratingScore = c.averageRating !== null && c.averageRating !== undefined
            ? parseFloat(c.averageRating).toFixed(1)
            : '0.0';

        return `
            <div class="ins-course-card" onclick="window.location.href='../course-detail.html?id=${c.courseId}'">
                <img class="ins-course-img" src="${thumbUrl}" alt="${c.courseTitle}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'">
                <div class="ins-course-body">
                    <h4 class="ins-course-name" title="${c.courseTitle}">${c.courseTitle}</h4>
                    <div class="ins-course-stats">
                        <span class="ins-course-rating">
                            <i class="fas fa-star"></i> ${ratingScore}
                        </span>
                        <span class="ins-course-price">${formattedPrice}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadInstructorProfile();
});
