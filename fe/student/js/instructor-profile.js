const API_BASE = 'http://localhost:8080';

        // Get ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const instructorId = urlParams.get('id');

        // ── Fallback Database for Offline Mode ──
        const localFallbackInstructors = [
            {
                id: "teacher-001",
                fullName: "Nguyễn Văn A",
                specialization: "Chuyên gia DevOps & Cloud @ Google",
                bio: "Hơn 10 năm kinh nghiệm thiết lập hạ tầng Kubernetes, CI/CD và vận hành hệ thống đám mây quy mô lớn tại các tập đoàn công nghệ hàng đầu thế giới. Đam mê chia sẻ kiến thức DevOps thực chiến.",
                avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
                coursesCount: 24,
                studentsCount: "15k+",
                rating: 4.9,
                reviewsCount: 1240
            },
            {
                id: "teacher-002",
                fullName: "Lê Thị B",
                specialization: "Chuyên gia Thiết kế UI/UX & Frontend @ VinGroup",
                bio: "Kỹ sư thiết kế UI/UX & Frontend Developer chuyên nghiệp, đam mê tạo ra giao diện tối ưu và thân thiện với người dùng. Đã dẫn dắt nhiều dự án thiết kế sản phẩm SaaS quy mô lớn.",
                avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
                coursesCount: 18,
                studentsCount: "12k+",
                rating: 4.8,
                reviewsCount: 980
            },
            {
                id: "teacher-003",
                fullName: "Trần Văn C",
                specialization: "Chuyên gia Backend @ Techcombank",
                bio: "Hơn 8 năm xây dựng hệ thống lõi ngân hàng bảo mật bằng Java Spring Boot & SQL. Có thế mạnh sâu sắc về thiết kế hệ thống Microservices chịu tải cao và tối ưu cơ sở dữ liệu lớn.",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
                coursesCount: 12,
                studentsCount: "8.5k+",
                rating: 5.0,
                reviewsCount: 450
            },
            {
                id: "teacher-004",
                fullName: "Phạm Mai Hương",
                specialization: "Digital Marketing Manager @ VCCorp",
                bio: "Hơn 8 năm kinh nghiệm thực chiến trong các chiến dịch marketing tổng lực trị giá hàng triệu USD. Chuyên gia tư vấn tăng trưởng doanh số đột phá cho doanh nghiệp vừa và nhỏ qua SEO & Performance Ads.",
                avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
                coursesCount: 15,
                studentsCount: "9.2k+",
                rating: 4.8,
                reviewsCount: 620
            },
            {
                id: "teacher-uuid-123456789",
                fullName: "Hoàng Lê Minh",
                specialization: "Chuyên gia Quản trị dự án & PMP",
                bio: "Từng giữ vị trí Giám đốc Vận hành tại nhiều startup kỳ lân Việt Nam. Chuyên gia đào tạo Agile/Scrum và luyện thi chứng chỉ quản lý dự án PMP chuyên nghiệp được học viên yêu thích.",
                avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
                coursesCount: 10,
                studentsCount: "6.8k+",
                rating: 4.7,
                reviewsCount: 340
            }
        ];

        const fallbackCourses = {
            "teacher-001": [
                { id: "course-001", title: "Lập trình Java Spring Boot từ cơ bản đến nâng cao", instructorName: "Nguyễn Văn A", averageRating: 4.9, totalReviews: 320, price: 1290000, thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" },
                { id: "course-004", title: "DevOps với Docker và Kubernetes thực chiến", instructorName: "Nguyễn Văn A", averageRating: 4.8, totalReviews: 245, price: 1590000, thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" }
            ],
            "teacher-002": [
                { id: "course-002", title: "Xây dựng ứng dụng Web hiện đại với ReactJS", instructorName: "Lê Thị B", averageRating: 4.8, totalReviews: 185, price: 990000, thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" },
                { id: "course-uiux-demo-123", title: "Thiết kế UI/UX nâng cao cho sản phẩm SaaS", instructorName: "Lê Thị B", averageRating: 4.9, totalReviews: 120, price: 1190000, thumbnailUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" }
            ],
            "teacher-003": [
                { id: "course-003", title: "Quản trị cơ sở dữ liệu MySQL chuyên nghiệp", instructorName: "Trần Văn C", averageRating: 4.7, totalReviews: 95, price: 890000, thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" }
            ],
            "teacher-004": [
                { id: "course-mkt-1", title: "Digital Marketing toàn diện từ A-Z", instructorName: "Phạm Mai Hương", averageRating: 4.8, totalReviews: 140, price: 790000, thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" },
                { id: "course-mkt-2", title: "Tối ưu hóa SEO & Content Marketing lên top", instructorName: "Phạm Mai Hương", averageRating: 4.7, totalReviews: 85, price: 690000, thumbnailUrl: "https://images.unsplash.com/photo-1571844307560-f55a3c6d7e73?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" }
            ],
            "teacher-uuid-123456789": [
                { id: "course-pmp-1", title: "Luyện thi chứng chỉ PMP quốc tế bài bản", instructorName: "Hoàng Lê Minh", averageRating: 4.9, totalReviews: 210, price: 2490000, thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" },
                { id: "course-agile-1", title: "Quản trị dự án Agile/Scrum thực chiến", instructorName: "Hoàng Lê Minh", averageRating: 4.8, totalReviews: 135, price: 1290000, thumbnailUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80", status: "PUBLISHED" }
            ]
        };

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

        function formatCurrency(amount) {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        }

        function getLocalFallbackInstructor(id) {
            return localFallbackInstructors.find(ins => ins.id === id) || 
                   localFallbackInstructors.find(ins => id.includes(ins.id)) || 
                   localFallbackInstructors[0];
        }

        function populateInstructorUI(profile, stats) {
            document.getElementById('insName').textContent = profile.fullName || 'Giảng viên';
            document.getElementById('insTitle').textContent = profile.specialization || 'Chuyên gia Đào tạo';
            document.getElementById('insBio').textContent = profile.bio || 'Chuyên gia đào tạo với nhiều năm kinh nghiệm thực chiến.';
            
            const avatarImg = document.getElementById('insAvatar');
            const skeleton = document.getElementById('avatarSkeleton');
            avatarImg.src = profile.avatar || profile.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80';
            
            avatarImg.onload = () => {
                if (skeleton) skeleton.style.display = 'none';
                avatarImg.style.display = 'block';
            };
            
            // In case image loads from cache immediately
            if (avatarImg.complete) {
                if (skeleton) skeleton.style.display = 'none';
                avatarImg.style.display = 'block';
            }

            document.getElementById('insCourses').textContent = stats.totalCourses || profile.coursesCount || 0;
            document.getElementById('insStudents').textContent = stats.totalStudents || profile.studentsCount || 0;
            
            const ratingVal = stats.averageRating ? stats.averageRating.toFixed(1) : (profile.rating ? Number(profile.rating).toFixed(1) : '4.8');
            document.getElementById('insRating').textContent = ratingVal;
            
            const ratingBig = document.getElementById('insRatingBig');
            if (ratingBig) ratingBig.textContent = ratingVal;
            
            const starsEl = document.getElementById('insRatingStars');
            if (starsEl) {
                const score = Math.round(Number(ratingVal));
                starsEl.innerHTML = Array(5).fill(0).map((_, idx) => 
                    `<i class="fas fa-star" style="color:${idx < score ? '#fbbf24' : '#e2e8f0'}"></i>`
                ).join('');
            }
        }

        function renderCoursesHTML(courses) {
            const grid = document.getElementById('courseGrid');
            if (courses.length === 0) {
                grid.innerHTML = '';
                document.getElementById('noCoursesMsg').style.display = 'block';
            } else {
                grid.innerHTML = courses.map(course => `
                    <div class="course-card">
                        <div class="course-thumbnail">
                            ${course.status === 'PUBLISHED' ? '<span class="course-badge">Đang mở</span>' : ''}
                            <img src="${course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'}" alt="${course.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80'">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>
                            <div class="course-instructor">
                                <i class="fas fa-chalkboard-teacher"></i> ${course.instructorName || 'Giảng viên'}
                            </div>
                            <div class="course-meta">
                                <div class="course-rating">
                                    <i class="fas fa-star"></i>
                                    <span>${course.averageRating ? course.averageRating.toFixed(1) : '4.8'}</span>
                                    <span class="rating-count">(${course.totalReviews || 0})</span>
                                </div>
                            </div>
                            <div class="course-footer">
                                <div class="course-price">${course.price > 0 ? formatCurrency(course.price) : 'Miễn phí'}</div>
                                <a href="course-detail.html?id=${course.id}" class="btn-outline"><i class="fas fa-chevron-right"></i></a>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        async function loadInstructorProfile() {
            if (!instructorId) {
                document.getElementById('insName').textContent = 'Không tìm thấy giảng viên';
                document.getElementById('courseGrid').innerHTML = '';
                return;
            }

            let profileLoaded = false;
            let statsLoaded = false;
            let coursesLoaded = false;
            let tempProfile = {};
            let tempStats = {};

            // 1. Load Profile
            try {
                const profileRes = await fetch(`${API_BASE}/profile/${instructorId}`);
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    tempProfile = profileData.result || {};
                    profileLoaded = true;
                }
            } catch (e) {
                console.warn("API profile fetch failed, using fallback.", e);
            }

            // 2. Load Stats
            try {
                const statsRes = await fetch(`${API_BASE}/instructor/stats?instructorId=${instructorId}`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    tempStats = statsData.result || {};
                    statsLoaded = true;
                }
            } catch (e) {
                console.warn("API stats fetch failed, using fallback.", e);
            }

            // Fallback profile & stats if API failed
            if (!profileLoaded || !statsLoaded) {
                const fallbackIns = getLocalFallbackInstructor(instructorId);
                if (!profileLoaded) tempProfile = fallbackIns;
                if (!statsLoaded) tempStats = {
                    totalCourses: fallbackIns.coursesCount,
                    totalStudents: fallbackIns.studentsCount,
                    averageRating: fallbackIns.rating
                };
            }

            populateInstructorUI(tempProfile, tempStats);

            // 3. Load Courses
            try {
                const coursesRes = await fetch(`${API_BASE}/course/search?instructorId=${instructorId}`);
                if (coursesRes.ok) {
                    const coursesData = await coursesRes.json();
                    const courses = coursesData.result?.content || [];
                    renderCoursesHTML(courses);
                    coursesLoaded = true;
                }
            } catch (error) {
                console.warn("API courses search failed, trying fallback.", error);
            }

            if (!coursesLoaded) {
                // Try searching local fallback courses
                const key = Object.keys(fallbackCourses).find(k => instructorId.includes(k)) || "teacher-001";
                const localCourses = fallbackCourses[key] || [];
                renderCoursesHTML(localCourses);
            }
        }

        // ── Initialize ──
        document.addEventListener('DOMContentLoaded', () => {
            applyLandingNavAuth();
            loadInstructorProfile();

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
