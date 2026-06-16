(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        if (token && userId) {
            let dispName = localStorage.getItem('userName') || 'Sinh viên';
            let avatarUrl = localStorage.getItem('userAvatar') || '';
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const data = JSON.parse(userStr);
                    dispName = data.fullName || data.username || dispName;
                    if (!avatarUrl) {
                        avatarUrl = data.avatar || data.avatarUrl || '';
                    }
                } catch(e) {}
            }
            
            const nameEl = document.getElementById('userNameDisplay') || document.getElementById('landingUserName');
            if(nameEl) nameEl.textContent = dispName;
            
            const avatarEl = document.getElementById('navUserAvatar');
            
            const renderAvatar = (url) => {
                if (avatarEl) {
                    if (url) {
                        avatarEl.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    } else {
                        avatarEl.textContent = dispName.charAt(0).toUpperCase();
                    }
                }
            };

            if (avatarUrl) {
                renderAvatar(avatarUrl);
            } else {
                renderAvatar('');
                
                // Fetch trực tiếp từ DB để đồng bộ avatar
                const API_BASE = 'http://localhost:8080';
                fetch(`${API_BASE}/profile/me?userId=${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => {
                    if (res.ok) return res.json();
                })
                .then(json => {
                    if (json && json.result) {
                        const data = json.result;
                        const newAvatar = data.avatar || data.avatarUrl || '';
                        if (newAvatar) {
                            localStorage.setItem('userAvatar', newAvatar);
                            localStorage.setItem('user', JSON.stringify(data));
                            renderAvatar(newAvatar);
                        }
                    }
                })
                .catch(err => console.warn("Failed to sync avatar in background", err));
            }
        }
    });
})();

const API_BASE = 'http://localhost:8080';
let currentCourseId = null;
let currentPaymentRequestId = null;
let selectedBillFile = null;
let rawPrice = 0;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!token || !userId) {
        alert("Vui lòng đăng nhập để tiếp tục!");
        window.location.href = '../login.html';
        return;
    }
    
    const userAvatar = document.getElementById('navUserAvatar');
    if (userAvatar) userAvatar.textContent = userName ? userName.charAt(0).toUpperCase() : 'U';

    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = urlParams.get('courseId');

    if (!currentCourseId) {
        alert("Không tìm thấy thông tin khóa học.");
        window.location.href = '../catalog.html';
        return;
    }

    loadCheckoutData(currentCourseId, userId, token);
    
    // File input listener
    document.getElementById('billInput').addEventListener('change', handleFileSelect);
    document.getElementById('confirmBtn').addEventListener('click', confirmPayment);
});

async function loadCheckoutData(courseId, userId, token) {
    try {
        // 1. Fetch Course details to show summary
        const courseRes = await fetch(`${API_BASE}/course/${courseId}`);
        const courseDataJson = await courseRes.json();
        if (!courseRes.ok) {
            alert("Lỗi tải thông tin khóa học: " + (courseDataJson.message || "Không tìm thấy khóa học"));
            window.location.href = '../catalog.html';
            return;
        }
        const course = courseDataJson.result || courseDataJson;
        
        document.getElementById('courseTitle').textContent = course.title;
        let thumbUrl = course.thumbnailUrl || course.thumbnail;
        if (thumbUrl && !thumbUrl.startsWith('http')) thumbUrl = `${API_BASE}/uploads/${thumbUrl}`;
        document.getElementById('courseThumb').src = thumbUrl;
        
        rawPrice = course.price;
        const formattedPrice = rawPrice.toLocaleString('vi-VN');
        document.getElementById('coursePrice').textContent = formattedPrice + ' đ';
        document.getElementById('totalPrice').textContent = formattedPrice + ' đ';

        // 2. Fetch Payment Info (Bank details)
        const paymentInfoRes = await fetch(`${API_BASE}/payment-requests/courses/${courseId}/payment-info`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const infoJson = await paymentInfoRes.json();
        if (!paymentInfoRes.ok) {
            let errMsg = infoJson.message || "Giảng viên chưa cấu hình tài khoản nhận tiền";
            if (errMsg === "Primary bank account not found") {
                errMsg = "Giảng viên sở hữu khóa học này chưa cấu hình tài khoản nhận tiền.";
            }
            alert("Lỗi lấy thông tin thanh toán: " + errMsg);
            return;
        }
        const info = infoJson.result || infoJson;

        document.getElementById('instructorName').textContent = info.instructorName;
        document.getElementById('bankName').textContent = info.bankName;
        document.getElementById('bankAccount').innerHTML = `${info.accountNumber} <i class="far fa-copy" onclick="copyText('${info.accountNumber}')"></i>`;
        document.getElementById('bankOwner').textContent = info.accountName;
        document.getElementById('transferAmount').innerHTML = `${formattedPrice} <i class="far fa-copy" onclick="copyText('${rawPrice}')"></i>`;

        // 3. Create Payment Request (PENDING) to get Reference Code
        let createRes = await fetch(`${API_BASE}/payment-requests/create?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId: courseId })
        });
        
        let paymentReq = null;
        
        if (!createRes.ok) {
            const err = await createRes.json();
            const errMsg = err.message || '';
            const errCode = err.status || err.code;
            
            if (errCode === 905 || errMsg.includes("Already enrolled") || errMsg.includes("đã đăng ký")) {
                alert("Bạn đã đăng ký và thanh toán thành công khóa học này rồi! Hệ thống sẽ chuyển hướng bạn về trang học tập.");
                window.location.href = `learning.html?courseId=${courseId}`;
                return;
            }
            
            if (errCode === 901 || errMsg.includes("already exists") || errMsg.includes("đã có giao dịch")) {
                // Fetch the existing pending request
                const myPaymentsRes = await fetch(`${API_BASE}/payment-requests/my-payments?userId=${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (myPaymentsRes.ok) {
                    const myPaymentsJson = await myPaymentsRes.json();
                    const list = myPaymentsJson.result || myPaymentsJson || [];
                    // Find the pending payment request for this course
                    const pendingReq = list.find(r => r.courseId === courseId && r.status === 'PENDING');
                    if (pendingReq) {
                        paymentReq = pendingReq;
                    }
                }
            }
            
            // If still no paymentReq found, alert the error
            if (!paymentReq) {
                alert("Lỗi tạo mã thanh toán: " + (err.message || 'Hệ thống bận'));
                return;
            }
        } else {
            const createJson = await createRes.json();
            paymentReq = createJson.result || createJson;
        }
        
        currentPaymentRequestId = paymentReq.id;
        const refCode = paymentReq.referenceCode;
        
        document.getElementById('transferContent').innerHTML = `${refCode} <i class="far fa-copy" onclick="copyText('${refCode}')"></i>`;

        // Helper function to map common bank names to VietQR short codes
        const getVietQrBankId = (name) => {
            if (!name) return "";
            const n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (n.includes("mbbank") || n === "mb" || n.includes("quandoi")) return "MB";
            if (n.includes("vietcombank") || n === "vcb" || n.includes("ngoaithuong")) return "VCB";
            if (n.includes("vietinbank") || n === "vtb" || n === "icb" || n.includes("congthuong")) return "ICB";
            if (n.includes("techcombank") || n === "tcb" || n.includes("kythuong")) return "TCB";
            if (n.includes("bidv") || n.includes("dautu")) return "BIDV";
            if (n.includes("acb") || n.includes("achau")) return "ACB";
            if (n.includes("sacombank") || n.includes("saigonthuongtin")) return "STB";
            if (n.includes("agribank") || n === "vba" || n.includes("nongnghiep")) return "VBA";
            if (n.includes("tpbank") || n === "tpb" || n.includes("tienphong")) return "TPB";
            if (n.includes("vpbank") || n === "vpb" || n.includes("thinhvuong")) return "VPB";
            if (n.includes("msb") || n.includes("hanghai")) return "MSB";
            if (n.includes("shb") || n.includes("saigonhanoi")) return "SHB";
            if (n.includes("vib") || n.includes("quocte")) return "VIB";
            if (n.includes("hdbank") || n === "hdb" || n.includes("phattrien")) return "HDB";
            return name; // fallback
        };

        document.getElementById('qrLoading').style.display = 'none';
        const qrImg = document.getElementById('bankQrCode');
        
        let qrUrl = "";
        if (info.qrCodeUrl) {
            qrUrl = info.qrCodeUrl;
            if (!qrUrl.startsWith('http')) {
                qrUrl = `${API_BASE}/uploads/${qrUrl}`;
            }
            console.log("Using instructor's uploaded QR code:", qrUrl);
        } else {
            // Fallback to VietQR API if no custom QR code uploaded
            const bankId = getVietQrBankId(info.bankName);
            qrUrl = `https://img.vietqr.io/image/${bankId}-${info.accountNumber}-compact2.jpg?amount=${rawPrice}&addInfo=${refCode}&accountName=${info.accountName}`;
            console.log("Using generated VietQR:", qrUrl);
        }
        
        qrImg.src = qrUrl;
        qrImg.style.display = 'block';

    } catch (error) {
        console.error(error);
        alert("Lỗi tải dữ liệu thanh toán: " + error.message);
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedBillFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('billPreview').src = e.target.result;
            document.getElementById('uploadZone').style.display = 'none';
            document.getElementById('previewZone').style.display = 'block';
            document.getElementById('confirmBtn').disabled = false;
        }
        reader.readAsDataURL(file);
    }
}

function removeBill() {
    selectedBillFile = null;
    document.getElementById('billInput').value = '';
    document.getElementById('uploadZone').style.display = 'block';
    document.getElementById('previewZone').style.display = 'none';
    document.getElementById('confirmBtn').disabled = true;
}

window.copyText = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Đã copy: " + text);
    });
}

async function confirmPayment() {
    if (!selectedBillFile || !currentPaymentRequestId) return;
    
    const btn = document.getElementById('confirmBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải ảnh lên...';

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    try {
        // Step 1: Upload Image
        const formData = new FormData();
        formData.append('image', selectedBillFile);
        
        const uploadRes = await fetch(`${API_BASE}/payment-requests/upload-proof-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!uploadRes.ok) throw new Error("Upload ảnh thất bại");
        const uploadJson = await uploadRes.json();
        const fileUrl = uploadJson.result.url || uploadJson.result.fileUrl;

        // Step 2: Link proof to payment request
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hoàn tất...';
        
        const refElement = document.getElementById('transferContent').innerText.trim();
        const refCode = refElement || "NO_REF";

        const confirmRes = await fetch(`${API_BASE}/payment-requests/${currentPaymentRequestId}/upload-proof?userId=${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paymentProofUrl: fileUrl,
                transferNote: refCode,
                studentNote: "Tôi đã chuyển khoản thành công."
            })
        });

        if (confirmRes.ok) {
            btn.innerHTML = '<i class="fas fa-check"></i> Gửi thành công';
            btn.className = 'btn btn-success btn-block mt-4';
            
            // Show Success Overlay
            document.querySelector('.checkout-payment').innerHTML = `
                <div style="text-align:center; padding: 40px 20px;">
                    <i class="fas fa-check-circle" style="font-size: 60px; color: #22c55e; margin-bottom: 20px;"></i>
                    <h3 style="font-size: 20px; margin-bottom: 10px;">Gửi hóa đơn thành công!</h3>
                    <p style="color: #64748b; margin-bottom: 30px;">Hệ thống đã ghi nhận yêu cầu của bạn. Giảng viên sẽ kiểm tra và duyệt đăng ký trong thời gian sớm nhất.</p>
                    <a href="../course-detail.html?id=${currentCourseId}" class="btn btn-primary">Quay lại trang khóa học</a>
                </div>
            `;
        } else {
            const err = await confirmRes.json();
            throw new Error(err.message || "Lỗi cập nhật hóa đơn");
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi: " + error.message);
        btn.disabled = false;
        btn.innerHTML = 'Xác nhận đã thanh toán';
    }
}
