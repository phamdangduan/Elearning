// ── Auth Handling ──
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



        const API_BASE = 'http://localhost:8080';

        // ── Formatter ──
        function formatCurrency(amount) {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        }

        function formatDuration(seconds) {
            if (!seconds) return "0 phút";
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            if (h > 0) return `${h} giờ ${m} phút`;
            return `${m} phút`;
        }

        // ── Load Data ──
        async function loadCourseDetail() {
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id');
            const app = document.getElementById('courseDetailApp');
            
            if (!courseId) {
                app.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 50px;">Không tìm thấy ID khóa học.</div>';
                return;
            }

            try {
                // Determine API endpoint depending on role
                const role = localStorage.getItem('role');
                const userId = localStorage.getItem('userId');
                
                let endpoint = `${API_BASE}/course/${courseId}`;
                if (role === 'STUDENT' && userId) {
                    endpoint = `${API_BASE}/course/${courseId}/student?studentId=${userId}`;
                }

                // Using public endpoint:
                const res = await fetch(`${API_BASE}/course/${courseId}`);
                if (!res.ok) throw new Error("Course not found");
                
                const data = await res.json();
                const course = data.result;
                
                // Fetch enrollment status
                let isEnrolled = false;
                let paymentStatus = null;
                if (userId) {
                    try {
                        const enrollRes = await fetch(`${API_BASE}/enrollment/status?userId=${userId}&courseId=${courseId}`);
                        if (enrollRes.ok) {
                            const enrollData = await enrollRes.json();
                            isEnrolled = !!(enrollData.result && (enrollData.result.isEnrolled || enrollData.result.enrolled));
                            paymentStatus = enrollData.result ? enrollData.result.paymentStatus : null;
                        }
                    } catch (e) {
                        console.error('Error fetching enrollment status:', e);
                    }
                }
                const isCreatorOrAdmin = (role === 'ADMIN') || (role === 'INSTRUCTOR' && course.instructor && course.instructor.id === userId);
                const hasAccess = (isEnrolled && paymentStatus === 'CONFIRMED') || isCreatorOrAdmin;
                const isPendingPayment = isEnrolled && paymentStatus === 'PENDING';
                const isRejectedPayment = isEnrolled && paymentStatus === 'REJECTED';
                
                document.title = `${course.title} - EduVN`;

                // Fetch instructor profile
                let instructorProfile = null;
                if (course.instructor?.id) {
                    try {
                        const profRes = await fetch(`${API_BASE}/profile/${course.instructor.id}`);
                        if (profRes.ok) {
                            const profData = await profRes.json();
                            instructorProfile = profData.result;
                        }
                    } catch(e) { console.error('Error fetching instructor profile', e); }
                }

                // Fetch reviews
                let reviews = [];
                try {
                    const revRes = await fetch(`${API_BASE}/review/get-reviewsForCourse?courseId=${course.id}&page=0&size=4`);
                    if (revRes.ok) {
                        const revData = await revRes.json();
                        reviews = revData.result?.content || [];
                    }
                } catch(e) { console.error('Error fetching reviews', e); }

                
                // Build curriculum
                let curriculumHTML = '';
                if (course.sections && course.sections.length > 0) {
                    curriculumHTML = course.sections.map((sec, idx) => `
                        <div class="cd-accordion-item ${idx === 0 ? 'open' : ''}">
                            <div class="cd-accordion-header" onclick="this.parentElement.classList.toggle('open')">
                                <div class="cd-accordion-title"><span>Phần ${idx + 1}:</span> ${sec.title}</div>
                                <div class="cd-accordion-meta">${sec.lessons ? sec.lessons.length : 0} bài học <i class="fas fa-chevron-down"></i></div>
                            </div>
                            <div class="cd-accordion-body">
                                ${(sec.lessons || []).map(les => {
                                    if (hasAccess) {
                                        return `
                                            <div class="cd-lesson-row" style="cursor: pointer;" onclick="location.href='learning.html?id=${course.id}'">
                                                <div class="cd-lesson-info">
                                                    <i class="${les.contentType === 'VIDEO' ? 'far fa-play-circle' : 'far fa-file-alt'}"></i> 
                                                    ${les.title}
                                                </div>
                                                <div class="cd-lesson-duration">${formatDuration(les.durationInSeconds)}</div>
                                            </div>
                                        `;
                                    } else {
                                        return `
                                            <div class="cd-lesson-row locked" onclick="window.scrollToPricing(event)">
                                                <div class="cd-lesson-info">
                                                    <i class="fas fa-lock"></i> 
                                                    ${les.title}
                                                </div>
                                                <div class="cd-lesson-duration">${formatDuration(les.durationInSeconds)}</div>
                                            </div>
                                        `;
                                    }
                                }).join('')}
                            </div>
                        </div>
                    `).join('');
                    
                    if (!hasAccess) {
                        curriculumHTML += `
                            <div class="cd-lock-banner">
                                <i class="fas fa-lock"></i>
                                <h3>Lộ trình học đang bị khóa</h3>
                                <p>Đăng ký khóa học ngay hôm nay để mở khóa toàn bộ bài học, tài liệu đi kèm và nhận chứng nhận hoàn thành khóa học từ EduVN.</p>
                                <button class="btn btn-primary btn-sm" onclick="window.scrollToPricing(event)">Đăng ký học ngay</button>
                            </div>
                        `;
                    }
                } else {
                    curriculumHTML = '<p>Chưa có nội dung bài học.</p>';
                }

                // Render App
                app.innerHTML = `
                    <!-- LEFT COLUMN -->
                    <div class="cd-main-content">
                        <!-- Breadcrumb -->
                        <div class="cd-breadcrumb">
                            <a href="../index.html">Trang chủ</a> <span>/</span> 
                            <a href="courses.html">Khóa học</a> <span>/</span> 
                            <span style="color: var(--primary); font-weight: 600;">Chi tiết</span>
                        </div>

                        <!-- Header Info -->
                        <div>
                            <h1 class="cd-title">${course.title}</h1>
                            <p class="cd-desc">${course.description || ''}</p>
                            <div class="cd-meta">
                                <div class="cd-meta-item">
                                    <i class="fas fa-star" style="color: #f6ad55;"></i> ${course.averageRating ? course.averageRating.toFixed(1) : '0.0'} (${course.totalReviews || 0} đánh giá)
                                </div>
                                <div class="cd-meta-item">
                                    <i class="fas fa-users"></i> ${course.totalEnrollments || 0} học viên
                                </div>
                                <div class="cd-meta-item">
                                    <i class="fas fa-book"></i> ${course.totalLessons || 0} bài học
                                </div>
                            </div>
                        </div>

                        <!-- Video Placeholder -->
                        <div class="cd-video-wrapper">
                            <img src="${course.thumbnailUrl || 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1000&q=80'}" alt="Cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1000&q=80'">
                            <div class="cd-play-btn"><i class="fas fa-play"></i></div>
                        </div>

                        <!-- Curriculum -->
                        <div style="margin-top: 20px;">
                            <h2 class="cd-section-title">Lộ trình học tập</h2>
                            <div class="cd-curriculum">
                                ${curriculumHTML}
                            </div>
                        </div>

                        <!-- Instructor -->
                        <div class="cd-instructor-box">
                            <img src="${instructorProfile?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80'}" alt="Giảng viên" class="cd-instructor-avatar" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80'">
                            <div class="cd-instructor-info">
                                <h3><a href="instructor-profile.html?id=${course.instructor?.id || ''}" style="color:inherit;text-decoration:none;">${instructorProfile?.fullName || course.instructor?.userName || 'Giảng viên'}</a></h3>
                                <span class="cd-instructor-title">Giảng viên EduVN</span>
                                <p class="cd-instructor-bio">${instructorProfile?.bio || 'Chuyên gia giàu kinh nghiệm trong lĩnh vực.'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN (SIDEBAR) -->
                    <div class="cd-sidebar">
                        <div class="cd-pricing-card">
                            <div class="cd-price-row">
                                <span class="cd-current-price">${course.price > 0 ? formatCurrency(course.price) : 'Miễn phí'}</span>
                                ${course.price > 0 ? `<span class="cd-original-price">${formatCurrency(course.price * 2)}</span>
                                <span class="cd-discount-badge">GIẢM 50%</span>` : ''}
                            </div>
                            ${course.price > 0 ? `<div class="cd-promo-text"><i class="fas fa-clock"></i> GIÁ ƯU ĐÃI CHỈ CÒN 2 NGÀY!</div>` : ''}
                            
                            <div class="cd-sidebar-actions" style="margin-top: 20px;">
                                ${hasAccess ? `
                                    <button class="btn btn-primary" onclick="location.href='learning.html?id=${course.id}'">
                                        <i class="fas fa-play" style="margin-right:8px;"></i> Vào học ngay
                                    </button>
                                ` : isPendingPayment ? `
                                    <button class="btn" style="background:#fef3c7; color:#d97706; border:1px solid #fde68a; cursor:not-allowed; width:100%; font-weight:700;" disabled>
                                        <i class="fas fa-hourglass-half" style="margin-right:8px;"></i> Chờ phê duyệt học phí
                                    </button>
                                ` : isRejectedPayment ? `
                                    <button class="btn btn-danger" onclick="location.href='checkout.html?id=${course.id}'" style="width:100%; font-weight:700;">
                                        <i class="fas fa-redo-alt" style="margin-right:8px;"></i> Bị từ chối - Đăng ký lại
                                    </button>
                                ` : `
                                    <button class="btn btn-primary" onclick="location.href='checkout.html?id=${course.id}'">Đăng ký học ngay</button>
                                `}
                            </div>
                            
                            <div class="cd-features-list" style="margin-top: 30px;">
                                <h4>Khóa học này bao gồm:</h4>
                                <div class="cd-feature-item"><i class="far fa-check-circle"></i> Chứng chỉ hoàn thành EduVN</div>
                                <div class="cd-feature-item"><i class="fas fa-cloud-download-alt"></i> Tài liệu & Mã nguồn đi kèm</div>
                                <div class="cd-feature-item"><i class="fas fa-infinity"></i> Truy cập trọn đời kiến thức</div>
                                <div class="cd-feature-item"><i class="fas fa-mobile-alt"></i> Học được trên mọi thiết bị</div>
                            </div>
                        </div>

                        <div class="cd-guarantee-box">
                            <i class="fas fa-shield-alt"></i>
                            <div>
                                <h4>Hoàn tiền trong 7 ngày</h4>
                                <p>Không hài lòng? Chúng tôi hoàn lại 100%.</p>
                            </div>
                        </div>
                    </div>
                `;

                // Append Reviews section at the bottom of main content
                const mainContent = app.querySelector('.cd-main-content');
                if (mainContent && reviews.length > 0) {
                    const reviewsHTML = reviews.map(r => `
                        <div class="cd-review-card">
                            <div class="cd-review-user">
                                <div class="cd-review-avatar"><img src="${r.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.userName || 'U') + '&background=random'}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></div>
                                <div class="cd-review-user-info">
                                    <h4>${r.userName || 'Học viên'}</h4>
                                    <div class="cd-review-stars">
                                        ${Array(5).fill(0).map((_, idx) => `<i class="fas fa-star" style="color:${idx < r.rating ? '#f5a623' : '#e2e8f0'}"></i>`).join('')}
                                    </div>
                                </div>
                            </div>
                            <p class="cd-review-text">${r.comment || ''}</p>
                        </div>
                    `).join('');

                    mainContent.innerHTML += `
                        <!-- Reviews -->
                        <div style="margin-top: 40px;">
                            <div class="cd-reviews-header">
                                <h2 class="cd-section-title" style="margin-bottom:0;">Đánh giá tiêu biểu</h2>
                            </div>
                            <div class="cd-reviews-grid">
                                ${reviewsHTML}
                            </div>
                        </div>
                    `;
                } else if (mainContent) {
                    mainContent.innerHTML += `
                        <div style="margin-top: 40px;">
                            <h2 class="cd-section-title">Đánh giá tiêu biểu</h2>
                            <p style="color:var(--text-muted);">Chưa có đánh giá nào cho khóa học này.</p>
                        </div>
                    `;
                }
            } catch (err) {
                console.error(err);
                app.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 50px;">Có lỗi xảy ra khi tải khóa học. Vui lòng thử lại sau.</div>';
            }
        }

        window.scrollToPricing = function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const pricingCard = document.querySelector('.cd-pricing-card');
            if (pricingCard) {
                pricingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                pricingCard.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)';
                pricingCard.style.transform = 'scale(1.02)';
                pricingCard.style.transition = 'all 0.5s ease';
                setTimeout(() => {
                    pricingCard.style.boxShadow = 'var(--shadow-lg)';
                    pricingCard.style.transform = 'scale(1)';
                }, 1500);
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            applyLandingNavAuth();
            loadCourseDetail();

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
        });
