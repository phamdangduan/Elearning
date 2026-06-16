const API_BASE = 'http://localhost:8080';
        let accountsList = [];

        // Dummy database accounts fallback
        const dummyAccounts = [
            {
                id: "bank_1",
                bankName: "Vietcombank",
                accountNumber: "0011004351603",
                accountName: "NGUYEN VAN ANH",
                qrCodeUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=150&q=80",
                isPrimary: true
            },
            {
                id: "bank_2",
                bankName: "Techcombank",
                accountNumber: "19034567291011",
                accountName: "NGUYEN VAN ANH",
                qrCodeUrl: "",
                isPrimary: false
            }
        ];

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

        // ── Load Bank Accounts ──
        async function loadBankAccounts(auth) {
            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;
                
                const res = await fetch(`${API_BASE}/bank-account/my-account?userId=${auth.uid}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        accountsList = data.result;
                        renderAccountsList();
                        return;
                    }
                }
                throw new Error("Failed to load accounts");
            } catch (error) {
                console.warn("Bank Accounts API offline, using local mockup database.");
                const localSaved = localStorage.getItem('mockTeacherBankAccounts');
                if (localSaved) {
                    try {
                        accountsList = JSON.parse(localSaved);
                    } catch(e) {
                        accountsList = [...dummyAccounts];
                    }
                } else {
                    accountsList = [...dummyAccounts];
                }
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
                        <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px;">Vui lòng thêm tài khoản để học viên có thể nhìn thấy thông tin chuyển khoản học phí!</p>
                        <button class="btn btn-primary btn-sm" onclick="openCreateModal()">Thêm tài khoản đầu tiên</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = accountsList.map(acc => {
                const qrImageHTML = acc.qrCodeUrl ? `
                    <img src="${acc.qrCodeUrl}" class="qr-thumb" alt="QR Code" onclick="window.open('${acc.qrCodeUrl}')" title="Xem ảnh lớn" style="cursor:pointer;">
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

                // Get bank abbreviation name first letter for logo
                const logoChar = acc.bankName ? acc.bankName.charAt(0) : 'B';

                return `
                    <div class="bank-card" style="flex-direction: column;">
                        ${primaryBadgeHTML}
                        <div style="display:flex; gap: 20px; align-items: start; width:100%;">
                            <div class="bank-logo-placeholder">${logoChar}</div>
                            <div class="bank-info">
                                <div class="bank-name">${acc.bankName}</div>
                                <div class="bank-num">${acc.accountNumber}</div>
                                <div class="bank-holder">${acc.accountName}</div>
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
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/bank-account/${accountId}/set-primary?userId=${auth.uid}`, {
                    method: 'PATCH',
                    headers: headers
                });

                if (res.ok) {
                    showFeedback("Đã thay đổi tài khoản ngân hàng chính thành công!");
                    loadBankAccounts(auth);
                    return;
                }
                throw new Error("Failed to set primary account");
            } catch(e) {
                console.warn("API error, setting primary locally in mockup db.");
                accountsList.forEach(acc => {
                    acc.isPrimary = (acc.id === accountId);
                });
                localStorage.setItem('mockTeacherBankAccounts', JSON.stringify(accountsList));
                showFeedback("Đặt tài khoản chính thành công (Chế độ Demo)!");
                renderAccountsList();
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
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/bank-account/${accountId}?userId=${auth.uid}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (res.ok) {
                    showFeedback("Xóa tài khoản ngân hàng thành công!");
                    loadBankAccounts(auth);
                    return;
                }
                throw new Error("Failed to delete account");
            } catch(error) {
                console.warn("API error, deleting locally in mockup database.");
                
                const deletedAcc = accountsList.find(a => a.id === accountId);
                accountsList = accountsList.filter(a => a.id !== accountId);
                
                // If we deleted the primary account, set the first remaining one as primary
                if (deletedAcc && deletedAcc.isPrimary && accountsList.length > 0) {
                    accountsList[0].isPrimary = true;
                }

                localStorage.setItem('mockTeacherBankAccounts', JSON.stringify(accountsList));
                showFeedback("Xóa tài khoản thành công (Chế độ Demo)!");
                renderAccountsList();
            }
        };

        // ── Upload QR Code Image ──
        async function handleQrUpload(file) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            const headers = {};
            if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

            const formData = new FormData();
            formData.append('image', file);

            try {
                // Call Spring Boot QR upload
                const res = await fetch(`${API_BASE}/bank-account/upload-qr?userId=${auth.uid}`, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result && data.result.url) {
                        setQrPreview(data.result.url);
                        showFeedback("Tải mã QR lên thành công!");
                        return;
                    }
                }
                throw new Error("QR upload failed");
            } catch (error) {
                console.warn("Backend QR upload failed. Simulating FileReader image preview.", error);
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    setQrPreview(e.target.result);
                    showFeedback("Tải mã QR lên thành công (Chế độ Demo)!");
                };
                reader.readAsDataURL(file);
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

            const bankName = document.getElementById('bankNameInput').value;
            const accountNum = document.getElementById('accountNumInput').value.trim();
            const accountName = document.getElementById('accountNameInput').value.trim().toUpperCase();
            const qrCodeUrl = document.getElementById('qrCodeUrlInput').value;
            const isPrimary = document.getElementById('isPrimaryInput').checked;

            const requestBody = {
                bankName: bankName,
                accountNumber: accountNum,
                accountName: accountName,
                qrCodeUrl: qrCodeUrl,
                isPrimary: isPrimary
            };

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/bank-account/create?userId=${auth.uid}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        showFeedback("Thêm tài khoản ngân hàng thành công!");
                        closeCreateModal();
                        loadBankAccounts(auth);
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = originalText;
                        return;
                    }
                }
                throw new Error("Failed to create bank account");
            } catch (error) {
                console.warn("Backend API failed. Creating mockup account locally.", error);
                
                await new Promise(r => setTimeout(r, 500));

                const mockNewAccount = {
                    id: 'bank_' + Date.now(),
                    bankName: bankName,
                    accountNumber: accountNum,
                    accountName: accountName,
                    qrCodeUrl: qrCodeUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=150&q=80",
                    isPrimary: isPrimary
                };

                // If marked as primary, demote all other accounts
                if (isPrimary) {
                    accountsList.forEach(a => a.isPrimary = false);
                } else if (accountsList.length === 0) {
                    // Force primary if it is the first account
                    mockNewAccount.isPrimary = true;
                }

                accountsList.push(mockNewAccount);
                localStorage.setItem('mockTeacherBankAccounts', JSON.stringify(accountsList));
                
                showFeedback("Thêm tài khoản thành công (Chế độ Demo)!");
                closeCreateModal();
                renderAccountsList();
                
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
