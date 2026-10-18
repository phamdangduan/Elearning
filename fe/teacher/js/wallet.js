/* ============================================================
   EduVN Teacher - Ví doanh thu & Rút tiền
   Danh tính lấy từ JWT phía backend — không gửi userId.
============================================================ */

let walletData = null;
let bankAccounts = [];

const WITHDRAWAL_STATUS = {
    PENDING:   { cls: 'badge-warning', txt: '⏳ Chờ admin chi' },
    APPROVED:  { cls: 'badge-success', txt: '✅ Đã chuyển' },
    REJECTED:  { cls: 'badge-danger',  txt: '❌ Từ chối' },
    CANCELLED: { cls: 'badge-muted',   txt: '🚫 Đã hủy' },
};

// sign: +1 cộng vào số dư khả dụng, -1 trừ, 0 không đổi số dư khả dụng
const LEDGER_TYPES = {
    SALE_CREDIT:       { txt: 'Doanh thu bán khóa học', icon: 'fa-shopping-cart' },
    SALE_RELEASE:      { txt: 'Hết tạm giữ → khả dụng', icon: 'fa-unlock', sign: 1 },
    WITHDRAW_HOLD:     { txt: 'Tạm trừ cho yêu cầu rút', icon: 'fa-lock', sign: -1 },
    WITHDRAW_RELEASE:  { txt: 'Hoàn lại yêu cầu rút', icon: 'fa-undo', sign: 1 },
    WITHDRAW_COMPLETE: { txt: 'Đã chuyển về ngân hàng', icon: 'fa-university', sign: 0 },
};

function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ── Load ── */
async function loadAll() {
    await Promise.all([loadWallet(), loadWithdrawals()]);
}

async function loadWallet() {
    const data = await apiGet('/instructor/wallet');
    if (!data?.result) {
        showToast('Không tải được thông tin ví', 'error');
        return;
    }
    walletData = data.result;
    const w = walletData;

    document.getElementById('availableBalance').textContent = formatMoney(w.availableBalance);
    document.getElementById('pendingBalance').textContent = formatMoney(w.pendingBalance);
    document.getElementById('lockedBalance').textContent = formatMoney(w.lockedBalance);
    document.getElementById('totalEarned').textContent = formatMoney(w.totalEarned);
    document.getElementById('totalWithdrawn').textContent = formatMoney(w.totalWithdrawn);

    const ratePct = Math.round(Number(w.commissionRate || 0) * 100);
    document.getElementById('commissionNote').textContent =
        `Sàn giữ ${ratePct}% phí nền tảng, bạn nhận ${100 - ratePct}% giá bán của mỗi khóa học.`;
    document.getElementById('pendingLabel').textContent = w.holdDays > 0
        ? `Đang tạm giữ (${w.holdDays} ngày)`
        : 'Đang tạm giữ';
    document.getElementById('minWithdrawalHint').textContent =
        `Rút tối thiểu ${formatMoney(w.minWithdrawal)} · Tiền về tài khoản trong 1–2 ngày làm việc`;

    const canWithdraw = Number(w.availableBalance) >= Number(w.minWithdrawal || 0) && Number(w.availableBalance) > 0;
    document.getElementById('openWithdrawBtn').disabled = !canWithdraw;

    renderLedger(w.recentTransactions || []);
}

function renderLedger(items) {
    const body = document.getElementById('ledgerBody');
    if (!items.length) {
        body.innerHTML = `<tr><td colspan="3"><div class="empty-state" style="padding:24px"><div class="empty-icon">📒</div><p>Chưa có biến động nào</p></div></td></tr>`;
        return;
    }
    body.innerHTML = items.map(t => {
        const meta = LEDGER_TYPES[t.type] || { txt: t.type, icon: 'fa-circle' };
        let cls = 'neutral';
        let sign = '';
        if (t.type === 'SALE_CREDIT') {
            cls = 'plus'; sign = '+';
        } else if (meta.sign === 1) {
            cls = 'plus'; sign = '+';
        } else if (meta.sign === -1) {
            cls = 'minus'; sign = '−';
        }
        let sub = escapeHtml(t.note || '');
        if (t.type === 'SALE_CREDIT' && t.released === false && t.availableAt) {
            sub += ` · khả dụng từ ${formatDateTime(t.availableAt)}`;
        }
        return `<tr>
            <td class="muted-sm" style="white-space:nowrap">${formatDateTime(t.createdAt)}</td>
            <td>
                <div style="font-weight:600;color:var(--text-primary)"><i class="fas ${meta.icon}" style="width:16px;color:var(--text-muted)"></i> ${meta.txt}</div>
                <div class="muted-sm">${sub}</div>
            </td>
            <td style="text-align:right"><span class="ledger-amount ${cls}">${sign}${formatMoney(t.amount)}</span></td>
        </tr>`;
    }).join('');
}

async function loadWithdrawals() {
    const data = await apiGet('/instructor/withdrawals');
    const list = data?.result || [];
    const body = document.getElementById('withdrawalBody');
    if (!list.length) {
        body.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:24px"><div class="empty-icon">🏦</div><p>Chưa có yêu cầu rút tiền nào</p></div></td></tr>`;
        return;
    }
    body.innerHTML = list.map(w => {
        const s = WITHDRAWAL_STATUS[w.status] || { cls: 'badge-muted', txt: w.status };
        const note = w.status === 'REJECTED' && w.adminNote
            ? `<div class="muted-sm" style="color:var(--teacher-red)">Lý do: ${escapeHtml(w.adminNote)}</div>` : '';
        return `<tr>
            <td>
                <div style="font-family:monospace;font-weight:700;color:var(--text-primary)">${escapeHtml(w.code)}</div>
                <div class="muted-sm">${formatDateTime(w.createdAt)}</div>
            </td>
            <td><span class="ledger-amount">${formatMoney(w.amount)}</span></td>
            <td>
                <div style="font-weight:600">${escapeHtml(w.bankName)}</div>
                <div class="muted-sm">${escapeHtml(w.accountNumber)} · ${escapeHtml(w.accountName)}</div>
            </td>
            <td><span class="badge ${s.cls}">${s.txt}</span>${note}</td>
            <td>${w.status === 'PENDING'
                ? `<button class="btn btn-outline btn-sm" onclick="cancelWithdrawal('${w.id}')">Hủy</button>` : ''}</td>
        </tr>`;
    }).join('');
}

/* ── Withdraw modal ── */
async function openWithdrawModal() {
    if (!walletData) return;
    const available = Number(walletData.availableBalance);
    const min = Number(walletData.minWithdrawal || 0);

    const amountInput = document.getElementById('withdrawAmount');
    amountInput.value = Math.floor(available);
    amountInput.min = min;
    amountInput.max = Math.floor(available);
    document.getElementById('withdrawNote').value = '';
    document.getElementById('withdrawHint').textContent =
        `Khả dụng: ${formatMoney(available)} · Tối thiểu: ${formatMoney(min)}`;

    const quick = [0.25, 0.5, 1].map(r => Math.floor(available * r / 1000) * 1000).filter(v => v >= min);
    document.getElementById('quickAmounts').innerHTML = [...new Set(quick)].map(v =>
        `<button type="button" onclick="document.getElementById('withdrawAmount').value=${v}">${formatMoney(v)}</button>`
    ).join('');

    openModal('withdrawModal');
    await loadBankAccounts();
}

async function loadBankAccounts() {
    const pick = document.getElementById('bankPick');
    const data = await apiGet(`/bank-account/my-account?userId=${TEACHER_ID}`);
    bankAccounts = (data?.result || []).filter(b => b.isActive !== false);

    if (!bankAccounts.length) {
        pick.innerHTML = `<div class="muted-sm">Bạn chưa có tài khoản ngân hàng.
            <a href="bank-accounts.html" style="color:var(--primary);font-weight:700">Thêm tài khoản nhận tiền</a></div>`;
        document.getElementById('submitWithdrawBtn').disabled = true;
        return;
    }
    document.getElementById('submitWithdrawBtn').disabled = false;
    pick.innerHTML = bankAccounts.map(b => `
        <label class="bank-option">
            <input type="radio" name="bankAccount" value="${b.id}" ${b.isPrimary ? 'checked' : ''}>
            <div>
                <div style="font-weight:700;color:var(--text-primary)">${escapeHtml(b.bankName)} ${b.isPrimary ? '<span class="badge badge-info" style="font-size:10px">Chính</span>' : ''}</div>
                <div class="muted-sm">${escapeHtml(b.accountNumber)} · ${escapeHtml(b.accountName)}</div>
            </div>
        </label>`).join('');
    if (!document.querySelector('input[name="bankAccount"]:checked')) {
        document.querySelector('input[name="bankAccount"]').checked = true;
    }
}

document.getElementById('submitWithdrawBtn').addEventListener('click', async () => {
    const amount = Number(document.getElementById('withdrawAmount').value);
    const bankAccountId = document.querySelector('input[name="bankAccount"]:checked')?.value;
    const note = document.getElementById('withdrawNote').value.trim();
    const available = Number(walletData?.availableBalance || 0);
    const min = Number(walletData?.minWithdrawal || 0);

    if (!Number.isInteger(amount) || amount <= 0) { showToast('Số tiền không hợp lệ', 'warning'); return; }
    if (amount < min) { showToast(`Số tiền rút tối thiểu là ${formatMoney(min)}`, 'warning'); return; }
    if (amount > available) { showToast('Số dư khả dụng không đủ', 'warning'); return; }
    if (!bankAccountId) { showToast('Vui lòng chọn tài khoản nhận tiền', 'warning'); return; }

    const btn = document.getElementById('submitWithdrawBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

    const data = await apiPost('/instructor/withdrawals', { amount, bankAccountId, note: note || null });

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi yêu cầu';

    if (data?.result?.id) {
        showToast(`Đã gửi yêu cầu rút ${formatMoney(amount)}`, 'success');
        closeModal('withdrawModal');
        await loadAll();
    } else {
        const msg = Array.isArray(data?.result) ? data.result.join(', ') : (data?.message || 'Không thể tạo yêu cầu');
        showToast(msg, 'error');
    }
});

async function cancelWithdrawal(id) {
    if (!confirm('Hủy yêu cầu rút tiền này? Số tiền sẽ được hoàn lại số dư khả dụng.')) return;
    const data = await apiPut(`/instructor/withdrawals/${id}/cancel`);
    if (data?.result?.id) {
        showToast('Đã hủy yêu cầu rút tiền', 'success');
        await loadAll();
    } else {
        showToast(data?.message || 'Không thể hủy yêu cầu', 'error');
    }
}

document.getElementById('withdrawModal').addEventListener('click', e => {
    if (e.target.id === 'withdrawModal') closeModal('withdrawModal');
});

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userRole') !== 'TEACHER') {
        window.location.href = '../login.html';
        return;
    }
    loadAll();
});
