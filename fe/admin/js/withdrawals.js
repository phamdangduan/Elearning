/* ============================================================
   EduVN Admin - Duyệt chi rút tiền giảng viên
============================================================ */

let allWithdrawals = [];
let activeStatus = 'PENDING';
let actionTargetId = null;

const WD_STATUS = {
    PENDING:   { cls: 'badge-orange',  txt: '⏳ Chờ chi' },
    APPROVED:  { cls: 'badge-success', txt: '✅ Đã chi' },
    REJECTED:  { cls: 'badge-danger',  txt: '❌ Từ chối' },
    CANCELLED: { cls: 'badge-muted',   txt: '🚫 GV đã hủy' },
};

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadWithdrawals() {
    const data = await apiGet('/admin/withdrawals');
    if (!Array.isArray(data?.result)) {
        showToast('Không tải được danh sách: ' + (data?.message || 'lỗi không xác định'), 'error');
        allWithdrawals = [];
    } else {
        allWithdrawals = data.result;
    }
    updateStats();
    render();
}

function updateStats() {
    const pending = allWithdrawals.filter(w => w.status === 'PENDING');
    const approved = allWithdrawals.filter(w => w.status === 'APPROVED');
    const sum = list => list.reduce((s, w) => s + Number(w.amount || 0), 0);
    document.getElementById('statPendingCount').textContent = pending.length;
    document.getElementById('statPendingAmount').textContent = formatMoney(sum(pending));
    document.getElementById('statApprovedAmount').textContent = formatMoney(sum(approved));
}

function switchTab(btn, status) {
    document.querySelectorAll('#statusTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = status;
    render();
}

function render() {
    const list = activeStatus ? allWithdrawals.filter(w => w.status === activeStatus) : allWithdrawals;
    const container = document.getElementById('withdrawalList');

    if (!list.length) {
        container.innerHTML = `<div class="card"><div class="empty-state">
            <div class="empty-icon">🏦</div><h3>Không có yêu cầu nào</h3>
            <p>${activeStatus === 'PENDING' ? 'Tất cả yêu cầu rút tiền đã được xử lý.' : 'Chưa có yêu cầu ở trạng thái này.'}</p>
        </div></div>`;
        return;
    }
    container.innerHTML = list.map(cardHTML).join('');
}

function cardHTML(w) {
    const s = WD_STATUS[w.status] || { cls: 'badge-muted', txt: w.status };
    const isPending = w.status === 'PENDING';

    const qr = w.vietQrUrl
        ? `<img src="${escapeHtml(w.vietQrUrl)}" alt="VietQR ${escapeHtml(w.code)}" loading="lazy">
           <div class="qr-caption">Quét bằng app ngân hàng — đã điền sẵn STK, số tiền, nội dung</div>`
        : `<div class="qr-missing"><i class="fas fa-exclamation-triangle"></i><br>Không nhận diện được ngân hàng "${escapeHtml(w.bankName)}".<br>Chuyển khoản thủ công theo thông tin bên trái.</div>`;
    const uploadedQr = w.qrCodeUrl
        ? `<div class="qr-caption"><a href="${escapeHtml(w.qrCodeUrl)}" target="_blank" rel="noopener">Xem ảnh QR do GV tải lên</a> (chỉ tham khảo)</div>`
        : '';

    const processed = w.processedAt ? `
        <div class="wd-field"><label>Xử lý lúc</label><span>${formatDateTime(w.processedAt)}</span></div>
        <div class="wd-field"><label>Mã GD ngân hàng</label><span class="mono">${escapeHtml(w.bankTransactionRef || '–')}</span></div>` : '';

    const notes = [
        w.instructorNote ? `<i class="fas fa-comment" style="color:var(--primary)"></i> <strong>GV:</strong> ${escapeHtml(w.instructorNote)}` : '',
        w.adminNote ? `<i class="fas fa-user-shield" style="color:var(--text-muted)"></i> <strong>Admin:</strong> ${escapeHtml(w.adminNote)}` : ''
    ].filter(Boolean).join('<br>');

    return `<div class="wd-card ${isPending ? 'pending' : ''}">
        <div>
            <div class="wd-head">
                <div>
                    <div style="font-size:15px;font-weight:800;color:var(--text-primary)">${escapeHtml(w.instructorName || w.instructorId)}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(w.instructorEmail || '')} · Yêu cầu lúc ${formatDateTime(w.createdAt)}</div>
                </div>
                <div style="text-align:right">
                    <div class="wd-amount">${formatMoney(w.amount)}</div>
                    <span class="badge ${s.cls}">${s.txt}</span>
                </div>
            </div>
            <div class="wd-fields">
                <div class="wd-field"><label>Ngân hàng</label><span>${escapeHtml(w.bankName)}</span></div>
                <div class="wd-field"><label>Chủ tài khoản</label><span>${escapeHtml(w.accountName)}</span></div>
                <div class="wd-field"><label>Số tài khoản</label>
                    <span class="mono">${escapeHtml(w.accountNumber)}</span>
                    <button class="copy-btn" title="Copy" data-copy="${escapeHtml(w.accountNumber)}" onclick="copyText(this.dataset.copy)"><i class="far fa-copy"></i></button>
                </div>
                <div class="wd-field"><label>Nội dung chuyển khoản</label>
                    <span class="mono">${escapeHtml(w.transferContent)}</span>
                    <button class="copy-btn" title="Copy" data-copy="${escapeHtml(w.transferContent)}" onclick="copyText(this.dataset.copy)"><i class="far fa-copy"></i></button>
                </div>
                ${processed}
                ${notes ? `<div class="wd-note">${notes}</div>` : ''}
            </div>
            ${isPending ? `<div class="wd-actions">
                <button class="btn btn-success" onclick="openApprove('${w.id}')"><i class="fas fa-check"></i> Xác nhận duyệt chi</button>
                <button class="btn btn-outline" onclick="openReject('${w.id}')"><i class="fas fa-times"></i> Từ chối</button>
            </div>` : ''}
        </div>
        <div class="wd-qr">${isPending ? qr : ''}${uploadedQr}</div>
    </div>`;
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Đã copy: ' + text, 'info', 2000));
}

/* ── Approve ── */
function openApprove(id) {
    const w = allWithdrawals.find(x => x.id === id);
    if (!w) return;
    actionTargetId = id;
    document.getElementById('approveAmount').textContent = formatMoney(w.amount);
    document.getElementById('approveName').textContent = w.instructorName || w.accountName;
    document.getElementById('approveRef').value = '';
    document.getElementById('approveNote').value = '';
    openModal('approveModal');
}

document.getElementById('doApproveBtn').addEventListener('click', async () => {
    if (!actionTargetId) return;
    const btn = document.getElementById('doApproveBtn');
    btn.disabled = true;
    const data = await apiPut(`/admin/withdrawals/${actionTargetId}/approve`, {
        bankTransactionRef: document.getElementById('approveRef').value.trim() || null,
        adminNote: document.getElementById('approveNote').value.trim() || null
    });
    btn.disabled = false;
    if (data?.result?.id) {
        showToast('Đã duyệt chi thành công', 'success');
        closeModal('approveModal');
        await loadWithdrawals();
    } else {
        showToast('Không thể duyệt: ' + (data?.message || 'lỗi không xác định'), 'error');
    }
});

/* ── Reject ── */
function openReject(id) {
    actionTargetId = id;
    document.getElementById('rejectReason').value = '';
    openModal('rejectModal');
}

document.getElementById('doRejectBtn').addEventListener('click', async () => {
    const reason = document.getElementById('rejectReason').value.trim();
    if (!reason) { showToast('Vui lòng nhập lý do từ chối', 'warning'); return; }
    const btn = document.getElementById('doRejectBtn');
    btn.disabled = true;
    const data = await apiPut(`/admin/withdrawals/${actionTargetId}/reject`, { adminNote: reason });
    btn.disabled = false;
    if (data?.result?.id) {
        showToast('Đã từ chối và hoàn tiền vào ví giảng viên', 'warning');
        closeModal('rejectModal');
        await loadWithdrawals();
    } else {
        showToast('Không thể từ chối: ' + (data?.message || 'lỗi không xác định'), 'error');
    }
});

document.addEventListener('DOMContentLoaded', loadWithdrawals);
