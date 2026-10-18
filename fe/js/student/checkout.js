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
const POLL_INTERVAL_MS = 2000;          // Đơn còn hạn: kiểm tra mỗi 2 giây
const LATE_POLL_INTERVAL_MS = 5000;     // Đơn đã hết hạn: vẫn kiểm tra thưa hơn — tiền về muộn sẽ được "hồi sinh"
const LATE_POLL_WINDOW_MS = 10 * 60 * 1000;

let currentCourseId = null;
let currentCourseTitle = '';
let currentPaymentRequestId = null;

let pollTimer = null;
let countdownTimer = null;
let expiresAtMs = null;     // Mốc hết hạn theo đồng hồ client (đồng bộ từ timeRemainingSeconds của server)
let expiredSinceMs = null;
let pollStopped = false;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    // Chưa đăng nhập → về trang login (kèm redirect); sai vai trò → về trang chủ (js/api.js)
    if (!Api.requireRole('STUDENT')) return;

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

    // Tab ẩn thì ngừng polling cho đỡ tốn request; quay lại tab thì kiểm tra ngay
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && currentPaymentRequestId && !pollStopped) {
            schedulePoll(0);
        }
    });
});

async function loadCheckoutData(courseId, userId, token) {
    try {
        // 1. Thông tin khóa học
        const courseRes = await fetch(`${API_BASE}/course/${courseId}`);
        const courseDataJson = await courseRes.json();
        if (!courseRes.ok) {
            alert("Lỗi tải thông tin khóa học: " + (courseDataJson.message || "Không tìm thấy khóa học"));
            window.location.href = '../catalog.html';
            return;
        }
        const course = courseDataJson.result || courseDataJson;
        currentCourseTitle = course.title;

        document.getElementById('courseTitle').textContent = course.title;
        let thumbUrl = course.thumbnailUrl || course.thumbnail;
        if (thumbUrl && !thumbUrl.startsWith('http')) thumbUrl = `${API_BASE}/uploads/${thumbUrl}`;
        document.getElementById('courseThumb').src = thumbUrl;

        const formattedPrice = Number(course.price).toLocaleString('vi-VN');
        document.getElementById('coursePrice').textContent = formattedPrice + ' đ';
        document.getElementById('totalPrice').textContent = formattedPrice + ' đ';

        // 2. Thông tin tài khoản nhận tiền — tài khoản DUY NHẤT của sàn
        const paymentInfoRes = await fetch(`${API_BASE}/payment-requests/courses/${courseId}/payment-info`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const infoJson = await paymentInfoRes.json();
        if (!paymentInfoRes.ok) {
            alert("Lỗi lấy thông tin thanh toán: " + (infoJson.message || 'Hệ thống bận'));
            return;
        }
        const info = infoJson.result || infoJson;

        document.getElementById('instructorName').textContent = info.instructorName;
        document.getElementById('bankName').textContent = info.bankName;
        setCopyable('bankAccount', info.accountNumber, info.accountNumber);
        document.getElementById('bankOwner').textContent = info.accountName;

        // 3. Tạo đơn PENDING (hoặc dùng lại đơn PENDING còn hạn) để lấy mã đối soát
        const paymentReq = await createOrReusePaymentRequest(courseId, userId, token);
        if (!paymentReq) return;

        currentPaymentRequestId = paymentReq.id;
        const refCode = paymentReq.referenceCode;
        const amount = Number(paymentReq.amount || course.price);

        setCopyable('transferAmount', amount.toLocaleString('vi-VN'), String(amount));
        setCopyable('transferContent', refCode, refCode);

        // 4. VietQR động: STK sàn + số tiền + nội dung = mã đối soát
        const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(info.bankCode)}-${encodeURIComponent(info.accountNumber)}-compact2.png`
            + `?amount=${amount}&addInfo=${encodeURIComponent(refCode)}&accountName=${encodeURIComponent(info.accountName)}`;
        const qrImg = document.getElementById('bankQrCode');
        qrImg.onload = () => { document.getElementById('qrLoading').style.display = 'none'; };
        qrImg.src = qrUrl;
        qrImg.style.display = 'block';

        // 5. Bắt đầu đếm ngược + polling trạng thái
        syncExpiry(paymentReq.timeRemainingSeconds);
        startCountdown();
        schedulePoll(POLL_INTERVAL_MS);

    } catch (error) {
        console.error(error);
        alert("Lỗi tải dữ liệu thanh toán: " + error.message);
    }
}

async function createOrReusePaymentRequest(courseId, userId, token) {
    const createRes = await fetch(`${API_BASE}/payment-requests/create?userId=${userId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId: courseId })
    });

    if (createRes.ok) {
        const createJson = await createRes.json();
        return createJson.result || createJson;
    }

    const err = await createRes.json().catch(() => ({}));
    const errCode = err.status || err.code;

    if (errCode === 905) { // ALREADY_ENROLLED
        alert("Bạn đã sở hữu khóa học này! Hệ thống sẽ chuyển bạn vào trang học.");
        window.location.href = `learning.html?courseId=${courseId}`;
        return null;
    }

    if (errCode === 901) { // PAYMENT_ALREADY_EXISTS → dùng lại đơn PENDING còn hạn
        const myPaymentsRes = await fetch(`${API_BASE}/payment-requests/my-payments?userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (myPaymentsRes.ok) {
            const myPaymentsJson = await myPaymentsRes.json();
            const list = myPaymentsJson.result || [];
            const pendingReq = list.find(r => r.courseId === courseId && r.status === 'PENDING');
            if (pendingReq) return pendingReq;
        }
    }

    alert("Lỗi tạo mã thanh toán: " + (err.message || 'Hệ thống bận'));
    return null;
}

/* ── Polling trạng thái đơn ─────────────────────────────── */

function schedulePoll(delay) {
    clearTimeout(pollTimer);
    if (pollStopped) return;
    pollTimer = setTimeout(pollPaymentStatus, delay);
}

async function pollPaymentStatus() {
    if (pollStopped || !currentPaymentRequestId) return;

    // Tab đang ẩn: không gọi API, chờ visibilitychange gọi lại
    if (document.visibilityState === 'hidden') return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE}/payment-requests/${currentPaymentRequestId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            stopPolling();
            setStatusUI('error', 'Phiên đăng nhập đã hết hạn',
                'Nếu bạn đã chuyển khoản, khóa học vẫn được kích hoạt tự động. Vui lòng đăng nhập lại để kiểm tra.');
            return;
        }

        if (res.ok) {
            const json = await res.json();
            const data = json.result || {};
            syncExpiry(data.timeRemainingSeconds);

            switch (data.status) {
                case 'CONFIRMED':
                    onPaymentConfirmed();
                    return;
                case 'EXPIRED':
                    onPaymentExpired();
                    break;
                case 'CANCELLED':
                case 'REJECTED':
                    stopPolling();
                    setStatusUI('expired', 'Đơn thanh toán đã bị hủy',
                        'Vui lòng tạo mã thanh toán mới. Nếu đã chuyển khoản, liên hệ hỗ trợ để được kiểm tra.');
                    return;
            }
        }
    } catch (e) {
        console.warn('[Checkout] Polling lỗi mạng, thử lại...', e);
    }

    if (expiredSinceMs) {
        if (Date.now() - expiredSinceMs > LATE_POLL_WINDOW_MS) {
            stopPolling();
            return;
        }
        schedulePoll(LATE_POLL_INTERVAL_MS);
    } else {
        schedulePoll(POLL_INTERVAL_MS);
    }
}

function stopPolling() {
    pollStopped = true;
    clearTimeout(pollTimer);
    clearInterval(countdownTimer);
}

function onPaymentConfirmed() {
    stopPolling();
    setStatusUI('success', 'Đã nhận được thanh toán!', 'Khóa học của bạn đã được kích hoạt.');

    const target = `learning.html?courseId=${encodeURIComponent(currentCourseId)}`;
    document.getElementById('paySuccessCourse').textContent = currentCourseTitle;
    document.getElementById('paySuccessGo').href = target;
    document.getElementById('paySuccessOverlay').classList.add('show');

    let seconds = 3;
    const counter = document.getElementById('paySuccessCountdown');
    counter.textContent = seconds;
    const t = setInterval(() => {
        seconds -= 1;
        counter.textContent = Math.max(seconds, 0);
        if (seconds <= 0) {
            clearInterval(t);
            window.location.href = target;
        }
    }, 1000);
}

function onPaymentExpired() {
    if (!expiredSinceMs) expiredSinceMs = Date.now();
    clearInterval(countdownTimer);
    document.getElementById('payCountdown').textContent = '00:00';
    setStatusUI('expired', 'Mã thanh toán đã hết hạn',
        'Nếu bạn ĐÃ chuyển khoản, đừng lo — hệ thống vẫn tự động kích hoạt khi tiền về. Nếu chưa, hãy tạo mã mới.');
}

/* ── Đếm ngược ──────────────────────────────────────────── */

function syncExpiry(timeRemainingSeconds) {
    if (timeRemainingSeconds == null) return;
    expiresAtMs = Date.now() + Number(timeRemainingSeconds) * 1000;
}

function startCountdown() {
    clearInterval(countdownTimer);
    const el = document.getElementById('payCountdown');
    const tick = () => {
        if (expiresAtMs == null) return;
        const remain = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
        const mm = String(Math.floor(remain / 60)).padStart(2, '0');
        const ss = String(remain % 60).padStart(2, '0');
        el.textContent = `${mm}:${ss}`;
        if (remain === 0) {
            onPaymentExpired();
            schedulePoll(0); // Hỏi server ngay để chắc chắn (có thể tiền vừa về)
        }
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
}

/* ── UI helpers ─────────────────────────────────────────── */

function setStatusUI(state, title, desc) {
    const card = document.getElementById('payStatusCard');
    const icon = document.getElementById('payStatusIcon');
    card.classList.toggle('is-expired', state === 'expired' || state === 'error');
    document.getElementById('payStatusTitle').textContent = title;
    document.getElementById('payStatusDesc').textContent = desc;

    const icons = {
        waiting: '<i class="fas fa-circle-notch fa-spin"></i>',
        success: '<i class="fas fa-check-circle" style="color:#22c55e"></i>',
        expired: '<i class="fas fa-hourglass-end"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>'
    };
    icon.innerHTML = icons[state] || icons.waiting;

    document.getElementById('renewBtn').style.display = (state === 'expired') ? 'block' : 'none';
    document.getElementById('payCountdownWrap').style.display = (state === 'success') ? 'none' : 'block';
}

function setCopyable(elementId, displayText, copyValue) {
    const el = document.getElementById(elementId);
    el.textContent = displayText + ' ';
    const icon = document.createElement('i');
    icon.className = 'far fa-copy';
    icon.style.cursor = 'pointer';
    icon.addEventListener('click', () => copyText(copyValue));
    el.appendChild(icon);
}

window.copyText = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Đã copy: " + text);
    });
}
