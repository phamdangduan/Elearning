const API_BASE = 'http://localhost:8080';

// ── Auth Handling ──
function applyLandingNavAuth() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const uid = localStorage.getItem('userId');
    const guest = document.getElementById('navGuestActions');
    const logged = document.getElementById('navLoggedIn');
    const nameEl = document.getElementById('landingUserName');

    if (!guest || !logged) return;
    if (token && uid) {
        guest.hidden = true;
        logged.hidden = false;
        if (nameEl) {
            const disp = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Học viên';
            nameEl.textContent = disp.length > 26 ? disp.slice(0, 23) + '…' : disp;
            nameEl.title = disp;
            
            let avatarUrl = localStorage.getItem('userAvatar') || '';
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const data = JSON.parse(userStr);
                    if (!avatarUrl) {
                        avatarUrl = data.avatar || data.avatarUrl || '';
                    }
                } catch(e) {}
            }
            const avatarEl = document.getElementById('navUserAvatar');
            const renderAvatar = (url) => {
                if (avatarEl) {
                    if (url) {
                        avatarEl.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    } else {
                        avatarEl.textContent = disp.charAt(0).toUpperCase();
                    }
                }
            };

            if (avatarUrl) {
                renderAvatar(avatarUrl);
            } else {
                renderAvatar('');
                // Fetch ngầm nếu chưa có cache
                fetch(`${API_BASE}/profile/me?userId=${uid}`, {
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
        
        // Intercept "Khóa học" links to redirect to my-courses.html
        const courseLinks = document.querySelectorAll('a.nav-link[href*="catalog.html"]');
        courseLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'student/my-courses.html';
            });
        });
    } else {
        guest.hidden = false;
        logged.hidden = true;
    }
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    applyLandingNavAuth();
    loadCategories();
    loadFeaturedCourses();
    loadTopInstructors();

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
    });

    // Mobile menu
    document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('mobile-open');
        document.getElementById('navGuestActions').classList.toggle('mobile-open');
    });

    // Logout
    document.getElementById('landingLogoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });

    // Newsletter submit
    document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Cảm ơn bạn đã đăng ký nhận bản tin!');
        e.target.reset();
    });
});
