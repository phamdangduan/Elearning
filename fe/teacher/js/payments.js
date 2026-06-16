const API_BASE = 'http://localhost:8080';
        let paymentsList = [];
        let activeFilter = 'PENDING';

        // Mock database
        const dummyPayments = [
            {
                id: "pay_1",
                referenceCode: "PAY-USER-CRSE-168801",
                studentId: "user_2",
                studentName: "nguyenvananh",
                courseId: "course_1",
                courseTitle: "Kiến trúc Bảo mật Cloud & DevOps",
                amount: 1899000,
                paymentProofUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80",
                transferNote: "Nguyen Van Anh chuyen khoan hoc phi DevOps",
                studentNote: "Em đã chuyển khoản thành công lúc 19h30, nhờ giảng viên duyệt giúp.",
                status: "PENDING",
                createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: "pay_2",
                referenceCode: "PAY-BICH-UIUX-168905",
                studentId: "user_3",
                studentName: "lethibich",
                courseId: "course_3",
                courseTitle: "Thiết kế UI/UX Nâng cao cho SaaS",
                amount: 1299000,
                paymentProofUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80",
                transferNote: "Le Thi Bich chuyen khoan hoc phi UI UX",
                studentNote: "Gửi minh chứng chuyển khoản ạ.",
                status: "PENDING",
                createdAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: "pay_3",
                referenceCode: "PAY-MINH-AI-168992",
                studentId: "user_4",
                studentName: "phamdangminh",
                courseId: "course_2",
                courseTitle: "Lập trình AI với Python & TensorFlow",
                amount: 2499000,
                paymentProofUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80",
                transferNote: "Pham Dang Minh chuyen khoan hoc phi",
                studentNote: "Duyệt nhanh giúp em.",
                status: "CONFIRMED",
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        // ── Auth Verification ──
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

        // ── Show feedback banner ──
        function showFeedback(message, type = 'success') {
            const banner = document.getElementById('alertBanner');
            if (banner) {
                banner.textContent = message;
                banner.className = `alert-banner ${type}`;
                banner.style.display = 'block';
                setTimeout(() => banner.style.display = 'none', 4500);
            }
        }

        // ── Load Payment Requests ──
        async function loadPayments(auth) {
            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;
                
                const res = await fetch(`${API_BASE}/instructor/payment-requests?userId=${auth.uid}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        paymentsList = data.result;
                        renderPaymentsTable();
                        return;
                    }
                }
                throw new Error("Failed to load payment requests");
            } catch (error) {
                console.warn("Payments API connection failed, showing connection error.", error);
                const tbody = document.getElementById('paymentsTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; color: #f87171; padding: 40px 0; font-weight: 600;">
                                <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i> Lỗi kết nối, không thể tải danh sách hóa đơn thực tế.
                            </td>
                        </tr>
                    `;
                }
            }
        }

        function renderPaymentsTable() {
            const tbody = document.getElementById('paymentsTableBody');
            if (!tbody) return;

            let filtered = [];
            if (activeFilter === 'ALL') {
                filtered = paymentsList;
            } else {
                filtered = paymentsList.filter(p => p.status === activeFilter);
            }

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                            Không có hóa đơn học phí nào trong danh mục này.
                        </td>
                    </tr>
                `;
                return;
            }

            // Sort payments by newest date first
            filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

            tbody.innerHTML = filtered.map(pay => {
                const statusClass = pay.status === 'PENDING' ? 'pending' : pay.status === 'CONFIRMED' ? 'confirmed' : 'rejected';
                const statusLabel = pay.status === 'PENDING' ? 'Chờ duyệt' : pay.status === 'CONFIRMED' ? 'Đã duyệt' : 'Từ chối';

                const proofHTML = pay.paymentProofUrl ? `
                    <button class="bill-proof-btn" onclick="openProofModal('${pay.id}')">
                        <i class="far fa-image"></i> Xem bill
                    </button>
                ` : `<span style="font-size:12px; color:var(--text-muted); font-style:italic;">Chưa tải bill</span>`;

                let actionButtonsHTML = '';
                if (pay.status === 'PENDING') {
                    actionButtonsHTML = `
                        <button class="action-confirm-btn" onclick="confirmPayment('${pay.id}')">Duyệt</button>
                        <button class="action-reject-btn" onclick="openRejectModal('${pay.id}')">Từ chối</button>
                    `;
                } else {
                    actionButtonsHTML = `<span class="badge ${statusClass}">${statusLabel}</span>`;
                }

                return `
                    <tr>
                        <td style="font-family: monospace; font-weight:700; font-size:12.5px;">${pay.referenceCode}</td>
                        <td style="font-weight: 600;">${pay.studentName}</td>
                        <td style="max-width: 200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${pay.courseTitle}">${pay.courseTitle}</td>
                        <td style="font-weight:700; color:var(--primary);">${pay.amount.toLocaleString('vi-VN')}đ</td>
                        <td>${proofHTML}</td>
                        <td style="font-size:12.5px; color:var(--text-muted); font-style:italic;">
                            ${pay.transferNote || 'Không có nội dung'}
                        </td>
                        <td>
                            <div style="display:flex; align-items:center;">
                                ${actionButtonsHTML}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // ── Confirm / Approve Payment Request ──
        window.confirmPayment = async function(paymentId) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            if (!confirm("Xác nhận đã nhận đủ tiền và kích hoạt quyền học tập cho học viên này?")) {
                return;
            }

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                // Call Spring Boot Confirm API
                const res = await fetch(`${API_BASE}/instructor/payment-requests/${paymentId}/confirm?userId=${auth.uid}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ instructorNote: "Thanh toán đã được phê duyệt thành công." })
                });

                if (res.ok) {
                    showFeedback("Đã phê duyệt thanh toán và mở khóa học cho học viên!");
                    loadPayments(auth);
                    return;
                }
                throw new Error("Failed to confirm payout");
            } catch(e) {
                console.warn("API error, executing locally in mockup mode.");
                
                const pay = paymentsList.find(p => p.id === paymentId);
                if (pay) {
                    pay.status = 'CONFIRMED';
                    pay.confirmedAt = new Date().toISOString();
                }

                localStorage.setItem('mockTeacherPayments', JSON.stringify(paymentsList));
                showFeedback("Đã phê duyệt thanh toán (Chế độ Demo)!");
                renderPaymentsTable();
            }
        };

        // ── Reject Payment Request ──
        async function rejectPayment(e) {
            e.preventDefault();
            const auth = checkTeacherAuth();
            if (!auth) return;

            const paymentId = document.getElementById('rejectPaymentId').value;
            const reason = document.getElementById('rejectReasonInput').value.trim();

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                // Call Spring Boot Reject API
                const res = await fetch(`${API_BASE}/instructor/payment-requests/${paymentId}/reject?userId=${auth.uid}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ instructorNote: reason })
                });

                if (res.ok) {
                    showFeedback("Hóa đơn đã bị từ chối thành công.", "error");
                    closeRejectModal();
                    loadPayments(auth);
                    return;
                }
                throw new Error("Failed to reject");
            } catch(e) {
                console.warn("API error, rejecting locally in mockup database.");
                
                const pay = paymentsList.find(p => p.id === paymentId);
                if (pay) {
                    pay.status = 'REJECTED';
                    pay.instructorNote = reason;
                }

                localStorage.setItem('mockTeacherPayments', JSON.stringify(paymentsList));
                showFeedback("Đã từ chối thanh toán (Chế độ Demo)!", "error");
                closeRejectModal();
                renderPaymentsTable();
            }
        }

        // ── Proof Modal Viewing ──
        const proofModal = document.getElementById('proofModal');
        const rejectModal = document.getElementById('rejectModal');
        let currentModalPaymentId = null;

        window.openProofModal = function(paymentId) {
            const pay = paymentsList.find(p => p.id === paymentId);
            if (!pay) return;

            currentModalPaymentId = paymentId;
            document.getElementById('proofImgView').src = pay.paymentProofUrl;
            document.getElementById('proofModalNote').textContent = pay.studentNote ? `Ghi chú học viên: "${pay.studentNote}"` : `Không có ghi chú của học viên.`;
            
            const btnApprove = document.getElementById('btnApproveFromProof');
            if (pay.status === 'PENDING') {
                btnApprove.style.display = 'block';
            } else {
                btnApprove.style.display = 'none';
            }

            proofModal.style.display = 'flex';
        };

        function closeProofModal() { proofModal.style.display = 'none'; }

        window.openRejectModal = function(paymentId) {
            closeProofModal(); // Close proof modal if open
            document.getElementById('rejectForm').reset();
            document.getElementById('rejectPaymentId').value = paymentId;
            rejectModal.style.display = 'flex';
        };

        function closeRejectModal() { rejectModal.style.display = 'none'; }

        // ── DOM Listeners ──
        document.addEventListener('DOMContentLoaded', () => {
            const auth = checkTeacherAuth();
            if (!auth) return;

            // Display Name
            document.getElementById('instructorName').textContent = localStorage.getItem('userName') || 'Giảng viên';

            loadPayments(auth);

            // Tabs interaction
            const tabs = document.querySelectorAll('.payout-tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    activeFilter = tab.getAttribute('data-filter');
                    renderPaymentsTable();
                });
            });

            // Modal Approve from proof window
            document.getElementById('btnApproveFromProof').addEventListener('click', () => {
                if (currentModalPaymentId) {
                    closeProofModal();
                    confirmPayment(currentModalPaymentId);
                }
            });

            // Modal Closes
            document.getElementById('btnCloseProofModal').addEventListener('click', closeProofModal);
            document.getElementById('btnCloseProof').addEventListener('click', closeProofModal);
            document.getElementById('btnCloseRejectModal').addEventListener('click', closeRejectModal);
            document.getElementById('btnCancelReject').addEventListener('click', closeRejectModal);

            proofModal.addEventListener('click', (e) => { if (e.target === proofModal) closeProofModal(); });
            rejectModal.addEventListener('click', (e) => { if (e.target === rejectModal) closeRejectModal(); });

            // Reject Form submit
            document.getElementById('rejectForm').addEventListener('submit', rejectPayment);

            // Logout
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        });
