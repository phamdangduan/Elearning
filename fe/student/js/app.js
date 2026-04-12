/* ============================================================
   EduVN Student Portal - App JavaScript
   Connects to Spring Boot Backend at http://localhost:8080
============================================================ */

const API_BASE = 'http://localhost:8080';

/* ── State ── */
const state = {
    userId: 'student-001', // Hardcoded for testing (no auth yet)
    user: null,
    profile: null,
    courses: [],
    categories: [],
    page: 0,
    pageSize: 6,
    totalPages: 0,
    activeCategory: '',
    loading: false
};

/* ── API Helper ── */
async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('[API Error]', path, err);
        return null;
    }
}

/* ── Toast ── */
function showToast(message, type = 'info') {
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><p>${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

/* ── Format Price ── */
function formatPrice(price) {
    if (!price || price === 0) return '<span class="course-price free">Miễn phí</span>';
    return `<span class="course-price">${Number(price).toLocaleString('vi-VN')}đ</span>`;
}

/* ── Format Rating Stars ── */
function renderStars(rating) {
    const r = parseFloat(rating) || 0;
    const full = Math.floor(r);
    const half = r % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return `
        <div class="rating-stars">
            ${'<i class="fas fa-star"></i>'.repeat(full)}
            ${half ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${'<i class="far fa-star"></i>'.repeat(empty)}
        </div>
    `;
}

/* ── Thumbnail Backgrounds ── */
const thumbBgs = ['blue-bg', 'cyan-bg', 'purple-bg', 'green-bg', 'orange-bg'];
const thumbEmojis = ['💻', '🎨', '📊', '🚀', '📱', '🎵', '✏️', '🔬', '📚', '🌐'];
function getThumb(course, index) {
    if (course.thumbnailUrl) {
        return `<img src="${course.thumbnailUrl}" alt="${course.title}" onerror="this.parentNode.innerHTML='<div class=\\'course-thumb-placeholder ${thumbBgs[index % thumbBgs.length]}\\'>${thumbEmojis[index % thumbEmojis.length]}</div>'" loading="lazy">`;
    }
    return `<div class="course-thumb-placeholder ${thumbBgs[index % thumbBgs.length]}">${thumbEmojis[index % thumbEmojis.length]}</div>`;
}

/* ── Course Card HTML ── */
function renderCourseCard(course, index) {
    const cats = course.categories?.slice(0, 2).map(c => `<span class="cat-tag">${c.name}</span>`).join('') || '';
    const rating = parseFloat(course.averageRating) || 0;
    const isFree = !course.price || Number(course.price) === 0;

    return `
        <div class="course-card" data-id="${course.id}" onclick="openCourseModal('${course.id}')">
            <div class="course-thumb">
                ${getThumb(course, index)}
                ${isFree ? '<span class="course-badge free">Miễn phí</span>' : ''}
                <div class="course-play-overlay">
                    <div class="play-btn-circle"><i class="fas fa-play"></i></div>
                </div>
            </div>
            <div class="course-body">
                <div class="course-categories">${cats}</div>
                <h3 class="course-title">${course.title || 'Không có tiêu đề'}</h3>
                <div class="course-instructor">
                    <i class="fas fa-user-circle"></i>
                    <span>${course.instructorName || course.user?.userName || 'Giáo viên'}</span>
                </div>
                <div class="course-stats">
                    ${renderStars(rating)}
                    <span class="rating-val">${rating > 0 ? rating.toFixed(1) : 'Mới'}</span>
                    <span class="rating-count">(${course.totalReviews || 0})</span>
                    <div class="enrollments">
                        <i class="fas fa-users"></i>
                        <span>${(course.totalEnrollments || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div class="course-footer">
                    ${formatPrice(course.price)}
                    <button class="enroll-btn" onclick="event.stopPropagation(); handleEnroll('${course.id}')">
                        ${isFree ? 'Đăng ký miễn phí' : 'Xem chi tiết'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

/* ── Load All Courses ── */
async function loadCourses(reset = true) {
    if (state.loading) return;
    state.loading = true;

    if (reset) {
        state.page = 0;
        document.getElementById('coursesGrid').innerHTML = Array(6).fill('<div class="course-card skeleton-course"></div>').join('');
    }

    const keyword = document.getElementById('heroSearchInput')?.value?.trim() || '';
    const qParts = [
        `page=${state.page}`,
        `size=${state.pageSize}`,
        `sort=createdAt,desc`
    ];
    if (keyword) qParts.push(`keyword=${encodeURIComponent(keyword)}`);
    if (state.activeCategory) qParts.push(`categoryId=${state.activeCategory}`);

    const data = await apiGet(`/course/search?${qParts.join('&')}`);
    state.loading = false;

    if (!data?.data) {
        document.getElementById('coursesGrid').innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding: 60px; color: var(--text-muted)">
                <i class="fas fa-box-open" style="font-size:48px; margin-bottom:16px"></i>
                <p>Chưa có khóa học nào</p>
            </div>`;
        return;
    }

    const courses = data.data.content || [];
    state.totalPages = data.data.totalPages || 1;
    state.courses = reset ? courses : [...state.courses, ...courses];

    const grid = document.getElementById('coursesGrid');
    if (reset) {
        grid.innerHTML = state.courses.map((c, i) => renderCourseCard(c, i)).join('');
    } else {
        courses.forEach((c, i) => {
            grid.insertAdjacentHTML('beforeend', renderCourseCard(c, state.courses.length - courses.length + i));
        });
    }

    // Animate new cards
    grid.querySelectorAll('.course-card:not(.animated)').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.classList.add('animated');
        }, i * 80);
    });

    // Load more button
    const loadMoreWrapper = document.getElementById('loadMoreWrapper');
    if (state.page < state.totalPages - 1) {
        loadMoreWrapper.style.display = 'block';
    } else {
        loadMoreWrapper.style.display = 'none';
    }
}

/* ── Load Categories ── */
async function loadCategories() {
    const data = await apiGet('/category');
    if (!data?.data) return;

    const categories = data.data;
    state.categories = categories;

    // Filter tabs
    const filterTabs = document.getElementById('filterTabs');
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-tab';
        btn.dataset.category = cat.id;
        btn.textContent = cat.name;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            state.activeCategory = cat.id;
            loadCourses(true);
        });
        filterTabs.appendChild(btn);
    });

    // Categories grid
    const catIcons = ['💻', '🎨', '📈', '🌐', '🎵', '📚', '🔬', '💡', '🚀', '🎬'];
    const catColors = ['blue-bg', 'cyan-bg', 'purple-bg', 'green-bg', 'orange-bg'];
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = categories.slice(0, 8).map((cat, i) => `
        <div class="cat-card" onclick="filterByCategory('${cat.id}', '${cat.name}')">
            <div class="cat-icon">
                ${cat.iconUrl ? `<img src="${cat.iconUrl}" alt="${cat.name}" style="width:36px;height:36px;object-fit:contain" onerror="this.innerHTML='${catIcons[i % catIcons.length]}'">` : catIcons[i % catIcons.length]}
            </div>
            <div class="cat-name">${cat.name}</div>
            <div class="cat-count">Khóa học hấp dẫn</div>
        </div>
    `).join('');
}

function filterByCategory(id, name) {
    state.activeCategory = id;
    document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.category === id);
    });
    document.getElementById('featuredCourses')?.scrollIntoView({ behavior: 'smooth' });
    loadCourses(true);
}

/* ── Load Instructors ── */
async function loadInstructors() {
    const data = await apiGet('/profile/instructors');
    if (!data?.data) return;

    const instructors = data.data.slice(0, 4);
    const grid = document.getElementById('instructorsGrid');
    grid.innerHTML = instructors.map(inst => {
        const initial = (inst.firstName || inst.fullName || inst.user?.userName || 'G')[0].toUpperCase();
        return `
            <div class="instructor-card">
                <div class="instructor-avatar">
                    ${inst.avatar ? `<img src="${inst.avatar}" alt="${inst.fullName}">` : `<span style="font-size:28px;font-weight:700">${initial}</span>`}
                </div>
                <div class="instructor-name">${inst.fullName || inst.firstName || 'Giáo viên'}</div>
                <div class="instructor-bio">${inst.bio || 'Giảng viên chuyên nghiệp với nhiều năm kinh nghiệm'}</div>
                <div class="instructor-stats">
                    <div class="ins-stat">
                        <div class="ins-stat-val"><i class="fas fa-star" style="color:#f59e0b;font-size:12px"></i> 4.8</div>
                        <div class="ins-stat-lab">Đánh giá</div>
                    </div>
                    <div class="ins-stat">
                        <div class="ins-stat-val">12+</div>
                        <div class="ins-stat-lab">Khóa học</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* ── Load User Profile ── */
async function loadUserProfile() {
    if (!state.userId) return;

    const data = await apiGet(`/profile/me?userId=${state.userId}`);
    if (!data?.data) return;

    state.profile = data.data;
    const profile = state.profile;
    const fullName = profile.fullName || profile.firstName || 'Học viên';

    // Update navbar
    document.getElementById('userNameNav').textContent = fullName;
    document.getElementById('dropdownName').textContent = fullName;

    if (profile.avatar) {
        const avatarHtml = `<img src="${profile.avatar}" alt="${fullName}">`;
        document.getElementById('userAvatarNav').innerHTML = avatarHtml;
        document.getElementById('dropdownAvatar').innerHTML = avatarHtml;
    }

    document.getElementById('dashboardName').textContent = (profile.firstName || fullName).split(' ').pop();
    document.getElementById('studentDashboard').style.display = 'block';

    loadStudentStats();
    loadMyEnrollments();
}

/* ── Load Student Stats ── */
async function loadStudentStats() {
    const data = await apiGet(`/student/stats?studentId=${state.userId}`);
    if (!data?.data) return;

    const stats = data.data;
    document.getElementById('sc-enrolled').textContent = stats.totalEnrolledCourses || 0;
    document.getElementById('sc-completed').textContent = stats.totalCompletedCourses || 0;
    document.getElementById('sc-inprogress').textContent = stats.totalInProgressCourses || 0;
    document.getElementById('sc-lessons').textContent = stats.totalCompletedLessons || 0;

    // Counter animation
    document.querySelectorAll('.stat-card-value').forEach(el => {
        const target = parseInt(el.textContent);
        if (!isNaN(target) && target > 0) {
            let current = 0;
            const step = target / 20;
            const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = Math.floor(current);
                if (current >= target) clearInterval(timer);
            }, 50);
        }
    });
}

/* ── Load My Enrollments (Continue Learning) ── */
async function loadMyEnrollments() {
    const data = await apiGet(`/enrollment/my-enrollment?userId=${state.userId}&page=0&size=3&sort=enrollmentDate,desc`);
    if (!data?.data?.content) {
        document.getElementById('continueSection').style.display = 'none';
        return;
    }

    const enrollments = data.data.content;
    const grid = document.getElementById('continueGrid');

    if (enrollments.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted)">
                <i class="fas fa-book-open" style="font-size:40px;margin-bottom:12px"></i>
                <p>Chưa có khóa học nào. <a href="courses.html" style="color:var(--primary);font-weight:600">Khám phá ngay!</a></p>
            </div>`;
        return;
    }

    const thumbBgs2 = ['#eff6ff', '#ecfdf5', '#fdf4ff', '#fff7ed', '#f0fdf4'];
    const thumbEmojis2 = ['💻', '🎨', '📊', '🌐', '📱'];

    grid.innerHTML = enrollments.map((enr, i) => {
        const course = enr.course || enr;
        const progress = enr.progress || 0;
        const completed = enr.completedLessons || 0;
        const total = enr.totalLessons || 0;
        const title = enr.courseTitle || course.title || 'Khóa học';
        const courseId = enr.courseId || course.id;
        const thumb = enr.courseThumbnail || course.thumbnailUrl;

        return `
            <div class="continue-card">
                <div class="continue-card-thumb">
                    ${thumb
                        ? `<img src="${thumb}" alt="${title}" onerror="this.onerror=null;this.parentNode.innerHTML='<div class=\\'thumb-placeholder\\' style=\\'background:${thumbBgs2[i%5]};width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;\\'>${thumbEmojis2[i%5]}</div>'">`
                        : `<div class="thumb-placeholder" style="background:${thumbBgs2[i%5]};width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px">${thumbEmojis2[i%5]}</div>`
                    }
                    <div class="course-progress-overlay">
                        <div class="course-progress-bar" style="width:${progress}%"></div>
                    </div>
                </div>
                <div class="continue-card-body">
                    <div class="continue-card-title">${title}</div>
                    <div class="continue-card-meta">
                        <span>${completed}/${total} bài học</span>
                        <span style="color:var(--primary);font-weight:700">${Math.round(progress)}%</span>
                    </div>
                    <a href="learn.html?courseId=${courseId}" class="continue-btn">
                        <i class="fas fa-play"></i> Tiếp tục học
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

/* ── Load Notifications ── */
async function loadNotifications() {
    if (!state.userId) return;

    const [notiData, countData] = await Promise.all([
        apiGet(`/notifications/my-notifications?userId=${state.userId}&page=0&size=10`),
        apiGet(`/notifications/unread-count?userId=${state.userId}`)
    ]);

    // Update badge
    const count = countData?.data || 0;
    const badge = document.getElementById('notiBadge');
    badge.textContent = count;
    badge.dataset.count = count;

    if (!notiData?.data?.content) return;

    const notis = notiData.data.content;
    const list = document.getElementById('notiList');

    if (notis.length === 0) {
        list.innerHTML = `<div class="noti-empty"><i class="fas fa-bell-slash"></i><p>Chưa có thông báo</p></div>`;
        return;
    }

    const typeConfig = {
        PAYMENT_CONFIRMED: { icon: 'fa-check-circle', cls: 'payment' },
        PAYMENT_REJECTED: { icon: 'fa-times-circle', cls: 'alert' },
        PAYMENT_EXPIRED: { icon: 'fa-clock', cls: 'alert' },
        PAYMENT_PROOF_UPLOADED: { icon: 'fa-file-upload', cls: 'info' }
    };

    list.innerHTML = notis.map(n => {
        const cfg = typeConfig[n.type] || { icon: 'fa-bell', cls: 'info' };
        const time = n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : '';
        return `
            <div class="noti-item ${!n.isRead ? 'unread' : ''}" onclick="markNotificationRead('${n.id}')">
                <div class="noti-item-icon ${cfg.cls}"><i class="fas ${cfg.icon}"></i></div>
                <div class="noti-item-body">
                    <p><strong>${n.title}</strong><br>${n.message}</p>
                    <small>${time}</small>
                </div>
                ${!n.isRead ? '<div class="noti-unread-dot"></div>' : ''}
            </div>
        `;
    }).join('');
}

async function markNotificationRead(notiId) {
    await fetch(`${API_BASE}/notifications/${notiId}/mark-read?userId=${state.userId}`, { method: 'PUT' });
    loadNotifications();
}

/* ── Open Course Modal ── */
async function openCourseModal(courseId) {
    const modal = document.getElementById('courseModal');
    const content = document.getElementById('courseModalContent');
    content.innerHTML = '<div class="spinner"></div>';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    const data = await apiGet(`/course/${courseId}`);
    if (!data?.data) {
        content.innerHTML = '<p style="padding:40px;text-align:center">Không tìm thấy khóa học</p>';
        return;
    }

    const course = data.data;
    const isFree = !course.price || Number(course.price) === 0;
    const rating = parseFloat(course.averageRating) || 0;
    const cats = course.categories?.map(c => `<span class="cat-tag">${c.name}</span>`).join('') || '';

    content.innerHTML = `
        <div class="course-modal-thumb">
            ${course.thumbnailUrl
                ? `<img src="${course.thumbnailUrl}" alt="${course.title}">`
                : `<div class="thumb-placeholder blue-bg">💻</div>`
            }
        </div>
        <div class="course-modal-body">
            <div style="margin-bottom:10px">${cats}</div>
            <h3>${course.title}</h3>
            <div class="course-modal-meta">
                <span><i class="fas fa-user"></i> ${course.instructorName || 'Giáo viên'}</span>
                <span>${renderStars(rating)} ${rating > 0 ? rating.toFixed(1) : 'Chưa có'}</span>
                <span><i class="fas fa-users"></i> ${(course.totalEnrollments || 0).toLocaleString()} học viên</span>
                <span><i class="fas fa-comment"></i> ${course.totalReviews || 0} đánh giá</span>
            </div>
            <p class="course-modal-desc">${course.description || 'Chưa có mô tả cho khóa học này.'}</p>
            <div class="course-modal-footer">
                <div>
                    ${isFree
                        ? '<span style="font-size:24px;font-weight:800;color:var(--success)">Miễn phí</span>'
                        : `<span style="font-size:24px;font-weight:800;color:var(--primary)">${Number(course.price).toLocaleString('vi-VN')}đ</span>`
                    }
                </div>
                <button class="btn-primary" style="background:linear-gradient(135deg,var(--primary),var(--accent));color:white" onclick="handleEnroll('${course.id}')">
                    <i class="fas fa-graduation-cap"></i>
                    ${isFree ? 'Đăng ký miễn phí' : 'Đăng ký ngay'}
                </button>
            </div>
        </div>
    `;
}

/* ── Handle Enroll ── */
async function handleEnroll(courseId) {
    // Always use student-001 for testing
    if (!state.userId) {
        state.userId = 'student-001';
    }

    // Check enrollment status
    const statusData = await apiGet(`/enrollment/status?userId=${state.userId}&courseId=${courseId}`);
    if (statusData?.data?.isEnrolled) {
        showToast('Bạn đã đăng ký khóa học này rồi!', 'warning');
        window.location.href = `learn.html?courseId=${courseId}`;
        return;
    }

    // Check if course is free
    const courseData = await apiGet(`/course/${courseId}`);
    const course = courseData?.data;

    if (!course) { showToast('Không tìm thấy khóa học', 'error'); return; }

    const isFree = !course.price || Number(course.price) === 0;

    if (isFree) {
        // Free enrollment
        const res = await fetch(`${API_BASE}/enrollment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: state.userId, courseId })
        });
        if (res.ok) {
            showToast('Đăng ký khóa học thành công!', 'success');
            document.getElementById('courseModal').classList.remove('show');
            document.body.style.overflow = '';
            // Reload enrollments
            await loadMyEnrollments();
        } else {
            showToast('Đăng ký thất bại, vui lòng thử lại', 'error');
        }
    } else {
        // Redirect to payment
        window.location.href = `payment.html?courseId=${courseId}`;
    }
}

/* ── Search ── */
function setupSearch() {
    const heroInput = document.getElementById('heroSearchInput');
    const heroBtn = document.getElementById('heroSearchBtn');
    const navInput = document.getElementById('navSearchInput');

    let searchTimer;
    const doSearch = () => {
        if (navInput.value) heroInput.value = navInput.value;
        state.page = 0;
        state.activeCategory = '';
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.filter-tab[data-category=""]')?.classList.add('active');
        document.getElementById('featuredCourses').scrollIntoView({ behavior: 'smooth' });
        loadCourses(true);
    };

    heroBtn?.addEventListener('click', doSearch);
    heroInput?.addEventListener('keypress', e => e.key === 'Enter' && doSearch());
    navInput?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { if (navInput.value.length > 2) doSearch(); }, 500);
    });

    // Tag buttons
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            heroInput.value = btn.dataset.keyword;
            doSearch();
        });
    });
}

/* ── Navbar Scroll Effect ── */
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
        document.getElementById('scrollTopBtn').classList.toggle('show', window.scrollY > 300);
    }, { passive: true });

    // Hamburger
    document.getElementById('hamburger')?.addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('mobile-open');
    });

    // Scroll top
    document.getElementById('scrollTopBtn')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ── Notification Toggle ── */
function setupNotifications() {
    document.getElementById('notiBell')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notiDropdown').classList.toggle('show');
        document.getElementById('userDropdown')?.classList.remove('show');
    });

    document.getElementById('markAllRead')?.addEventListener('click', async () => {
        if (!state.userId) return;
        await fetch(`${API_BASE}/notifications/mark-all-read?userId=${state.userId}`, { method: 'PUT' });
        loadNotifications();
        showToast('Đã đánh dấu tất cả là đã đọc', 'success');
    });
}

/* ── User Dropdown ── */
function setupUserMenu() {
    document.getElementById('userAvatarBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
        document.getElementById('notiDropdown')?.classList.remove('show');
    });

    document.addEventListener('click', () => {
        document.getElementById('userDropdown')?.classList.remove('show');
        document.getElementById('notiDropdown')?.classList.remove('show');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        // Temporarily disabled - hardcoded userId for testing
        showToast('Logout tạm thời bị vô hiệu hóa (đang test)', 'info');
        /*
        localStorage.removeItem('userId');
        state.userId = null;
        state.user = null;
        state.profile = null;
        document.getElementById('studentDashboard').style.display = 'none';
        document.getElementById('userNameNav').textContent = 'Đăng nhập';
        document.getElementById('userAvatarNav').innerHTML = '<i class="fas fa-user"></i>';
        document.getElementById('userDropdown').classList.remove('show');
        showToast('Đã đăng xuất thành công', 'success');
        */
    });
}

/* ── Login Modal ── */
function setupLoginModal() {
    document.getElementById('closeLoginModal')?.addEventListener('click', () => {
        document.getElementById('loginModal').classList.remove('show');
        document.body.style.overflow = '';
    });

    document.getElementById('loginConfirmBtn')?.addEventListener('click', async () => {
        // Temporarily disabled - using hardcoded student-001
        showToast('Đang sử dụng student-001 (hardcoded)', 'info');
        document.getElementById('loginModal').classList.remove('show');
        document.body.style.overflow = '';
        /*
        const userId = document.getElementById('loginInput').value.trim();
        if (!userId) { showToast('Vui lòng nhập User ID', 'warning'); return; }

        state.userId = userId;
        localStorage.setItem('userId', userId);
        document.getElementById('loginModal').classList.remove('show');
        document.body.style.overflow = '';
        showToast('Đăng nhập thành công!', 'success');
        await loadUserProfile();
        await loadNotifications();
        */
    });

    document.getElementById('loginInput')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') document.getElementById('loginConfirmBtn').click();
    });
}

/* ── Course Modal Close ── */
function setupCourseModal() {
    document.getElementById('closeCourseModal')?.addEventListener('click', () => {
        document.getElementById('courseModal').classList.remove('show');
        document.body.style.overflow = '';
    });

    document.getElementById('courseModal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('courseModal')) {
            document.getElementById('courseModal').classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    document.getElementById('loginModal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('loginModal')) {
            document.getElementById('loginModal').classList.remove('show');
            document.body.style.overflow = '';
        }
    });
}

/* ── Load More ── */
document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    state.page++;
    loadCourses(false);
});

/* ── Filter Tabs ── */
document.getElementById('filterTabs')?.addEventListener('click', e => {
    if (e.target.classList.contains('filter-tab') && e.target.dataset.category === '') {
        state.activeCategory = '';
        loadCourses(true);
    }
});

/* ── Intersection Observer (Scroll Animations) ── */
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.stat-card, .feature-item, .instructor-card, .cat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

/* ── Animated Progress Bars ── */
function animateProgressBars() {
    document.querySelectorAll('.pb-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = width; }, 500);
    });
}

/* ── Init ── */
async function init() {
    setupNavbar();
    setupSearch();
    setupNotifications();
    setupUserMenu();
    setupLoginModal();
    setupCourseModal();

    // Load data in parallel
    await Promise.all([
        loadCategories(),
        loadCourses(true),
        loadInstructors()
    ]);

    // If logged in, load personal data
    if (state.userId) {
        await loadUserProfile();
        await loadNotifications();
    }

    // Animations after content loads
    setTimeout(() => {
        setupScrollAnimations();
        animateProgressBars();
    }, 300);
}

// Run when DOM ready
document.addEventListener('DOMContentLoaded', init);
