/* ============================================================
   EduVN Admin - Categories Management
   Quản lý danh mục với dữ liệu từ backend
============================================================ */

let allCategories = [];

const COLOR_MAP = {
    blue: { bg: 'var(--primary-xlight)', color: 'var(--primary)' },
    green: { bg: 'var(--teacher-green-light)', color: 'var(--teacher-green)' },
    orange: { bg: 'var(--teacher-orange-light)', color: 'var(--teacher-orange)' },
    purple: { bg: 'var(--teacher-purple-light)', color: 'var(--teacher-purple)' },
    red: { bg: 'var(--admin-red-light)', color: 'var(--admin-red)' },
    teal: { bg: 'var(--admin-teal-light)', color: 'var(--admin-teal)' },
};

/* ── Load Categories ── */
async function loadCategories() {
    try {
        const data = await apiGet('/category');
        const categories = data?.result || [];
        
        console.log('[Categories] Loaded:', categories.length, categories);
        
        // Transform data - backend không trả courseCount, color, status
        allCategories = categories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            icon: c.icon || c.iconUrl || '📁',
            iconUrl: c.iconUrl,
            // Default values vì backend không có
            color: 'blue',
            courseCount: 0,
            status: 'ACTIVE'
        }));
        
        console.log('[Categories] Transformed:', allCategories);
        
        updateStats();
        renderGrid();
    } catch (error) {
        console.error('[Categories] Error loading:', error);
        showToast('Không thể tải danh sách danh mục', 'error');
        allCategories = [];
        updateStats();
        renderGrid();
    }
}

/* ── Update Stats ── */
function updateStats() {
    document.getElementById('statTotal').textContent = allCategories.length;
    document.getElementById('statCourses').textContent = allCategories.reduce((s, c) => s + (c.courseCount || 0), 0);
    document.getElementById('statActive').textContent = allCategories.filter(c => c.status === 'ACTIVE').length;
    document.getElementById('statHidden').textContent = allCategories.filter(c => c.status === 'HIDDEN').length;
}

/* ── Render Grid ── */
function renderGrid() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;
    
    let list = [...allCategories];
    
    // Search filter
    if (q) {
        list = list.filter(c => (c.name || '').toLowerCase().includes(q));
    }
    
    // Status filter
    if (status) {
        list = list.filter(c => c.status === status);
    }
    
    if (!list.length) {
        document.getElementById('catGrid').innerHTML = `
            <div style="grid-column:1/-1">
                <div class="empty-state">
                    <div class="empty-icon">🏷️</div>
                    <h3>Không tìm thấy danh mục</h3>
                    <p>Thử thay đổi bộ lọc hoặc thêm danh mục mới</p>
                </div>
            </div>`;
        return;
    }
    
    document.getElementById('catGrid').innerHTML = list.map(c => {
        const cm = COLOR_MAP[c.color] || COLOR_MAP.blue;
        const iconDisplay = c.iconUrl 
            ? `<img src="${c.iconUrl}" style="width:100%;height:100%;object-fit:contain">`
            : (c.icon || '📁');
        
        return `
            <div class="cat-card">
                <div class="cat-card-icon" style="background:${cm.bg};color:${cm.color}">
                    ${iconDisplay}
                </div>
                <div class="cat-card-name">${c.name}</div>
                <div class="cat-card-desc">${c.description || 'Chưa có mô tả'}</div>
                <div class="cat-card-stats">
                    <div class="cat-stat">
                        <i class="fas fa-book-open"></i> 
                        <strong>${c.courseCount || 0}</strong> khóa học
                    </div>
                    <div class="cat-stat">
                        <span class="badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-muted'}" style="font-size:10px">
                            ${c.status === 'ACTIVE' ? 'Hiển thị' : 'Đã ẩn'}
                        </span>
                    </div>
                </div>
                <div class="cat-card-footer">
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-outline btn-sm" onclick="editCategory('${c.id}')">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                    </div>
                    <button class="tbl-action danger" onclick="deleteCategory('${c.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    }).join('');
}

/* ── Edit Category ── */
function editCategory(id) {
    const c = allCategories.find(x => x.id === id);
    if (!c) return;
    
    document.getElementById('editCatId').value = c.id;
    document.getElementById('catName').value = c.name || '';
    document.getElementById('catDesc').value = c.description || '';
    document.getElementById('catIcon').value = c.icon || '';
    document.getElementById('catColor').value = c.color || 'blue';
    document.getElementById('catModalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa danh mục';
    
    openModal('addCatModal');
}

/* ── Save Category ── */
async function saveCategory() {
    const id = document.getElementById('editCatId').value;
    const name = document.getElementById('catName').value.trim();
    const description = document.getElementById('catDesc').value.trim();
    const icon = document.getElementById('catIcon').value.trim() || '📁';
    const color = document.getElementById('catColor').value;
    
    if (!name) {
        showToast('Vui lòng nhập tên danh mục!', 'error');
        return;
    }
    
    const categoryData = { name, description, icon };
    
    try {
        if (id) {
            // Edit - Backend expects multipart/form-data
            const formData = new FormData();
            formData.append('category', new Blob([JSON.stringify(categoryData)], { type: 'application/json' }));
            
            await fetch(`${API_BASE}/category/${id}/update`, {
                method: 'PUT',
                body: formData
            });
            
            // Update local state
            const c = allCategories.find(x => x.id === id);
            if (c) {
                c.name = name;
                c.description = description;
                c.icon = icon;
                c.color = color;
            }
            
            showToast('Đã cập nhật danh mục!', 'success');
        } else {
            // Create - Backend expects multipart/form-data with userId
            const userId = localStorage.getItem('userId') || 'admin';
            
            const formData = new FormData();
            formData.append('category', new Blob([JSON.stringify(categoryData)], { type: 'application/json' }));
            
            const response = await fetch(`${API_BASE}/category/create?id=${userId}`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.result) {
                allCategories.push({
                    id: result.result.id,
                    name: result.result.name,
                    description: result.result.description,
                    icon: result.result.icon || result.result.iconUrl || icon,
                    iconUrl: result.result.iconUrl,
                    color: color,
                    courseCount: 0,
                    status: 'ACTIVE'
                });
            }
            
            showToast('Đã tạo danh mục mới!', 'success');
        }
        
        closeModal('addCatModal');
        resetForm();
        updateStats();
        renderGrid();
    } catch (error) {
        console.error('[Save Category] Error:', error);
        showToast('Không thể lưu danh mục', 'error');
    }
}

/* ── Reset Form ── */
function resetForm() {
    document.getElementById('editCatId').value = '';
    document.getElementById('catName').value = '';
    document.getElementById('catDesc').value = '';
    document.getElementById('catIcon').value = '';
    document.getElementById('catColor').value = 'blue';
    document.getElementById('catModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Thêm danh mục';
}

/* ── Delete Category ── */
async function deleteCategory(id) {
    if (!confirm('Xóa danh mục này? Khóa học thuộc danh mục sẽ chuyển sang "Chưa phân loại".')) return;
    
    try {
        await fetch(`${API_BASE}/category/${id}`, {
            method: 'DELETE'
        });
        
        allCategories = allCategories.filter(c => c.id !== id);
        updateStats();
        renderGrid();
        
        showToast('Đã xóa danh mục!', 'success');
    } catch (error) {
        console.error('[Delete Category] Error:', error);
        showToast('Không thể xóa danh mục', 'error');
    }
}

/* ── Toggle Category Status ── */
// Backend không hỗ trợ toggle status, nên tạm thời disable
async function toggleCatStatus(id) {
    showToast('Chức năng này chưa được hỗ trợ bởi backend', 'warning');
}

/* ── Event Listeners ── */
document.getElementById('searchInput')?.addEventListener('input', debounce(renderGrid, 300));
document.getElementById('statusFilter')?.addEventListener('change', renderGrid);

// Reset form when opening add modal via button
const addButton = document.querySelector('[onclick="openModal(\'addCatModal\')"]');
if (addButton) {
    addButton.addEventListener('click', resetForm);
}

/* ── Initialize ── */
document.addEventListener('DOMContentLoaded', loadCategories);
