const API_BASE = 'http://localhost:8080';
        let accountsList = [];

        // ── Auth Check ──
        function checkTeacherAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            const role = localStorage.getItem('userRole');

            if (!token || !uid || role !== 'TEACHER') {
                window.location.href = '../login.html';
                return null;
            }
            return { token, uid };
        }

        // ── Feedback Banner ──
        function showFeedback(message, type = 'success') {
            const banner = document.getElementById('alertBanner');
            if (banner) {
                banner.textContent = message;
                banner.className = `alert-banner ${type}`;
                banner.style.display = 'block';
                setTimeout(() => banner.style.display = 'none', 4000);
            }
        }

        function escapeHtml(str) {
            return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        async function readError(res, fallback) {
            try {
                const data = await res.json();
                if (Array.isArray(data?.result)) return data.result.join(', ');
                return data?.message || fallback;
            } catch (e) {
                return fallback;
            }
        }

        // ── Load Bank Accounts ──
        async function loadBankAccounts(auth) {
            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/bank-account/my-account?userId=${auth.uid}`, { headers });
                if (!res.ok) throw new Error(await readError(res, 'Không tải được danh sách tài khoản'));
                const data = await res.json();
                accountsList = data?.result || [];
                renderAccountsList();
            } catch (error) {
                console.error(error);
                showFeedback(error.message || 'Không kết nối được máy chủ', 'error');
                accountsList = [];
                renderAccountsList();
            }
        }

        function renderAccountsList() {
            const container = document.getElementById('bankAccountsList');
            if (!container) return;

            if (accountsList.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: span 2; text-align: center; color: var(--text-muted); padding: 60px 0; border: 1.5px dashed var(--border-color); border-radius: var(--radius-lg); background: white;">
                        <i class="fas fa-university" style="font-size: 44px; color: #cbd5e1; margin-bottom: 16px;"></i>
                        <h3 style="font-size: 16px; font-weight: 600; color: var(--text-dark); margin-bottom: 8px;">Chưa cấu hình tài khoản ngân hàng</h3>
                        <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px;">Thêm tài khoản để nhận tiền khi rút doanh thu từ ví.</p>
                        <button class="btn btn-primary btn-sm" onclick="openCreateModal()">Thêm tài khoản đầu tiên</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = accountsList.map(acc => {
                const qrImageHTML = acc.qrCodeUrl ? `
                    <img src="${escapeHtml(acc.qrCodeUrl)}" class="qr-thumb" alt="QR Code" onclick="window.open(this.src)" title="Xem ảnh lớn" style="cursor:pointer;">
                ` : `
                    <div class="qr-thumb" style="display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); font-size:11px; text-align:center; padding:10px;">
                        <i class="fas fa-qrcode" style="font-size:20px; margin-bottom:4px;"></i> Không có QR
                    </div>
                `;

                const primaryBadgeHTML = acc.isPrimary ? `
                    <span class="badge confirmed" style="position: absolute; top: 20px; right: 24px; font-size:10px;">Tài khoản chính</span>
                ` : '';

                const primaryButtonHTML = acc.isPrimary ? '' : `
                    <button class="btn btn-outline btn-sm" onclick="setPrimaryAccount('${acc.id}')" style="font-size:12px; padding: 6px 12px;">Thiết lập tài khoản chính</button>
                `;

                const logoChar = acc.bankName ? acc.bankName.charAt(0) : 'B';

                return `
                    <div class="bank-card" style="flex-direction: column;">
                        ${primaryBadgeHTML}
                        <div style="display:flex; gap: 20px; align-items: start; width:100%;">
                            <div class="bank-logo-placeholder">${escapeHtml(logoChar)}</div>
                            <div class="bank-info">
                                <div class="bank-name">${escapeHtml(acc.bankName)}</div>
                                <div class="bank-num">${escapeHtml(acc.accountNumber)}</div>
                                <div class="bank-holder">${escapeHtml(acc.accountName)}</div>
                            </div>
                            <div>
                                ${qrImageHTML}
                            </div>
                        </div>
                        <div class="bank-actions" style="margin-top: 10px; padding-top: 10px; width: 100%;">
                            ${primaryButtonHTML}
                            <button class="btn btn-sm" style="background:#ef4444; color:white; font-size:12px; padding:6px 12px;" onclick="deleteAccount('${acc.id}')">Xóa</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ── Set Primary Bank Account ──
        window.setPrimaryAccount = async function(accountId) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            try {
                const res = await fetch(`${API_BASE}/bank-account/${accountId}/set-primary?userId=${auth.uid}`, {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Bearer ' + auth.token }
                });
                if (!res.ok) throw new Error(await readError(res, 'Không đổi được tài khoản chính'));
                showFeedback("Đã thay đổi tài khoản ngân hàng chính thành công!");
                loadBankAccounts(auth);
            } catch (error) {
                showFeedback(error.message, 'error');
            }
        };

        // ── Delete Bank Account ──
        window.deleteAccount = async function(accountId) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            if (!confirm("Bạn có chắc chắn muốn xóa tài khoản ngân hàng này không?")) {
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/bank-account/${accountId}?userId=${auth.uid}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + auth.token }
                });
                if (!res.ok) throw new Error(await readError(res, 'Không xóa được tài khoản'));
                showFeedback("Xóa tài khoản ngân hàng thành công!");
                loadBankAccounts(auth);
            } catch (error) {
                showFeedback(error.message, 'error');
            }
        };

        // ── Upload QR Code Image ──
        async function handleQrUpload(file) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            const formData = new FormData();
            formData.append('image', file);

            try {
                const res = await fetch(`${API_BASE}/bank-account/upload-qr?userId=${auth.uid}`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + auth.token },
                    body: formData
                });
                if (!res.ok) throw new Error(await readError(res, 'Tải ảnh QR thất bại'));
                const data = await res.json();
                if (!data?.result?.url) throw new Error('Tải ảnh QR thất bại');
                setQrPreview(data.result.url);
                showFeedback("Tải mã QR lên thành công!");
            } catch (error) {
                showFeedback(error.message, 'error');
            }
        }

        function setQrPreview(url) {
            document.getElementById('qrCodeUrlInput').value = url;

            const preview = document.getElementById('qrPreviewImg');
            const placeholder = document.getElementById('qrPlaceholder');

            preview.src = url;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }

        // ── Create Bank Account ──
        async function createBankAccount(e) {
            e.preventDefault();
            const auth = checkTeacherAuth();
            if (!auth) return;

            const btnSubmit = document.getElementById('btnSubmitBank');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Đang thêm...';

            const requestBody = {
                bankName: document.getElementById('bankNameInput').value,
                accountNumber: document.getElementById('accountNumInput').value.trim(),
                accountName: document.getElementById('accountNameInput').value.trim().toUpperCase(),
                qrCodeUrl: document.getElementById('qrCodeUrlInput').value,
                isPrimary: document.getElementById('isPrimaryInput').checked
            };

            try {
                const res = await fetch(`${API_BASE}/bank-account/create?userId=${auth.uid}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + auth.token
                    },
                    body: JSON.stringify(requestBody)
                });
                if (!res.ok) throw new Error(await readError(res, 'Không thêm được tài khoản'));
                showFeedback("Thêm tài khoản ngân hàng thành công!");
                closeCreateModal();
                loadBankAccounts(auth);
            } catch (error) {
                showFeedback(error.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalText;
            }
        }

        // ── Modal Handlers ──
        const modal = document.getElementById('createBankModal');

        window.openCreateModal = function() {
            document.getElementById('createBankForm').reset();
            document.getElementById('qrCodeUrlInput').value = "";
            document.getElementById('qrPreviewImg').style.display = 'none';
            document.getElementById('qrPlaceholder').style.display = 'block';
            modal.style.display = 'flex';
        };

        function closeCreateModal() { modal.style.display = 'none'; }

        // ── DOM Listeners ──
        document.addEventListener('DOMContentLoaded', () => {
            const auth = checkTeacherAuth();
            if (!auth) return;

            // Display Name
            document.getElementById('instructorName').textContent = localStorage.getItem('userName') || 'Giảng viên';

            loadBankAccounts(auth);

            // Modal Toggles
            document.getElementById('btnOpenCreateModal').addEventListener('click', window.openCreateModal);
            document.getElementById('btnCloseCreateModal').addEventListener('click', closeCreateModal);
            document.getElementById('btnCancelCreate').addEventListener('click', closeCreateModal);

            modal.addEventListener('click', (e) => { if (e.target === modal) closeCreateModal(); });

            // Form Submit
            document.getElementById('createBankForm').addEventListener('submit', createBankAccount);

            // QR Image trigger
            const qrPreviewBtn = document.getElementById('qrUploadPreview');
            const btnTriggerQr = document.getElementById('btnTriggerQrUpload');
            const qrFileInput = document.getElementById('qrFileInput');

            const triggerSelect = () => qrFileInput.click();
            qrPreviewBtn.addEventListener('click', triggerSelect);
            btnTriggerQr.addEventListener('click', triggerSelect);

            qrFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleQrUpload(file);
            });

            // Logout
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        });
