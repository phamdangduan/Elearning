const API_BASE = 'http://localhost:8080';

        async function applyLandingNavAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            
            const guest = document.getElementById('navGuestActions');
            const logged = document.getElementById('navLoggedIn');
            
            if (token && uid) {
                if (guest) guest.style.display = 'none';
                if (logged) logged.style.display = 'flex';
                
                const userNameNav = document.getElementById('userNameNav');
                const dropdownName = document.getElementById('dropdownName');
                const dropdownEmail = document.getElementById('dropdownEmail');
                const userAvatarNav = document.getElementById('userAvatarNav');
                const dropdownAvatar = document.getElementById('dropdownAvatar');
                
                const dispName = localStorage.getItem('userName') || 'Học viên';
                const dispEmail = localStorage.getItem('userEmail') || 'student@eduvn.com';
                const initial = dispName.trim()[0].toUpperCase();
                
                if (userNameNav) userNameNav.textContent = dispName;
                if (dropdownName) dropdownName.textContent = dispName;
                if (dropdownEmail) dropdownEmail.textContent = dispEmail;
                if (userAvatarNav) userAvatarNav.innerHTML = `<span style="font-weight:700">${initial}</span>`;
                if (dropdownAvatar) dropdownAvatar.innerHTML = `<span style="font-weight:700">${initial}</span>`;
                
                try {
                    const headers = {};
                    if (token) headers['Authorization'] = 'Bearer ' + token;
                    const res = await fetch(`${API_BASE}/profile/me?userId=${uid}`, { headers });
                    if (res.ok) {
                        const data = await res.json();
                        const profile = data?.result;
                        if (profile) {
                            const fullName = profile.fullName || profile.firstName || dispName;
                            const apiInitial = fullName.trim()[0].toUpperCase();
                            
                            if (userNameNav) userNameNav.textContent = fullName;
                            if (dropdownName) dropdownName.textContent = fullName;
                            if (profile.email && dropdownEmail) dropdownEmail.textContent = profile.email;
                            
                            if (profile.avatar) {
                                const imgHtml = `<img src="${profile.avatar}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                                if (userAvatarNav) userAvatarNav.innerHTML = imgHtml;
                                if (dropdownAvatar) dropdownAvatar.innerHTML = imgHtml;
                            } else {
                                const initHtml = `<span style="font-weight:700">${apiInitial}</span>`;
                                if (userAvatarNav) userAvatarNav.innerHTML = initHtml;
                                if (dropdownAvatar) dropdownAvatar.innerHTML = initHtml;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to load user profile from API", e);
                }
                
                loadNotifications(uid, token);
                
            } else {
                if (guest) guest.style.display = 'flex';
                if (logged) logged.style.display = 'none';
            }
        }

        async function loadNotifications(userId, token) {
            try {
                const headers = {};
                if (token) headers['Authorization'] = 'Bearer ' + token;
                
                const [notiRes, countRes] = await Promise.all([
                    fetch(`${API_BASE}/notifications/my-notifications?userId=${userId}&page=0&size=10`, { headers }),
                    fetch(`${API_BASE}/notifications/unread-count?userId=${userId}`, { headers })
                ]);
                
                let count = 0;
                if (countRes.ok) {
                    const countData = await countRes.json();
                    count = countData?.result || 0;
                }
                
                const badge = document.getElementById('notiBadge');
                if (badge) {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'flex' : 'none';
                }
                
                const list = document.getElementById('notiList');
                if (list && notiRes.ok) {
                    const notiData = await notiRes.json();
                    const notis = notiData?.result?.content || [];
                    
                    if (notis.length === 0) {
                        list.innerHTML = `<div class="noti-empty"><i class="fas fa-bell-slash"></i><p>Chưa có thông báo</p></div>`;
                        return;
                    }
                    
                    const cfg = {
                        PAYMENT_CONFIRMED: { icon: 'fa-check-circle', cls: 'payment' },
                        PAYMENT_REJECTED: { icon: 'fa-times-circle', cls: 'alert' },
                        PAYMENT_EXPIRED: { icon: 'fa-clock', cls: 'alert' },
                        PAYMENT_PROOF_UPLOADED: { icon: 'fa-file-upload', cls: 'info' }
                    };
                    
                    list.innerHTML = notis.map(n => {
                        const c = cfg[n.type] || { icon: 'fa-bell', cls: 'info' };
                        const time = n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : '';
                        return `
                            <div class="noti-item ${!n.isRead ? 'unread' : ''}" onclick="markNotificationRead('${n.id}', '${userId}')">
                                <div class="noti-item-icon ${c.cls}"><i class="fas ${c.icon}"></i></div>
                                <div class="noti-item-body">
                                    <p><strong>${n.title}</strong><br>${n.message}</p>
                                    <small>${time}</small>
                                </div>
                                ${!n.isRead ? '<div class="noti-unread-dot"></div>' : ''}
                            </div>
                        `;
                    }).join('');
                }
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        }

        window.markNotificationRead = async function(notiId, userId) {
            try {
                await fetch(`${API_BASE}/notifications/${notiId}/mark-read?userId=${userId}`, { method: 'PUT' });
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                loadNotifications(userId, token);
            } catch (e) {
                console.error(e);
            }
        }

        const fallbackCategories = [
            { id: "cat_frontend", name: "Frontend", icon: "fa-laptop-code", description: "Làm chủ HTML, CSS, JavaScript và các framework hiện đại (React, Angular, Vue).", count: "45+" },
            { id: "cat_backend", name: "Backend", icon: "fa-server", description: "Xây dựng hệ thống backend hiệu năng cao, bảo mật và khả năng mở rộng tốt (Spring Boot, Node.js).", count: "38+" },
            { id: "cat_mobile", name: "Mobile", icon: "fa-mobile-alt", description: "Phát triển ứng dụng di động native và cross-platform cho iOS & Android (Flutter, React Native).", count: "25+" },
            { id: "cat_database", name: "Database", icon: "fa-database", description: "Thiết kế, truy vấn và tối ưu hóa các cơ sở dữ liệu SQL & NoSQL (MySQL, PostgreSQL, MongoDB).", count: "18+" },
            { id: "cat_devops", name: "DevOps", icon: "fa-infinity", description: "Tự động hóa, CI/CD, quản trị hạ tầng container và vận hành trên Cloud (Docker, Kubernetes, AWS).", count: "12+" }
        ];

        async function loadMainCategories() {
            const grid = document.getElementById('mainCategoryGrid');
            try {
                // Try fetching from API
                const data = await fetch(`${API_BASE}/category`).then(r => r.json());
                let categories = data?.result || [];
                
                // If API returns empty or fails, use fallback data to match the UI mockup
                if (!categories.length) {
                    categories = fallbackCategories;
                } else {
                    // Map API data to fallback structure for missing visual fields
                    categories = categories.slice(0, 5).map((cat) => {
                        const fallback = fallbackCategories.find(f => f.name.toLowerCase() === cat.name.toLowerCase()) || {
                            icon: "fa-code",
                            description: cat.description || "Khóa học chất lượng cao.",
                            count: "10+"
                        };
                        return {
                            ...cat,
                            icon: fallback.icon,
                            description: cat.description || fallback.description,
                            count: fallback.count
                        };
                    });
                }

                grid.innerHTML = categories.map(cat => `
                    <div class="main-category-card">
                        <div class="main-cat-icon"><i class="fas ${cat.icon}"></i></div>
                        <h3>${cat.name}</h3>
                        <p>${cat.description}</p>
                        <div class="main-cat-footer">
                            <span class="cat-count-badge">${cat.count} Khóa học</span>
                            <a href="../catalog.html?categoryId=${cat.id}" class="cat-explore-link">Khám phá <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                `).join('');
            } catch (e) {
                // Fallback to static mock data on error
                grid.innerHTML = fallbackCategories.map(cat => `
                    <div class="main-category-card">
                        <div class="main-cat-icon"><i class="fas ${cat.icon}"></i></div>
                        <h3>${cat.name}</h3>
                        <p>${cat.description}</p>
                        <div class="main-cat-footer">
                            <span class="cat-count-badge">${cat.count} Khóa học</span>
                            <a href="courses.html?categoryId=${cat.id}" class="cat-explore-link">Khám phá <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                `).join('');
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            applyLandingNavAuth();
            loadMainCategories();

            // Navbar User & Notification Dropdown toggles
            const userAvatarBtn = document.getElementById('userAvatarBtn');
            const userDropdown = document.getElementById('userDropdown');
            const notiBell = document.getElementById('notiBell');
            const notiDropdown = document.getElementById('notiDropdown');
            
            if (userAvatarBtn && userDropdown) {
                userAvatarBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                    if (notiDropdown) notiDropdown.classList.remove('show');
                });
            }
            
            if (notiBell && notiDropdown) {
                notiBell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notiDropdown.classList.toggle('show');
                    if (userDropdown) userDropdown.classList.remove('show');
                });
            }
            
            document.addEventListener('click', () => {
                if (userDropdown) userDropdown.classList.remove('show');
                if (notiDropdown) notiDropdown.classList.remove('show');
            });

            // Navbar scroll effect
            window.addEventListener('scroll', () => {
                const navbar = document.getElementById('navbar');
                if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
            });

            // Mobile menu
            document.getElementById('hamburger')?.addEventListener('click', () => {
                document.getElementById('navLinks').classList.toggle('mobile-open');
            });

            // Logout
            document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });

            // Mark all read
            document.getElementById('markAllRead')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const uid = localStorage.getItem('userId');
                if (!uid) return;
                try {
                    await fetch(`${API_BASE}/notifications/mark-all-read?userId=${uid}`, { method: 'PUT' });
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    loadNotifications(uid, token);
                } catch (err) {
                    console.error(err);
                }
            });

            // Newsletter submit
            document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Cảm ơn bạn đã đăng ký nhận bản tin!');
                e.target.reset();
            });
            
            // Filter click logic
            const pills = document.querySelectorAll('.sub-cat-pill');
            pills.forEach(pill => {
                pill.addEventListener('click', () => {
                    pills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                });
            });
        });
