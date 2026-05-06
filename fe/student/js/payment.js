/* =====================================================
   PAYMENT.JS - Xử lý thanh toán khóa học
   ===================================================== */

/* ── Configuration ── */
const API_BASE = 'http://localhost:8080';

/* ── State Management ── */
const paymentState = {
    userId: null,
    courseId: null,
    course: null,
    currentStep: 1,
    uploadedFile: null,
    profile: null,
    paymentRequestId: null,
    bankInfo: {
        bankName: 'MB Bank',
        accountNumber: '0987654321',
        accountName: 'NGUYEN VAN A'
    }
};

/* ── Utility Functions ── */
function showToast(message, type = 'info') {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <p>${message}</p>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function formatPrice(price) {
    if (!price || price === 0) return 'Miễn phí';
    return Number(price).toLocaleString('vi-VN') + 'đ';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ── API Helper ── */
async function apiGet(path) {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${API_BASE}${path}`, { headers });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        
        return await res.json();
    } catch (err) {
        console.error('[API Error]', path, err);
        return null;
    }
}

async function apiPost(path, data, isFormData = false) {
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers,
            body: isFormData ? data : JSON.stringify(data)
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${res.status}`);
        }
        
        return await res.json();
    } catch (err) {
        console.error('[API Error]', path, err);
        throw err;
    }
}

/* ── Step Navigation ── */
function goToStep(step) {
    // Validate before advancing
    if (step === 4 && !validateStep3()) {
        return;
    }
    
    paymentState.currentStep = step;
    
    // Update panels
    document.querySelectorAll('.step-panel').forEach((panel, index) => {
        panel.classList.toggle('active', index + 1 === step);
    });
    
    // Update step indicators
    updateStepIndicators(step);
    
    // Update timeline dots
    updateTimelineDots(step);
    
    // Scroll to top
    document.querySelector('.payment-hero').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function updateStepIndicators(currentStep) {
    [1, 2, 3, 4].forEach(stepNum => {
        const item = document.getElementById(`stepItem${stepNum}`);
        const circle = item.querySelector('.step-circle');
        
        if (stepNum < currentStep) {
            item.classList.add('done');
            item.classList.remove('active');
            circle.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNum === currentStep) {
            item.classList.add('active');
            item.classList.remove('done');
            circle.innerHTML = stepNum;
        } else {
            item.classList.remove('active', 'done');
            circle.innerHTML = stepNum;
        }
        
        // Update connectors
        if (stepNum < 4) {
            const connector = document.getElementById(`conn${stepNum}`);
            connector.classList.toggle('done', stepNum < currentStep);
        }
    });
}

function updateTimelineDots(currentStep) {
    [1, 2, 3, 4].forEach(stepNum => {
        const dot = document.getElementById(`tl${stepNum}`);
        
        if (stepNum < currentStep) {
            dot.classList.add('done');
            dot.classList.remove('active');
            dot.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNum === currentStep) {
            dot.classList.add('active');
            dot.classList.remove('done');
            dot.innerHTML = stepNum;
        } else {
            dot.classList.remove('active', 'done');
            dot.innerHTML = stepNum;
        }
    });
}

/* ── Load Course Information ── */
async function loadCourseInfo() {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');
    
    if (!courseId) {
        showDemoCourse();
        return;
    }
    
    paymentState.courseId = courseId;
    
    try {
        const data = await apiGet(`/course/${courseId}`);
        
        if (!data?.result) {
            throw new Error('No course data');
        }
        
        const course = data.result;
        paymentState.course = course;
        renderCourseInfo(course);
        
        // Load payment info (bank account & QR code)
        await loadPaymentInfo(courseId);
    } catch (err) {
        console.error('Load course error:', err);
        showDemoCourse();
    }
}

/* ── Load Payment Info (Bank & QR) ── */
async function loadPaymentInfo(courseId) {
    try {
        const data = await apiGet(`/payment-requests/courses/${courseId}/payment-info`);
        
        if (!data?.result) {
            console.warn('No payment info available');
            return;
        }
        
        const paymentInfo = data.result;
        console.log('Payment info loaded:', paymentInfo);
        
        // Update bank info
        if (paymentInfo.bankName) {
            document.getElementById('bankName').textContent = paymentInfo.bankName;
            paymentState.bankInfo.bankName = paymentInfo.bankName;
        }
        
        if (paymentInfo.accountNumber) {
            document.getElementById('bankAccountNumber').textContent = paymentInfo.accountNumber;
            paymentState.bankInfo.accountNumber = paymentInfo.accountNumber;
        }
        
        if (paymentInfo.accountName) {
            document.getElementById('bankAccountName').textContent = paymentInfo.accountName;
            paymentState.bankInfo.accountName = paymentInfo.accountName;
        }
        
        // Update QR code
        if (paymentInfo.qrCodeUrl) {
            const qrPlaceholder = document.querySelector('.qr-placeholder');
            if (qrPlaceholder) {
                qrPlaceholder.innerHTML = `<img src="${paymentInfo.qrCodeUrl}" alt="QR Code" style="width:100%;height:100%;object-fit:contain;">`;
            }
        }
        
        // Update reference code if provided
        if (paymentInfo.referenceCode) {
            document.getElementById('bankContent').textContent = paymentInfo.referenceCode;
        }
        
    } catch (err) {
        console.error('Load payment info error:', err);
        // Keep using default/demo bank info
    }
}

function showDemoCourse() {
    const demoCourse = {
        id: 'demo-course',
        title: 'JavaScript Nâng Cao - Từ Zero Đến Hero',
        instructorName: 'Nguyễn Văn A',
        price: 599000,
        level: 'Trung cấp',
        totalLessons: 48,
        totalEnrollments: 1240,
        averageRating: 4.8,
        categories: [{ name: 'Lập trình' }]
    };
    
    paymentState.course = demoCourse;
    paymentState.courseId = demoCourse.id;
    renderCourseInfo(demoCourse);
}

function renderCourseInfo(course) {
    const price = course.price || 0;
    const priceStr = formatPrice(price);
    const instructor = course.instructorName || course.user?.userName || 'Giáo viên';
    const lessons = course.totalLessons || 0;
    const level = course.level || 'Tất cả cấp độ';
    
    // Step 1 - Course info box
    document.getElementById('courseTitle').textContent = course.title || 'Khóa học';
    document.getElementById('courseInstructor').textContent = instructor;
    document.getElementById('courseLevel').textContent = level;
    document.getElementById('courseLessons').textContent = `${lessons} bài học`;
    document.getElementById('coursePriceMain').textContent = priceStr;
    
    // Update thumbnails
    if (course.thumbnailUrl) {
        const thumbnailHtml = `<img src="${course.thumbnailUrl}" alt="${course.title}">`;
        document.getElementById('courseThumbnail').innerHTML = thumbnailHtml;
        document.getElementById('summaryCourseThumb').innerHTML = thumbnailHtml;
    }
    
    // Summary sidebar
    document.getElementById('summaryCourseTitle').textContent = course.title || 'Khóa học';
    document.getElementById('summaryCourseInstructor').textContent = instructor;
    document.getElementById('summaryLevel').textContent = level;
    document.getElementById('summaryOriginalPrice').textContent = priceStr;
    document.getElementById('summaryTotal').textContent = priceStr;
    
    // Bank transfer amount
    document.getElementById('bankAmount').textContent = priceStr;
    
    // Generate transfer content
    const contentCode = generateTransferContent(course.id);
    document.getElementById('bankContent').textContent = contentCode;
    
    // Success page
    document.getElementById('successCourseTitle').textContent = course.title || 'Khóa học';
    document.getElementById('successAmount').textContent = priceStr;
}

function generateTransferContent(courseId) {
    const userId = paymentState.userId || 'USER';
    const courseCode = (courseId || 'COURSE').toString().toUpperCase().replace(/-/g, '').slice(0, 8);
    const userCode = userId.toString().toUpperCase().replace(/-/g, '').slice(0, 8);
    return `EDUVN ${courseCode} ${userCode}`;
}

/* ── Load User Profile ── */
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        // Use demo mode if not logged in
        paymentState.userId = 'demo-user-001';
        const demoName = 'Học viên Demo';
        
        document.getElementById('userNameNav').textContent = demoName;
        document.getElementById('dropdownName').textContent = demoName;
        document.getElementById('dropdownEmail').textContent = 'demo@eduvn.vn';
        document.getElementById('senderName').value = demoName;
        
        console.log('Using demo mode - no token found');
        return;
    }
    
    try {
        // API requires userId as query parameter
        const data = await apiGet(`/profile/me?userId=${userId}`);
        
        if (!data?.result) {
            throw new Error('No profile data');
        }
        
        const profile = data.result;
        paymentState.profile = profile;
        paymentState.userId = profile.id || userId;
        
        const fullName = profile.fullName || profile.firstName || 'Học viên';
        
        // Update navbar
        document.getElementById('userNameNav').textContent = fullName;
        document.getElementById('dropdownName').textContent = fullName;
        document.getElementById('dropdownEmail').textContent = profile.email || '';
        
        if (profile.avatar) {
            const avatarHtml = `<img src="${profile.avatar}" alt="${fullName}">`;
            document.getElementById('userAvatarNav').innerHTML = avatarHtml;
            document.getElementById('dropdownAvatar').innerHTML = avatarHtml;
        }
        
        // Pre-fill sender name
        if (!document.getElementById('senderName').value) {
            document.getElementById('senderName').value = fullName;
        }
        
        // Update transfer content with real user ID
        if (paymentState.course) {
            const contentCode = generateTransferContent(paymentState.course.id);
            document.getElementById('bankContent').textContent = contentCode;
        }
    } catch (err) {
        console.error('Load profile error:', err);
        
        // Fallback to demo mode
        paymentState.userId = userId || 'demo-user-001';
        const demoName = 'Học viên';
        
        document.getElementById('userNameNav').textContent = demoName;
        document.getElementById('dropdownName').textContent = demoName;
        document.getElementById('senderName').value = demoName;
    }
}

/* ── Copy to Clipboard ── */
async function copyToClipboard(text, btn) {
    try {
        await navigator.clipboard.writeText(text);
        
        const icon = btn.querySelector('i');
        const originalClass = icon.className;
        
        icon.className = 'fas fa-check';
        btn.classList.add('copied');
        
        showToast('Đã sao chép!', 'success');
        
        setTimeout(() => {
            icon.className = originalClass;
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        showToast('Không thể sao chép, vui lòng copy thủ công', 'warning');
    }
}

function copyAmountToClipboard(btn) {
    const course = paymentState.course;
    if (!course) return;
    
    const amount = (course.price || 0).toString();
    copyToClipboard(amount, btn);
}

function copyContentToClipboard(btn) {
    const content = document.getElementById('bankContent').textContent;
    copyToClipboard(content, btn);
}

/* ── File Upload Handling ── */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('File quá lớn! Tối đa 10MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showToast('Định dạng file không hợp lệ! Chỉ chấp nhận JPG, PNG, WEBP, GIF, PDF', 'error');
        event.target.value = '';
        return;
    }
    
    paymentState.uploadedFile = file;
    
    // Show preview
    const preview = document.getElementById('uploadPreview');
    preview.classList.add('show');
    document.getElementById('uploadArea').style.display = 'none';
    
    document.getElementById('previewFileName').textContent = file.name;
    document.getElementById('previewFileSize').textContent = formatFileSize(file.size);
    
    // Show thumbnail for images
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewThumb').innerHTML = 
                `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        document.getElementById('previewThumb').innerHTML = 
            '<i class="fas fa-file-pdf" style="font-size:28px;color:var(--danger);"></i>';
    }
    
    showToast('Đã chọn file thành công!', 'success');
}

function removeFile() {
    paymentState.uploadedFile = null;
    document.getElementById('billFileInput').value = '';
    document.getElementById('uploadPreview').classList.remove('show');
    document.getElementById('uploadArea').style.display = '';
    
    // Reset thumbnail
    document.getElementById('previewThumb').innerHTML = 
        '<i class="fas fa-file-image" style="font-size:28px;color:var(--primary);"></i>';
}

/* ── Drag & Drop Setup ── */
function setupDragDrop() {
    const area = document.getElementById('uploadArea');
    
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });
    
    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            const input = document.getElementById('billFileInput');
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            handleFileSelect({ target: input });
        }
    });
}

/* ── Form Validation ── */
function validateStep3() {
    let isValid = true;
    
    // Check file upload
    if (!paymentState.uploadedFile) {
        showToast('Vui lòng upload ảnh bill thanh toán', 'warning');
        isValid = false;
    }
    
    // Check sender name
    const senderName = document.getElementById('senderName').value.trim();
    const senderError = document.getElementById('senderNameError');
    
    if (!senderName) {
        document.getElementById('senderName').classList.add('error');
        senderError.classList.add('show');
        isValid = false;
    } else {
        document.getElementById('senderName').classList.remove('error');
        senderError.classList.remove('show');
    }
    
    // Check transfer time
    const transferTime = document.getElementById('transferTime').value;
    const timeError = document.getElementById('transferTimeError');
    
    if (!transferTime) {
        document.getElementById('transferTime').classList.add('error');
        timeError.classList.add('show');
        isValid = false;
    } else {
        document.getElementById('transferTime').classList.remove('error');
        timeError.classList.remove('show');
    }
    
    return isValid;
}

/* ── Submit Payment ── */
async function submitPayment() {
    if (!validateStep3()) return;
    
    const btn = document.getElementById('submitPaymentBtn');
    const actions = document.getElementById('step3Actions');
    const loading = document.getElementById('uploadLoading');
    
    // Show loading state
    btn.disabled = true;
    actions.style.display = 'none';
    loading.classList.add('show');
    
    try {
        const userId = paymentState.userId || localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
            throw new Error('Vui lòng đăng nhập để tiếp tục');
        }
        
        // Step 1: Upload image to get URL
        let paymentProofUrl = '';
        
        if (paymentState.uploadedFile) {
            console.log('Uploading image...', paymentState.uploadedFile.name);
            
            const imageFormData = new FormData();
            imageFormData.append('image', paymentState.uploadedFile);
            
            const uploadRes = await fetch(`${API_BASE}/payment-requests/upload-proof-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: imageFormData
            });
            
            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error('Upload image failed:', uploadRes.status, errorText);
                throw new Error(`Không thể upload ảnh (${uploadRes.status})`);
            }
            
            const uploadData = await uploadRes.json();
            console.log('Upload response:', uploadData);
            
            if (!uploadData?.result?.url) {
                throw new Error('Không nhận được URL ảnh từ server');
            }
            
            paymentProofUrl = uploadData.result.url;
            console.log('Image uploaded successfully:', paymentProofUrl);
        }
        
        // Step 2: Check if payment request exists, if not create one
        let paymentRequestId = paymentState.paymentRequestId;
        
        if (!paymentRequestId) {
            console.log('Creating payment request...');
            
            const createPaymentData = {
                courseId: paymentState.courseId || 'demo-course'
            };
            
            const createRes = await fetch(`${API_BASE}/payment-requests/create?userId=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(createPaymentData)
            });
            
            if (!createRes.ok) {
                const errorText = await createRes.text();
                console.error('Create payment failed:', createRes.status, errorText);
                throw new Error(`Không thể tạo yêu cầu thanh toán (${createRes.status})`);
            }
            
            const createData = await createRes.json();
            console.log('Create payment response:', createData);
            
            if (!createData?.result?.id) {
                throw new Error('Không nhận được payment request ID');
            }
            
            paymentRequestId = createData.result.id;
            paymentState.paymentRequestId = paymentRequestId;
            console.log('Payment request created:', paymentRequestId);
        }
        
        // Step 3: Upload payment proof with URL
        console.log('Uploading payment proof...');
        
        const proofData = {
            paymentProofUrl: paymentProofUrl,
            studentNote: document.getElementById('transferNote').value.trim(),
            transferNote: `${document.getElementById('senderName').value.trim()} - ${document.getElementById('transferTime').value}`
        };
        
        console.log('Proof data:', proofData);
        
        const proofRes = await fetch(`${API_BASE}/payment-requests/${paymentRequestId}/upload-proof?userId=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(proofData)
        });
        
        if (!proofRes.ok) {
            const errorText = await proofRes.text();
            console.error('Upload proof failed:', proofRes.status, errorText);
            throw new Error(`Không thể gửi bill (${proofRes.status})`);
        }
        
        const proofResult = await proofRes.json();
        console.log('Upload proof response:', proofResult);
        
        if (proofResult?.result) {
            // Update success page
            updateSuccessPage();
            
            showToast('Gửi bill thành công! Chờ giáo viên xác nhận.', 'success');
            setTimeout(() => goToStep(4), 500);
        } else {
            throw new Error('Không nhận được phản hồi từ server');
        }
        
    } catch (err) {
        console.error('Submit payment error:', err);
        showToast(err.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
        
        // Reset UI
        actions.style.display = 'flex';
        loading.classList.remove('show');
        btn.disabled = false;
    }
}

function updateSuccessPage() {
    const senderName = document.getElementById('senderName').value.trim();
    const now = new Date();
    
    document.getElementById('successSender').textContent = senderName;
    document.getElementById('successDate').textContent = now.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/* ── Set Default Transfer Time ── */
function setDefaultTransferTime() {
    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    
    document.getElementById('transferTime').value = localTime;
}

/* ── Navbar Setup ── */
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
        document.getElementById('scrollTopBtn').classList.toggle('show', window.scrollY > 300);
    }, { passive: true });
    
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('mobile-open');
        });
    }
    
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function setupUserMenu() {
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    if (userAvatarBtn) {
        userAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('userDropdown').classList.toggle('show');
            const notiDropdown = document.getElementById('notiDropdown');
            if (notiDropdown) notiDropdown.classList.remove('show');
        });
    }
    
    const notiBell = document.getElementById('notiBell');
    if (notiBell) {
        notiBell.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('notiDropdown').classList.toggle('show');
            const userDropdown = document.getElementById('userDropdown');
            if (userDropdown) userDropdown.classList.remove('show');
        });
    }
    
    document.addEventListener('click', () => {
        const userDropdown = document.getElementById('userDropdown');
        const notiDropdown = document.getElementById('notiDropdown');
        if (userDropdown) userDropdown.classList.remove('show');
        if (notiDropdown) notiDropdown.classList.remove('show');
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = 'login.html';
        });
    }
}

/* ── Initialization ── */
async function init() {
    setupNavbar();
    setupUserMenu();
    setupDragDrop();
    setDefaultTransferTime();
    
    // Load data in sequence
    try {
        await loadUserProfile();
        await loadCourseInfo();
    } catch (err) {
        console.error('Initialization error:', err);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);

// Export functions for inline onclick handlers
window.goToStep = goToStep;
window.copyToClipboard = copyToClipboard;
window.copyAmountToClipboard = copyAmountToClipboard;
window.copyContentToClipboard = copyContentToClipboard;
window.handleFileSelect = handleFileSelect;
window.removeFile = removeFile;
window.submitPayment = submitPayment;
