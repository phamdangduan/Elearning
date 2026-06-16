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
    } else {
        guest.hidden = false;
        logged.hidden = true;
    }
}

const dummyCourses = `
    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80" alt="Cybersecurity">
            <span class="course-badge hot">Bán chạy</span>
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i>
                </div>
                <span class="score">4.9</span>
                <span class="count">(2.5k)</span>
            </div>
            <h3 class="course-title">Kiến trúc Bảo mật Hệ thống Cloud & DevOps</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Trần Văn A</span>
            </div>
            <div class="course-footer">
                <span class="course-price">1.299.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-1', 'Kiến trúc Bảo mật Hệ thống Cloud & DevOps', 1299000, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', 'Trần Văn A')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>
    
    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80" alt="AI">
            <span class="course-badge">Mới</span>
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#e2e8f0"></i>
                </div>
                <span class="score">4.5</span>
                <span class="count">(1.2k)</span>
            </div>
            <h3 class="course-title">Lập trình AI căn bản với Python & TensorFlow</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Nguyễn Thị B</span>
            </div>
            <div class="course-footer">
                <span class="course-price">899.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-2', 'Lập trình AI căn bản với Python & TensorFlow', 899000, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80', 'Nguyễn Thị B')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>

    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80" alt="UI/UX">
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i>
                </div>
                <span class="score">4.8</span>
                <span class="count">(3.1k)</span>
            </div>
            <h3 class="course-title">Thiết kế UI/UX Nâng cao cho Sản phẩm SaaS</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Lê Văn C</span>
            </div>
            <div class="course-footer">
                <span class="course-price">1.500.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-3', 'Thiết kế UI/UX Nâng cao cho Sản phẩm SaaS', 1500000, 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80', 'Lê Văn C')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>
    
    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80" alt="Web Dev">
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#e2e8f0"></i>
                </div>
                <span class="score">4.7</span>
                <span class="count">(5.4k)</span>
            </div>
            <h3 class="course-title">Fullstack Web Development với Spring Boot & React</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Phạm D</span>
            </div>
            <div class="course-footer">
                <span class="course-price">2.000.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-4', 'Fullstack Web Development với Spring Boot & React', 2000000, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80', 'Phạm D')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>
`;

async function searchCatalog(keyword = '', categoryId = '') {
    const grid = document.getElementById('catalogGrid');
    const titleEl = document.getElementById('catalogTitle');
    
    if (keyword) {
        titleEl.innerText = `Kết quả tìm kiếm cho: "${keyword}"`;
    } else if (categoryId) {
        titleEl.innerText = "Khóa học theo danh mục";
    } else {
        titleEl.innerText = "Tất cả khóa học";
    }

    grid.innerHTML = `
        <div class="skeleton" style="height: 320px;"></div>
        <div class="skeleton" style="height: 320px;"></div>
        <div class="skeleton" style="height: 320px;"></div>
    `;

    try {
        let url = `${API_BASE}/course/search?page=0&size=20`;
        if (categoryId) {
            url += `&categoryId=${categoryId}`;
        }
        if (keyword) {
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }

        const data = await fetch(url).then(r => r.json());
        const courses = data?.result?.content || [];
        
        if (!courses.length) {
            if (keyword) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                        <i class="fas fa-search-minus" style="font-size: 56px; margin-bottom: 16px; color: #cbd5e1;"></i>
                        <p style="font-size: 16px; font-weight: 500; max-width: 500px; margin: 0 auto; line-height: 1.6;">Không tìm thấy khóa học nào khớp với từ khóa "${keyword}".</p>
                        <button onclick="clearSearch()" class="btn btn-outline" style="margin-top: 20px; padding: 8px 16px; border-radius: 8px;">Xem tất cả khóa học</button>
                    </div>
                `;
            } else {
                grid.innerHTML = dummyCourses;
            }
            return;
        }
        
        grid.innerHTML = courses.map((c, i) => `
            <div class="course-card" onclick="location.href='course-detail.html?id=${c.id}'">
                <div class="course-thumb">
                    <img src="${c.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'}" alt="${c.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'">
                    ${i === 0 ? '<span class="course-badge hot">Bán chạy</span>' : (i === 1 ? '<span class="course-badge">Mới</span>' : '')}
                </div>
                <div class="course-body">
                    <div class="course-rating">
                        <div class="stars">
                            ${Array(5).fill(0).map((_, idx) => `<i class="fas fa-star" style="color:${idx < Math.round(c.averageRating || 5) ? '#f5a623' : '#e2e8f0'}"></i>`).join('')}
                        </div>
                        <span class="score">${(c.averageRating || 5).toFixed(1)}</span>
                        <span class="count">(${c.totalEnrollments || 0})</span>
                    </div>
                    <h3 class="course-title">${c.title}</h3>
                    <div class="course-instructor">
                        <i class="fas fa-user-circle"></i> <span>${c.instructorName || 'Giảng viên'}</span>
                    </div>
                    <div class="course-footer">
                        <span class="course-price ${!c.price ? 'free' : ''}">${c.price ? c.price.toLocaleString('vi-VN') + 'đ' : 'Miễn phí'}</span>
                        <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('\${c.id}', '\${c.title.replace(/\'/g, &quot;\\\\'&quot;)}', \${c.price || 0}, '\${c.thumbnailUrl || &quot;&quot;}', '\${(c.instructorName || &quot;Giảng viên&quot;).replace(/\'/g, &quot;\\\\'&quot;)}')"><i class="fas fa-shopping-cart"></i></div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Catalog search error:', e);
        grid.innerHTML = dummyCourses;
    }
}

window.clearSearch = function() {
    document.getElementById('catalogSearchInput').value = '';
    window.history.pushState({}, '', 'catalog.html');
    searchCatalog('', '');
};

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    applyLandingNavAuth();
    
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId') || '';
    const keyword = urlParams.get('keyword') || '';
    
    if (keyword) {
        document.getElementById('catalogSearchInput').value = keyword;
    }
    
    searchCatalog(keyword, categoryId);

    // Search Form Submit Handler
    document.getElementById('catalogSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const val = document.getElementById('catalogSearchInput').value.trim();
        
        // Update URL parameter without reloading the page
        const newUrl = val ? `catalog.html?keyword=${encodeURIComponent(val)}` : 'catalog.html';
        window.history.pushState({}, '', newUrl);
        
        searchCatalog(val, '');
    });

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
