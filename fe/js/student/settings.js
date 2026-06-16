const API_BASE = 'http://localhost:8080';

// ── Toast Notification ──
function showToast(msg, type = 'info') {
    const toastContainer = document.querySelector('.settings-toast-container') || document.createElement('div');
    if (!toastContainer.classList.contains('settings-toast-container')) {
        toastContainer.className = 'settings-toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        document.body.appendChild(toastContainer);
    }

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#2563eb'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: white;
        border-left: 4px solid ${colors[type]};
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}" style="color:${colors[type]};font-size:20px"></i>
        <p style="margin:0;font-size:14px;color:#0f172a;font-weight:500">${msg}</p>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            toast.remove();
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 3000);
}

// Add animation styles
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        window.location.href = '../login.html';
        return;
    }

    // ── Handle Change Password ──
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword.length < 6) {
                showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'warning');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                showToast('Mật khẩu xác nhận không khớp', 'warning');
                return;
            }

            const submitBtn = document.getElementById('changePasswordBtn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang cập nhật...';

            try {
                const res = await fetch(`${API_BASE}/profile/change-password?userId=${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ oldPassword, newPassword })
                });

                const json = await res.json();

                if (res.ok && (json.status === 200 || json.code === 200 || json.success !== false)) {
                    showToast('Đổi mật khẩu thành công!', 'success');
                    passwordForm.reset();
                } else {
                    const errMsg = json.message || 'Không thể đổi mật khẩu';
                    showToast(errMsg, 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Lỗi kết nối máy chủ', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // ── Handle Deactivate Account ──
    const deactivateBtn = document.getElementById('deactivateAccountBtn');
    if (deactivateBtn) {
        deactivateBtn.addEventListener('click', async () => {
            const confirmed = confirm(
                'Bạn có chắc chắn muốn tạm khóa tài khoản của mình không?\nHành động này sẽ tạm thời vô hiệu hóa truy cập của bạn cho đến khi được ban quản trị kích hoạt lại.'
            );
            if (!confirmed) return;

            deactivateBtn.disabled = true;
            deactivateBtn.textContent = 'Đang xử lý...';

            try {
                const res = await fetch(`${API_BASE}/profile/${userId}/status?status=INACTIVE`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const json = await res.json();

                if (res.ok) {
                    showToast('Tài khoản đã được tạm khóa. Đang đăng xuất...', 'info');
                    setTimeout(() => {
                        localStorage.clear();
                        window.location.href = '../login.html';
                    }, 2000);
                } else {
                    const errMsg = json.message || 'Không thể tạm khóa tài khoản';
                    showToast(errMsg, 'error');
                    deactivateBtn.disabled = false;
                    deactivateBtn.textContent = 'Tạm khóa tài khoản';
                }
            } catch (err) {
                console.error(err);
                showToast('Lỗi kết nối máy chủ', 'error');
                deactivateBtn.disabled = false;
                deactivateBtn.textContent = 'Tạm khóa tài khoản';
            }
        });
    }

    // ── Handle Toggle Settings UI feedback ──
    const toggles = document.querySelectorAll('.toggle-switch input');
    toggles.forEach(toggle => {
        // Mock save status in localStorage just for frontend persistence demonstration
        const key = `setting_${toggle.id}`;
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            toggle.checked = saved === 'true';
        }

        toggle.addEventListener('change', () => {
            localStorage.setItem(key, toggle.checked);
            showToast('Đã lưu thay đổi cài đặt', 'success');
        });
    });
});
