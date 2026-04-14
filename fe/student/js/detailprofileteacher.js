/* ============================================================
   EduVN Student Portal - Teacher Profile Detail JavaScript
   Handles teacher profile page functionality
============================================================ */

const API_BASE = "http://localhost:8080";

/* ── State ── */
const teacherState = {
  teacherId: null,
  teacher: null,
  stats: null,
  courses: [],
  reviews: [],
};

/* ── API Helper ── */
async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[API Error]", path, err);
    return null;
  }
}

/* ── Toast ── */
function showToast(message, type = "info") {
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };
  const container =
    document.getElementById("toastContainer") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.style.cssText =
    "position:fixed;top:90px;right:24px;background:white;padding:16px 20px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;z-index:9999;min-width:300px;animation:slideIn 0.3s ease;";
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}" style="font-size:20px;color:${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#2563eb"}"></i><p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${message}</p>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100px)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toastContainer";
  document.body.appendChild(container);
  return container;
}

/* ── Get teacherId from URL ── */
function getTeacherIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("teacherId");
}

/* ── Format Price ── */
function formatPrice(price) {
  if (!price || price === 0) return "Miễn phí";
  return `${Number(price).toLocaleString("vi-VN")}₫`;
}

/* ── Render Stars ── */
function renderStars(rating, size = "normal") {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  const half = r % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return `
    ${'<i class="fas fa-star"></i>'.repeat(full)}
    ${half ? '<i class="fas fa-star-half-alt"></i>' : ""}
    ${'<i class="far fa-star"></i>'.repeat(empty)}
  `;
}

/* ── Load Teacher Profile ── */
async function loadTeacherProfile() {
  // Load both user profile and instructor stats
  const [profileData, statsData] = await Promise.all([
    apiGet(`/profile/me?userId=${teacherState.teacherId}`),
    apiGet(`/instructor/stats?instructorId=${teacherState.teacherId}`)
  ]);

  if (!statsData?.result) {
    showToast("Không tìm thấy thông tin giáo viên", "error");
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  teacherState.teacher = profileData?.result || null;
  teacherState.stats = statsData.result;
  
  renderTeacherProfile(teacherState.stats, teacherState.teacher);
}

/* ── Render Teacher Profile ── */
function renderTeacherProfile(stats, teacher) {
  // Update page title
  const teacherName = teacher?.fullName || teacher?.userName || "Giáo Viên";
  document.title = `${teacherName} - EduVN`;

  // Render hero section
  renderHeroSection(stats, teacher);

  // Render stats strip
  renderStatsStrip(stats);

  // Render about/bio section
  if (teacher?.bio) {
    renderBioSection(teacher);
  }

  // Render courses
  renderCourses(stats.courseStats || []);

  // Load reviews from all courses
  loadAllReviews(stats.courseStats || []);
}

/* ── Render Hero Section ── */
function renderHeroSection(stats, teacher) {
  const averageRating = stats.averageRating 
    ? parseFloat(stats.averageRating).toFixed(1) 
    : "Chưa có";
  const totalStudents = stats.totalStudents || 0;
  const totalCourses = stats.totalCourses || 0;

  // Update teacher name
  const teacherName = teacher?.fullName || teacher?.userName || "Giáo Viên";
  const teacherNameEl = document.getElementById("teacherName");
  if (teacherNameEl) {
    teacherNameEl.textContent = teacherName;
  }

  // Update breadcrumb
  const breadcrumbCurrent = document.querySelector(".breadcrumb .current");
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = teacherName;
  }

  // Update avatar
  const teacherAvatarEl = document.getElementById("teacherAvatar");
  if (teacherAvatarEl) {
    if (teacher?.avatar) {
      teacherAvatarEl.innerHTML = `<img src="${teacher.avatar}" alt="${teacherName}" style="width:100%;height:100%;object-fit:cover" />`;
    } else {
      const initials = teacherName.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      teacherAvatarEl.textContent = initials;
    }
  }

  // Update instructor name in card
  const instructorNameEl = document.querySelector(".instructor-name");
  if (instructorNameEl) {
    instructorNameEl.textContent = teacherName;
  }

  // Update instructor avatar in card
  const instructorAvatarBig = document.querySelector(".instructor-avatar-big");
  if (instructorAvatarBig) {
    if (teacher?.avatar) {
      instructorAvatarBig.innerHTML = `<img src="${teacher.avatar}" alt="${teacherName}" style="width:100%;height:100%;object-fit:cover" />`;
    } else {
      const initials = teacherName.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      instructorAvatarBig.textContent = initials;
    }
  }

  // Update rating
  const teacherRatingEl = document.getElementById("teacherRating");
  if (teacherRatingEl) {
    teacherRatingEl.textContent = averageRating;
  }

  // Update students count
  const teacherStudentsEl = document.getElementById("teacherStudents");
  if (teacherStudentsEl) {
    teacherStudentsEl.textContent = totalStudents >= 1000 
      ? `${(totalStudents / 1000).toFixed(1)}K+` 
      : totalStudents.toString();
  }

  // Update course count
  const teacherCourseCountEl = document.getElementById("teacherCourseCount");
  if (teacherCourseCountEl) {
    teacherCourseCountEl.textContent = totalCourses.toString();
  }

  // Update review count
  const teacherReviewCountEl = document.getElementById("teacherReviewCount");
  if (teacherReviewCountEl) {
    const totalReviews = (stats.courseStats || []).reduce(
      (sum, course) => sum + (course.totalReviews || 0), 
      0
    );
    teacherReviewCountEl.textContent = `(${totalReviews.toLocaleString()} đánh giá)`;
  }

  // Update stars
  const starsContainer = document.querySelector(".teacher-rating-row .stars");
  if (starsContainer && averageRating !== "Chưa có") {
    starsContainer.innerHTML = renderStars(averageRating);
  }

  // Update title/bio in hero
  const teacherTitleEl = document.getElementById("teacherTitle");
  if (teacherTitleEl && teacher?.bio) {
    teacherTitleEl.textContent = teacher.bio.substring(0, 200) + (teacher.bio.length > 200 ? "..." : "");
  }
}

/* ── Render Stats Strip ── */
function renderStatsStrip(stats) {
  const averageRating = stats.averageRating 
    ? parseFloat(stats.averageRating).toFixed(1) 
    : "0.0";
  const totalStudents = stats.totalStudents || 0;
  const totalCourses = stats.totalCourses || 0;

  // Calculate total reviews from all courses
  const totalReviews = (stats.courseStats || []).reduce(
    (sum, course) => sum + (course.totalReviews || 0), 
    0
  );

  document.getElementById("statCourses").textContent = totalCourses;
  document.getElementById("statRating").textContent = averageRating;
  
  const statStudentsEl = document.getElementById("statStudents");
  if (statStudentsEl) {
    statStudentsEl.textContent = totalStudents >= 1000 
      ? `${(totalStudents / 1000).toFixed(1)}K+` 
      : totalStudents.toString();
  }
  
  const statReviewsEl = document.getElementById("statReviews");
  if (statReviewsEl) {
    statReviewsEl.textContent = totalReviews.toLocaleString();
  }
}

/* ── Render Bio Section ── */
function renderBioSection(teacher) {
  const teacherBioEl = document.getElementById("teacherBio");
  if (teacherBioEl && teacher?.bio) {
    teacherBioEl.innerHTML = `<p>${teacher.bio}</p>`;
  }

  // Hide expertise tags since backend doesn't provide this data
  const expertiseList = document.querySelector(".expertise-list");
  if (expertiseList) {
    expertiseList.style.display = "none";
  }
}

/* ── Render Courses ── */
function renderCourses(courses) {
  if (!courses || courses.length === 0) {
    document.getElementById("teacherCoursesList").innerHTML = 
      '<p style="text-align:center;color:var(--text-muted);padding:40px 0;">Chưa có khóa học nào</p>';
    
    // Hide load more button
    const loadMoreBtn = document.getElementById("loadMoreCoursesBtn");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = "none";
    }
    return;
  }

  teacherState.courses = courses;

  const courseTotal = document.getElementById("courseTotal");
  if (courseTotal) {
    courseTotal.textContent = `${courses.length} khóa học`;
  }

  const coursesHTML = courses.map((course, idx) => {
    const emojis = ["☕", "🏗️", "🔐", "🗄️", "🚀", "💻", "🎨", "📊"];
    const emoji = emojis[idx % emojis.length];
    
    const gradients = [
      "linear-gradient(135deg, #1e3a8a, #2563eb, #06b6d4)",
      "linear-gradient(135deg, #065f46, #10b981, #34d399)",
      "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)",
      "linear-gradient(135deg, #7c2d12, #ea580c, #fb923c)",
    ];
    const gradient = gradients[idx % gradients.length];

    const rating = course.averageRating || 0;
    const reviewCount = course.totalReviews || 0;

    return `
      <div class="course-card-h" onclick="window.location.href='detailcourse.html?courseId=${course.courseId}'">
        <div class="course-thumb-h" style="background: ${gradient}">
          <div class="thumb-overlay"></div>
          ${course.courseThumbnail 
            ? `<img src="${course.courseThumbnail}" style="width:100%;height:100%;object-fit:cover" />` 
            : `<span class="course-thumb-h-emoji">${emoji}</span>`
          }
        </div>
        <div class="course-info-h">
          <span class="course-level-badge beginner"><i class="fas fa-seedling"></i> Cơ bản</span>
          <div class="course-h-title">${course.courseTitle}</div>
          <div class="course-h-meta">
            <span><i class="fas fa-users"></i> ${course.totalEnrollments || 0} học viên</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(course.createdAt)}</span>
          </div>
          <div class="course-h-rating">
            <div class="stars-sm">
              ${renderStars(rating, "small")}
            </div>
            <span class="r-num">${rating > 0 ? rating.toFixed(1) : "Chưa có"}</span>
            <span class="r-count">(${reviewCount} đánh giá)</span>
          </div>
        </div>
        <div class="course-price-h">
          <div class="price-now">${formatPrice(course.coursePrice)}</div>
          <button class="btn-view-course"><i class="fas fa-arrow-right"></i> Xem khóa</button>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("teacherCoursesList").innerHTML = coursesHTML;

  // Hide load more button since we're showing all courses
  const loadMoreBtn = document.getElementById("loadMoreCoursesBtn");
  if (loadMoreBtn) {
    loadMoreBtn.style.display = "none";
  }

  // Update sidebar top courses
  renderTopCourses(courses.slice(0, 3));

  // Update achievements in sidebar
  renderAchievements(teacherState.stats);
}

/* ── Format Date ── */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${year}`;
}

/* ── Render Top Courses in Sidebar ── */
function renderTopCourses(courses) {
  const miniCourseList = document.querySelector(".mini-course-list");
  if (!miniCourseList) return;

  if (!courses || courses.length === 0) {
    miniCourseList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px 0;font-size:13px;">Chưa có khóa học</p>';
    return;
  }

  const emojis = ["☕", "🏗️", "🔐", "🗄️", "🚀", "💻", "🎨", "📊"];
  const gradients = [
    "linear-gradient(135deg, #1e3a8a, #2563eb)",
    "linear-gradient(135deg, #065f46, #10b981)",
    "linear-gradient(135deg, #4c1d95, #7c3aed)",
  ];

  const coursesHTML = courses.map((course, idx) => {
    const emoji = emojis[idx % emojis.length];
    const gradient = gradients[idx % gradients.length];

    return `
      <div class="mini-course-item" onclick="window.location.href='detailcourse.html?courseId=${course.courseId}'" style="cursor:pointer">
        <div class="mini-course-thumb" style="background: ${gradient}">
          ${course.courseThumbnail 
            ? `<img src="${course.courseThumbnail}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)" />` 
            : emoji
          }
        </div>
        <div>
          <div class="mini-course-name">${course.courseTitle}</div>
          <div class="mini-course-price">${formatPrice(course.coursePrice)}</div>
        </div>
      </div>
    `;
  }).join('');

  miniCourseList.innerHTML = coursesHTML;
}

/* ── Render Achievements in Sidebar ── */
function renderAchievements(stats) {
  const achievementList = document.querySelector(".achievement-list");
  if (!achievementList || !stats) return;

  const averageRating = stats.averageRating 
    ? parseFloat(stats.averageRating).toFixed(1) 
    : "0.0";
  const totalStudents = stats.totalStudents || 0;
  const totalCourses = stats.totalCourses || 0;
  const totalRevenue = stats.totalRevenue || 0;

  // Format students count
  const studentsDisplay = totalStudents >= 1000 
    ? `${(totalStudents / 1000).toFixed(1)}K+` 
    : totalStudents.toString();

  // Format revenue
  const revenueDisplay = totalRevenue >= 1000000
    ? `${(totalRevenue / 1000000).toFixed(1)}M`
    : totalRevenue >= 1000
    ? `${(totalRevenue / 1000).toFixed(0)}K`
    : totalRevenue.toString();

  const achievementsHTML = `
    <div class="achievement-item">
      <div class="achievement-icon blue"><i class="fas fa-users"></i></div>
      <div>
        <div class="achievement-name">${studentsDisplay} Học Viên</div>
        <div class="achievement-desc">Tổng số học viên đã đăng ký</div>
      </div>
    </div>
    <div class="achievement-item">
      <div class="achievement-icon green"><i class="fas fa-star"></i></div>
      <div>
        <div class="achievement-name">Điểm ${averageRating}/5.0</div>
        <div class="achievement-desc">Đánh giá trung bình</div>
      </div>
    </div>
    <div class="achievement-item">
      <div class="achievement-icon purple"><i class="fas fa-certificate"></i></div>
      <div>
        <div class="achievement-name">${totalCourses} Khóa Học</div>
        <div class="achievement-desc">Đã xuất bản ${totalCourses} khóa học</div>
      </div>
    </div>
    ${totalRevenue > 0 ? `
    <div class="achievement-item">
      <div class="achievement-icon gold"><i class="fas fa-coins"></i></div>
      <div>
        <div class="achievement-name">${revenueDisplay}đ Doanh Thu</div>
        <div class="achievement-desc">Tổng doanh thu đạt được</div>
      </div>
    </div>
    ` : ''}
  `;

  achievementList.innerHTML = achievementsHTML;
}

/* ── Setup Event Listeners ── */
function setupEventListeners() {
  // Navbar scroll
  const navbar = document.getElementById("navbar");
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar?.classList.add("scrolled");
      scrollTopBtn?.classList.add("show");
    } else {
      navbar?.classList.remove("scrolled");
      scrollTopBtn?.classList.remove("show");
    }
  });

  scrollTopBtn?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  // User Dropdown
  const userAvatarBtn = document.getElementById("userAvatarBtn");
  const userDropdown = document.getElementById("userDropdown");
  if (userAvatarBtn && userDropdown) {
    userAvatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });
    document.addEventListener("click", () => userDropdown.classList.remove("show"));
  }

  // Follow Button
  const followBtn = document.getElementById("followBtn");
  if (followBtn) {
    let isFollowing = false;
    followBtn.addEventListener("click", () => {
      isFollowing = !isFollowing;
      if (isFollowing) {
        followBtn.innerHTML = '<i class="fas fa-check"></i> Đang theo dõi';
        followBtn.style.background = "rgba(255,255,255,0.15)";
        followBtn.style.boxShadow = "none";
        showToast("Đã theo dõi giáo viên", "success");
      } else {
        followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Theo dõi giáo viên';
        followBtn.style.background = "";
        followBtn.style.boxShadow = "";
        showToast("Đã bỏ theo dõi", "info");
      }
    });
  }

  // Course Filter Tabs
  document.querySelectorAll(".course-filter-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".course-filter-tab").forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      
      const filter = this.dataset.filter;
      filterCourses(filter);
    });
  });

  // Send Message Button
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener("click", () => {
      const name = document.getElementById("contactName")?.value;
      const email = document.getElementById("contactEmail")?.value;
      const message = document.getElementById("contactMessage")?.value;

      if (!name || !email || !message) {
        showToast("Vui lòng điền đầy đủ thông tin", "warning");
        return;
      }

      // TODO: Send message to API
      showToast("Tin nhắn đã được gửi!", "success");
      
      // Clear form
      document.getElementById("contactName").value = "";
      document.getElementById("contactEmail").value = "";
      document.getElementById("contactMessage").value = "";
    });
  }
}

/* ── Filter Courses ── */
function filterCourses(filter) {
  let filteredCourses = [...teacherState.courses];

  switch (filter) {
    case "popular":
      filteredCourses.sort((a, b) => (b.totalEnrollments || 0) - (a.totalEnrollments || 0));
      break;
    case "new":
      filteredCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case "beginner":
      // For now, show all courses as we don't have level info
      break;
    default:
      // "all" - no filtering
      break;
  }

  renderCourses(filteredCourses);
}

/* ── Load All Reviews from Courses ── */
async function loadAllReviews(courses) {
  if (!courses || courses.length === 0) return;

  // Get reviews from all courses
  const reviewPromises = courses.map(course => 
    apiGet(`/review/get-reviewsForCourse?courseId=${course.courseId}&page=0&size=10`)
  );

  const reviewsData = await Promise.all(reviewPromises);
  
  // Combine all reviews
  const allReviews = [];
  reviewsData.forEach((data, idx) => {
    if (data?.result?.content) {
      data.result.content.forEach(review => {
        allReviews.push({
          ...review,
          courseName: courses[idx].courseTitle
        });
      });
    }
  });

  // Sort by date (newest first)
  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  teacherState.reviews = allReviews;
  renderReviews(allReviews.slice(0, 3)); // Show first 3 reviews
  updateReviewsSummary(allReviews);
}

/* ── Render Reviews ── */
function renderReviews(reviews) {
  const reviewsList = document.getElementById("reviewsList");
  if (!reviewsList) return;

  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px 0;">Chưa có đánh giá nào</p>';
    return;
  }

  const reviewsHTML = reviews.map(review => {
    const userName = review.userName || "Học viên";
    const initials = userName.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const gradients = [
      "linear-gradient(135deg, #2563eb, #06b6d4)",
      "linear-gradient(135deg, #7c3aed, #a78bfa)",
      "linear-gradient(135deg, #065f46, #10b981)",
      "linear-gradient(135deg, #dc2626, #f97316)",
    ];
    const gradient = gradients[Math.floor(Math.random() * gradients.length)];

    const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'N/A';

    return `
      <div class="review-card">
        <div class="review-header">
          <div class="reviewer-avatar" style="background: ${gradient};">${initials}</div>
          <div>
            <div class="reviewer-name">${userName}</div>
            <div class="review-date"><i class="fas fa-calendar" style="color: var(--text-muted); font-size: 11px;"></i> ${date}</div>
            ${review.courseName ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;"><i class="fas fa-book"></i> ${review.courseName}</div>` : ''}
          </div>
          <div class="review-stars">
            ${renderStars(review.rating)}
          </div>
        </div>
        <p class="review-text">${review.comment || 'Không có nhận xét'}</p>
        <div class="review-helpful">
          <span>Có hữu ích không?</span>
          <button class="helpful-btn"><i class="fas fa-thumbs-up"></i> Có (0)</button>
          <button class="helpful-btn"><i class="fas fa-thumbs-down"></i> Không (0)</button>
        </div>
      </div>
    `;
  }).join('');

  reviewsList.innerHTML = reviewsHTML;

  // Update load more button
  const loadMoreBtn = document.getElementById("loadMoreReviewsBtn");
  if (loadMoreBtn) {
    const remainingReviews = teacherState.reviews.length - reviews.length;
    if (remainingReviews > 0) {
      loadMoreBtn.textContent = `Xem thêm đánh giá (${remainingReviews} đánh giá)`;
      loadMoreBtn.style.display = 'inline-flex';
      loadMoreBtn.onclick = () => {
        renderReviews(teacherState.reviews);
        loadMoreBtn.style.display = 'none';
      };
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
}

/* ── Update Reviews Summary ── */
function updateReviewsSummary(reviews) {
  if (!reviews || reviews.length === 0) return;

  // Calculate average rating
  const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  
  // Update big rating number
  const bigRatingNum = document.querySelector(".big-rating-num");
  if (bigRatingNum) {
    bigRatingNum.textContent = avgRating.toFixed(1);
  }

  // Update stars
  const bigRatingStars = document.querySelector(".big-rating-stars");
  if (bigRatingStars) {
    bigRatingStars.innerHTML = renderStars(avgRating);
  }

  // Update review count in hero section
  const teacherReviewCountEl = document.getElementById("teacherReviewCount");
  if (teacherReviewCountEl) {
    teacherReviewCountEl.textContent = `(${reviews.length.toLocaleString()} đánh giá)`;
  }

  // Update review count in stats strip
  const statReviewsEl = document.getElementById("statReviews");
  if (statReviewsEl) {
    statReviewsEl.textContent = reviews.length.toLocaleString();
  }

  // Calculate star distribution
  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    const rating = Math.floor(r.rating || 0);
    if (rating >= 1 && rating <= 5) {
      starCounts[rating - 1]++;
    }
  });

  // Update star breakdown
  for (let i = 5; i >= 1; i--) {
    const percentage = reviews.length > 0 ? (starCounts[i - 1] / reviews.length * 100) : 0;
    const starRow = document.querySelectorAll(".star-row")[5 - i];
    if (starRow) {
      const fill = starRow.querySelector(".star-bar-fill");
      const pct = starRow.querySelector(".star-row-pct");
      if (fill) fill.style.width = `${percentage}%`;
      if (pct) pct.textContent = `${Math.round(percentage)}%`;
    }
  }
}

/* ── Initialize ── */
async function init() {
  // Get teacherId from URL
  teacherState.teacherId = getTeacherIdFromURL();

  if (!teacherState.teacherId) {
    showToast("Không tìm thấy thông tin giáo viên", "error");
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  // Setup event listeners
  setupEventListeners();

  // Load teacher data
  await loadTeacherProfile();
}

// Run when DOM ready
document.addEventListener("DOMContentLoaded", init);
