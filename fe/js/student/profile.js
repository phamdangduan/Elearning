document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    loadProfile(token);

    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfile(token);
    });

    document.getElementById('avatarUpload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Hiển thị preview ngay lập tức
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('avatarPreview');
                preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
            reader.readAsDataURL(file);
            
            // Xử lý upload avatar qua API nếu có
            uploadAvatar(file, token);
        }
    });
});

async function loadProfile(token) {
    try {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`${API_BASE}/profile/me?userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const json = await res.json();
            const data = json.result;
            
            if (!data) {
                loadFromLocalStorage();
                return;
            }
            
            // Lưu thông tin từ DB vào localStorage để các trang khác đồng bộ
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('userName', data.fullName || '');
            localStorage.setItem('userEmail', data.email || '');
            localStorage.setItem('userAvatar', data.avatar || '');
            
            // Map data to UI
            const nameParts = (data.fullName || '').trim().split(' ');
            const fName = nameParts.pop() || '';
            const lName = nameParts.join(' ') || '';
            document.getElementById('inputFirstName').value = fName;
            document.getElementById('inputLastName').value = lName;
            
            document.getElementById('inputPhone').value = data.phone || '';
            document.getElementById('inputBio').value = data.bio || '';
            const emailInput = document.getElementById('inputEmail');
            if (emailInput) {
                emailInput.value = data.email || '';
            }
            
            document.getElementById('profileNameDisplay').textContent = data.fullName || 'Chưa cập nhật tên';
            document.getElementById('profileEmailDisplay').textContent = data.email || '';
            
            document.getElementById('userNameDisplay').textContent = data.fullName || (localStorage.getItem('userName') || 'Sinh viên');

            const avatarUrl = data.avatar || data.avatarUrl;
            if (avatarUrl) {
                const imgHtml = `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                document.getElementById('avatarPreview').innerHTML = imgHtml;
                const navUserAvatar = document.getElementById('navUserAvatar');
                if (navUserAvatar) navUserAvatar.innerHTML = imgHtml;
            } else if (data.fullName) {
                const initial = data.fullName.charAt(0).toUpperCase();
                document.getElementById('avatarPreview').textContent = initial;
                const navUserAvatar = document.getElementById('navUserAvatar');
                if (navUserAvatar) navUserAvatar.textContent = initial;
            }
        } else {
            loadFromLocalStorage();
        }
    } catch (e) {
        console.warn("Could not load profile from API, fallback to localStorage", e);
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const userStr = localStorage.getItem('user');
    const userEmail = localStorage.getItem('userEmail');
    let email = userEmail || '';
    if (userStr) {
        try {
            const data = JSON.parse(userStr);
            const fNameRaw = data.fullName || data.username || '';
            const nameParts = fNameRaw.trim().split(' ');
            const fName = nameParts.pop() || '';
            const lName = nameParts.join(' ') || '';
            
            document.getElementById('inputFirstName').value = fName;
            document.getElementById('inputLastName').value = lName;
            email = email || data.email || '';
            
            document.getElementById('profileNameDisplay').textContent = fNameRaw || (localStorage.getItem('userName') || 'Sinh viên');
            document.getElementById('userNameDisplay').textContent = data.fullName || data.username || (localStorage.getItem('userName') || 'Sinh viên');
            
            const avatarUrl = data.avatar || data.avatarUrl;
            if (avatarUrl) {
                const imgHtml = `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                document.getElementById('avatarPreview').innerHTML = imgHtml;
                const navUserAvatar = document.getElementById('navUserAvatar');
                if (navUserAvatar) navUserAvatar.innerHTML = imgHtml;
            } else if (data.fullName || data.username) {
                const initial = (data.fullName || data.username).charAt(0).toUpperCase();
                document.getElementById('avatarPreview').textContent = initial;
                const navUserAvatar = document.getElementById('navUserAvatar');
                if (navUserAvatar) navUserAvatar.textContent = initial;
            }
        } catch(e) {}
    }
    document.getElementById('profileEmailDisplay').textContent = email;
    const emailInput = document.getElementById('inputEmail');
    if (emailInput) emailInput.value = email;
}

async function saveProfile(token) {
    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    const userId = localStorage.getItem('userId');
    const fName = document.getElementById('inputFirstName').value.trim();
    const lName = document.getElementById('inputLastName').value.trim();
    const fullName = `${lName} ${fName}`.trim();
    const email = document.getElementById('inputEmail') ? document.getElementById('inputEmail').value.trim() : '';

    const payload = {
        fullName: fullName,
        email: email,
        phone: document.getElementById('inputPhone').value,
        bio: document.getElementById('inputBio').value
    };

    try {
        const res = await fetch(`${API_BASE}/profile/update?userId=${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const json = await res.json();
            const data = json.result || payload;
            
            alert("Cập nhật hồ sơ thành công!");
            document.getElementById('profileNameDisplay').textContent = data.fullName;
            document.getElementById('profileEmailDisplay').textContent = data.email || payload.email;
            document.getElementById('userNameDisplay').textContent = data.fullName;
            
            // Cập nhật lại localStorage
            let userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    let userObj = JSON.parse(userStr);
                    userObj.fullName = data.fullName;
                    userObj.email = data.email || payload.email;
                    localStorage.setItem('user', JSON.stringify(userObj));
                } catch(e) {}
            }
            localStorage.setItem('userName', data.fullName);
            localStorage.setItem('userEmail', data.email || payload.email);
        } else {
            try {
                const errData = await res.json();
                alert(errData.message || "Lưu thất bại.");
            } catch(e) {
                alert("Lưu thất bại.");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Có lỗi khi lưu hồ sơ.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Lưu thay đổi";
    }
}

async function uploadAvatar(file, token) {
    const userId = localStorage.getItem('userId');
    const formData = new FormData();
    formData.append('avatar', file);
    
    console.log("Đang upload avatar...");

    try {
        const res = await fetch(`${API_BASE}/profile/upload-avatar?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (res.ok) {
            const json = await res.json();
            const avatarUrl = json.result;
            console.log("Upload avatar thành công", avatarUrl);
            
            // Cập nhật lại localStorage
            let userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    let userObj = JSON.parse(userStr);
                    userObj.avatar = avatarUrl;
                    localStorage.setItem('user', JSON.stringify(userObj));
                } catch(e) {}
            }
            
            // Đồng thời cập nhật cả logo ở menu toggle/avatar hiển thị
            const imgHtml = `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview) {
                avatarPreview.innerHTML = imgHtml;
            }
            const navUserAvatar = document.getElementById('navUserAvatar');
            if (navUserAvatar) {
                navUserAvatar.innerHTML = imgHtml;
            }
            
            alert("Cập nhật ảnh đại diện thành công!");
        } else {
            alert("Lưu ảnh thất bại.");
        }
    } catch (e) {
        console.error("Lỗi upload avatar", e);
        alert("Lỗi kết nối khi tải ảnh lên.");
    }
}
