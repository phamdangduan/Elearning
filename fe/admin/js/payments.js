/* ============================================================
   EduVN Admin - Payments Management
   Quản lý thanh toán với dữ liệu từ backend
============================================================ */

const PAGE_SIZE = 15;
let allPayments = [];
let filteredPayments = [];
let currentPage = 0;
let activeStatus = '';

const STATUS_MAP = {
    PROOF_UPLOADED: { cls: 'badge-orange', txt: '📋 Chờ duyệt' },
    PENDING_PROOF: { cls: 'badge-warning', txt: '⏳ Chờ bill' },
    CONFIRMED: { cls: 'badge-success', txt: '✅ Đã xác nhận' },
    REJECTED: { cls: 'badge-danger', txt: '❌ Từ chối' },
    CANCELLED: { cls: 'badge-muted', txt: '🚫 Đã hủy' },
    EXPIRED: { cls: 'badge-danger', txt: '⌛ Hết hạn' },
};

/* ── Load Payments ── */
async function loadPayments() {
    showSkeleton();
    try {
        // Get all payment requests from backend
        const data = await apiGet('/payment-requests/all');
        const payments = data?.result || [];
        
        console.log('[Payments] Loaded:', payments.length, payments);
        
        // Transform data to match frontend format
        allPayments = payments.map(p => ({
            id: p.id,
            studentId: p.studentId,
            studentName: p.studentName || p.studentId,
            courseId: p.courseId,
            courseTitle: p.courseTitle || 'Khóa học',
            instructorId: p.instructorId,
            instructor: p.instructorName || p.instructorId,
            amount: parseFloat(p.amount) || 0,
            status: p.status,
            createdAt: p.createdAt,
            expiredAt: p.expiredAt,
            proofUrl: p.proofUrl,
            note: p.note
        }));
        
        console.log('[Payments] Transformed:', allPayments);
        
        updateStats();
        applyFilter();
    } catch (error) {
        console.error('[Payments] Error loading:', error);
        showToast('Không thể tải danh sách thanh toán', 'error');
        allPayments = [];
        updateStats();
        applyFilter();
    }
}

function showSkeleton() {
    document.getElementById('paymentTableBody').innerHTML = `
        <tr><td colspan="8"><div style="padding:16px;display:flex;flex-direction:column;gap:10px">
            <div class="skeleton" style="height:52px;border-radius:var(--radius-sm)"></div>
            <div class="skeleton" style="height:52px;border-radius:var(--radius-sm)"></div>
            <div class="skeleton" style="height:52px;border-radius:var(--radius-sm)"></div>
        </div></td></tr>`;
}

/* ── Update Stats ── */
function updateStats() {
    const confirmed = allPayments.filter(p => p.status === 'CONFIRMED');
    const pending = allPayments.filter(p => p.status === 'PROOF_UPLOADED' || p.status === 'PENDING_PROOF');
    const rejected = allPayments.filter(p => ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(p.status));
    
    const totalRevenue = confirmed.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    document.getElementById('statRevenue').textContent = shortNum(totalRevenue) + 'đ';
    document.getElementById('statConfirmed').textContent = confirmed.length;
    document.getElementById('statPending').textContent = pending.length;
    document.getElementById('statRejected').textContent = rejected.length;
    
    console.log('[Stats]', { totalRevenue, confirmed: confirmed.length, pending: pending.length, rejected: rejected.length });
}

/* ── Switch Tab ── */
function switchTab(btn, status) {
    document.querySelectorAll('#statusTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = status;
    currentPage = 0;
    applyFilter();
}

/* ── Apply Filter ── */
function applyFilter() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const sort = document.getElementById('sortFilter').value;
    
    let list = [...allPayments];
    
    // Filter by status
    if (activeStatus) {
        list = list.filter(p => p.status === activeStatus);
    }
    
    // Search filter
    if (q) {
        list = list.filter(p =>
            (p.studentName || '').toLowerCase().includes(q) ||
            (p.courseTitle || '').toLowerCase().includes(q) ||
            (p.instructor || '').toLowerCase().includes(q)
        );
    }
    
    // Sort
    if (sort === 'oldest') {
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'amount_desc') {
        list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } else if (sort === 'amount_asc') {
        list.sort((a, b) => (a.amount || 0) - (b.amount || 0));
    } else {
        // newest (default)
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    filteredPayments = list;
    currentPage = 0;
    render();
}

/* ── Render Table ── */
function render() {
    const start = currentPage * PAGE_SIZE;
    const page = filteredPayments.slice(start, start + PAGE_SIZE);
    const total = filteredPayments.length;
    
    document.getElementById('displayCount').textContent = total;
    document.getElementById('tableCount').textContent = total ? `${start + 1}–${Math.min(start + page.length, total)} / ${total}` : '';
    document.getElementById('pageInfo').textContent = total ? `Tổng ${total} giao dịch` : '';
    
    if (!page.length) {
        document.getElementById('paymentTableBody').innerHTML = `
            <tr><td colspan="8">
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h3>Không có giao dịch</h3>
                    <p>Thử thay đổi bộ lọc</p>
                </div>
            </td></tr>`;
        document.getElementById('paginationWrap').innerHTML = '';
        return;
    }
    
    document.getElementById('paymentTableBody').innerHTML = page.map((p, i) => {
        const s = STATUS_MAP[p.status] || { cls: 'badge-muted', txt: p.status };
        const initials = (p.studentName || 'U')[0].toUpperCase();
        const canApprove = p.status === 'PROOF_UPLOADED';
        
        return `
            <tr>
                <td style="color:var(--text-muted);font-size:12px">${start + i + 1}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-sm">${initials}</div>
                        <div class="user-name-wrap">
                            <div class="user-name-el">${p.studentName || '–'}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size:13px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${p.courseTitle || '–'}
                </td>
                <td style="font-size:13px">${p.instructor || '–'}</td>
                <td style="font-size:14px;font-weight:800;color:var(--teacher-green)">
                    ${formatMoney(p.amount)}
                </td>
                <td><span class="badge ${s.cls}">${s.txt}</span></td>
                <td style="font-size:12px;color:var(--text-muted)">${formatDate(p.createdAt)}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="tbl-action" title="Chi tiết" onclick="viewPayment('${p.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canApprove ? `
                            <button class="tbl-action success" title="Xác nhận" onclick="confirmPayment('${p.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="tbl-action danger" title="Từ chối" onclick="rejectPayment('${p.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>`;
    }).join('');
    
    renderPagination(total);
}

/* ── Render Pagination ── */
function renderPagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    
    if (totalPages <= 1) {
        document.getElementById('paginationWrap').innerHTML = '';
        return;
    }
    
    let pHtml = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    for (let p = 0; p < totalPages; p++) {
        if (p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1) {
            pHtml += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">
                ${p + 1}
            </button>`;
        } else if (Math.abs(p - currentPage) === 2) {
            pHtml += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
        }
    }
    
    pHtml += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    document.getElementById('paginationWrap').innerHTML = pHtml;
}

function goPage(p) {
    currentPage = p;
    render();
    window.scrollTo(0, 0);
}

/* ── View Payment Detail ── */
function viewPayment(id) {
    const p = allPayments.find(x => x.id === id);
    if (!p) return;
    
    const s = STATUS_MAP[p.status] || { cls: 'badge-muted', txt: p.status };
    
    document.getElementById('payDetailBody').innerHTML = `
        <div style="background:var(--bg-primary);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
                <div>
                    <div style="font-size:14px;color:var(--text-muted);margin-bottom:4px">Số tiền giao dịch</div>
                    <div style="font-size:32px;font-weight:900;color:var(--teacher-green)">${formatMoney(p.amount)}</div>
                </div>
                <span class="badge ${s.cls}" style="font-size:13px;padding:6px 14px">${s.txt}</span>
            </div>
        </div>
        <div class="form-row">
            <div><label class="form-label">Học viên</label><p style="font-size:14px;font-weight:600">${p.studentName || '–'}</p></div>
            <div><label class="form-label">Khóa học</label><p style="font-size:14px">${p.courseTitle || '–'}</p></div>
            <div><label class="form-label">Giảng viên</label><p style="font-size:14px">${p.instructor || '–'}</p></div>
            <div><label class="form-label">Ngày tạo</label><p style="font-size:14px">${formatDate(p.createdAt)}</p></div>
        </div>
        ${p.expiredAt ? `
            <div style="margin-top:16px">
                <label class="form-label">Hết hạn</label>
                <p style="font-size:14px">${formatDate(p.expiredAt)}</p>
            </div>
        ` : ''}
        ${p.note ? `
            <div style="margin-top:16px">
                <label class="form-label">Ghi chú</label>
                <p style="font-size:14px">${p.note}</p>
            </div>
        ` : ''}
        ${p.proofUrl ? `
            <div style="margin-top:16px">
                <label class="form-label">Bằng chứng thanh toán</label>
                <img src="${p.proofUrl}" style="max-width:100%;border-radius:var(--radius);border:1px solid var(--border);margin-top:8px" alt="Proof">
            </div>
        ` : ''}`;
    
    const footer = document.getElementById('payDetailFooter');
    const canApprove = p.status === 'PROOF_UPLOADED';
    
    footer.innerHTML = `
        <button class="btn btn-outline" onclick="closeModal('payDetailModal')">Đóng</button>
        ${canApprove ? `
            <button class="btn btn-danger" onclick="rejectPayment('${p.id}');closeModal('payDetailModal')">
                <i class="fas fa-times"></i> Từ chối
            </button>
            <button class="btn btn-success" onclick="confirmPayment('${p.id}');closeModal('payDetailModal')">
                <i class="fas fa-check"></i> Xác nhận
            </button>
        ` : ''}`;
    
    openModal('payDetailModal');
}

/* ── Confirm Payment ── */
async function confirmPayment(id) {
    const p = allPayments.find(x => x.id === id);
    if (!p) return;
    
    try {
        // Call instructor payment API (admin acts as instructor)
        await fetch(`${API_BASE}/instructor/payment-requests/${id}/confirm?userId=${p.instructorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note: 'Đã xác nhận bởi admin' })
        });
        
        // Update local state
        p.status = 'CONFIRMED';
        updateStats();
        applyFilter();
        
        showToast('Đã xác nhận thanh toán!', 'success');
    } catch (error) {
        console.error('[Confirm Payment] Error:', error);
        showToast('Không thể xác nhận thanh toán', 'error');
    }
}

/* ── Reject Payment ── */
async function rejectPayment(id) {
    if (!confirm('Từ chối giao dịch này?')) return;
    
    const p = allPayments.find(x => x.id === id);
    if (!p) return;
    
    try {
        // Call instructor payment API (admin acts as instructor)
        await fetch(`${API_BASE}/instructor/payment-requests/${id}/reject?userId=${p.instructorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Từ chối bởi admin' })
        });
        
        // Update local state
        p.status = 'REJECTED';
        updateStats();
        applyFilter();
        
        showToast('Đã từ chối thanh toán!', 'warning');
    } catch (error) {
        console.error('[Reject Payment] Error:', error);
        showToast('Không thể từ chối thanh toán', 'error');
    }
}

/* ── Export CSV ── */
function exportCSV() {
    const rows = [['#', 'Học viên', 'Khóa học', 'Giảng viên', 'Số tiền', 'Trạng thái', 'Ngày tạo']];
    
    filteredPayments.forEach((p, i) => {
        rows.push([
            i + 1,
            p.studentName,
            p.courseTitle,
            p.instructor,
            p.amount,
            p.status,
            formatDate(p.createdAt)
        ]);
    });
    
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = 'payments.csv';
    a.click();
}

/* ── Event Listeners ── */
document.getElementById('searchInput')?.addEventListener('input', debounce(applyFilter, 300));
document.getElementById('sortFilter')?.addEventListener('change', applyFilter);

/* ── Initialize ── */
document.addEventListener('DOMContentLoaded', loadPayments);
