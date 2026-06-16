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

const dummyGridInstructors = `
    <div class="ins-grid-card">
        <div class="ins-grid-img">
            <span class="ins-grid-badge">Senior Expert</span>
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" alt="Lê Thị Minh Anh">
        </div>
        <div class="ins-grid-body">
            <h3 class="ins-grid-name">Lê Thị Minh Anh</h3>
            <p class="ins-grid-title">Senior UI/UX Designer tại GlobalTech</p>
            <div class="ins-grid-stats">
                <i class="fas fa-star"></i>
                <span class="score">4.9</span>
                <span class="reviews">(1.2k) ĐG,</span>
                <span>8.500 Học viên</span>
            </div>
            <button class="btn btn-primary ins-grid-action">Xem hồ sơ</button>
        </div>
    </div>
    
    <div class="ins-grid-card">
        <div class="ins-grid-img">
            <span class="ins-grid-badge">Lead Architect</span>
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" alt="Nguyễn Văn Hoàng">
        </div>
        <div class="ins-grid-body">
            <h3 class="ins-grid-name">Nguyễn Văn Hoàng</h3>
            <p class="ins-grid-title">Software Architect & Fullstack Dev</p>
            <div class="ins-grid-stats">
                <i class="fas fa-star"></i>
                <span class="score">4.8</span>
                <span class="reviews">(850) ĐG,</span>
                <span>5.100 Học viên</span>
            </div>
            <button class="btn btn-outline-primary ins-grid-action">Xem hồ sơ</button>
        </div>
    </div>
    
    <div class="ins-grid-card">
        <div class="ins-grid-img">
            <span class="ins-grid-badge">Marketing Lead</span>
            <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" alt="Trần Thanh Vân">
        </div>
        <div class="ins-grid-body">
            <h3 class="ins-grid-name">Trần Thanh Vân</h3>
            <p class="ins-grid-title">Head of Growth tại Vingroup</p>
            <div class="ins-grid-stats">
                <i class="fas fa-star"></i>
                <span class="score">5.0</span>
                <span class="reviews">(2.1k) ĐG,</span>
                <span>12.300 Học viên</span>
            </div>
            <button class="btn btn-outline-primary ins-grid-action">Xem hồ sơ</button>
        </div>
    </div>
    
    <div class="ins-grid-card">
        <div class="ins-grid-img">
            <span class="ins-grid-badge">Business Coach</span>
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80" alt="Phạm Thành Đạt">
        </div>
        <div class="ins-grid-body">
            <h3 class="ins-grid-name">Phạm Thành Đạt</h3>
            <p class="ins-grid-title">Founder of Business Strategy Hub</p>
            <div class="ins-grid-stats">
                <i class="fas fa-star"></i>
                <span class="score">4.7</span>
                <span class="reviews">(650) ĐG,</span>
                <span>3.200 Học viên</span>
            </div>
            <button class="btn btn-outline-primary ins-grid-action">Xem hồ sơ</button>
        </div>
    </div>
    
    <div class="ins-grid-card">
        <div class="ins-grid-img">
            <span class="ins-grid-badge">Creative Expert</span>
            <img src="https://images.unsplash.com/photo-1531123897727-8f129e1bfa8ea?auto=format&fit=crop&w=400&q=80" alt="Đặng Mỹ Linh">
        </div>
        <div class="ins-grid-body">
            <h3 class="ins-grid-name">Đặng Mỹ Linh</h3>
            <p class="ins-grid-title">Creative Director tại ArtFlow</p>
            <div class="ins-grid-stats">
                <i class="fas fa-star"></i>
                <span class="score">4.9</span>
                <span class="reviews">(420) ĐG,</span>
                <span>4.500 Học viên</span>
            </div>
            <button class="btn btn-outline-primary ins-grid-action">Xem hồ sơ</button>
        </div>
    </div>
`;

async function loadPageInstructors() {
    const grid = document.getElementById('insPageGrid');
    if(!grid) return;
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const data = await fetch(`${API_BASE}/profile/instructors`).then(r => r.json());
        const instructors = data?.result || [];
        if (!instructors.length) {
            grid.innerHTML = dummyGridInstructors;
            return;
        }

        // Fetch stats for all instructors concurrently
        const instructorsWithStats = await Promise.all(
            instructors.map(async (ins) => {
                try {
                    const headers = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const statsRes = await fetch(`${API_BASE}/instructor/stats?instructorId=${ins.id}`, { headers });
                    if (statsRes.ok) {
                        const statsJson = await statsRes.json();
                        if (statsJson && statsJson.result) {
                            return { ...ins, stats: statsJson.result };
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to fetch stats for instructor ${ins.id}`, err);
                }
                return { ...ins, stats: null };
            })
        );

        grid.innerHTML = instructorsWithStats.map((ins, i) => {
            const stats = ins.stats;
            const avgRating = stats && stats.averageRating !== null && stats.averageRating !== undefined 
                ? parseFloat(stats.averageRating).toFixed(1) 
                : '0.0';
            const totalReviews = stats && stats.totalReviews !== null && stats.totalReviews !== undefined
                ? stats.totalReviews
                : 0;
            const totalStudents = stats && stats.totalStudents !== null && stats.totalStudents !== undefined
                ? stats.totalStudents
                : 0;

            const formatCount = (num) => {
                if (num >= 1000) {
                    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
                }
                return num.toString();
            };

            const formattedReviews = formatCount(totalReviews);
            const formattedStudents = totalStudents.toLocaleString('vi-VN');

            return `
                <div class="ins-grid-card">
                    <div class="ins-grid-img">
                        <span class="ins-grid-badge">${i === 0 ? 'Top Rated' : (i===1 ? 'Bestseller' : 'Expert')}</span>
                        <img src="${ins.avatar || ins.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'}" alt="${ins.fullName}">
                    </div>
                    <div class="ins-grid-body">
                        <h3 class="ins-grid-name">${ins.fullName}</h3>
                        <p class="ins-grid-title">${ins.specialization || ins.bio || 'Giảng viên cấp cao'}</p>
                        <div class="ins-grid-stats">
                            <i class="fas fa-star"></i>
                            <span class="score">${avgRating}</span>
                            <span class="reviews">(${formattedReviews}) ĐG,</span>
                            <span>${formattedStudents} Học viên</span>
                        </div>
                        <button class="btn ${i === 0 ? 'btn-primary' : 'btn-outline-primary'} ins-grid-action" onclick="window.location.href='instructor-profile.html?id=${ins.id}'">Xem hồ sơ</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
        grid.innerHTML = dummyGridInstructors;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPageInstructors();
});
