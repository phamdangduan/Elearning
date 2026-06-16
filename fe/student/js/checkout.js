const API_BASE = 'http://localhost:8080';
        let currentCourseId = null;
        let currentCoursePrice = 0;

        async function applyLandingNavAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            
            if (!token || !uid) {
                window.location.href = '../login.html';
                return;
            }

            const guest = document.getElementById('navGuestActions');
            const logged = document.getElementById('navLoggedIn');
            
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

        async function loadCourseForCheckout() {
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id');
            const container = document.getElementById('courseSummaryContainer');
            const btn = document.getElementById('btnCheckout');
            
            // Dummy Data Fallback in case API fails or no ID provided
            const dummyCourse = {
                id: "dummy123",
                title: "Kiến trúc Bảo mật Hệ thống Cloud & DevOps",
                instructorName: "Trần Văn A",
                price: 1299000,
                thumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80"
            };

            const renderCourse = (c) => {
                currentCourseId = c.id;
                currentCoursePrice = c.price || 0;
                const formattedPrice = c.price ? c.price.toLocaleString('vi-VN') + 'đ' : 'Miễn phí';
                container.innerHTML = `
                    <div class="summary-course">
                        <img src="${c.thumbnailUrl || 'https://via.placeholder.com/400x250?text=Course'}" alt="Course Image">
                        <div class="summary-course-info">
                            <h3 class="summary-course-title">${c.title}</h3>
                            <span class="summary-course-instructor">Giảng viên: ${c.instructorName || 'Đang cập nhật'}</span>
                        </div>
                    </div>
                    
                    <div class="summary-row">
                        <span>Giá gốc</span>
                        <span style="text-decoration: line-through; color: var(--text-muted);">${c.price ? (c.price * 1.5).toLocaleString('vi-VN') + 'đ' : ''}</span>
                    </div>
                    <div class="summary-row">
                        <span>Khuyến mãi</span>
                        <span style="color: #10b981;">-${c.price ? (c.price * 0.5).toLocaleString('vi-VN') + 'đ' : '0đ'}</span>
                    </div>
                    
                    <div class="summary-row total">
                        <span>Tổng thanh toán</span>
                        <span class="summary-total-price">${formattedPrice}</span>
                    </div>
                `;
                btn.disabled = false;
            };

            if (!courseId) {
                renderCourse(dummyCourse);
                return;
            }

            try {
                const data = await fetch(`${API_BASE}/course/${courseId}`).then(r => r.json());
                if (data && data.result) {
                    renderCourse(data.result);
                } else {
                    renderCourse(dummyCourse);
                }
            } catch (error) {
                console.error("Error loading course:", error);
                renderCourse(dummyCourse);
            }
        }

        function loadUserInfo() {
            const uName = localStorage.getItem('userName') || 'Trần Văn Demo';
            const uEmail = localStorage.getItem('userEmail') || 'demo@eduvn.com';
            
            document.getElementById('userInfoContainer').innerHTML = `
                <div class="user-info-row">
                    <span class="user-info-label">Họ và tên</span>
                    <span class="user-info-value">${uName}</span>
                </div>
                <div class="user-info-row">
                    <span class="user-info-label">Email</span>
                    <span class="user-info-value">${uEmail}</span>
                </div>
                <div class="user-info-row">
                    <span class="user-info-label">Tài khoản EduVN</span>
                    <span class="user-info-value" style="color: var(--primary);"><i class="fas fa-check-circle"></i> Đã liên kết</span>
                </div>
            `;
        }

        document.addEventListener('DOMContentLoaded', () => {
            applyLandingNavAuth();
            loadUserInfo();
            loadCourseForCheckout();

            // Handle Registration
            document.getElementById('btnCheckout').addEventListener('click', async () => {
                const userId = localStorage.getItem('userId') || 'demo_user_123';
                if (!currentCourseId) {
                    alert("Lỗi: Không tìm thấy thông tin khóa học!");
                    return;
                }

                document.getElementById('checkoutLoadingOverlay').style.display = 'flex';

                try {
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = 'Bearer ' + token;

                    let res;
                    let redirectUrl = "";

                    if (currentCoursePrice > 0) {
                        // Paid course -> Create Payment Request first (Draft status, teacher must confirm to create enrollment)
                        res = await fetch(`${API_BASE}/payment-requests/create?userId=${userId}`, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({ courseId: currentCourseId })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const reqId = data?.result?.id || 'req_dummy_789';
                            redirectUrl = `payment-submit.html?id=${reqId}&courseId=${currentCourseId}`;
                        } else {
                            // If payment request already exists, try to get the existing one
                            const existRes = await fetch(`${API_BASE}/payment-requests/my-payments?userId=${userId}`, { headers });
                            if (existRes.ok) {
                                const existData = await existRes.json();
                                const pendingPayment = (existData.result || []).find(p => p.courseId === currentCourseId && p.status === 'PENDING');
                                if (pendingPayment) {
                                    redirectUrl = `payment-submit.html?id=${pendingPayment.id}&courseId=${currentCourseId}`;
                                    res = { ok: true };
                                }
                            }
                        }
                    } else {
                        // Free course -> Enroll directly
                        res = await fetch(`${API_BASE}/enrollment`, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({ userId: userId, courseId: currentCourseId })
                        });
                        if (res.ok) {
                            redirectUrl = "courses.html";
                        }
                    }

                    if (!res || !res.ok) {
                        throw new Error("API request failed");
                    }

                    // Simulate network delay for nice UX
                    await new Promise(r => setTimeout(r, 1200));
                    window.location.href = redirectUrl;
                    
                } catch (error) {
                    console.error("Enrollment/Payment error:", error);
                    // Fallback success for UI demo if backend is offline
                    await new Promise(r => setTimeout(r, 1200));
                    if (currentCoursePrice > 0) {
                        window.location.href = `payment-submit.html?id=req_dummy_789&courseId=${currentCourseId}`;
                    } else {
                        window.location.href = "courses.html";
                    }
                }
            });

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

            // Mobile menu
            document.getElementById('hamburger')?.addEventListener('click', () => {
                document.getElementById('navLinks').classList.toggle('mobile-open');
            });

            // Logout
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
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
        });
