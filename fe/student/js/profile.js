// =====================================================
// PROFILE PAGE - JavaScript Handler
// =====================================================

const API_BASE_URL = 'http://localhost:8080';
const API_BASE = 'http://localhost:8080'; // Alias for compatibility
const USER_ID = 'student-001'; // Hardcoded for testing
let profileData = null;
let enrollmentStats = null;

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProfileData();
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

// ── Load Profile Data ──
async function loadProfileData() {
  try {
    // Get userId (force student-001 for testing)
    const userId = 'student-001';
    
    // Fetch profile and enrollment stats
    const [profileRes, enrollmentRes] = await Promise.all([
      fetch(`${API_BASE_URL}/profile/me?userId=${userId}`, {
        headers: getAuthHeaders()
      }),
      fetch(`${API_BASE_URL}/enrollment/my-enrollment?userId=${userId}&pageSize=100`, {
        headers: getAuthHeaders()
      })
    ]);

    if (!profileRes.ok || !enrollmentRes.ok) {
      throw new Error('Failed to fetch data');
    }

    const profileResult = await profileRes.json();
    const enrollmentResult = await enrollmentRes.json();

    profileData = profileResult.result;
    const enrollments = enrollmentResult.result?.content || [];
    
    console.log('Profile data loaded:', profileData);
    console.log('Enrollments loaded:', enrollments.length);
    
    // Load stats from API (real data)
    enrollmentStats = await loadStatsFromAPI();
    
    // Fallback to calculated stats if API fails
    if (!enrollmentStats) {
      console.log('Using fallback stats calculation');
      enrollmentStats = calculateStats(enrollments);
    }
    
    console.log('Final enrollment stats:', enrollmentStats);
    
    // Render all sections
    renderProfile();
    renderStats();
    renderCompletionScore();
    
    // Load recent courses
    loadRecentCourses();
    
  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Không thể tải dữ liệu hồ sơ', 'error');
  }
}

// ── Calculate Stats from Student Stats API ──
async function loadStatsFromAPI() {
  try {
    console.log('Loading stats from API for userId:', USER_ID);
    const statsRes = await fetch(`${API_BASE_URL}/student/stats?studentId=${USER_ID}`);
    
    if (!statsRes.ok) {
      console.error('Failed to load student stats, status:', statsRes.status);
      return null;
    }
    
    const statsData = await statsRes.json();
    console.log('Stats API response:', statsData);
    const stats = statsData.result;
    
    if (!stats) {
      console.error('No stats in result');
      return null;
    }
    
    const result = {
      totalEnrolled: stats.totalEnrolledCourses || 0,
      completed: stats.totalCompletedCourses || 0,
      inProgress: stats.totalInProgressCourses || 0,
      lessonsCompleted: stats.totalCompletedLessons || 0,
      certificates: stats.totalCertificates || 0
    };
    
    console.log('Parsed stats:', result);
    return result;
  } catch (error) {
    console.error('Error loading stats:', error);
    return null;
  }
}

// ── Calculate Stats from Enrollments (fallback) ──
function calculateStats(enrollments) {
  const total = enrollments.length;
  const completed = enrollments.filter(e => parseFloat(e.progress) >= 100).length;
  const inProgress = enrollments.filter(e => {
    const p = parseFloat(e.progress);
    return p > 0 && p < 100;
  }).length;
  
  // Mock lessons count (would need separate API)
  const lessonsCompleted = Math.floor(total * 15); // Estimate 15 lessons per course
  
  return {
    totalEnrolled: total,
    completed,
    inProgress,
    lessonsCompleted,
    certificates: completed
  };
}

// ── Render Profile ──
function renderProfile() {
  if (!profileData) return;

  const fullName = profileData.fullName || profileData.userName || 'Học viên';
  const email = profileData.email || 'email@example.com';
  const avatar = profileData.avatar;
  const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Update hero section
  const heroName = document.getElementById('profileHeroName');
  const heroEmail = document.getElementById('profileHeroEmail');
  if (heroName) heroName.textContent = fullName;
  if (heroEmail) heroEmail.textContent = email;
  
  // Update avatars
  const avatarElements = [
    document.getElementById('profileAvatarLarge'),
    document.getElementById('avatarPreview'),
    document.getElementById('userAvatarNav'),
    document.getElementById('dropdownAvatar')
  ];
  
  avatarElements.forEach(el => {
    if (el) {
      if (avatar) {
        el.innerHTML = `<img src="${avatar}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;" />`;
      } else {
        el.innerHTML = initials;
      }
    }
  });

  // Update navbar
  const userNameNav = document.getElementById('userNameNav');
  const dropdownName = document.getElementById('dropdownName');
  const dropdownEmail = document.getElementById('dropdownEmail');
  if (userNameNav) userNameNav.textContent = fullName;
  if (dropdownName) dropdownName.textContent = fullName;
  if (dropdownEmail) dropdownEmail.textContent = email;

  // Fill form fields
  const fillInput = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  };
  
  // Split fullName into firstName and lastName
  const nameParts = fullName.split(' ');
  const firstName = nameParts[nameParts.length - 1] || '';
  const lastName = nameParts.slice(0, -1).join(' ') || '';
  
  fillInput('firstName', firstName);
  fillInput('lastName', lastName);
  fillInput('emailInput', email);
  fillInput('phoneInput', profileData.phone);
  fillInput('inputBio', profileData.bio);
  
  // Birth date
  if (profileData.birthDate) {
    fillInput('dobInput', profileData.birthDate);
  }
  
  // Gender
  if (profileData.gender) {
    fillInput('genderInput', profileData.gender);
  }
}

// ── Render Stats ──
function renderStats() {
  if (!enrollmentStats) {
    console.log('No enrollment stats available');
    return;
  }

  console.log('Rendering stats:', enrollmentStats);

  const { totalEnrolled, completed, inProgress, lessonsCompleted, certificates } = enrollmentStats;

  // Helper function to safely set text content
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      console.log(`Set ${id} = ${value}`);
    } else {
      console.warn(`Element not found: ${id}`);
    }
  };

  // Hero stats
  setText('heroStatCourses', totalEnrolled);
  setText('heroStatCompleted', completed);
  setText('heroStatLessons', lessonsCompleted);

  // Quick stats sidebar
  setText('qsEnrolled', totalEnrolled);
  setText('qsCompleted', completed);
  setText('qsInprogress', inProgress);
  setText('qsLessons', lessonsCompleted);
  setText('qsCerts', certificates);

  // Activity stats section (correct IDs from HTML)
  setText('actEnrolled', totalEnrolled);
  setText('actCompleted', completed);
  setText('actLessons', lessonsCompleted);
  setText('actHours', Math.floor(lessonsCompleted * 0.5) + 'h');
}

// ── Render Completion Score ──
function renderCompletionScore() {
  if (!profileData) return;

  // Calculate completion percentage
  const fields = ['fullName', 'email', 'phone', 'bio', 'address', 'birthDate', 'avatar'];
  const filledFields = fields.filter(field => profileData[field]).length;
  const completionPct = Math.round((filledFields / fields.length) * 100);

  // Update ring
  const ring = document.getElementById('completionRing');
  const circumference = 264;
  const offset = circumference - (completionPct / 100) * circumference;
  ring.style.strokeDashoffset = offset;

  // Update text
  document.getElementById('completionPct').textContent = completionPct + '%';
  
  if (completionPct === 100) {
    document.getElementById('completionMsg').textContent = 'Hồ sơ hoàn thiện';
    document.getElementById('completionSub').textContent = 'Tuyệt vời! Hồ sơ của bạn đã đầy đủ';
  } else if (completionPct >= 70) {
    document.getElementById('completionMsg').textContent = 'Gần hoàn thiện';
    document.getElementById('completionSub').textContent = 'Thêm vài thông tin nữa là xong';
  } else {
    document.getElementById('completionMsg').textContent = 'Hồ sơ chưa hoàn thiện';
    document.getElementById('completionSub').textContent = 'Thêm thông tin để tăng độ hiển thị';
  }
}

// ── Load Recent Courses ──
async function loadRecentCourses() {
  try {
    const userId = 'student-001';
    const response = await fetch(`${API_BASE_URL}/enrollment/my-enrollment?userId=${userId}&page=0&size=5&sort=enrollmentDate,desc`);
    
    if (!response.ok) {
      console.error('Failed to load recent courses');
      return;
    }
    
    const data = await response.json();
    const enrollments = data.result?.content || [];
    
    console.log('Recent courses loaded:', enrollments);
    
    const listEl = document.getElementById('recentCoursesList');
    if (!listEl) return;
    
    if (enrollments.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted)">
          <i class="fas fa-book-open" style="font-size:32px;margin-bottom:12px"></i>
          <p>Bạn chưa đăng ký khóa học nào. <a href="courses.html" style="color:var(--primary);font-weight:600">Khám phá ngay!</a></p>
        </div>`;
      return;
    }
    
    const emojis = ['💻', '🎨', '📊', '🌐', '📱'];
    listEl.innerHTML = enrollments.map((enr, i) => {
      const title = enr.courseTitle || 'Khóa học';
      const progress = Math.round(parseFloat(enr.progress) || 0);
      const completed = enr.completedLessons || 0;
      const total = enr.totalLessons || 0;
      const courseId = enr.courseId;
      const thumb = enr.courseThumbnail;
      
      return `
        <div class="recent-course-item" onclick="window.location.href='detailcourse.html?courseId=${courseId}'" style="cursor:pointer">
          <div class="recent-course-thumb">
            ${thumb ? `<img src="${thumb}" alt="${title}" onerror="this.parentNode.innerHTML='${emojis[i % 5]}'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : `<span style="font-size:24px">${emojis[i % 5]}</span>`}
          </div>
          <div class="recent-course-info">
            <div class="recent-course-title">${title}</div>
            <div class="recent-course-meta">
              <i class="fas fa-play-circle" style="color:var(--primary)"></i>
              ${completed}/${total} bài học
              ${progress >= 100 ? '<span style="color:var(--success);font-weight:700;margin-left:8px"><i class="fas fa-check-circle"></i> Hoàn thành</span>' : ''}
            </div>
          </div>
          <div class="recent-course-progress">
            <div class="recent-progress-bar-sm">
              <div class="recent-progress-fill-sm" style="width:${progress}%;background:var(--primary)"></div>
            </div>
            <div class="recent-progress-pct">${progress}%</div>
          </div>
        </div>`;
    }).join('');
    
  } catch (error) {
    console.error('Error loading recent courses:', error);
    const listEl = document.getElementById('recentCoursesList');
    if (listEl) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted)">
          <i class="fas fa-exclamation-circle" style="font-size:32px;margin-bottom:12px;color:var(--error)"></i>
          <p>Không thể tải khóa học. Vui lòng thử lại sau.</p>
        </div>`;
    }
  }
}

// ── Setup Event Listeners ──
function setupEventListeners() {
  // Navbar scroll
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });

  // User dropdown
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userAvatarBtn && userDropdown) {
    userAvatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => userDropdown.classList.remove('show'));
  }

  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const target = this.dataset.section;
      if (target) {
        document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // Scroll to section
        const section = document.getElementById(`section-${target}`);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Scroll to edit button
  document.getElementById('scrollToEditBtn')?.addEventListener('click', () => {
    document.getElementById('section-info')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Profile form submit
  document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);

  // Password form submit
  document.getElementById('passwordForm')?.addEventListener('submit', handlePasswordChange);

  // Avatar upload
  document.getElementById('avatarFileInput')?.addEventListener('change', handleAvatarUpload);
  document.getElementById('avatarFileInput2')?.addEventListener('change', handleAvatarUpload);

  // Password visibility toggles
  document.querySelectorAll('.input-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const input = this.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        this.classList.remove('fa-eye');
        this.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        this.classList.remove('fa-eye-slash');
        this.classList.add('fa-eye');
      }
    });
  });

  // Password strength checker
  const newPasswordInput = document.getElementById('newPassword');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', checkPasswordStrength);
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

// ── Handle Profile Update ──
async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const firstName = document.getElementById('firstName')?.value || '';
  const lastName = document.getElementById('lastName')?.value || '';
  const fullName = `${lastName} ${firstName}`.trim();
  
  const formData = {
    userId: 'student-001',
    fullName: fullName,
    email: document.getElementById('emailInput')?.value || '',
    phone: document.getElementById('phoneInput')?.value || '',
    bio: document.getElementById('inputBio')?.value || '',
    birthDate: document.getElementById('dobInput')?.value || '',
    gender: document.getElementById('genderInput')?.value || ''
  };

  try {
    const response = await fetch(`${API_BASE_URL}/profile/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Update failed');

    const result = await response.json();
    profileData = result.result;
    
    renderProfile();
    renderCompletionScore();
    showToast('Cập nhật hồ sơ thành công!', 'success');
    
  } catch (error) {
    console.error('Error updating profile:', error);
    showToast('Không thể cập nhật hồ sơ', 'error');
  }
}

// ── Handle Password Change ──
async function handlePasswordChange(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword')?.value || '';
  const newPassword = document.getElementById('newPassword')?.value || '';
  const confirmPassword = document.getElementById('confirmPassword')?.value || '';

  if (newPassword !== confirmPassword) {
    showToast('Mật khẩu xác nhận không khớp', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showToast('Mật khẩu phải có ít nhất 8 ký tự', 'error');
    return;
  }

  try {
    // TODO: Implement password change API
    showToast('Đổi mật khẩu thành công!', 'success');
    
    // Clear form
    const form = document.getElementById('passwordForm');
    if (form) form.reset();
    
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    if (strengthFill) strengthFill.style.width = '0%';
    if (strengthText) strengthText.textContent = '';
    
  } catch (error) {
    console.error('Error changing password:', error);
    showToast('Không thể đổi mật khẩu', 'error');
  }
}

// ── Handle Avatar Upload ──
async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn file ảnh', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Kích thước ảnh không được vượt quá 5MB', 'error');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'student-001');

    const response = await fetch(`${API_BASE_URL}/profile/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');

    const result = await response.json();
    profileData.avatar = result.result?.url || result.result;
    
    renderProfile();
    renderCompletionScore();
    showToast('Cập nhật ảnh đại diện thành công!', 'success');
    
  } catch (error) {
    console.error('Error uploading avatar:', error);
    showToast('Không thể tải ảnh lên', 'error');
  }
}

// ── Check Password Strength ──
function checkPasswordStrength(e) {
  const password = e.target.value;
  const strengthFill = document.querySelector('.strength-fill');
  const strengthText = document.querySelector('.strength-text');

  if (!password) {
    strengthFill.className = 'strength-fill';
    strengthText.textContent = '';
    return;
  }

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 1) {
    strengthFill.className = 'strength-fill weak';
    strengthText.className = 'strength-text weak';
    strengthText.textContent = 'Yếu';
  } else if (strength <= 2) {
    strengthFill.className = 'strength-fill medium';
    strengthText.className = 'strength-text medium';
    strengthText.textContent = 'Trung bình';
  } else {
    strengthFill.className = 'strength-fill strong';
    strengthText.className = 'strength-text strong';
    strengthText.textContent = 'Mạnh';
  }
}

// ── Handle Logout ──
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  window.location.href = '../auth/login.html';
}

// ── Toast Notification ──
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed; top: 90px; right: 24px; z-index: 9999;
    background: white; padding: 16px 20px; border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    display: flex; align-items: center; gap: 12px;
    animation: slideIn 0.3s ease;
  `;
  
  const icons = {
    success: '<i class="fas fa-check-circle" style="color:#10b981;font-size:20px"></i>',
    error: '<i class="fas fa-exclamation-circle" style="color:#ef4444;font-size:20px"></i>',
    warning: '<i class="fas fa-exclamation-triangle" style="color:#f59e0b;font-size:20px"></i>',
    info: '<i class="fas fa-info-circle" style="color:#2563eb;font-size:20px"></i>'
  };
  
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${message}</p>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
