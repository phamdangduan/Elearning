const API_BASE = 'http://localhost:8080';
        let paymentRequestId = null;
        let mockProofUrl = "";

        // ── Auth Handling ──
        async function applyLandingNavAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            
            const guest = document.getElementById('navGuestActions');
            const logged = document.getElementById('navLoggedIn');
            
            if (token && uid) {
                if (guest) guest.style.display = 'none';
                if (logged) logged.style.display = 'flex';
                
                const userNameNav = document.getElementById('userNameNav');
                const dropdownName = document.getElementById('dropdownName');
                const dropdownEmail = document.getElementById('dropdownEmail');
                const userAvatarNav = document.getElementById('userAvatarNav');
                const dropdownAvatar = document.getElementById('dropdownAvatar');
                
                const dispName = localStorage.getItem('userName') || 'Học viên';
                const dispEmail = localStorage.getItem('userEmail') || 'student@eduvn.com';
                const initial = dispName.trim()[0].toUpperCase();
                
                if (userNameNav) userNameNav.textContent = dispName;
                if (dropdownName) dropdownName.textContent = dispName;
                if (dropdownEmail) dropdownEmail.textContent = dispEmail;
                if (userAvatarNav) userAvatarNav.innerHTML = `<span style="font-weight:700">${initial}</span>`;
                if (dropdownAvatar) dropdownAvatar.innerHTML = `<span style="font-weight:700">${initial}</span>`;
                
                try {
                    const headers = {};
                    if (token) headers['Authorization'] = 'Bearer ' + token;
                    const res = await fetch(`${API_BASE}/profile/me?userId=${uid}`, { headers });
                    if (res.ok) {
                        const data = await res.json();
                        const profile = data?.result;
                        if (profile) {
                            const fullName = profile.fullName || profile.firstName || dispName;
                            const apiInitial = fullName.trim()[0].toUpperCase();
                            
                            if (userNameNav) userNameNav.textContent = fullName;
                            if (dropdownName) dropdownName.textContent = fullName;
                            if (profile.email && dropdownEmail) dropdownEmail.textContent = profile.email;
                            
                            if (profile.avatar) {
                                const imgHtml = `<img src="${profile.avatar}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                                if (userAvatarNav) userAvatarNav.innerHTML = imgHtml;
                                if (dropdownAvatar) dropdownAvatar.innerHTML = imgHtml;
                            } else {
                                const initHtml = `<span style="font-weight:700">${apiInitial}</span>`;
                                if (userAvatarNav) userAvatarNav.innerHTML = initHtml;
                                if (dropdownAvatar) dropdownAvatar.innerHTML = initHtml;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to load user profile from API", e);
                }
                
                loadNotifications(uid, token);
                
            } else {
                if (guest) guest.style.display = 'flex';
                if (logged) logged.style.display = 'none';
            }
        }

        async function loadNotifications(userId, token) {
            try {
                const headers = {};
                if (token) headers['Authorization'] = 'Bearer ' + token;
                
                const [notiRes, countRes] = await Promise.all([
                    fetch(`${API_BASE}/notifications/my-notifications?userId=${userId}&page=0&size=10`, { headers }),
                    fetch(`${API_BASE}/notifications/unread-count?userId=${userId}`, { headers })
                ]);
                
                let count = 0;
                if (countRes.ok) {
                    const countData = await countRes.json();
                    count = countData?.result || 0;
                }
                
                const badge = document.getElementById('notiBadge');
                if (badge) {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'flex' : 'none';
                }
                
                const list = document.getElementById('notiList');
                if (list && notiRes.ok) {
                    const notiData = await notiRes.json();
                    const notis = notiData?.result?.content || [];
                    
                    if (notis.length === 0) {
                        list.innerHTML = `<div class="noti-empty"><i class="fas fa-bell-slash"></i><p>Chưa có thông báo</p></div>`;
                        return;
                    }
                    
                    const cfg = {
                        PAYMENT_CONFIRMED: { icon: 'fa-check-circle', cls: 'payment' },
                        PAYMENT_REJECTED: { icon: 'fa-times-circle', cls: 'alert' },
                        PAYMENT_EXPIRED: { icon: 'fa-clock', cls: 'alert' },
                        PAYMENT_PROOF_UPLOADED: { icon: 'fa-file-upload', cls: 'info' }
                    };
                    
                    list.innerHTML = notis.map(n => {
                        const c = cfg[n.type] || { icon: 'fa-bell', cls: 'info' };
                        const time = n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : '';
                        return `
                            <div class="noti-item ${!n.isRead ? 'unread' : ''}" onclick="markNotificationRead('${n.id}', '${userId}')">
                                <div class="noti-item-icon ${c.cls}"><i class="fas ${c.icon}"></i></div>
                                <div class="noti-item-body">
                                    <p><strong>${n.title}</strong><br>${n.message}</p>
                                    <small>${time}</small>
                                </div>
                                ${!n.isRead ? '<div class="noti-unread-dot"></div>' : ''}
                            </div>
                        `;
                    }).join('');
                }
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        }

        window.markNotificationRead = async function(notiId, userId) {
            try {
                await fetch(`${API_BASE}/notifications/${notiId}/mark-read?userId=${userId}`, { method: 'PUT' });
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                loadNotifications(userId, token);
            } catch (e) {
                console.error(e);
            }
        }

        // File upload preview
        const proofFile = document.getElementById('proofFile');
        const previewImage = document.getElementById('previewImage');
        const uploadBoxLabel = document.querySelector('.file-upload-box span');

        proofFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadBoxLabel.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'inline-block';
                    // Save as mock URL for demo
                    mockProofUrl = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });

        async function loadPaymentRequestInfo() {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const userId = localStorage.getItem('userId');
            if (!token || !userId) {
                window.location.href = '../login.html';
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            paymentRequestId = urlParams.get('id');
            const courseId = urlParams.get('courseId');

            // Dummy Data Fallback for UI demo
            const dummyInfo = {
                bankAccount: {
                    bankName: "Vietcombank",
                    accountNumber: "0123456789",
                    accountName: "TRAN VAN A"
                },
                amount: 1299000,
                referenceCode: "EDUVN-" + Math.floor(Math.random() * 1000000)
            };

            const renderInfo = (info) => {
                document.getElementById('bankName').textContent = info.bankAccount?.bankName || 'Đang cập nhật';
                document.getElementById('accountNumber').textContent = info.bankAccount?.accountNumber || 'Đang cập nhật';
                document.getElementById('accountName').textContent = info.bankAccount?.accountName || 'Đang cập nhật';
                document.getElementById('amount').textContent = info.amount ? info.amount.toLocaleString('vi-VN') + 'đ' : '0đ';
                document.getElementById('referenceCode').textContent = info.referenceCode || 'EDUVN-XYZ';
                
                // Dynamically generate a VietQR image for visual
                const qrUrl = `https://api.vietqr.io/image/970436-${info.bankAccount?.accountNumber}-9b9F20q.jpg?accountName=${encodeURIComponent(info.bankAccount?.accountName)}&amount=${info.amount}&addInfo=${encodeURIComponent(info.referenceCode)}`;
                document.getElementById('qrCodeImg').src = qrUrl;
            };

            if (!paymentRequestId || paymentRequestId.startsWith('req_dummy')) {
                renderInfo(dummyInfo);
                return;
            }

            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                const res = await fetch(`${API_BASE}/payment-requests/${paymentRequestId}`, {
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
                });
                const data = await res.json();
                if (data && data.result) {
                    renderInfo(data.result);
                } else {
                    renderInfo(dummyInfo);
                }
            } catch (error) {
                console.error("Error loading payment info:", error);
                renderInfo(dummyInfo);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            applyLandingNavAuth();
            loadPaymentRequestInfo();

            // Navbar User & Notification Dropdown toggles
            const userAvatarBtn = document.getElementById('userAvatarBtn');
            const userDropdown = document.getElementById('userDropdown');
            const notiBell = document.getElementById('notiBell');
            const notiDropdown = document.getElementById('notiDropdown');
            
            if (userAvatarBtn && userDropdown) {
                userAvatarBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                    if (notiDropdown) notiDropdown.classList.remove('show');
                });
            }
            
            if (notiBell && notiDropdown) {
                notiBell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notiDropdown.classList.toggle('show');
                    if (userDropdown) userDropdown.classList.remove('show');
                });
            }
            
            document.addEventListener('click', () => {
                if (userDropdown) userDropdown.classList.remove('show');
                if (notiDropdown) notiDropdown.classList.remove('show');
            });

            // Navbar scroll effect
            window.addEventListener('scroll', () => {
                const navbar = document.getElementById('navbar');
                if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
            });

            // Mobile menu
            document.getElementById('hamburger')?.addEventListener('click', () => {
                document.getElementById('navLinks').classList.toggle('mobile-open');
            });

            // Logout
            document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });

            // Mark all read
            document.getElementById('markAllRead')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const uid = localStorage.getItem('userId');
                if (!uid) return;
                try {
                    await fetch(`${API_BASE}/notifications/mark-all-read?userId=${uid}`, { method: 'PUT' });
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    loadNotifications(uid, token);
                } catch (err) {
                    console.error(err);
                }
            });

            // Newsletter submit
            document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Cảm ơn bạn đã đăng ký nhận bản tin!');
                e.target.reset();
            });

            document.getElementById('paymentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const file = proofFile.files[0];
                const note = document.getElementById('studentNote').value.trim();

                if (!file) {
                    alert("Vui lòng tải lên ảnh biên lai chuyển khoản!");
                    return;
                }

                document.getElementById('loadingOverlay').style.display = 'flex';

                try {
                    const userId = localStorage.getItem('userId') || 'demo_user_123';
                    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                    
                    const headers = {};
                    if (token) headers['Authorization'] = 'Bearer ' + token;

                    let proofUrl = mockProofUrl;

                    // If it's a real paymentRequestId (not mockup)
                    if (paymentRequestId && !paymentRequestId.startsWith('req_dummy')) {
                        // 1. Upload proof image file to backend
                        const formData = new FormData();
                        formData.append('image', file);

                        const uploadRes = await fetch(`${API_BASE}/payment-requests/upload-proof-image`, {
                            method: 'POST',
                            headers: headers,
                            body: formData
                        });

                        if (!uploadRes.ok) {
                            throw new Error("Failed to upload payment proof image");
                        }

                        const uploadData = await uploadRes.json();
                        if (uploadData && uploadData.result && uploadData.result.url) {
                            proofUrl = uploadData.result.url;
                        }
                        
                        // 2. Submit payment proof details (updates status to PENDING)
                        const putRes = await fetch(`${API_BASE}/payment-requests/${paymentRequestId}/upload-proof?userId=${userId}`, {
                            method: 'PUT',
                            headers: {
                                ...headers,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                studentNote: note,
                                paymentProofUrl: proofUrl,
                                transferNote: document.getElementById('referenceCode').textContent.trim()
                            })
                        });

                        if (!putRes.ok) {
                            throw new Error("Failed to submit payment proof details");
                        }
                    } else {
                        // Demo mode fallback delay
                        await new Promise(r => setTimeout(r, 1500));
                    }
                    
                    alert("✅ Đã gửi biên lai thành công! Vui lòng chờ giáo viên xác nhận để vào học.");
                    window.location.href = "courses.html?status=pending";

                } catch (error) {
                    console.error("Submit error:", error);
                    alert("❌ Có lỗi xảy ra khi gửi biên lai. Vui lòng kiểm tra lại kết nối!");
                    document.getElementById('loadingOverlay').style.display = 'none';
                }
            });
        });
