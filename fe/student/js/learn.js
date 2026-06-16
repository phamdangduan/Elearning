/* =====================================================
   EduVN - Learn Page JavaScript
   Handles video player, curriculum, notes, Q&A
===================================================== */

const API_BASE = 'http://localhost:8080';
const USER_ID = 'student-001'; // Hardcoded for testing

// ── State Management ──
const state = {
    courseId: null,
    enrollmentId: null,
    course: null,
    chapters: [],
    allLessons: [],
    currentLessonIndex: 0,
    currentLesson: null,
    completedLessons: new Set(),
    notes: [],
    totalLessons: 0,
    progress: 0
};

// ── API Helper ──
async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('[API Error]', path, err);
        return null;
    }
}

async function apiPost(path, body) {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><p>${msg}</p>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Utility Functions ──
function formatSeconds(sec) {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function getCourseIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('courseId');
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star" style="color:#f59e0b"></i>';
        } else if (i === fullStars && hasHalf) {
            html += '<i class="fas fa-star-half-alt" style="color:#f59e0b"></i>';
        } else {
            html += '<i class="far fa-star" style="color:#d1d5db"></i>';
        }
    }
    return html;
}

// ── Load User Profile ──
async function loadUserProfile() {
    const data = await apiGet(`/profile/me?userId=${USER_ID}`);
    if (!data?.result) return;
    
    const profile = data.result;
    const fullName = profile.fullName || profile.firstName || 'Học viên';
    const avatarEl = document.getElementById('topbarUserAvatar');
    
    if (profile.avatar) {
        avatarEl.innerHTML = `<img src="${profile.avatar}" alt="${fullName}">`;
    } else {
        const initial = fullName[0]?.toUpperCase() || 'H';
        avatarEl.innerHTML = initial;
    }
}

// ── Load Course Data ──
async function loadCourse() {
    console.log('Loading course:', state.courseId);
    
    // Load course info
    const courseData = await apiGet(`/course/${state.courseId}`);

    if (!courseData?.result) {
        showToast('Không tìm thấy khóa học', 'error');
        document.getElementById('overviewContent').innerHTML = `
            <div style="text-align:center;padding:60px;color:var(--text-muted)">
                <i class="fas fa-exclamation-circle" style="font-size:48px;margin-bottom:16px;color:#fecaca"></i>
                <p>Không thể tải thông tin khóa học.</p>
            </div>`;
        return;
    }

    state.course = courseData.result;
    document.title = `${state.course.title} - EduVN`;
    document.getElementById('topbarCourseTitle').textContent = state.course.title;

    console.log('Course loaded:', state.course);

    // Render overview (async)
    await renderOverview();

    // Try to load sections first
    const sectionsData = await apiGet(`/section/course/${state.courseId}`);
    
    console.log('Sections API response:', sectionsData);
    
    if (sectionsData?.result && sectionsData.result.length > 0) {
        // Has sections
        state.chapters = sectionsData.result;
        
        console.log('Sections data:', state.chapters);
        
        // Flatten all lessons
        state.allLessons = [];
        state.chapters.forEach(section => {
            console.log(`Section "${section.title}" has ${section.lessons?.length || 0} lessons`);
            
            if (section.lessons && section.lessons.length > 0) {
                section.lessons.forEach(lesson => {
                    state.allLessons.push({
                        ...lesson,
                        sectionTitle: section.title,
                        sectionId: section.id
                    });
                });
            }
        });
        state.totalLessons = state.allLessons.length;
        
        console.log('Sections loaded:', state.chapters.length);
        console.log('Total lessons:', state.totalLessons);
    } else {
        // No sections, try loading lessons directly
        console.log('No sections found, loading lessons directly');
        const lessonsData = await apiGet(`/lesson/course/${state.courseId}`);
        
        if (lessonsData?.result && lessonsData.result.length > 0) {
            const lessons = lessonsData.result;
            
            // Create a default section
            state.chapters = [{
                id: 'default-section',
                title: 'Nội dung khóa học',
                lessons: lessons
            }];
            
            state.allLessons = lessons.map(l => ({
                ...l,
                sectionTitle: 'Nội dung khóa học',
                sectionId: 'default-section'
            }));
            
            state.totalLessons = lessons.length;
            
            console.log('Lessons loaded directly:', state.totalLessons);
        } else {
            console.warn('No lessons found for this course');
            showToast('Khóa học chưa có nội dung', 'warning');
        }
    }

    // Load enrollment progress
    await loadEnrollmentProgress();

    // Render curriculum
    renderCurriculum();

    // Auto-select first lesson or last in-progress
    if (state.allLessons.length > 0) {
        const lastIndex = findLastInProgressLesson();
        selectLesson(lastIndex);
    } else {
        // No lessons available
        document.getElementById('videoPlaceholder').style.display = 'flex';
        document.getElementById('phLessonTitle').textContent = 'Khóa học chưa có nội dung';
    }

    updateProgressUI();
}

// ── Find Last In-Progress Lesson ──
function findLastInProgressLesson() {
    for (let i = state.allLessons.length - 1; i >= 0; i--) {
        if (state.completedLessons.has(state.allLessons[i].id)) {
            return Math.min(i + 1, state.allLessons.length - 1);
        }
    }
    return 0;
}

// ── Load Enrollment Progress ──
async function loadEnrollmentProgress() {
    // Get enrollment first
    const enrollmentData = await apiGet(`/enrollment/my-enrollment?userId=${USER_ID}&page=0&size=100`);
    if (!enrollmentData?.result?.content) return;

    const enrollment = enrollmentData.result.content.find(e => {
        const courseId = e.courseId || e.course?.id;
        return courseId === state.courseId;
    });

    if (enrollment) {
        state.enrollmentId = enrollment.id;
        state.progress = parseFloat(enrollment.progress) || 0;
        
        console.log('Enrollment found:', enrollment);
        
        // Get lesson progress using correct API
        const progressData = await apiGet(`/lessonprogess?courseId=${state.courseId}&userId=${USER_ID}`);
        if (progressData?.result) {
            const progress = progressData.result;
            
            // Mark completed lessons
            if (progress.completedLessonIds && Array.isArray(progress.completedLessonIds)) {
                progress.completedLessonIds.forEach(lessonId => {
                    state.completedLessons.add(lessonId);
                });
            }
            
            console.log('Progress loaded:', progress);
            console.log('Completed lessons:', state.completedLessons.size);
        }
    }
}

// ── Render Overview Tab ──
async function renderOverview() {
    const course = state.course;
    const rating = parseFloat(course.averageRating) || 0;
    const stars = renderStars(rating);
    const totalStudents = course.totalStudents || 0;
    const totalLessons = course.totalLessons || state.totalLessons || 0;

    // Instructor info
    const instrName = course.instructorName || 'Giảng viên';
    const instrInitial = instrName[0]?.toUpperCase() || 'G';

    // Fetch instructor stats to get total courses
    let instructorRating = rating;
    let instructorTotalCourses = 1;
    
    if (course.userId) {
        const statsData = await apiGet(`/instructor/stats?instructorId=${course.userId}`);
        if (statsData?.result) {
            instructorRating = parseFloat(statsData.result.averageRating) || rating;
            instructorTotalCourses = statsData.result.totalCourses || 1;
        }
    }

    document.getElementById('overviewContent').innerHTML = `
        <h1 class="overview-course-title">${course.title}</h1>
        <div class="overview-meta">
            <div class="overview-meta-item">
                ${stars}
                <span style="font-weight:700;color:var(--warning)">${rating > 0 ? rating.toFixed(1) : 'Chưa có'}</span>
            </div>
            <div class="overview-meta-item">
                <i class="fas fa-users"></i>
                ${totalStudents} học viên
            </div>
            <div class="overview-meta-item">
                <i class="fas fa-play-circle"></i>
                ${totalLessons} bài học
            </div>
            <div class="overview-meta-item">
                <i class="fas fa-clock"></i>
                ${course.duration || 'Chưa xác định'}
            </div>
        </div>

        <div class="overview-desc">
            ${course.description || 'Chưa có mô tả cho khóa học này.'}
        </div>

        ${course.learningOutcomes ? `
        <div class="learn-goals">
            <div class="learn-goals-title">
                <i class="fas fa-graduation-cap"></i>
                Bạn sẽ học được gì
            </div>
            <div class="learn-goals-grid">
                ${course.learningOutcomes.split('\n').filter(o => o.trim()).map(outcome => `
                    <div class="learn-goal-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${outcome.trim()}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="instructor-info-card" onclick="window.location.href='detailprofileteacher.html?teacherId=${course.userId}'">
            <div class="instr-avatar-big">${instrInitial}</div>
            <div class="instr-details">
                <div class="instr-name">${instrName}</div>
                <div class="instr-role">Giảng viên</div>
                <div class="instr-stats-mini">
                    <div class="instr-stat-mini">
                        <i class="fas fa-star"></i>
                        ${instructorRating > 0 ? instructorRating.toFixed(1) : 'N/A'}
                    </div>
                    <div class="instr-stat-mini">
                        <i class="fas fa-book"></i>
                        ${instructorTotalCourses} khóa học
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ── Render Curriculum (Sidebar) ──
function renderCurriculum() {
    const listEl = document.getElementById('curriculumList');
    if (!listEl) return;

    if (state.chapters.length === 0) {
        listEl.innerHTML = `
            <div style="padding:40px 20px;text-align:center;color:#64748b">
                <i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;display:block"></i>
                <p>Chưa có nội dung</p>
            </div>`;
        return;
    }

    listEl.innerHTML = state.chapters.map((section, sIdx) => {
        const lessons = section.lessons || [];
        const completedCount = lessons.filter(l => state.completedLessons.has(l.id)).length;
        const totalCount = lessons.length;
        const allDone = completedCount === totalCount && totalCount > 0;
        const partial = completedCount > 0 && completedCount < totalCount;

        return `
            <div class="chapter-item ${sIdx === 0 ? 'open' : ''}" data-section-id="${section.id}">
                <div class="chapter-header" onclick="toggleChapter(this)">
                    <div class="chapter-toggle">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="chapter-info">
                        <div class="chapter-name">${section.title}</div>
                        <div class="chapter-meta">
                            ${totalCount} bài học • ${completedCount}/${totalCount} hoàn thành
                        </div>
                    </div>
                    <div class="chapter-check ${allDone ? 'done' : partial ? 'partial' : 'empty'}">
                        <i class="fas ${allDone ? 'fa-check' : partial ? 'fa-circle-notch' : 'fa-circle'}"></i>
                    </div>
                </div>
                <div class="lessons-list">
                    ${lessons.map((lesson, lIdx) => {
                        const globalIndex = state.allLessons.findIndex(l => l.id === lesson.id);
                        const isActive = globalIndex === state.currentLessonIndex;
                        const isDone = state.completedLessons.has(lesson.id);
                        const lessonType = lesson.videoUrl ? 'video' : 'text';
                        
                        return `
                            <div class="lesson-item ${isActive ? 'active' : ''}" 
                                 data-lesson-index="${globalIndex}"
                                 onclick="selectLesson(${globalIndex})">
                                <div class="lesson-icon ${isDone ? 'done' : lessonType}">
                                    <i class="fas ${isDone ? 'fa-check' : lessonType === 'video' ? 'fa-play' : 'fa-file-alt'}"></i>
                                </div>
                                <div class="lesson-info">
                                    <div class="lesson-title">${lesson.title}</div>
                                    <div class="lesson-meta">
                                        <span>${lesson.duration || '5 phút'}</span>
                                        ${isDone ? '<span style="color:var(--success)">• Đã hoàn thành</span>' : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ── Toggle Chapter (Accordion) ──
function toggleChapter(headerEl) {
    const chapterItem = headerEl.closest('.chapter-item');
    chapterItem.classList.toggle('open');
}

// ── Select Lesson ──
function selectLesson(index) {
    if (index < 0 || index >= state.allLessons.length) return;

    state.currentLessonIndex = index;
    state.currentLesson = state.allLessons[index];

    console.log('Selected lesson:', {
        index,
        id: state.currentLesson.id,
        title: state.currentLesson.title,
        sectionId: state.currentLesson.sectionId,
        sectionTitle: state.currentLesson.sectionTitle
    });

    // Update UI
    document.getElementById('topbarLessonName').textContent = state.currentLesson.title;
    document.getElementById('currentLessonNum').textContent = index + 1;
    document.getElementById('totalLessonsNum').textContent = state.totalLessons;

    // Update active state in sidebar
    document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.lesson-item[data-lesson-index="${index}"]`);
    if (activeEl) {
        activeEl.classList.add('active');
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Load video or content
    loadLessonContent();

    // Update navigation buttons
    updateNavButtons();

    // Update complete button
    updateCompleteButton();
}

// ── Load Lesson Content ──
function loadLessonContent() {
    const lesson = state.currentLesson;
    const videoWrapper = document.getElementById('videoWrapper');
    const videoEl = document.getElementById('courseVideo');
    const videoSource = document.getElementById('videoSource');
    const placeholder = document.getElementById('videoPlaceholder');

    if (lesson.videoUrl) {
        // Show video
        videoSource.src = lesson.videoUrl;
        videoEl.load();
        videoEl.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        // Show placeholder
        videoEl.style.display = 'none';
        placeholder.style.display = 'flex';
        document.getElementById('phLessonTitle').textContent = lesson.title;
    }
}

// ── Update Navigation Buttons ──
function updateNavButtons() {
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');

    prevBtn.disabled = state.currentLessonIndex === 0;
    nextBtn.disabled = state.currentLessonIndex === state.totalLessons - 1;
}

// ── Update Complete Button ──
function updateCompleteButton() {
    const btn = document.getElementById('markCompleteBtn');
    const isDone = state.completedLessons.has(state.currentLesson.id);

    if (isDone) {
        btn.classList.add('completed');
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Đã hoàn thành';
    } else {
        btn.classList.remove('completed');
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Đánh dấu hoàn thành';
    }
}

// ── Mark Lesson as Complete ──
let isMarkingComplete = false; // Prevent double-click

async function markCurrentLessonDone() {
    const lesson = state.currentLesson;
    if (!lesson) {
        console.error('No current lesson');
        showToast('Không có bài học được chọn', 'error');
        return;
    }

    const isDone = state.completedLessons.has(lesson.id);

    if (isDone) {
        showToast('Bài học đã được đánh dấu hoàn thành', 'info');
        return;
    }

    // Prevent double-click
    if (isMarkingComplete) {
        console.log('Already marking complete, please wait...');
        return;
    }

    isMarkingComplete = true;

    // Validate required fields
    if (!state.courseId) {
        console.error('Missing courseId');
        showToast('Lỗi: Không có courseId', 'error');
        isMarkingComplete = false;
        return;
    }

    if (!lesson.sectionId) {
        console.error('Missing sectionId for lesson:', lesson);
        showToast('Lỗi: Bài học không có sectionId', 'error');
        isMarkingComplete = false;
        return;
    }

    const requestData = {
        courseId: state.courseId,
        sectionId: lesson.sectionId,
        lessonId: lesson.id
    };

    console.log('Marking lesson as complete:', requestData);

    try {
        // Call API to mark complete
        const result = await apiPost(`/lessonprogess/complete-lesson?userId=${USER_ID}`, requestData);

        console.log('Complete lesson result:', result);

        if (result?.status === 200 || result?.code === 200) {
            state.completedLessons.add(lesson.id);
            showToast('Đã đánh dấu hoàn thành!', 'success');
            
            // Update UI
            updateCompleteButton();
            renderCurriculum();
            updateProgressUI();

            // Auto go to next lesson
            setTimeout(() => {
                if (state.currentLessonIndex < state.totalLessons - 1) {
                    goNextLesson();
                } else {
                    showToast('Chúc mừng! Bạn đã hoàn thành khóa học!', 'success');
                }
            }, 1000);
        } else {
            const errorMsg = result?.message || 'Không thể đánh dấu hoàn thành';
            console.error('API error:', result);
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error marking lesson complete:', error);
        showToast('Lỗi kết nối server', 'error');
    } finally {
        isMarkingComplete = false;
    }
}

// ── Navigation Functions ──
function goPrevLesson() {
    if (state.currentLessonIndex > 0) {
        selectLesson(state.currentLessonIndex - 1);
    }
}

function goNextLesson() {
    if (state.currentLessonIndex < state.totalLessons - 1) {
        selectLesson(state.currentLessonIndex + 1);
    }
}

// ── Update Progress UI ──
function updateProgressUI() {
    const completed = state.completedLessons.size;
    const total = state.totalLessons;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Topbar
    document.getElementById('topbarProgressLabel').textContent = `${completed}/${total} bài`;
    document.getElementById('topbarProgressFill').style.width = `${pct}%`;
    document.getElementById('topbarPct').textContent = `${pct}%`;

    // Sidebar
    document.getElementById('sidebarProgressFill').style.width = `${pct}%`;
    document.getElementById('sidebarPctLabel').textContent = `${pct}%`;
    document.getElementById('sidebarProgressSub').textContent = `${completed}/${total} bài đã hoàn thành`;
}

// ── Tab Switching ──
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.content-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.content-tab[onclick="switchTab('${tabName}')"]`)?.classList.add('active');

    // Update panels
    document.querySelectorAll('.content-tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
}

// ── Initialize ──
async function init() {
    state.courseId = getCourseIdFromURL();

    if (!state.courseId) {
        // For testing: use default courseId
        console.warn('No courseId in URL, using default: course-002');
        state.courseId = 'course-002';
        
        // Show warning
        showToast('Không tìm thấy ID khóa học trong URL. Đang dùng course-002 để test.', 'warning');
    }

    console.log('Initializing with courseId:', state.courseId);

    // Load data
    await Promise.all([
        loadUserProfile(),
        loadCourse()
    ]);

    // Setup event listeners
    setupEventListeners();
}

// ── Event Listeners ──
function setupEventListeners() {
    // Previous/Next buttons
    document.getElementById('prevLessonBtn')?.addEventListener('click', goPrevLesson);
    document.getElementById('nextLessonBtn')?.addEventListener('click', goNextLesson);
    document.getElementById('markCompleteBtn')?.addEventListener('click', markCurrentLessonDone);
    document.getElementById('sidebarNextBtn')?.addEventListener('click', goNextLesson);

    // Video controls
    const video = document.getElementById('courseVideo');
    if (video) {
        video.addEventListener('play', () => {
            document.getElementById('videoOverlay')?.classList.remove('visible');
        });
        video.addEventListener('pause', () => {
            document.getElementById('videoOverlay')?.classList.add('visible');
        });
    }

    // Big play button
    document.getElementById('videoBigPlayBtn')?.addEventListener('click', () => {
        video?.play();
    });
}

// ── Start on DOM Ready ──
document.addEventListener('DOMContentLoaded', init);
