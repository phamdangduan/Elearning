// =====================================================
// MY LEARNING PAGE - JavaScript Handler
// =====================================================

const API_BASE_URL = 'http://localhost:8080';
let allEnrollments = [];
let currentFilter = 'all';

// ── DOM Elements ──
const coursesGrid = document.getElementById('coursesGrid');
const mySearchInput = document.getElementById('mySearchInput');
const sortSelect = document.getElementById('sortSelect');
const courseTabs = document.querySelectorAll('.course-tab');

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadMyLearning();
  setupEventListeners();
});

// ── Check Authentication ──
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../auth/login.html';
    return;
  }
}

// ── Get Auth Headers ──
function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };
}

// ── Load My Learning Data ──
async function loadMyLearning() {
  try {
    showLoading();
    
    // Force use student-001 for testing
    // TODO: Get from localStorage after proper login implementation
    const userId = 'student-001';
    console.log('Using userId:', userId);
    
    // Fetch enrollments
    const response = await fetch(`${API_BASE_URL}/enrollment/my-enrollment?userId=${userId}&pageSize=100`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch enrollments');
    }

    const result = await response.json();
    console.log('API Response:', result); // Debug log
    
    // Extract data from PageResponse structure
    allEnrollments = result.result?.content || [];
    
    // Update header stats
    updateHeaderStats();
    
    // Render courses
    renderCourses(allEnrollments);
    
    // Update tab counts
    updateTabCounts();
    
    // Load certificates
    loadCertificates();
    
    hideLoading();
  } catch (error) {
    console.error('Error loading my learning:', error);
    hideLoading();
    showError('Không thể tải dữ liệu học tập. Vui lòng thử lại sau.');
  }
}

// ── Update Header Stats ──
function updateHeaderStats() {
  const totalEnrolled = allEnrollments.length;
  const completed = allEnrollments.filter(e => {
    const progress = parseFloat(e.progress) || 0;
    return progress >= 100;
  }).length;
  // Mock total hours since it's not in MyEnrollmentResponse
  const totalHours = allEnrollments.length * 20; // Estimate 20h per course
  
  document.getElementById('hsTotalEnrolled').textContent = totalEnrolled;
  document.getElementById('hsCompleted').textContent = completed;
  document.getElementById('hsHoursLearned').textContent = `${totalHours}h`;
}

// ── Update Tab Counts ──
function updateTabCounts() {
  const all = allEnrollments.length;
  const inProgress = allEnrollments.filter(e => {
    const progress = parseFloat(e.progress) || 0;
    return progress > 0 && progress < 100;
  }).length;
  const completed = allEnrollments.filter(e => {
    const progress = parseFloat(e.progress) || 0;
    return progress >= 100;
  }).length;
  
  document.querySelector('[data-tab="all"] .tab-count').textContent = all;
  document.querySelector('[data-tab="inprogress"] .tab-count').textContent = inProgress;
  document.querySelector('[data-tab="completed"] .tab-count').textContent = completed;
  document.querySelector('[data-tab="archived"] .tab-count').textContent = 0;
}

// ── Render Courses ──
function renderCourses(enrollments) {
  if (!enrollments || enrollments.length === 0) {
    coursesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon"><i class="fas fa-book-open"></i></div>
        <div class="empty-title">Chưa có khóa học nào</div>
        <p class="empty-sub">Bạn chưa đăng ký khóa học nào. Hãy khám phá và bắt đầu học ngay hôm nay!</p>
        <a href="courses.html" class="btn-browse"><i class="fas fa-search"></i> Khám phá khóa học</a>
      </div>
    `;
    return;
  }

  coursesGrid.innerHTML = enrollments.map(enrollment => createCourseCard(enrollment)).join('');
  
  // Add click handlers
  document.querySelectorAll('.my-course-card').forEach(card => {
    const courseId = card.dataset.courseId;
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-more')) {
        window.location.href = `detailcourse.html?id=${courseId}`;
      }
    });
  });
  
  // Add more button handlers
  document.querySelectorAll('.btn-more').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showCourseMenu(e.currentTarget);
    });
  });
}

// ── Create Course Card ──
function createCourseCard(enrollment) {
  // Map MyEnrollmentResponse fields
  const courseId = enrollment.courseId || '';
  const courseTitle = enrollment.courseTitle || 'Khóa học';
  const courseThumbnail = enrollment.courseThumbnailUrl || '';
  const instructorName = enrollment.instructorName || 'Giảng viên';
  const progress = parseFloat(enrollment.progress) || 0;
  const enrollmentDate = enrollment.enrollmentDate || '';
  
  const isCompleted = progress >= 100;
  const status = isCompleted ? 'completed' : 'inprogress';
  
  // Mock data for fields not in MyEnrollmentResponse
  // TODO: Update API to include these fields or fetch separately
  const categoryName = 'Backend'; // Default category
  const completedLessons = Math.floor(progress / 100 * 25); // Estimate
  const totalLessons = 25; // Default
  const totalDuration = 72000; // 20 hours in seconds
  const remainingDuration = totalDuration * (100 - progress) / 100;
  
  const categoryIcon = getCategoryIcon(categoryName);
  const gradientStyle = getCourseGradient(categoryName);
  const emoji = getCourseEmoji(categoryName);
  
  const lastAccessed = enrollmentDate ? formatLastAccessed(enrollmentDate) : 'Chưa học';
  
  return `
    <div class="my-course-card" data-status="${status}" data-course-id="${courseId}" data-category="${categoryName}">
      ${isCompleted ? '<div class="ribbon"><i class="fas fa-check"></i> Đã hoàn thành</div>' : ''}
      
      <div class="card-thumb" style="${gradientStyle}">
        ${courseThumbnail ? `<img src="${courseThumbnail}" alt="${courseTitle}" style="width:100%;height:100%;object-fit:cover;">` : `<span class="card-thumb-emoji">${emoji}</span>`}
        <div class="card-thumb-overlay">
          <div class="play-circle"><i class="fas fa-${isCompleted ? 'redo' : 'play'}"></i></div>
        </div>
        <div class="thumb-progress">
          <div class="thumb-progress-fill ${isCompleted ? 'done' : ''}" style="width: ${progress}%"></div>
        </div>
      </div>
      
      <div class="card-body">
        <div class="card-category"><i class="${categoryIcon}"></i> ${categoryName}</div>
        <div class="card-title">${courseTitle}</div>
        <div class="card-instructor">
          <div class="instr-av">${getInitials(instructorName)}</div>
          ${instructorName}
        </div>
        
        <div class="card-progress">
          <div class="progress-label-row">
            <span>${completedLessons} / ${totalLessons} bài</span>
            <span class="pct" style="${isCompleted ? 'color: var(--success)' : ''}">${Math.round(progress)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${isCompleted ? 'done' : ''}" style="width: ${progress}%"></div>
          </div>
        </div>
        
        <div class="card-meta">
          ${isCompleted 
            ? `<span><i class="fas fa-trophy" style="color: var(--warning)"></i> Hoàn thành ${formatDate(enrollmentDate)}</span>
               <span><i class="fas fa-certificate" style="color: var(--warning)"></i> Có chứng chỉ</span>`
            : `<span><i class="fas fa-clock"></i> ${formatDuration(remainingDuration)} còn lại</span>
               <span><i class="fas fa-calendar-alt"></i> ${lastAccessed}</span>`
          }
        </div>
        
        <div class="card-footer-row">
          <button class="btn-continue ${isCompleted ? 'completed' : ''}" onclick="window.location.href='detailcourse.html?id=${courseId}'">
            <i class="fas fa-${isCompleted ? 'redo' : 'play'}"></i> ${isCompleted ? 'Xem lại' : (progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học')}
          </button>
          <button class="btn-more" data-course-id="${courseId}"><i class="fas fa-ellipsis-v"></i></button>
        </div>
      </div>
    </div>
  `;
}

// ── Load Certificates ──
async function loadCertificates() {
  try {
    const completedEnrollments = allEnrollments.filter(e => {
      const progress = parseFloat(e.progress) || 0;
      return progress >= 100;
    });
    
    if (completedEnrollments.length === 0) {
      document.getElementById('certSection').style.display = 'none';
      return;
    }
    
    const certList = document.querySelector('.cert-list');
    certList.innerHTML = completedEnrollments.map(enrollment => {
      return `
        <div class="cert-card" onclick="viewCertificate('${enrollment.id}')">
          <div class="cert-icon">🏆</div>
          <div class="cert-info">
            <div class="cert-course-name">${enrollment.courseTitle || 'Khóa học'}</div>
            <div class="cert-date">
              <i class="fas fa-calendar-check"></i>
              Cấp ngày ${formatDate(enrollment.enrollmentDate)}
            </div>
            <div class="cert-id">ID: EDUVN-${enrollment.courseId}-${new Date(enrollment.enrollmentDate).getFullYear()}</div>
          </div>
          <div class="cert-actions">
            <button class="cert-btn download" onclick="event.stopPropagation(); downloadCertificate('${enrollment.id}')">
              <i class="fas fa-download"></i> Tải xuống
            </button>
            <button class="cert-btn share" onclick="event.stopPropagation(); shareCertificate('${enrollment.id}')">
              <i class="fab fa-linkedin"></i> Chia sẻ
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // Update cert header
    document.querySelector('.cert-header-sub').textContent = 
      `${completedEnrollments.length} chứng chỉ đã nhận — chia sẻ lên LinkedIn ngay!`;
      
  } catch (error) {
    console.error('Error loading certificates:', error);
  }
}

// ── Setup Event Listeners ──
function setupEventListeners() {
  // Tab filters
  courseTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      courseTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.tab;
      filterCourses();
    });
  });
  
  // Search
  mySearchInput.addEventListener('input', filterCourses);
  
  // Sort
  sortSelect.addEventListener('change', sortCourses);
  
  // Category filter
  categorySelect.addEventListener('change', filterCourses);
}

// ── Filter Courses ──
function filterCourses() {
  let filtered = [...allEnrollments];
  
  // Filter by tab
  if (currentFilter === 'inprogress') {
    filtered = filtered.filter(e => {
      const progress = parseFloat(e.progress) || 0;
      return progress > 0 && progress < 100;
    });
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(e => {
      const progress = parseFloat(e.progress) || 0;
      return progress >= 100;
    });
  } else if (currentFilter === 'archived') {
    filtered = [];
  }
  
  // Filter by search
  const searchQuery = mySearchInput.value.toLowerCase().trim();
  if (searchQuery) {
    filtered = filtered.filter(e => 
      (e.courseTitle || '').toLowerCase().includes(searchQuery) ||
      (e.instructorName || '').toLowerCase().includes(searchQuery)
    );
  }
  
  // Show empty state for archived
  if (currentFilter === 'archived') {
    coursesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon"><i class="fas fa-archive"></i></div>
        <div class="empty-title">Chưa có khóa học lưu trữ</div>
        <p class="empty-sub">Các khóa học bạn lưu trữ sẽ xuất hiện ở đây.</p>
        <a href="courses.html" class="btn-browse"><i class="fas fa-search"></i> Khám phá khóa học</a>
      </div>
    `;
    return;
  }
  
  console.log('Filtered courses:', filtered); // Debug log
  renderCourses(filtered);
}

// ── Sort Courses ──
function sortCourses() {
  const sortValue = sortSelect.value;
  let sorted = [...allEnrollments];
  
  switch (sortValue) {
    case 'recently':
      sorted.sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
      break;
    case 'progress':
      sorted.sort((a, b) => b.progress - a.progress);
      break;
    case 'az':
      sorted.sort((a, b) => (a.courseTitle || '').localeCompare(b.courseTitle || ''));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
      break;
  }
  
  allEnrollments = sorted;
  filterCourses();
}

// ── Show Course Menu ──
function showCourseMenu(button) {
  const courseId = button.dataset.courseId;
  // TODO: Implement context menu for course actions
  alert('Menu khóa học: Lưu trữ, Đánh giá, Báo cáo vấn đề');
}

// ── Certificate Actions ──
function viewCertificate(enrollmentId) {
  window.location.href = `certificate.html?enrollment=${enrollmentId}`;
}

function downloadCertificate(enrollmentId) {
  window.open(`${API_BASE_URL}/certificates/download/${enrollmentId}`, '_blank');
}

function shareCertificate(enrollmentId) {
  const url = `${window.location.origin}/certificate.html?enrollment=${enrollmentId}`;
  const text = 'Tôi vừa hoàn thành khóa học trên EduVN!';
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(linkedInUrl, '_blank', 'width=600,height=600');
}

// ── Utility Functions ──
function getCategoryIcon(category) {
  const icons = {
    'Backend': 'fas fa-code',
    'Frontend': 'fas fa-laptop-code',
    'Database': 'fas fa-database',
    'DevOps': 'fab fa-docker',
    'Security': 'fas fa-shield-alt',
    'Microservices': 'fas fa-cubes',
    'System Design': 'fas fa-project-diagram'
  };
  return icons[category] || 'fas fa-book';
}

function getCourseGradient(category) {
  const gradients = {
    'Backend': 'background: linear-gradient(135deg, #1e3a8a, #2563eb, #06b6d4);',
    'Frontend': 'background: linear-gradient(135deg, #0c4a6e, #0369a1, #38bdf8);',
    'Database': 'background: linear-gradient(135deg, #7c2d12, #ea580c, #fb923c);',
    'DevOps': 'background: linear-gradient(135deg, #134e4a, #0f766e, #2dd4bf);',
    'Security': 'background: linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa);',
    'Microservices': 'background: linear-gradient(135deg, #065f46, #10b981, #34d399);',
    'System Design': 'background: linear-gradient(135deg, #1e1b4b, #4338ca, #818cf8);'
  };
  return gradients[category] || 'background: linear-gradient(135deg, #1e3a8a, #2563eb, #06b6d4);';
}

function getCourseEmoji(category) {
  const emojis = {
    'Backend': '☕',
    'Frontend': '⚛️',
    'Database': '🗄️',
    'DevOps': '🐳',
    'Security': '🔐',
    'Microservices': '🏗️',
    'System Design': '🏛️'
  };
  return emojis[category] || '📚';
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDuration(seconds) {
  if (!seconds) return '0h';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatLastAccessed(dateString) {
  if (!dateString) return 'Chưa học';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Học hôm nay';
  if (diffDays === 1) return 'Học hôm qua';
  if (diffDays < 7) return `Học ${diffDays} ngày trước`;
  if (diffDays < 30) return `Học ${Math.floor(diffDays / 7)} tuần trước`;
  return formatDate(dateString);
}

function showLoading() {
  coursesGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
      <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--primary);"></i>
      <p style="margin-top: 20px; color: var(--text-muted);">Đang tải dữ liệu...</p>
    </div>
  `;
}

function hideLoading() {
  // Loading is replaced by content
}

function showError(message) {
  coursesGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <div class="empty-icon" style="background: #fee2e2; color: var(--danger);">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="empty-title">Có lỗi xảy ra</div>
      <p class="empty-sub">${message}</p>
      <button class="btn-browse" onclick="location.reload()">
        <i class="fas fa-redo"></i> Thử lại
      </button>
    </div>
  `;
}
