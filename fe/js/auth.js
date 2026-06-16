// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:8080';

    // ── COMMON OVERLAYS & HELPERS ──
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loaderArea = document.getElementById('loaderArea');
    const successArea = document.getElementById('successArea');
    const loadingText = document.getElementById('loadingText');

    function showInputError(inputEl, errorEl, message) {
        if (inputEl && errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            inputEl.style.borderColor = 'var(--error)';
        }
    }

    function hideInputError(inputEl, errorEl) {
        if (inputEl && errorEl) {
            errorEl.style.display = 'none';
            inputEl.style.borderColor = '';
        }
    }

    function showLoadingOverlay(text = "Đang xử lý...") {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loaderArea.style.display = 'flex';
            successArea.style.display = 'none';
            if (loadingText) loadingText.textContent = text;
        }
    }

    function hideLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    function showSuccessOverlay(message) {
        if (loadingOverlay) {
            loaderArea.style.display = 'none';
            successArea.style.display = 'flex';
            const successText = successArea.querySelector('.auth-loading-text');
            if (successText) {
                successText.textContent = message;
            }
        }
    }

    function shakeFormCard() {
        const card = document.querySelector('.auth-card-container');
        if (card) {
            card.style.animation = 'none';
            void card.offsetWidth; // Trigger reflow
            card.style.animation = 'shake 0.4s ease';
        }
    }

    function saveAuthData(token, userId, name, email, role) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', name || email.split('@')[0]);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', role || 'STUDENT');
    }

    // ── 1. LOGIN FORM LOGIC ──
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const togglePasswordBtn = document.getElementById('togglePassword');

        // Toggle Password Visibility
        if (togglePasswordBtn && passwordInput) {
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                const icon = togglePasswordBtn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
                }
            });
        }

        // Realtime input resets
        emailInput?.addEventListener('input', () => hideInputError(emailInput, emailError));
        passwordInput?.addEventListener('input', () => hideInputError(passwordInput, passwordError));

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isValid = true;
            const emailValue = emailInput.value.trim();
            const passwordValue = passwordInput.value;

            // Email Regex check
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailValue) {
                showInputError(emailInput, emailError, "Vui lòng nhập địa chỉ email.");
                isValid = false;
            } else if (!emailRegex.test(emailValue)) {
                showInputError(emailInput, emailError, "Định dạng email không hợp lệ (Ví dụ: name@domain.com).");
                isValid = false;
            }

            // Password Length check
            if (!passwordValue) {
                showInputError(passwordInput, passwordError, "Vui lòng nhập mật khẩu.");
                isValid = false;
            } else if (passwordValue.length < 6) {
                showInputError(passwordInput, passwordError, "Mật khẩu phải chứa ít nhất 6 ký tự.");
                isValid = false;
            }

            if (!isValid) {
                shakeFormCard();
                return;
            }

            showLoadingOverlay("Đang xác thực thông tin...");

            try {
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue
                    })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    saveAuthData(data.token, data.userId, data.name, data.email, data.role);
                    showSuccessOverlay("Đăng nhập thành công!");
                    setTimeout(() => {
                        if (data.role === 'TEACHER') {
                            window.location.href = 'teacher/index.html';
                        } else if (data.role === 'ADMIN') {
                            window.location.href = 'admin/index.html';
                        } else {
                            window.location.href = 'student/profile.html';
                        }
                    }, 1600);
                } else {
                    hideLoadingOverlay();
                    const message = data.message || "Tài khoản hoặc mật khẩu không chính xác.";
                    if (message.toLowerCase().includes('email')) {
                        showInputError(emailInput, emailError, message);
                    } else {
                        showInputError(passwordInput, passwordError, message);
                    }
                    shakeFormCard();
                }
            } catch (error) {
                console.warn("Backend server connection failed, falling back to Demo Mock login.", error);
                await new Promise(resolve => setTimeout(resolve, 1500));

                const isTeacher = emailValue.toLowerCase().startsWith('teacher');
                saveAuthData(
                    'dummy_token_123',
                    isTeacher ? 'teacher_1' : 'user_1',
                    emailValue.split('@')[0],
                    emailValue,
                    isTeacher ? 'TEACHER' : 'STUDENT'
                );

                showSuccessOverlay("Đăng nhập thành công (Chế độ Demo)!");
                setTimeout(() => {
                    window.location.href = isTeacher ? 'teacher/index.html' : 'student/profile.html';
                }, 1600);
            }
        });
    }

    // ── 2. REGISTER FORM LOGIC ──
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const regEmailInput = document.getElementById('regEmail');
        const phoneInput = document.getElementById('phone');
        const roleSelect = document.getElementById('role');
        const regPasswordInput = document.getElementById('regPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const termsCheckbox = document.getElementById('terms');

        const firstNameError = document.getElementById('firstNameError');
        const lastNameError = document.getElementById('lastNameError');
        const regEmailError = document.getElementById('regEmailError');
        const phoneError = document.getElementById('phoneError');
        const roleError = document.getElementById('roleError');
        const regPasswordError = document.getElementById('regPasswordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        const termsError = document.getElementById('termsError');

        const togglePasswordBtn = document.getElementById('togglePassword');
        const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

        // Toggle Password Visibility
        if (togglePasswordBtn && regPasswordInput) {
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = regPasswordInput.getAttribute('type') === 'password';
                regPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
                const icon = togglePasswordBtn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
                }
            });
        }

        // Toggle Confirm Password Visibility
        if (toggleConfirmPasswordBtn && confirmPasswordInput) {
            toggleConfirmPasswordBtn.addEventListener('click', () => {
                const isPassword = confirmPasswordInput.getAttribute('type') === 'password';
                confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
                const icon = toggleConfirmPasswordBtn.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'far fa-eye-slash' : 'far fa-eye';
                }
            });
        }

        // Password Strength calculation
        regPasswordInput?.addEventListener('input', () => {
            const val = regPasswordInput.value;
            const strengthContainer = document.getElementById('strengthContainer');
            const strengthFill = document.getElementById('strengthFill');
            const strengthText = document.getElementById('strengthText');
            
            if (val.length === 0) {
                strengthContainer.style.display = 'none';
                return;
            }
            
            strengthContainer.style.display = 'block';
            
            let score = 0;
            if (val.length >= 6) score++;
            if (val.length >= 10) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;
            
            let text = 'Mật khẩu yếu';
            let color = 'var(--error)';
            let width = '33%';
            
            if (score >= 4) {
                text = 'Mật khẩu mạnh';
                color = 'var(--success)';
                width = '100%';
            } else if (score >= 2) {
                text = 'Mật khẩu trung bình';
                color = '#f59e0b';
                width = '66%';
            }
            
            strengthFill.style.width = width;
            strengthFill.style.backgroundColor = color;
            strengthText.innerHTML = `<i class="fas fa-circle-info" style="color:${color}"></i> <span style="color:${color}">${text}</span>`;
        });

        // Realtime Input validation resets
        firstNameInput?.addEventListener('input', () => hideInputError(firstNameInput, firstNameError));
        lastNameInput?.addEventListener('input', () => hideInputError(lastNameInput, lastNameError));
        regEmailInput?.addEventListener('input', () => hideInputError(regEmailInput, regEmailError));
        phoneInput?.addEventListener('input', () => hideInputError(phoneInput, phoneError));
        roleSelect?.addEventListener('change', () => hideInputError(roleSelect, roleError));
        regPasswordInput?.addEventListener('input', () => hideInputError(regPasswordInput, regPasswordError));
        confirmPasswordInput?.addEventListener('input', () => hideInputError(confirmPasswordInput, confirmPasswordError));
        termsCheckbox?.addEventListener('change', () => {
            if (termsCheckbox.checked) {
                termsError.style.display = 'none';
            }
        });

        // Submit Handler
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isValid = true;
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const email = regEmailInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleSelect.value;
            const password = regPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // First Name Validate
            if (!firstName) {
                showInputError(firstNameInput, firstNameError, "Vui lòng nhập họ của bạn.");
                isValid = false;
            }

            // Last Name Validate
            if (!lastName) {
                showInputError(lastNameInput, lastNameError, "Vui lòng nhập tên của bạn.");
                isValid = false;
            }

            // Email Regex check
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) {
                showInputError(regEmailInput, regEmailError, "Vui lòng nhập địa chỉ email.");
                isValid = false;
            } else if (!emailRegex.test(email)) {
                showInputError(regEmailInput, regEmailError, "Định dạng email không hợp lệ.");
                isValid = false;
            }

            // Phone check
            const phoneRegex = /^[0-9]{9,11}$/;
            if (!phone) {
                showInputError(phoneInput, phoneError, "Vui lòng nhập số điện thoại.");
                isValid = false;
            } else if (!phoneRegex.test(phone.replace(/[\s\-\+\(\)]/g, ''))) {
                showInputError(phoneInput, phoneError, "Số điện thoại phải từ 9 đến 11 chữ số.");
                isValid = false;
            }

            // Role check
            if (!role) {
                showInputError(roleSelect, roleError, "Vui lòng chọn vai trò.");
                isValid = false;
            }

            // Password length check
            if (!password) {
                showInputError(regPasswordInput, regPasswordError, "Vui lòng nhập mật khẩu.");
                isValid = false;
            } else if (password.length < 6) {
                showInputError(regPasswordInput, regPasswordError, "Mật khẩu phải chứa ít nhất 6 ký tự.");
                isValid = false;
            }

            // Password match check
            if (!confirmPassword) {
                showInputError(confirmPasswordInput, confirmPasswordError, "Vui lòng xác nhận mật khẩu.");
                isValid = false;
            } else if (password !== confirmPassword) {
                showInputError(confirmPasswordInput, confirmPasswordError, "Mật khẩu xác nhận không khớp.");
                isValid = false;
            }

            // Terms check
            if (!termsCheckbox.checked) {
                termsError.style.display = 'block';
                isValid = false;
            }

            if (!isValid) {
                shakeFormCard();
                return;
            }

            showLoadingOverlay("Đang khởi tạo tài khoản...");

            try {
                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        phone,
                        password,
                        confirmPassword,
                        role
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showSuccessOverlay("Đăng ký tài khoản thành công!");
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    hideLoadingOverlay();
                    let errMsg = "Không thể đăng ký tài khoản.";
                    
                    if (data.result && Array.isArray(data.result)) {
                        errMsg = data.result.join('\n');
                    } else if (data.message) {
                        errMsg = data.message;
                    }
                    
                    if (errMsg.toLowerCase().includes('email')) {
                        showInputError(regEmailInput, regEmailError, errMsg);
                    } else if (errMsg.toLowerCase().includes('phone') || errMsg.toLowerCase().includes('điện thoại')) {
                        showInputError(phoneInput, phoneError, errMsg);
                    } else {
                        alert(errMsg);
                    }
                    shakeFormCard();
                }
            } catch (error) {
                console.warn("Backend server connection failed, falling back to Demo Mock registration.", error);
                await new Promise(resolve => setTimeout(resolve, 1500));

                showSuccessOverlay("Đăng ký tài khoản thành công (Chế độ Demo)!");
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        });
    }
});
