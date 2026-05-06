/* ============================================================
   EduVN Admin Dashboard - Main Logic
   Tổng hợp dữ liệu từ các API hiện có
============================================================ */

/* ── Load Dashboard Data ── */
async function loadDashboard() {
    console.log('[Dashboard] Loading...');
    
    // Set greeting
    setGreeting();
    
    // Load all data in parallel
    await Promise.all([
        loadSystemStats(),
        loadPendingPayments(),
        loadRevenueData(),
        loadRecentActivity()
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

/* ── System Stats ── */
async function loadSystemStats() {
    try {
        // Get all users
        const usersData = await apiGet('/profile/getAll');
        const allUsers = usersData?.result || [];
        
        console.log('[Stats] Loaded users:', allUsers.length, allUsers);
        
        // Count by role (roles is an array)
        const totalUsers = allUsers.length;
        const teachers = allUsers.filter(u => {
            const roles = u.roles || [];
            return roles.some(r => r === 'INSTRUCTOR' || r === 'TEACHER' || r === 'ROLE_INSTRUCTOR' || r === 'ROLE_TEACHER');
        }).length;
        const students = allUsers.filter(u => {
            const roles = u.roles || [];
            return roles.some(r => r === 'STUDENT' || r === 'USER' || r === 'ROLE_STUDENT' || r === 'ROLE_USER');
        }).length;
        
        console.log('[Stats] Total users:', totalUsers, 'Teachers:', teachers, 'Students:', students);
        
        // Get all courses
        const coursesData = await apiGet('/course/search?page=0&size=1000');
        const allCourses = coursesData?.result?.content || [];
        
        // Count courses by status
        const totalCourses = allCourses.length;
        const publishedCourses = allCourses.filter(c => c.status === 'PUBLISHED').length;
        const pendingCourses = allCourses.filter(c => c.status === 'PENDING').length;
        const draftCourses = allCourses.filter(c => c.status === 'DRAFT').length;
        
        // Get all enrollments to calculate revenue
        let totalEnrollments = 0;
        let totalRevenue = 0;
        
        // Try to get enrollment stats (if API exists)
        try {
            // Get enrollments for revenue calculation
            // Since we don't have a global enrollment API, we'll estimate from courses
            allCourses.forEach(course => {
                const enrollments = course.totalEnrollments || 0;
                const price = course.price || 0;
                totalEnrollments += enrollments;
                totalRevenue += enrollments * price;
            });
        } catch (e) {
            console.warn('[Stats] Could not calculate enrollments/revenue:', e);
        }
        
        // Update UI
        document.getElementById('statUsers').textContent = totalUsers.toLocaleString('vi-VN');
        document.getElementById('statTeachers').textContent = teachers;
        document.getElementById('statCourses').textContent = totalCourses;
        document.getElementById('statPending').textContent = pendingCourses;
        document.getElementById('statRevenue').textContent = shortNum(totalRevenue);
        document.getElementById('statEnrollments').textContent = totalEnrollments.toLocaleString('vi-VN');
        
        // Hero stats
        document.getElementById('heroUsers').textContent = totalUsers.toLocaleString('vi-VN');
        document.getElementById('heroCourses').textContent = totalCourses;
        document.getElementById('heroRevenue').textContent = shortNum(totalRevenue) + 'đ';
        
        // Quick stats
        document.getElementById('qs-published').textContent = publishedCourses;
        document.getElementById('qs-pending-c').textContent = pendingCourses;
        document.getElementById('qs-draft').textContent = draftCourses;
        
        // Update badges
        if (pendingCourses > 0) {
            const badge = document.getElementById('pendingCoursesBadge');
            if (badge) {
                badge.textContent = pendingCourses;
                badge.style.display = '';
            }
        }
        
        // Animate numbers
        setTimeout(() => {
            animateCount(document.getElementById('statUsers'), totalUsers);
            animateCount(document.getElementById('statTeachers'), teachers);
            animateCount(document.getElementById('statCourses'), totalCourses);
            animateCount(document.getElementById('statPending'), pendingCourses);
            animateCount(document.getElementById('statEnrollments'), totalEnrollments);
        }, 200);
        
        console.log('[Stats] Loaded:', { totalUsers, teachers, totalCourses, pendingCourses, totalRevenue, totalEnrollments });
        
    } catch (error) {
        console.error('[Stats] Error loading:', error);
        showToast('Không thể tải thống kê hệ thống', 'error');
    }
}

/* ── Pending Payments ── */
async function loadPendingPayments() {
    try {
        const data = await apiGet('/payment-request/pending?page=0&size=10');
        const payments = data?.result?.content || [];
        
        console.log('[Pending Payments] Found:', payments.length);
        
        renderPendingPayments(payments);
        
        // Update badge
        if (payments.length > 0) {
            const badge = document.getElementById('pendingPayBadge');
            badge.textContent = payments.length;
            badge.style.display = '';
        }
    } catch (error) {
        console.error('[Pending Payments] Error:', error);
        document.getElementById('pendingPayList').innerHTML = 
            '<div style="text-align:center;padding:20px;color:var(--text-muted)">Không thể tải danh sách</div>';
    }
}

function renderPendingPayments(payments) {
    const el = document.getElementById('pendingPayList');
    
    if (!payments.length) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">Không có thanh toán chờ duyệt</div>';
        return;
    }
    
    el.innerHTML = payments.slice(0, 5).map(p => {
        const statusText = p.status === 'PROOF_UPLOADED' ? '📋 Chờ duyệt' : '⏳ Chờ bill';
        const statusClass = p.status === 'PROOF_UPLOADED' ? 'badge-warning' : 'badge-secondary';
        
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

/* ── Revenue Chart ── */
async function loadRevenueData() {
    try {
        // Mock data for now - in real app, get from backend
        const mockRevenue = [
            { month:'T1', value:18500000 }, { month:'T2', value:22300000 }, { month:'T3', value:19800000 },
            { month:'T4', value:31200000 }, { month:'T5', value:28600000 }, { month:'T6', value:35100000 },
            { month:'T7', value:42000000 }, { month:'T8', value:38500000 }, { month:'T9', value:45200000 },
            { month:'T10', value:51000000 }, { month:'T11', value:47800000 }, { month:'T12', value:62000000 },
        ];
        
        renderChart(mockRevenue);
    } catch (error) {
        console.error('[Revenue Chart] Error:', error);
    }
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

/* ── Recent Activity ── */
async function loadRecentActivity() {
    try {
        // Mock activity for now
        const activities = [
            { dot:'green', msg:'Hệ thống đang hoạt động bình thường', time:'Vừa xong' },
            { dot:'orange', msg:'Có <strong>khóa học mới</strong> chờ duyệt', time:'5 phút trước' },
            { dot:'', msg:'Người dùng mới đăng ký', time:'15 phút trước' },
            { dot:'green', msg:'Thanh toán được xác nhận', time:'1 giờ trước' },
            { dot:'', msg:'Cập nhật hệ thống thành công', time:'2 giờ trước' },
        ];
        
        document.getElementById('activityList').innerHTML = activities.map(a =>
            `<div class="activity-item">
                <div class="activity-dot ${a.dot}"></div>
                <div class="activity-text">${a.msg}</div>
                <div class="activity-time">${a.time}</div>
            </div>`
        ).join('');
    } catch (error) {
        console.error('[Activity] Error:', error);
    }
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

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
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
