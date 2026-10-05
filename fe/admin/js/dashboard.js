/* ============================================================
   EduVN Admin Dashboard - Main Logic
   Tổng hợp dữ liệu từ các API hiện có
============================================================ */

/* ── Load Dashboard Data ── */
async function loadDashboard() {
    console.log('[Dashboard] Loading...');

    // Set greeting
    setGreeting();

    // Danh sách giao dịch dùng chung cho: thanh toán chờ duyệt, biểu đồ doanh thu, hoạt động gần đây
    const paymentsPromise = apiGet('/payment-requests/all').then(d => Array.isArray(d?.result) ? d.result : null);

    // Load all data in parallel
    await Promise.all([
        loadSystemStats(),
        loadPaymentStats(),
        paymentsPromise.then(payments => {
            loadPendingPayments(payments);
            loadRevenueData(payments);
            loadRecentActivity(payments);
        })
    ]);

    console.log('[Dashboard] Loaded successfully');
}

/* ── Greeting ── */
function setGreeting() {
    const h = new Date().getHours();
    let greet = '🌅 Chào buổi sáng,';
    if (h >= 12 && h < 18) greet = '☀️ Chào buổi chiều,';
    else if (h >= 18) greet = '🌙 Chào buổi tối,';
    document.getElementById('heroGreeting').textContent = greet;
}

/* ── System Stats (người dùng + khóa học) ── */
async function loadSystemStats() {
    try {
        // Get all users
        const usersData = await apiGet('/profile/getAll');
        const allUsers = usersData?.result || [];

        // Count by role (roles is an array)
        const totalUsers = allUsers.length;
        const teachers = allUsers.filter(u => {
            const roles = u.roles || [];
            return roles.some(r => r === 'INSTRUCTOR' || r === 'TEACHER' || r === 'ROLE_INSTRUCTOR' || r === 'ROLE_TEACHER');
        }).length;

        // /course/search chỉ trả khóa PUBLISHED → admin dùng /course/search/admin để đếm đủ mọi trạng thái
        const coursesData = await apiGet('/course/search/admin?page=0&size=1000');
        const allCourses = coursesData?.result?.content || [];

        // Count courses by status
        const totalCourses = coursesData?.result?.totalElement ?? allCourses.length;
        const publishedCourses = allCourses.filter(c => c.status === 'PUBLISHED').length;
        const archivedCourses = allCourses.filter(c => c.status === 'ARCHIVED').length;
        const draftCourses = allCourses.filter(c => c.status === 'DRAFT').length;
        const totalEnrollments = allCourses.reduce((sum, c) => sum + (c.totalEnrollments || 0), 0);

        // Update UI
        document.getElementById('statUsers').textContent = totalUsers.toLocaleString('vi-VN');
        document.getElementById('statTeachers').textContent = teachers;
        document.getElementById('statCourses').textContent = totalCourses;
        document.getElementById('statEnrollments').textContent = totalEnrollments.toLocaleString('vi-VN');

        // Hero stats
        document.getElementById('heroUsers').textContent = totalUsers.toLocaleString('vi-VN');
        document.getElementById('heroCourses').textContent = totalCourses;

        // Quick stats
        document.getElementById('qs-published').textContent = publishedCourses;
        document.getElementById('qs-archived').textContent = archivedCourses;
        document.getElementById('qs-draft').textContent = draftCourses;

        // Animate numbers
        setTimeout(() => {
            animateCount(document.getElementById('statUsers'), totalUsers);
            animateCount(document.getElementById('statTeachers'), teachers);
            animateCount(document.getElementById('statCourses'), totalCourses);
            animateCount(document.getElementById('statEnrollments'), totalEnrollments);
        }, 200);

    } catch (error) {
        console.error('[Stats] Error loading:', error);
        showToast('Không thể tải thống kê hệ thống', 'error');
    }
}

/* ── Payment Stats: doanh thu = tổng giao dịch CONFIRMED (BE tính) ── */
async function loadPaymentStats() {
    const data = await apiGet('/payment-requests/stats');
    const stats = data?.result;
    if (!stats) {
        ['statRevenue', 'statPending', 'heroRevenue'].forEach(id => {
            document.getElementById(id).textContent = '–';
        });
        return;
    }

    const revenue = Number(stats.totalRevenue) || 0;
    const pending = stats.pendingCount || 0;
    document.getElementById('statRevenue').textContent = shortNum(revenue);
    document.getElementById('heroRevenue').textContent = shortNum(revenue) + 'đ';
    document.getElementById('statPending').textContent = pending;
    setTimeout(() => animateCount(document.getElementById('statPending'), pending), 200);

    if (pending > 0) {
        const badge = document.getElementById('pendingPayBadge');
        badge.textContent = pending;
        badge.style.display = '';
    }
}

/* ── Pending Payments ── */
function loadPendingPayments(payments) {
    if (!payments) {
        document.getElementById('pendingPayList').innerHTML =
            '<div style="text-align:center;padding:20px;color:var(--text-muted)">Không thể tải danh sách</div>';
        return;
    }
    const pending = payments
        .filter(p => p.status === 'PENDING')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    renderPendingPayments(pending);
}

function renderPendingPayments(payments) {
    const el = document.getElementById('pendingPayList');

    if (!payments.length) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">Không có thanh toán chờ duyệt</div>';
        return;
    }

    el.innerHTML = payments.slice(0, 5).map(p => {
        const hasProof = !!p.paymentProofUrl;
        const statusText = hasProof ? '📋 Chờ duyệt' : '⏳ Chờ bill';
        const statusClass = hasProof ? 'badge-warning' : 'badge-secondary';

        return `
        <div class="pending-item">
            <div class="pending-icon" style="background:var(--teacher-green-light);color:var(--teacher-green)">
                <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="pending-info">
                <div class="pending-title">${p.studentName || 'Học viên'}</div>
                <div class="pending-sub">${p.courseTitle || 'Khóa học'} · ${formatMoney(p.amount || 0)}</div>
            </div>
            <span class="badge ${statusClass}">${statusText}</span>
        </div>`;
    }).join('');
}

/* ── Revenue Chart: 12 tháng gần nhất, cộng giao dịch CONFIRMED theo tháng xác nhận ── */
function loadRevenueData(payments) {
    const chartEl = document.getElementById('revenueChart');
    if (!payments) {
        chartEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Không tải được dữ liệu doanh thu</div>';
        return;
    }

    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: `T${d.getMonth() + 1}`, value: 0 });
    }
    const byKey = Object.fromEntries(months.map(m => [m.key, m]));

    payments
        .filter(p => p.status === 'CONFIRMED')
        .forEach(p => {
            const d = new Date(p.confirmedAt || p.createdAt);
            const bucket = byKey[`${d.getFullYear()}-${d.getMonth()}`];
            if (bucket) bucket.value += Number(p.amount) || 0;
        });

    if (months.every(m => m.value === 0)) {
        chartEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Chưa có doanh thu trong 12 tháng gần đây</div>';
        return;
    }
    renderChart(months);
}

function renderChart(data) {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const html = `<div class="chart-wrap">${data.map(d => {
        const pct = Math.max((d.value / maxVal) * 100, 2);
        const val = (d.value / 1000000).toFixed(1) + 'tr';
        return `<div class="chart-bar" style="height:${pct}%" data-label="${d.month}" data-value="${val}đ"></div>`;
    }).join('')}</div>`;
    document.getElementById('revenueChart').innerHTML = html;
}

/* ── Recent Activity: 6 giao dịch mới nhất ── */
const ACTIVITY_BY_STATUS = {
    CONFIRMED: { dot: 'green',  verb: 'đã thanh toán' },
    PENDING:   { dot: 'orange', verb: 'tạo yêu cầu thanh toán' },
    REJECTED:  { dot: 'red',    verb: 'bị từ chối thanh toán' },
    EXPIRED:   { dot: '',       verb: 'để hết hạn thanh toán' },
    CANCELLED: { dot: '',       verb: 'hủy thanh toán' }
};

function loadRecentActivity(payments) {
    const el = document.getElementById('activityList');
    if (!payments) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Không thể tải hoạt động</div>';
        return;
    }

    const recent = payments
        .map(p => ({ ...p, at: p.confirmedAt || p.createdAt }))
        .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
        .slice(0, 6);

    if (!recent.length) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">Chưa có hoạt động nào</div>';
        return;
    }

    el.innerHTML = recent.map(p => {
        const a = ACTIVITY_BY_STATUS[p.status] || { dot: '', verb: p.status };
        return `<div class="activity-item">
                <div class="activity-dot ${a.dot}"></div>
                <div class="activity-text"><strong>${p.studentName || 'Học viên'}</strong> ${a.verb} khóa <strong>${p.courseTitle || ''}</strong></div>
                <div class="activity-time">${timeAgo(p.at)}</div>
            </div>`;
    }).join('');
}

/* ── Helper Functions ── */
function shortNum(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatMoney(amount) {
    if (!amount || amount === 0) return 'Miễn phí';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

function animateCount(element, target) {
    if (!element || !target) return;

    let current = 0;
    const increment = target / 30;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString('vi-VN');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString('vi-VN');
        }
    }, 30);
}

/* ── Initialize ── */
document.addEventListener('DOMContentLoaded', loadDashboard);
