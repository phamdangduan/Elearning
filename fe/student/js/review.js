/* =====================================================
   EduVN - Review Page JavaScript
   Handles course review submission and display
===================================================== */

const API_BASE = 'http://localhost:8080';
const USER_ID = localStorage.getItem('userId') || 'student-001';

// ── State Management ──
const state = {
    courseId: null,
    course: null,
    enrollment: null,
    overallRating: 0,
    criteriaRatings: {
        content: 0,
        instructor: 0,
        video: 0,
        practice: 0,
        value: 0
    },
    selectedTags: new Set(),
    existingReview: null,
    courseReviews: []
};

// ── API Helper ──
async function apiGet(path) {
    try {
        const headers = {};
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}${path}`, {
            headers: headers
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('[API Error]', path, err);
        return null;
    }
}

async function apiPost(path, body) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('[API Error]', path, err);
        return null;
    }
}

// ── Toast Notification ──
function showToast(msg, type = 'info') {
    const toastContainer = document.createElement('div');
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

// ── Get Course ID from URL ──
function getCourseIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('courseId');
}

// ── Load Course Data ──
async function loadCourseData() {
    state.courseId = getCourseIdFromURL();
    
    if (!state.courseId) {
        showToast('Không tìm thấy ID khóa học', 'error');
        setTimeout(() => window.location.href = 'my-courses.html', 2000);
        return;
    }

    console.log('Loading course:', state.courseId);

    // Load course details
    const courseData = await apiGet(`/course/${state.courseId}`);
    if (!courseData?.result) {
        showToast('Không tìm thấy khóa học', 'error');
        return;
    }

    state.course = courseData.result;
    console.log('Course loaded:', state.course);

    // Check if user has enrolled
    const enrollmentData = await apiGet(`/enrollment/my-enrollment?userId=${USER_ID}&page=0&size=100`);
    if (enrollmentData?.result?.content) {
        state.enrollment = enrollmentData.result.content.find(e => 
            (e.courseId || e.course?.id) === state.courseId
        );
        
        if (!state.enrollment) {
            showToast('Bạn chưa đăng ký khóa học này', 'warning');
            setTimeout(() => window.location.href = `../course-detail.html?id=${state.courseId}`, 2000);
            return;
        }
    }

    // Check if user already reviewed
    const reviewedData = await apiGet(`/review/check-reviewed?userId=${USER_ID}&courseId=${state.courseId}`);
    if (reviewedData?.result === true) {
        // Load existing review
        const myReviewData = await apiGet(`/review/my-review?userId=${USER_ID}&courseId=${state.courseId}`);
        if (myReviewData?.result) {
            state.existingReview = myReviewData.result;
            showToast('Bạn đã đánh giá khóa học này rồi', 'info');
            populateExistingReview();
        }
    }

    // Load course reviews for sidebar
    await loadCourseReviews();

    // Render course info
    renderCourseInfo();
}

// ── Populate Existing Review ──
function populateExistingReview() {
    const review = state.existingReview;
    
    // Set overall rating
    state.overallRating = review.rating || 0;
    updateOverallStars();
    
    // Set comment
    if (review.comment) {
        document.getElementById('reviewContent').value = review.comment;
        updateCharCount();
    }
    
    // Disable all form elements
    disableFormForViewing();
}

// ── Disable Form for Viewing ──
function disableFormForViewing() {
    // Hide rating prompt text
    const ratingPrompt = document.querySelector('.rating-prompt');
    if (ratingPrompt) {
        ratingPrompt.style.display = 'none';
    }
    
    const ratingLabelText = document.getElementById('ratingLabelText');
    if (ratingLabelText) {
        ratingLabelText.style.display = 'none';
    }
    
    // Disable overall stars
    document.querySelectorAll('#overallStars .star-btn').forEach(btn => {
        btn.style.cursor = 'default';
        btn.style.pointerEvents = 'none';
    });
    
    // Disable criteria stars
    document.querySelectorAll('.mini-star').forEach(star => {
        star.style.cursor = 'default';
        star.style.pointerEvents = 'none';
    });
    
    // Disable all inputs and textareas
    document.querySelectorAll('input, textarea').forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = '#f8fafc';
        input.style.cursor = 'not-allowed';
    });
    
    // Disable tags
    document.querySelectorAll('.highlight-tag').forEach(tag => {
        tag.style.cursor = 'not-allowed';
        tag.style.pointerEvents = 'none';
        tag.style.opacity = '0.6';
    });
    
    // Disable toggles
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.disabled = true;
    });
    
    // Hide submit button and change cancel button
    const submitBtn = document.getElementById('submitReviewBtn');
    submitBtn.style.display = 'none';
    
    const cancelBtn = document.getElementById('cancelBtn');
    cancelBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Quay lại khóa học';
    cancelBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--accent))';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    
    // Add info message at top
    const firstSection = document.querySelector('.section-block');
    const infoBox = document.createElement('div');
    infoBox.style.cssText = `
        background: linear-gradient(135deg, #dbeafe, #e0f2fe);
        border: 1px solid #93c5fd;
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    infoBox.innerHTML = `
        <i class="fas fa-info-circle" style="color:#2563eb;font-size:20px"></i>
        <div>
            <div style="font-weight:600;color:#1e40af;margin-bottom:4px">Bạn đã đánh giá khóa học này</div>
            <div style="font-size:13px;color:#475569">Đánh giá của bạn đã được ghi nhận. Hiện tại bạn đang xem lại nội dung đánh giá.</div>
        </div>
    `;
    firstSection.parentNode.insertBefore(infoBox, firstSection);
    
    // Update page title
    document.querySelector('.page-title').innerHTML = 'Xem Lại <span>Đánh Giá</span>';
    document.querySelector('.page-desc').textContent = 'Bạn đã đánh giá khóa học này. Dưới đây là nội dung đánh giá của bạn.';
    document.querySelector('.page-label').innerHTML = '<i class="fas fa-eye"></i> Xem đánh giá đã gửi';
}

// ── Load Course Reviews ──
async function loadCourseReviews() {
    const reviewsData = await apiGet(`/review/get-reviewsForCourse?courseId=${state.courseId}&page=0&size=1000`);
    
    if (reviewsData?.result?.content) {
        const allReviews = reviewsData.result.content;
        state.courseReviews = allReviews.slice(0, 3);
        renderCommunityReviews();
        
        // Update rating summary and distribution dynamically
        renderRatingDistribution(allReviews);
    }
}

// ── Render Course Info in Hero ──
function renderCourseInfo() {
    const course = state.course;
    const enrollment = state.enrollment;
    
    // Update page title
    document.title = `Đánh giá: ${course.title} - EduVN`;
    
    // Update hero course card
    const thumb = course.thumbnailUrl 
        ? `<img src="${course.thumbnailUrl}" alt="${course.title}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`
        : '🚀';
    
    document.querySelector('.hcc-thumb').innerHTML = thumb;
    document.querySelector('.hcc-title').textContent = course.title;
    
    // Instructor
    const instrName = course.instructorName || 'Giảng viên';
    const instrInitial = instrName[0]?.toUpperCase() || 'G';
    document.querySelector('.hcc-instructor-avatar').textContent = instrInitial;
    document.querySelector('.hcc-instructor span').textContent = `${instrName} • Giảng viên chính`;
    
    // Progress
    const progress = enrollment ? parseFloat(enrollment.progress) || 0 : 0;
    document.querySelector('.hcc-progress-bar-fill').style.width = `${progress}%`;
    document.querySelector('.hcc-progress-label strong').textContent = `${Math.round(progress)}%`;
    
    // Update breadcrumb and links
    const breadcrumbCourse = document.getElementById('breadcrumbCourseLink');
    if (breadcrumbCourse) {
        breadcrumbCourse.href = `../course-detail.html?id=${state.courseId}`;
    }
    const seeAllReviewsLink = document.getElementById('seeAllReviewsLink');
    if (seeAllReviewsLink) {
        seeAllReviewsLink.href = `../course-detail.html?id=${state.courseId}#reviews`;
    }
}

// ── Render Rating Distribution ──
function renderRatingDistribution(allReviews) {
    const total = allReviews.length;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    allReviews.forEach(r => {
        const rating = Math.round(r.rating || 0);
        if (counts[rating] !== undefined) {
            counts[rating]++;
        }
    });

    const container = document.querySelector('.rating-dist');
    if (container) {
        let html = '';
        for (let stars = 5; stars >= 1; stars--) {
            const count = counts[stars];
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            html += `
                <div class="dist-row">
                    <div class="dist-star"><i class="fas fa-star"></i>${stars}</div>
                    <div class="dist-bar-bg">
                        <div class="dist-bar-fill" style="width:${percent}%"></div>
                    </div>
                    <div class="dist-pct">${percent}%</div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    // Calculate dynamic average
    let sum = 0;
    allReviews.forEach(r => sum += (r.rating || 0));
    const computedAvg = total > 0 ? (sum / total) : 0;

    // Update big score card
    const bigScoreNum = document.querySelector('.big-score-number');
    if (bigScoreNum) {
        bigScoreNum.textContent = computedAvg > 0 ? computedAvg.toFixed(1) : '0.0';
    }
    const bigScoreLabel = document.querySelector('.big-score-label');
    if (bigScoreLabel) {
        bigScoreLabel.textContent = `Dựa trên ${total.toLocaleString()} đánh giá`;
    }
    const bigScoreStars = document.querySelector('.big-score-stars');
    if (bigScoreStars) {
        bigScoreStars.innerHTML = renderStars(computedAvg);
    }
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalf) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// ── Render Community Reviews ──
function renderCommunityReviews() {
    const reviewList = document.querySelector('.review-list');
    
    if (state.courseReviews.length === 0) {
        reviewList.innerHTML = `
            <div style="padding:20px;text-align:center;color:#94a3b8">
                <i class="fas fa-inbox" style="font-size:32px;margin-bottom:8px;display:block"></i>
                <p style="font-size:13px">Chưa có đánh giá nào</p>
            </div>`;
        return;
    }
    
    const avatarColors = ['blue', 'green', 'purple'];
    
    reviewList.innerHTML = state.courseReviews.map((review, idx) => {
        const userName = review.userName || 'Học viên';
        const initial = userName[0]?.toUpperCase() || 'H';
        const rating = review.rating || 0;
        const comment = review.comment || '';
        const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '';
        
        return `
            <div class="review-item">
                <div class="reviewer-row">
                    <div class="reviewer-avatar ${avatarColors[idx % 3]}">${initial}</div>
                    <div class="reviewer-info">
                        <div class="reviewer-name">${userName}</div>
                        <div class="reviewer-date">${date}</div>
                    </div>
                    <div class="review-stars">
                        ${Array(5).fill(0).map((_, i) => 
                            `<i class="fas fa-star" style="color:${i < rating ? '#f59e0b' : '#e2e8f0'}"></i>`
                        ).join('')}
                    </div>
                </div>
                <p class="review-text">${comment}</p>
            </div>
        `;
    }).join('');
}

// ── Overall Star Rating ──
function setupOverallStars() {
    const starBtns = document.querySelectorAll('#overallStars .star-btn');
    const labelText = document.getElementById('ratingLabelText');
    
    const labels = {
        1: 'Rất tệ',
        2: 'Tệ',
        3: 'Trung bình',
        4: 'Tốt',
        5: 'Xuất sắc'
    };
    
    starBtns.forEach((btn, index) => {
        // Hover effect
        btn.addEventListener('mouseenter', () => {
            starBtns.forEach((b, i) => {
                if (i <= index) {
                    b.classList.add('hovered');
                } else {
                    b.classList.remove('hovered');
                }
            });
            labelText.textContent = labels[index + 1];
        });
        
        // Click to select
        btn.addEventListener('click', () => {
            state.overallRating = index + 1;
            updateOverallStars();
            labelText.textContent = labels[state.overallRating];
        });
    });
    
    // Reset hover on mouse leave
    document.getElementById('overallStars').addEventListener('mouseleave', () => {
        starBtns.forEach(b => b.classList.remove('hovered'));
        if (state.overallRating > 0) {
            labelText.textContent = labels[state.overallRating];
        } else {
            labelText.textContent = 'Chọn số sao để đánh giá';
        }
    });
}

function updateOverallStars() {
    const starBtns = document.querySelectorAll('#overallStars .star-btn');
    starBtns.forEach((btn, index) => {
        if (index < state.overallRating) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// ── Criteria Rating ──
function setupCriteriaRating() {
    const criteriaGroups = document.querySelectorAll('.mini-stars');
    
    criteriaGroups.forEach(group => {
        const criteriaName = group.dataset.criteria;
        const stars = group.querySelectorAll('.mini-star');
        const scoreEl = document.getElementById(`score${criteriaName.charAt(0).toUpperCase() + criteriaName.slice(1)}`);
        
        stars.forEach((star, index) => {
            // Hover
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('hovered');
                    } else {
                        s.classList.remove('hovered');
                    }
                });
            });
            
            // Click
            star.addEventListener('click', () => {
                state.criteriaRatings[criteriaName] = index + 1;
                updateCriteriaStars(criteriaName);
                scoreEl.textContent = index + 1;
                scoreEl.classList.remove('empty');
            });
        });
        
        // Reset hover
        group.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hovered'));
        });
    });
}

function updateCriteriaStars(criteriaName) {
    const group = document.querySelector(`.mini-stars[data-criteria="${criteriaName}"]`);
    const stars = group.querySelectorAll('.mini-star');
    const rating = state.criteriaRatings[criteriaName];
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

// ── Highlight Tags ──
function setupHighlightTags() {
    const tags = document.querySelectorAll('.highlight-tag');
    
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            const tagId = tag.id;
            
            if (state.selectedTags.has(tagId)) {
                state.selectedTags.delete(tagId);
                tag.classList.remove('selected');
            } else {
                state.selectedTags.add(tagId);
                tag.classList.add('selected');
            }
        });
    });
}

// ── Character Counter ──
function setupCharCounter() {
    const textarea = document.getElementById('reviewContent');
    const charCount = document.getElementById('charCount');
    
    textarea.addEventListener('input', updateCharCount);
}

function updateCharCount() {
    const textarea = document.getElementById('reviewContent');
    const charCount = document.getElementById('charCount');
    charCount.textContent = textarea.value.length;
}

// ── Submit Review ──
async function submitReview() {
    // Validation
    if (state.overallRating === 0) {
        showToast('Vui lòng chọn số sao đánh giá', 'warning');
        document.getElementById('overallStars').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    const reviewContent = document.getElementById('reviewContent').value.trim();
    if (reviewContent.length < 50) {
        showToast('Nội dung đánh giá phải có ít nhất 50 ký tự', 'warning');
        document.getElementById('reviewContent').focus();
        return;
    }
    
    // Prepare request
    const requestData = {
        courseId: state.courseId,
        rating: state.overallRating,
        comment: reviewContent
    };
    
    console.log('Submitting review:', requestData);
    
    // Show loading
    const submitBtn = document.getElementById('submitReviewBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    
    try {
        const result = await apiPost(`/review/create?userId=${USER_ID}`, requestData);
        
        if (result?.status === 200 || result?.code === 200) {
            showToast('Đánh giá của bạn đã được gửi thành công!', 'success');
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = `../course-detail.html?id=${state.courseId}#reviews`;
            }, 2000);
        } else {
            const errorMsg = result?.message || 'Không thể gửi đánh giá';
            showToast(errorMsg, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Lỗi kết nối server', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ── Cancel Button ──
function setupCancelButton() {
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.href = `../course-detail.html?id=${state.courseId}`;
    }
}

// ── Scroll to Top ──
function setupScrollToTop() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── Navbar Scroll Effect ──
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ── Initialize ──
async function init() {
    console.log('Initializing review page...');
    
    // Load data
    await loadCourseData();
    
    // Setup interactions
    setupOverallStars();
    setupCriteriaRating();
    setupHighlightTags();
    setupCharCounter();
    setupCancelButton();
    setupScrollToTop();
    setupNavbar();
    
    // Submit button
    document.getElementById('submitReviewBtn').addEventListener('click', submitReview);
    
    console.log('Review page initialized');
}

// ── Start on DOM Ready ──
document.addEventListener('DOMContentLoaded', init);
