/* ============================================================
   EduVN Admin - Users Management
   Quản lý người dùng với dữ liệu từ backend
============================================================ */

const PAGE_SIZE = 15;
let allUsers = [];
let filteredUsers = [];
let currentPage = 0;
let currentUser = null;

const MOCK_USERS = [
  { id: 'u1', fullName: 'Nguyễn Văn An', email: 'an.nv@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-01-15T08:00:00Z', phone: '0912345678', address: 'Hà Nội', bio: 'Giảng viên Web Dev' },
  { id: 'u2', fullName: 'Trần Thị Bình', email: 'binh.tt@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-02-10T09:30:00Z', phone: '0987654321', address: 'Đà Nẵng', bio: 'Giảng viên Spring Boot' },
  { id: 'u3', fullName: 'Lê Quốc Cường', email: 'cuong.lq@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-03-01T10:15:00Z', phone: '0905112233', address: 'TP. HCM', bio: 'Chuyên gia Machine Learning' },
  { id: 'u4', fullName: 'Phạm Minh Đức', email: 'duc.pm@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-03-12T14:20:00Z', phone: '0934556677', address: 'Hải Phòng', bio: 'Kỹ sư DevOps' },
  { id: 'u5', fullName: 'Hoàng Thị Em', email: 'em.ht@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-02-05T11:00:00Z', phone: '0977889900', address: 'Cần Thơ', bio: 'Giảng viên Java Core' },
  { id: 'u6', fullName: 'Vũ Văn Phong', email: 'phong.vv@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-04-20T16:45:00Z', phone: '0911223344', address: 'Hà Nội' },
  { id: 'u7', fullName: 'Đỗ Thị Giang', email: 'giang.dt@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-01-08T07:30:00Z', phone: '0944556677', address: 'Quảng Ninh' },
  { id: 'u8', fullName: 'Ngô Đức Hùng', email: 'hung.nd@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-02-28T15:10:00Z', phone: '0966778899', address: 'Nghệ An' },
  { id: 'u9', fullName: 'Đinh Thị Lan', email: 'lan.dt@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-02-20T08:50:00Z', phone: '0988990011', address: 'Thanh Hóa' },
  { id: 'u10', fullName: 'Trương Văn Minh', email: 'minh.tv@example.com', roles: ['TEACHER'], status: 'ACTIVE', createdAt: '2026-04-25T13:40:00Z', phone: '0955667788', address: 'Bình Dương' },
  { id: 'u11', fullName: 'Nguyễn Văn Học', email: 'hoc.nv@example.com', roles: ['STUDENT'], status: 'ACTIVE', createdAt: '2026-05-01T09:00:00Z', phone: '0912345001', address: 'Hà Nội', courseCount: 3 },
  { id: 'u12', fullName: 'Trần Thị Viên', email: 'vien.tt@example.com', roles: ['STUDENT'], status: 'ACTIVE', createdAt: '2026-05-02T10:30:00Z', phone: '0987654002', address: 'Đà Nẵng', courseCount: 2 },
  { id: 'u13', fullName: 'Lê Văn Sinh', email: 'sinh.lv@example.com', roles: ['STUDENT'], status: 'LOCKED', createdAt: '2026-05-03T11:15:00Z', phone: '0905112003', address: 'TP. HCM', courseCount: 1 },
  { id: 'u14', fullName: 'Phạm Thị Mơ', email: 'mo.pt@example.com', roles: ['STUDENT'], status: 'ACTIVE', createdAt: '2026-05-04T14:20:00Z', phone: '0934556004', address: 'Huế', courseCount: 4 },
  { id: 'u15', fullName: 'Hoàng Văn Tài', email: 'tai.hv@example.com', roles: ['STUDENT'], status: 'ACTIVE', createdAt: '2026-05-05T15:00:00Z', phone: '0977889005', address: 'Cần Thơ', courseCount: 0 },
];

/* ── Load Users ── */
async function loadUsers() {
    showSkeleton();
    
    let rawUsers = [];
    let allCourses = [];
    try {
        // Get all users from backend
        const data = await apiGet('/profile/getAll');
        rawUsers = data?.result || [];
        if (!rawUsers.length) rawUsers = MOCK_USERS;
    } catch (error) {
        console.error('[Users] Error loading users:', error);
        rawUsers = MOCK_USERS;
    }

    try {
        // Get all courses from backend to calculate teacher's courses count
        const coursesData = await apiGet('/course/search?page=0&size=1000');
        allCourses = coursesData?.result?.content || [];
    } catch (error) {
        console.error('[Users] Error loading courses for count:', error);
    }

    try {
        // Transform data to match UI format
        allUsers = rawUsers.map(user => {
            const role = getRolePrimary(user.roles);
            
            // Tính số khóa học của giảng viên dựa trên instructorId hoặc instructorName
            let courseCount = user.courseCount || 0;
            if (role === 'TEACHER') {
                const teacherCourses = allCourses.filter(c => 
                    c.instructorId === user.id || 
                    (c.instructorName && c.instructorName === (user.fullName || user.firstName || user.userName)) ||
                    (c.instructor && c.instructor === (user.fullName || user.firstName || user.userName))
                );
                courseCount = teacherCourses.length;
            }
            
            return {
                id: user.id,
                fullName: user.fullName || user.firstName || user.userName || 'Người dùng',
                email: user.email || '',
                roles: user.roles || [], // Array of roles
                role: role, // Get primary role for display
                status: user.status || 'ACTIVE',
                createdAt: user.createdAt,
                avatar: user.avatar,
                courseCount: courseCount,
                phone: user.phone,
                address: user.address,
                bio: user.bio
            };
        });
        
        updateStats();
        applyFilter();
    } catch (error) {
        console.error('[Users] Error transforming:', error);
        showToast('Không thể hiển thị danh sách người dùng', 'error');
    }
}

/* ── Get Primary Role ── */
function getRolePrimary(roles) {
    if (!roles || !roles.length) return 'STUDENT';
    
    // Priority: ADMIN > TEACHER/INSTRUCTOR > STUDENT
    const roleStr = roles.join(',').toUpperCase();
    
    if (roleStr.includes('ADMIN')) return 'ADMIN';
    if (roleStr.includes('TEACHER') || roleStr.includes('INSTRUCTOR')) return 'TEACHER';
    if (roleStr.includes('STUDENT') || roleStr.includes('USER')) return 'STUDENT';
    
    return 'STUDENT';
}

/* ── Show Skeleton ── */
function showSkeleton() {
    document.getElementById('userTableBody').innerHTML = `
        <tr><td colspan="7">
            <div style="display:flex;flex-direction:column;gap:10px;padding:16px">
                <div class="skeleton" style="height:52px;border-radius:var(--radius-sm)"></div>
                <div class="skeleton" style="height:52px;border-radius:var(--radius-sm)"></div>
                <div class="skeleton" style="height:52px;border-radius:var(--radius-sm)"></div>
            </div>
        </td></tr>`;
}

/* ── Update Stats ── */
function updateStats() {
    const total = allUsers.length;
    const students = allUsers.filter(u => u.role === 'STUDENT').length;
    const teachers = allUsers.filter(u => u.role === 'TEACHER').length;
    const locked = allUsers.filter(u => u.status === 'LOCKED' || u.status === 'INACTIVE').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statStudents').textContent = students;
    document.getElementById('statTeachers').textContent = teachers;
    document.getElementById('statLocked').textContent = locked;
    
    console.log('[Stats]', { total, students, teachers, locked });
}

/* ── Apply Filter ── */
function applyFilter() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const role = document.getElementById('roleFilter').value;
    const status = document.getElementById('statusFilter').value;
    const sort = document.getElementById('sortFilter').value;
    
    let list = [...allUsers];
    
    // Search filter
    if (q) {
        list = list.filter(u => 
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }
    
    // Role filter
    if (role) {
        list = list.filter(u => u.role === role);
    }
    
    // Status filter
    if (status) {
        list = list.filter(u => u.status === status);
    }
    
    // Sort
    if (sort === 'name_asc') {
        list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    } else if (sort === 'oldest') {
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
        // newest (default)
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    filteredUsers = list;
    currentPage = 0;
    render();
}

/* ── Render Table ── */
function render() {
    const start = currentPage * PAGE_SIZE;
    const page = filteredUsers.slice(start, start + PAGE_SIZE);
    const total = filteredUsers.length;
    
    // Update counts
    document.getElementById('displayCount').textContent = total;
    document.getElementById('tableCount').textContent = total 
        ? `Hiển thị ${start + 1}–${Math.min(start + page.length, total)} / ${total}` 
        : '';
    document.getElementById('pageInfo').textContent = total ? `Tổng ${total} người dùng` : '';
    
    // Empty state
    if (!page.length) {
        document.getElementById('userTableBody').innerHTML = `
            <tr><td colspan="7">
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Không tìm thấy người dùng</h3>
                    <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            </td></tr>`;
        document.getElementById('paginationWrap').innerHTML = '';
        return;
    }
    
    // Render rows
    document.getElementById('userTableBody').innerHTML = page.map((u, i) => {
        const initials = (u.fullName || 'U')[0].toUpperCase();
        const avatarHtml = u.avatar 
            ? `<img src="${u.avatar}" alt="${u.fullName}">` 
            : initials;
        
        const roleMap = { 
            STUDENT: 'role-student', 
            TEACHER: 'role-teacher', 
            ADMIN: 'role-admin' 
        };
        const roleLabel = { 
            STUDENT: 'Học viên', 
            TEACHER: 'Giảng viên', 
            ADMIN: 'Admin' 
        };
        
        const isLocked = u.status === 'LOCKED' || u.status === 'INACTIVE';
        const statusClass = isLocked ? 'status-locked' : 'status-active';
        const statusLabel = isLocked ? '🔒 Bị khoá' : '✅ Hoạt động';
        
        return `
            <tr>
                <td style="color:var(--text-muted);font-size:12px">${start + i + 1}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-sm">${avatarHtml}</div>
                        <div class="user-name-wrap">
                            <div class="user-name-el">${u.fullName || '–'}</div>
                            <div class="user-email-el">${u.email || '–'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-chip ${roleMap[u.role] || 'role-student'}">
                        ${roleLabel[u.role] || u.role}
                    </span>
                </td>
                <td style="font-size:13px">${formatDate(u.createdAt)}</td>
                <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="tbl-action" title="Chi tiết" onclick="viewUser('${u.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="tbl-action ${isLocked ? 'success' : 'danger'}" 
                                title="${isLocked ? 'Mở khóa' : 'Khóa'}" 
                                onclick="toggleLock('${u.id}')">
                            <i class="fas fa-${isLocked ? 'lock-open' : 'lock'}"></i>
                        </button>
                        <button class="tbl-action danger" title="Xóa" onclick="deleteUser('${u.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
    
    // Render pagination
    renderPagination(total);
}

/* ── Render Pagination ── */
function renderPagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    
    if (totalPages <= 1) {
        document.getElementById('paginationWrap').innerHTML = '';
        return;
    }
    
    let html = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    for (let p = 0; p < totalPages; p++) {
        if (p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1) {
            html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">
                ${p + 1}
            </button>`;
        } else if (Math.abs(p - currentPage) === 2) {
            html += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
        }
    }
    
    html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    document.getElementById('paginationWrap').innerHTML = html;
}

/* ── Go to Page ── */
function goPage(p) {
    if (p < 0 || p >= Math.ceil(filteredUsers.length / PAGE_SIZE)) return;
    currentPage = p;
    render();
    window.scrollTo(0, 0);
}

/* ── View User Detail ── */
function viewUser(id) {
    currentUser = allUsers.find(u => u.id === id);
    if (!currentUser) return;
    
    const u = currentUser;
    const roleLabel = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', ADMIN: 'Admin' };
    const roleMap = { STUDENT: 'role-student', TEACHER: 'role-teacher', ADMIN: 'role-admin' };
    const isLocked = u.status === 'LOCKED' || u.status === 'INACTIVE';
    
    document.getElementById('userDetailBody').innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding:20px;background:var(--bg-primary);border-radius:var(--radius-lg)">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;color:white;font-size:28px;font-weight:700;flex-shrink:0">
                ${u.avatar ? `<img src="${u.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : (u.fullName || 'U')[0].toUpperCase()}
            </div>
            <div>
                <div style="font-size:20px;font-weight:800;color:var(--text-primary);margin-bottom:4px">${u.fullName || '–'}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${u.email || '–'}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <span class="role-chip ${roleMap[u.role] || ''}">${roleLabel[u.role] || u.role}</span>
                    <span class="badge ${isLocked ? 'badge-danger' : 'badge-success'}">${isLocked ? '🔒 Bị khóa' : '✅ Hoạt động'}</span>
                </div>
            </div>
        </div>
        <div class="form-row" style="margin-bottom: 18px;">
            <div><label class="form-label" style="color:var(--text-muted);font-weight:500;margin-bottom:4px">Ngày tham gia</label><p style="font-size:14px;font-weight:600;color:var(--text-primary)">${formatDate(u.createdAt)}</p></div>
            <div><label class="form-label" style="color:var(--text-muted);font-weight:500;margin-bottom:4px">Số điện thoại</label><p style="font-size:14px;font-weight:600;color:var(--text-primary)">${u.phone || '–'}</p></div>
        </div>
        <div class="form-row" style="margin-bottom: 18px;">
            <div><label class="form-label" style="color:var(--text-muted);font-weight:500;margin-bottom:4px">Địa chỉ</label><p style="font-size:14px;font-weight:600;color:var(--text-primary)">${u.address || '–'}</p></div>
            <div><label class="form-label" style="color:var(--text-muted);font-weight:500;margin-bottom:4px">Số khóa học</label><p style="font-size:14px;font-weight:600;color:var(--text-primary)">${u.courseCount || 0}</p></div>
        </div>
        ${u.bio ? `<div style="margin-top: 18px; border-top: 1px dashed var(--border); padding-top: 16px;"><label class="form-label" style="color:var(--text-muted);font-weight:500;margin-bottom:6px">Giới thiệu</label><p style="font-size:14px;line-height:1.6;color:var(--text-secondary);letter-spacing:-0.1px">${u.bio}</p></div>` : ''}
    `;
    
    const lockBtn = document.getElementById('modalLockBtn');
    lockBtn.innerHTML = isLocked 
        ? '<i class="fas fa-lock-open"></i> Mở khóa' 
        : '<i class="fas fa-lock"></i> Khóa tài khoản';
    lockBtn.className = 'btn ' + (isLocked ? 'btn-success' : 'btn-danger');
    
    openModal('userDetailModal');
}

/* ── Toggle Lock from Modal ── */
async function toggleLockFromModal() {
    if (!currentUser) return;
    await toggleLock(currentUser.id);
    closeModal('userDetailModal');
}

/* ── Toggle Lock User ── */
async function toggleLock(id) {
    const u = allUsers.find(x => x.id === id);
    if (!u) return;
    
    const isLocked = u.status === 'LOCKED' || u.status === 'INACTIVE';
    const newStatus = isLocked ? 'ACTIVE' : 'LOCKED';
    
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`${API_BASE}/profile/${id}/status?status=${newStatus}`, {
            method: 'PATCH',
            headers: headers
        });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Lỗi HTTP ${res.status}`);
        }
        
        // Update local state
        u.status = newStatus;
        updateStats();
        applyFilter();
        
        showToast(
            isLocked ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản!', 
            isLocked ? 'success' : 'warning'
        );
    } catch (error) {
        console.error('[Toggle Lock] Error:', error);
        // Fallback for Mock/Demo mode if connection fails (network error)
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch')) {
            u.status = newStatus;
            updateStats();
            applyFilter();
            showToast(
                isLocked ? 'Đã mở khóa tài khoản (Chế độ Demo)!' : 'Đã khóa tài khoản (Chế độ Demo)!', 
                isLocked ? 'success' : 'warning'
            );
        } else {
            showToast('Không thể cập nhật trạng thái: ' + error.message, 'error');
        }
    }
}

/* ── Delete User ── */
async function deleteUser(id) {
    if (!confirm('Bạn có chắc muốn xóa người dùng này? Hành động không thể hoàn tác.')) return;
    
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`${API_BASE}/profile/${id}`, {
            method: 'DELETE',
            headers: headers
        });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Lỗi HTTP ${res.status}`);
        }
        
        // Remove from local state
        allUsers = allUsers.filter(u => u.id !== id);
        updateStats();
        applyFilter();
        
        showToast('Đã xóa người dùng!', 'success');
    } catch (error) {
        console.error('[Delete User] Error:', error);
        // Fallback for Mock/Demo mode if connection fails (network error)
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch')) {
            allUsers = allUsers.filter(u => u.id !== id);
            updateStats();
            applyFilter();
            showToast('Đã xóa người dùng (Chế độ Demo)!', 'warning');
        } else {
            showToast('Không thể xóa người dùng: ' + error.message, 'error');
        }
    }
}

/* ── Create User ── */
async function createUser() {
    const fullName = document.getElementById('newFullName').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!fullName || !email || !password) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'warning');
        return;
    }
    
    try {
        // Note: Backend might not have this endpoint yet
        // This is a placeholder for future implementation
        showToast('Chức năng tạo user đang được phát triển', 'info');
        
        // Mock: Add to local state for demo
        const newUser = {
            id: 'u' + Date.now(),
            fullName,
            email,
            roles: [role],
            role,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            courseCount: 0
        };
        
        allUsers.unshift(newUser);
        closeModal('addUserModal');
        updateStats();
        applyFilter();
        
        // Clear form
        document.getElementById('newFullName').value = '';
        document.getElementById('newEmail').value = '';
        document.getElementById('newPassword').value = '';
    } catch (error) {
        console.error('[Create User] Error:', error);
        showToast('Không thể tạo tài khoản', 'error');
    }
}

/* ── Export CSV ── */
function exportCSV() {
    const rows = [['STT', 'Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tham gia']];
    
    filteredUsers.forEach((u, i) => {
        rows.push([
            i + 1,
            u.fullName || '',
            u.email || '',
            u.role || '',
            u.status || '',
            formatDate(u.createdAt)
        ]);
    });
    
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Đã xuất file CSV!', 'success');
}

/* ── Helper Functions ── */
function formatDate(dateStr) {
    if (!dateStr) return '–';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

/* ── Event Listeners ── */
document.getElementById('searchInput')?.addEventListener('input', debounce(applyFilter, 300));
document.getElementById('roleFilter')?.addEventListener('change', applyFilter);
document.getElementById('statusFilter')?.addEventListener('change', applyFilter);
document.getElementById('sortFilter')?.addEventListener('change', applyFilter);

/* ── Initialize ── */
document.addEventListener('DOMContentLoaded', loadUsers);
