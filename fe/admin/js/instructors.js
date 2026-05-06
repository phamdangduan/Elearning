/* ============================================================
   EduVN Admin - Instructors Management
   Quản lý giảng viên với dữ liệu từ backend
============================================================ */

let allInstructors = [];
let filteredInstructors = [];
let viewMode = 'grid';

/* ── Load Instructors ── */
async function loadInstructors() {
    try {
        // Get all instructors from backend
        const data = await apiGet('/profile/instructors');
        const instructors = data?.result || [];
        
        console.log('[Instructors] Loaded:', instructors.length, instructors);
        
        // Load stats for each instructor
        const statsPromises = instructors.map(async (instructor) => {
            try {
                const statsData = await apiGet(`/instructor/stats?instructorId=${instructor.id}`);
                const stats = statsData?.result || {};
                
                console.log(`[Instructor ${instructor.id}] Stats:`, stats);
                console.log(`[Instructor ${instructor.id}] Revenue raw:`, stats.totalRevenue, 'type:', typeof stats.totalRevenue);
                
                return {
                    id: instructor.id,
                    fullName: instructor.fullName || instructor.firstName || instructor.userName || 'Giảng viên',
                    email: instructor.email || '',
                    avatar: instructor.avatar,
                    bio: instructor.bio,
                    phone: instructor.phone,
                    address: instructor.address,
                    status: instructor.status || 'ACTIVE',
                    createdAt: instructor.createdAt,
                    // Stats from API - parse numbers properly
                    courses: parseInt(stats.totalCourses) || 0,
                    students: parseInt(stats.totalStudents) || 0,
                    revenue: parseFloat(stats.totalRevenue) || 0,
                    rating: parseFloat(stats.averageRating) || 0,
                    totalReviews: parseInt(stats.totalReviews) || 0
                };
            } catch (error) {
                console.error(`[Instructor ${instructor.id}] Error loading stats:`, error);
                return {
                    id: instructor.id,
                    fullName: instructor.fullName || instructor.firstName || instructor.userName || 'Giảng viên',
                    email: instructor.email || '',
                    avatar: instructor.avatar,
                    bio: instructor.bio,
                    status: instructor.status || 'ACTIVE',
                    createdAt: instructor.createdAt,
                    courses: 0,
                    students: 0,
                    revenue: 0,
                    rating: 0,
                    totalReviews: 0
                };
            }
        });
        
        allInstructors = await Promise.all(statsPromises);
        
        console.log('[Instructors] With stats:', allInstructors);
        
        updateStats();
        applyFilter();
    } catch (error) {
        console.error('[Instructors] Error loading:', error);
        showToast('Không thể tải danh sách giảng viên', 'error');
        allInstructors = [];
        updateStats();
        applyFilter();
    }
}

/* ── Update Stats ── */
function updateStats() {
    const total = allInstructors.length;
    const active = allInstructors.filter(t => t.status === 'ACTIVE').length;
    const totalRevenue = allInstructors.reduce((sum, t) => {
        const rev = parseFloat(t.revenue) || 0;
        return sum + rev;
    }, 0);
    
    console.log('[Stats] Total revenue calculation:', totalRevenue);
    console.log('[Stats] All revenues:', allInstructors.map(t => ({ name: t.fullName, revenue: t.revenue })));
    
    const ratingsWithValue = allInstructors.filter(t => t.rating > 0);
    const avgRating = ratingsWithValue.length 
        ? (ratingsWithValue.reduce((sum, t) => sum + (t.rating || 0), 0) / ratingsWithValue.length).toFixed(1)
        : '–';
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statRevenue').textContent = shortNum(totalRevenue) + 'đ';
    document.getElementById('statAvgRating').textContent = avgRating;
    
    console.log('[Stats]', { total, active, totalRevenue, avgRating });
}

/* ── Apply Filter ── */
function applyFilter() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const sort = document.getElementById('sortFilter').value;
    
    let list = [...allInstructors];
    
    // Search filter
    if (q) {
        list = list.filter(t => 
            (t.fullName || '').toLowerCase().includes(q) ||
            (t.email || '').toLowerCase().includes(q)
        );
    }
    
    // Sort
    if (sort === 'students_desc') {
        list.sort((a, b) => (b.students || 0) - (a.students || 0));
    } else if (sort === 'rating_desc') {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'name_asc') {
        list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    } else if (sort === 'courses_desc') {
        list.sort((a, b) => (b.courses || 0) - (a.courses || 0));
    } else {
        // revenue_desc (default)
        list.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    }
    
    filteredInstructors = list;
    
    const displayCount = document.getElementById('displayCount');
    if (displayCount) displayCount.textContent = list.length;
    
    if (viewMode === 'grid') {
        renderGrid();
    } else {
        renderTable();
    }
}

/* ── Switch View ── */
function switchView(mode) {
    viewMode = mode;
    document.getElementById('gridView').style.display = mode === 'grid' ? '' : 'none';
    document.getElementById('tableView').style.display = mode === 'table' ? '' : 'none';
    document.getElementById('viewGridBtn').classList.toggle('active', mode === 'grid');
    document.getElementById('viewTableBtn').classList.toggle('active', mode === 'table');
    applyFilter();
}

/* ── Render Grid ── */
function renderGrid() {
    const list = filteredInstructors;
    
    if (!list.length) {
        document.getElementById('instructorGrid').innerHTML = `
            <div style="grid-column:1/-1">
                <div class="empty-state">
                    <div class="empty-icon">👨‍🏫</div>
                    <h3>Không tìm thấy giảng viên</h3>
                    <p>Thử thay đổi từ khóa tìm kiếm</p>
                </div>
            </div>`;
        return;
    }
    
    document.getElementById('instructorGrid').innerHTML = list.map(t => {
        const initials = (t.fullName || 'T')[0].toUpperCase();
        const stars = '★'.repeat(Math.round(t.rating || 0)) + '☆'.repeat(5 - Math.round(t.rating || 0));
        const isLocked = t.status === 'LOCKED' || t.status === 'INACTIVE';
        
        return `
            <div class="instructor-card">
                <div class="instructor-card-top">
                    <div class="instructor-avatar">
                        ${t.avatar 
                            ? `<img src="${t.avatar}" alt="${t.fullName}">` 
                            : initials
                        }
                    </div>
                    <div class="instructor-info">
                        <div class="instructor-name">${t.fullName}</div>
                        <div class="instructor-email">${t.email}</div>
                        <div style="margin-top:6px">
                            <span class="badge ${isLocked ? 'badge-danger' : 'badge-success'}">
                                ${isLocked ? '🔒 Bị khóa' : '✅ Hoạt động'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="instructor-stats">
                    <div class="ins-stat">
                        <div class="ins-stat-val">${t.courses || 0}</div>
                        <div class="ins-stat-lab">Khóa học</div>
                    </div>
                    <div class="ins-stat">
                        <div class="ins-stat-val">${(t.students || 0).toLocaleString('vi-VN')}</div>
                        <div class="ins-stat-lab">Học viên</div>
                    </div>
                    <div class="ins-stat">
                        <div class="ins-stat-val">${shortNum(t.revenue || 0)}đ</div>
                        <div class="ins-stat-lab">Doanh thu</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="color:#f59e0b;font-size:13px">
                        ${stars} 
                        <span style="color:var(--text-muted)">${(t.rating || 0).toFixed(1)}</span>
                        <span style="color:var(--text-muted);font-size:11px">(${t.totalReviews || 0})</span>
                    </div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-outline btn-sm" onclick="viewInstructor('${t.id}')">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                        <button class="btn ${isLocked ? 'btn-success' : 'btn-danger'} btn-sm" 
                                onclick="toggleLock('${t.id}')">
                            <i class="fas fa-${isLocked ? 'lock-open' : 'lock'}"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

/* ── Render Table ── */
function renderTable() {
    const list = filteredInstructors;
    
    if (!list.length) {
        document.getElementById('instructorTableBody').innerHTML = `
            <tr><td colspan="8">
                <div class="empty-state">
                    <div class="empty-icon">👨‍🏫</div>
                    <h3>Không có giảng viên</h3>
                </div>
            </td></tr>`;
        return;
    }
    
    document.getElementById('instructorTableBody').innerHTML = list.map((t, i) => {
        const initials = (t.fullName || 'T')[0].toUpperCase();
        const isLocked = t.status === 'LOCKED' || t.status === 'INACTIVE';
        
        return `
            <tr>
                <td style="color:var(--text-muted);font-size:12px">${i + 1}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-sm">
                            ${t.avatar 
                                ? `<img src="${t.avatar}" alt="${t.fullName}">` 
                                : initials
                            }
                        </div>
                        <div class="user-name-wrap">
                            <div class="user-name-el">${t.fullName}</div>
                            <div class="user-email-el">${t.email}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size:13px">${t.courses || 0}</td>
                <td style="font-size:13px">${(t.students || 0).toLocaleString('vi-VN')}</td>
                <td style="font-size:13px;font-weight:700;color:var(--teacher-green)">
                    ${shortNum(t.revenue || 0)}đ
                </td>
                <td style="font-size:13px;color:#f59e0b">
                    ${(t.rating || 0).toFixed(1)} ★
                </td>
                <td>
                    <span class="badge ${isLocked ? 'badge-danger' : 'badge-success'}">
                        ${isLocked ? '🔒 Khóa' : '✅ Hoạt động'}
                    </span>
                </td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="tbl-action" onclick="viewInstructor('${t.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="tbl-action ${isLocked ? 'success' : 'danger'}" 
                                onclick="toggleLock('${t.id}')">
                            <i class="fas fa-${isLocked ? 'lock-open' : 'lock'}"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

/* ── View Instructor Detail ── */
function viewInstructor(id) {
    const t = allInstructors.find(x => x.id === id);
    if (!t) return;
    
    const initials = (t.fullName || 'T')[0].toUpperCase();
    const isLocked = t.status === 'LOCKED' || t.status === 'INACTIVE';
    
    document.getElementById('instructorModalBody').innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;padding:20px;background:var(--bg-primary);border-radius:var(--radius-lg);margin-bottom:20px">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;color:white;font-size:26px;font-weight:800;flex-shrink:0;overflow:hidden">
                ${t.avatar 
                    ? `<img src="${t.avatar}" style="width:100%;height:100%;object-fit:cover">` 
                    : initials
                }
            </div>
            <div>
                <div style="font-size:20px;font-weight:800;margin-bottom:4px">${t.fullName}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${t.email}</div>
                <span class="badge ${isLocked ? 'badge-danger' : 'badge-success'}">
                    ${isLocked ? '🔒 Bị khóa' : '✅ Hoạt động'}
                </span>
            </div>
        </div>
        <div class="form-row-3">
            <div class="ins-stat" style="border-radius:var(--radius)">
                <div class="ins-stat-val" style="font-size:24px">${t.courses || 0}</div>
                <div class="ins-stat-lab">Khóa học</div>
            </div>
            <div class="ins-stat" style="border-radius:var(--radius)">
                <div class="ins-stat-val" style="font-size:24px">${(t.students || 0).toLocaleString('vi-VN')}</div>
                <div class="ins-stat-lab">Học viên</div>
            </div>
            <div class="ins-stat" style="border-radius:var(--radius)">
                <div class="ins-stat-val" style="font-size:24px">${shortNum(t.revenue || 0)}đ</div>
                <div class="ins-stat-lab">Doanh thu</div>
            </div>
        </div>
        <div class="form-row" style="margin-top:16px">
            <div>
                <label class="form-label">Rating trung bình</label>
                <p style="font-size:18px;color:#f59e0b;font-weight:800">
                    ${(t.rating || 0).toFixed(1)} ★ 
                    <span style="font-size:13px;color:var(--text-muted)">(${t.totalReviews || 0} đánh giá)</span>
                </p>
            </div>
            <div>
                <label class="form-label">Tham gia từ</label>
                <p>${formatDate(t.createdAt)}</p>
            </div>
        </div>
        ${t.bio ? `
            <div style="margin-top:16px">
                <label class="form-label">Giới thiệu</label>
                <p style="font-size:14px;line-height:1.6">${t.bio}</p>
            </div>
        ` : ''}
        ${t.phone || t.address ? `
            <div class="form-row" style="margin-top:16px">
                ${t.phone ? `<div><label class="form-label">Số điện thoại</label><p>${t.phone}</p></div>` : ''}
                ${t.address ? `<div><label class="form-label">Địa chỉ</label><p>${t.address}</p></div>` : ''}
            </div>
        ` : ''}
    `;
    
    const footer = document.getElementById('instructorModalFooter');
    footer.innerHTML = `
        <button class="btn btn-outline" onclick="closeModal('instructorModal')">Đóng</button>
        <button class="btn ${isLocked ? 'btn-success' : 'btn-danger'}" 
                onclick="toggleLock('${t.id}');closeModal('instructorModal')">
            <i class="fas fa-${isLocked ? 'lock-open' : 'lock'}"></i> 
            ${isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
        </button>`;
    
    openModal('instructorModal');
}

/* ── Toggle Lock ── */
async function toggleLock(id) {
    const t = allInstructors.find(x => x.id === id);
    if (!t) return;
    
    const isLocked = t.status === 'LOCKED' || t.status === 'INACTIVE';
    const newStatus = isLocked ? 'ACTIVE' : 'LOCKED';
    
    try {
        // Call backend API
        await fetch(`${API_BASE}/profile/${id}/status?status=${newStatus}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        
        // Update local state
        t.status = newStatus;
        updateStats();
        applyFilter();
        
        showToast(
            isLocked ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản!',
            isLocked ? 'success' : 'warning'
        );
    } catch (error) {
        console.error('[Toggle Lock] Error:', error);
        showToast('Không thể cập nhật trạng thái', 'error');
    }
}

/* ── Helper Functions ── */
function formatDate(dateStr) {
    if (!dateStr) return '–';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

/* ── Event Listeners ── */
document.getElementById('searchInput')?.addEventListener('input', debounce(applyFilter, 300));
document.getElementById('sortFilter')?.addEventListener('change', applyFilter);

/* ── Initialize ── */
document.addEventListener('DOMContentLoaded', loadInstructors);
