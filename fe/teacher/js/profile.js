const API_BASE = 'http://localhost:8080';
        let originalProfileData = null; // Cache to undo unsaved changes

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

        // ── Show feedback banner ──
        function showFeedback(message, type = 'success') {
            const banner = document.getElementById('alertBanner');
            if (banner) {
                banner.textContent = message;
                banner.className = `alert-banner ${type}`;
                banner.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => banner.style.display = 'none', 4000);
            }
        }

        // ── Fetch Profile ──
        async function loadProfile(auth) {
            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;
                
                const res = await fetch(`${API_BASE}/profile/me?userId=${auth.uid}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        populateProfile(data.result);
                        return;
                    }
                }
                throw new Error("API profile call failed");
            } catch (error) {
                console.warn("Profile API connection failed, using local mockup db fallback.", error);
                
                // Fallback to locally saved cache or dummy
                let profileData = null;
                const localSaved = localStorage.getItem('mockProfileDb');
                if (localSaved) {
                    try {
                        profileData = JSON.parse(localSaved);
                    } catch(e) {}
                }
                
                if (!profileData) {
                    profileData = {
                        id: auth.uid,
                        userName: localStorage.getItem('userName') || 'giangvien_mock',
                        email: localStorage.getItem('userEmail') || 'giangvien@eduvn.com',
                        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                        firstName: "Dũng",
                        lastName: "Phạm Đăng",
                        fullName: "Phạm Đăng Dũng",
                        phone: "0901234567",
                        dob: "1988-10-12",
                        gender: "Male",
                        address: "Hà Nội, Việt Nam",
                        bio: "Giảng viên CNTT với hơn 10 năm kinh nghiệm giảng dạy lập trình Web, kiến trúc hệ thống Cloud & DevOps. Đam mê truyền tải tri thức công nghệ và đồng hành cùng học viên.",
                        locale: "vi",
                        roles: ["TEACHER"],
                        createdAt: "2023-05-15T09:00:00"
                    };
                }
                
                populateProfile(profileData);
            }
        }

        function populateProfile(profile) {
            originalProfileData = { ...profile };

            // 1. Sidebar Display Sync
            document.getElementById('profileAvatar').src = profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
            
            const fullNameText = profile.fullName || `${profile.lastName || ''} ${profile.firstName || ''}`.trim() || profile.userName || 'Giảng viên';
            document.getElementById('sidebarFullName').textContent = fullNameText;
            document.getElementById('sidebarEmail').textContent = profile.email || 'email@domain.com';
            
            if (profile.createdAt) {
                const date = new Date(profile.createdAt);
                document.getElementById('sidebarJoinedDate').textContent = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            }

            // Sync Header username pill
            document.getElementById('instructorName').textContent = fullNameText;

            // 2. Populate form fields
            document.getElementById('userNameInput').value = profile.userName || '';
            document.getElementById('emailInput').value = profile.email || '';
            document.getElementById('firstNameInput').value = profile.firstName || '';
            document.getElementById('lastNameInput').value = profile.lastName || '';
            document.getElementById('phoneInput').value = profile.phone || '';
            document.getElementById('addressInput').value = profile.address || '';
            document.getElementById('bioInput').value = profile.bio || '';
            document.getElementById('genderSelect').value = profile.gender || '';
            document.getElementById('localeSelect').value = profile.locale || 'vi';
            document.getElementById('dobInput').value = profile.dob || '';

            // Update main localStorage username cache
            localStorage.setItem('userName', fullNameText);
        }

        // ── Save Profile ──
        async function saveProfile(e) {
            e.preventDefault();
            const auth = checkTeacherAuth();
            if (!auth) return;

            const btnSave = document.getElementById('btnSave');
            const originalBtnText = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang lưu...';

            const firstNameVal = document.getElementById('firstNameInput').value.trim();
            const lastNameVal = document.getElementById('lastNameInput').value.trim();
            const fullNameVal = `${lastNameVal} ${firstNameVal}`.trim();

            const requestBody = {
                firstName: firstNameVal,
                lastName: lastNameVal,
                fullName: fullNameVal,
                phone: document.getElementById('phoneInput').value.trim(),
                dob: document.getElementById('dobInput').value || null,
                gender: document.getElementById('genderSelect').value || null,
                address: document.getElementById('addressInput').value.trim(),
                bio: document.getElementById('bioInput').value.trim(),
                locale: document.getElementById('localeSelect').value || 'vi',
                avatar: document.getElementById('profileAvatar').src
            };

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/profile/update?userId=${auth.uid}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        populateProfile(data.result);
                        showFeedback("Cập nhật thông tin cá nhân thành công!");
                        btnSave.disabled = false;
                        btnSave.innerHTML = originalBtnText;
                        return;
                    }
                }
                throw new Error("Failed to save profile");
            } catch (error) {
                console.warn("Profile update API failed, saving locally in mockup mode.", error);
                
                await new Promise(r => setTimeout(r, 600));

                const updatedResult = {
                    ...originalProfileData,
                    ...requestBody,
                    fullName: fullNameVal,
                    updatedAt: new Date().toISOString()
                };

                localStorage.setItem('mockProfileDb', JSON.stringify(updatedResult));
                populateProfile(updatedResult);
                
                showFeedback("Cập nhật thông tin thành công (Chế độ Demo)!");
                btnSave.disabled = false;
                btnSave.innerHTML = originalBtnText;
            }
        }

        // ── Avatar Upload Handler ──
        async function handleAvatarUpload(file) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            const loader = document.getElementById('avatarLoader');
            loader.style.display = 'flex';

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/profile/upload-avatar?userId=${auth.uid}`, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        document.getElementById('profileAvatar').src = data.result;
                        if (originalProfileData) originalProfileData.avatar = data.result;
                        showFeedback("Ảnh đại diện đã được cập nhật!");
                        loader.style.display = 'none';
                        return;
                    }
                }
                throw new Error("Upload failed");
            } catch (error) {
                console.warn("Avatar upload API connection failed, simulating image using FileReader.", error);
                
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const dataUrl = e.target.result;
                    document.getElementById('profileAvatar').src = dataUrl;
                    
                    if (originalProfileData) {
                        originalProfileData.avatar = dataUrl;
                        let localDb = null;
                        try {
                            localDb = JSON.parse(localStorage.getItem('mockProfileDb'));
                        } catch(err) {}
                        if (!localDb) {
                            localDb = { ...originalProfileData };
                        }
                        localDb.avatar = dataUrl;
                        localStorage.setItem('mockProfileDb', JSON.stringify(localDb));
                    }
                    
                    await new Promise(r => setTimeout(r, 600));
                    showFeedback("Ảnh đại diện đã được cập nhật (Chế độ Demo)!");
                    loader.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        }

        // ── DOM Listeners ──
        document.addEventListener('DOMContentLoaded', () => {
            const auth = checkTeacherAuth();
            if (!auth) return;

            loadProfile(auth);

            // Form Submit
            document.getElementById('profileForm').addEventListener('submit', saveProfile);

            // Form Undo Reset
            document.getElementById('btnCancel').addEventListener('click', () => {
                if (originalProfileData) {
                    populateProfile(originalProfileData);
                    showFeedback("Đã hủy các thay đổi chưa lưu.");
                }
            });

            // Avatar Upload triggers
            const avatarContainer = document.getElementById('avatarContainer');
            const avatarFileInput = document.getElementById('avatarFileInput');
            
            avatarContainer.addEventListener('click', () => avatarFileInput.click());

            avatarFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Size validation: max 2MB
                    if (file.size > 2 * 1024 * 1024) {
                        showFeedback("Ảnh đại diện vượt quá giới hạn dung lượng (Tối đa 2MB).", "error");
                        return;
                    }
                    handleAvatarUpload(file);
                }
            });

            // Logout
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        });
