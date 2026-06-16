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

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        window.location.href = '../login.html';
        return;
    }
    
    loadPayments(userId, token);
});

function getStatusHtml(status) {
    switch (status) {
        case 'CONFIRMED':
            return '<span class="status-badge status-success">Thành công</span>';
        case 'PENDING':
            return '<span class="status-badge status-pending">Đang chờ xử lý</span>';
        case 'REJECTED':
            return '<span class="status-badge status-failed">Bị từ chối</span>';
        case 'EXPIRED':
            return '<span class="status-badge" style="background:#e2e8f0;color:#64748b;">Hết hạn</span>';
        case 'CANCELLED':
            return '<span class="status-badge" style="background:#f1f5f9;color:#94a3b8;">Đã hủy</span>';
        default:
            return '<span class="status-badge" style="background: #e2e8f0; color: #475569;">Không xác định</span>';
    }
}

function formatCurrency(amount) {
    if (!amount) return '0đ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    } catch(e) {
        return dateString;
    }
}

async function loadPayments(userId, token) {
    const tableBody = document.getElementById('paymentTableBody');
    const tableContainer = document.querySelector('.payment-table-container');
    const emptyState = document.getElementById('paymentEmptyState');
    
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size:24px; color:var(--primary);"></i></td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/payment-requests/my-payments?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error('Không thể lấy danh sách thanh toán');
        }

        const json = await res.json();
        const data = json.result || [];

        if (!data || data.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Sắp xếp giảm dần theo thời gian tạo
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';

        tableBody.innerHTML = data.map(tx => `
            <tr>
                <td><span class="tx-id">${tx.referenceCode || tx.id.substring(0,8).toUpperCase()}</span></td>
                <td><div class="course-name-col" title="${tx.courseTitle || 'Khóa học'}">${tx.courseTitle || 'Khóa học'}</div></td>
                <td>${formatDateTime(tx.createdAt)}</td>
                <td style="font-weight: 600; color: #1e293b;">${formatCurrency(tx.amount)}</td>
                <td>${getStatusHtml(tx.status)}</td>
            </tr>
        `).join('');
        
    } catch (e) {
        console.error('Lỗi khi tải lịch sử thanh toán:', e);
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Tùy chọn: Hiển thị lỗi ra UI
        emptyState.querySelector('h3').textContent = "Không thể tải dữ liệu";
        emptyState.querySelector('p').textContent = "Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau.";
        emptyState.querySelector('.btn').textContent = "Tải lại trang";
        emptyState.querySelector('.btn').href = "javascript:location.reload()";
    }
}
