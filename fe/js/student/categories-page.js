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

const catVisuals = {
    'Frontend': 'fa-laptop-code',
    'Backend': 'fa-server',
    'Mobile': 'fa-mobile-alt',
    'Database': 'fa-database',
    'DevOps': 'fa-infinity',
    'AI & Data': 'fa-brain',
    'Cloud': 'fa-cloud',
    'Security': 'fa-shield-alt',
    'Design': 'fa-palette'
};

const dummyPageCategories = `
    <div class="cat-page-card" onclick="location.href='../catalog.html?categoryId=1'">
        <div class="cat-page-icon"><i class="fas fa-laptop-code"></i></div>
        <h3>Công nghệ thông tin</h3>
        <p>120+ Khóa học</p>
    </div>
    <div class="cat-page-card" onclick="location.href='../catalog.html?categoryId=2'">
        <div class="cat-page-icon"><i class="fas fa-chart-line"></i></div>
        <h3>Kinh doanh & Khởi nghiệp</h3>
        <p>85+ Khóa học</p>
    </div>
    <div class="cat-page-card" onclick="location.href='../catalog.html?categoryId=3'">
        <div class="cat-page-icon"><i class="fas fa-palette"></i></div>
        <h3>Thiết kế & Đồ họa</h3>
        <p>64+ Khóa học</p>
    </div>
    <div class="cat-page-card" onclick="location.href='../catalog.html?categoryId=4'">
        <div class="cat-page-icon"><i class="fas fa-bullhorn"></i></div>
        <h3>Marketing & Truyền thông</h3>
        <p>90+ Khóa học</p>
    </div>
`;

async function loadPageCategories() {
    const grid = document.getElementById('categoryPageGrid');
    if(!grid) return;
    
    try {
        const data = await fetch(`${API_BASE}/category`).then(r => r.json());
        const cats = data?.result || [];
        if (!cats.length) {
            grid.innerHTML = dummyPageCategories;
            return;
        }
        grid.innerHTML = cats.map(cat => {
            const icon = catVisuals[cat.name] || 'fa-book';
            return `
            <div class="cat-page-card" onclick="location.href='../catalog.html?categoryId=${cat.id}'">
                <div class="cat-page-icon"><i class="fas ${icon}"></i></div>
                <h3>${cat.name}</h3>
                <p>${cat.courseCount || Math.floor(Math.random() * 50 + 10)} Khóa học</p>
            </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Categories error:', e);
        grid.innerHTML = dummyPageCategories;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPageCategories();
});
