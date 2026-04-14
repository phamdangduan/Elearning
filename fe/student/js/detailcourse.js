/* ============================================================
   EduVN Student Portal - Detail Course JavaScript
   Handles course detail page functionality
============================================================ */

const API_BASE = "http://localhost:8080";

/* ── State ── */
const detailState = {
  userId: "student-001", // Hardcoded for testing
  courseId: null,
  course: null,
  sections: [],
  reviews: [],
  relatedCourses: [],
  instructor: null,
  isEnrolled: false,
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

/* ── Get courseId from URL ── */
function getCourseIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("courseId");
}

/* ── Format Price ── */
function formatPrice(price) {
  if (!price || price === 0) return "Miễn phí";
  return `${Number(price).toLocaleString("vi-VN")}đ`;
}

/* ── Format Duration (seconds to HH:MM:SS or MM:SS) ── */
function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── Render Stars ── */
function renderStars(rating) {
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

/* ── Load Course Detail ── */
async function loadCourseDetail() {
  const data = await apiGet(`/course/${detailState.courseId}`);
  if (!data?.result) {
    showToast("Không tìm thấy khóa học", "error");
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  detailState.course = data.result;
  const course = detailState.course;

  // Update page title
  document.title = `${course.title} - EduVN`;

  // Render Hero Section
  renderHeroSection(course);

  // Render Buy Card
  renderBuyCard(course);

  // Load other data
  await Promise.all([
    loadSections(),
    loadReviews(),
    loadRelatedCourses(),
    checkEnrollmentStatus(),
    loadInstructorStats(),
  ]);
}

/* ── Render Hero Section ── */
function renderHeroSection(course) {
  const rating = parseFloat(course.averageRating) || 0;
  const isFree = !course.price || Number(course.price) === 0;

  // Breadcrumb
  const categoryName = course.categories?.[0]?.name || "Khóa học";
  document.querySelector(".breadcrumb .current").textContent = course.title;
  const breadcrumbCategory = document.querySelector(
    ".breadcrumb a:last-of-type",
  );
  if (breadcrumbCategory) breadcrumbCategory.textContent = categoryName;

  // Category badge
  const categoryBadge = document.querySelector(".course-category-badge");
  if (categoryBadge && course.categories?.[0]) {
    categoryBadge.innerHTML = `<i class="fas fa-code"></i> ${course.categories[0].name}`;
  }

  // Title & Description
  document.querySelector(".course-hero-title").textContent = course.title;
  document.querySelector(".course-hero-desc").textContent =
    course.description || "Chưa có mô tả cho khóa học này.";

  // Rating & Meta
  const metaRow = document.querySelector(".course-meta-row");
  metaRow.innerHTML = `
        <div class="meta-item">
            <div class="rating-stars">${renderStars(rating)}</div>
            <span class="rating-num">${rating > 0 ? rating.toFixed(1) : "Chưa có"}</span>
            <span class="rating-count">(${course.totalReviews || 0} đánh giá)</span>
        </div>
        <div class="meta-item"><i class="fas fa-users"></i> <span class="highlight">${(course.totalEnrollments || 0).toLocaleString()}</span> học viên</div>
        <div class="meta-item"><i class="fas fa-play-circle"></i> <span class="highlight">${course.totalLessons || 0}</span> bài học</div>
        <div class="meta-item"><i class="fas fa-clock"></i> <span class="highlight">${course.totalDuration || "N/A"}</span></div>
        <div class="meta-item"><i class="fas fa-signal"></i> <span>${course.level || "Tất cả"}</span></div>
    `;

  // Instructor
  const instructorName =
    course.instructorName || course.user?.userName || "Giáo viên";
  const instructorInitial = instructorName[0].toUpperCase();
  const instructorId = course.userId;
  
  const instructorMiniInfo = document.querySelector(".instructor-mini-info strong");
  if (instructorMiniInfo) {
    instructorMiniInfo.textContent = instructorName;
    instructorMiniInfo.style.cursor = "pointer";
    instructorMiniInfo.onclick = () => {
      window.location.href = `detailprofileteacher.html?teacherId=${instructorId}`;
    };
  }
  
  const instructorMiniAvatar = document.querySelector(".instructor-mini-avatar");
  if (instructorMiniAvatar) {
    instructorMiniAvatar.textContent = instructorInitial;
    instructorMiniAvatar.style.cursor = "pointer";
    instructorMiniAvatar.onclick = () => {
      window.location.href = `detailprofileteacher.html?teacherId=${instructorId}`;
    };
  }

  // Update bottom CTA
  document.querySelector(".bottom-cta-title").textContent = course.title;
  document.querySelector(".bottom-cta-price").textContent = formatPrice(
    course.price,
  );
}

/* ── Render Buy Card ── */
function renderBuyCard(course) {
  const isFree = !course.price || Number(course.price) === 0;
  const originalPrice = course.originalPrice || course.price * 1.5;
  const discount =
    course.price && originalPrice
      ? Math.round((1 - course.price / originalPrice) * 100)
      : 0;

  // Thumbnail
  const thumbs = document.querySelectorAll(".buy-card-thumb-emoji");
  const thumbEmojis = ["💻", "🎨", "📊", "🚀", "📱", "🎵", "✏️", "🔬"];
  const emoji = thumbEmojis[Math.floor(Math.random() * thumbEmojis.length)];
  thumbs.forEach((thumb) => {
    if (course.thumbnailUrl) {
      thumb.parentElement.innerHTML = `<img src="${course.thumbnailUrl}" alt="${course.title}" style="width:100%;height:100%;object-fit:cover">
                <div class="buy-card-thumb-overlay"><div class="play-preview-btn"><i class="fas fa-play"></i></div></div>
                <div class="preview-label"><i class="fas fa-play-circle"></i> Xem thử miễn phí</div>`;
    } else {
      thumb.textContent = emoji;
    }
  });

  // Price
  const priceRows = document.querySelectorAll(".price-row");
  priceRows.forEach((row) => {
    if (isFree) {
      row.innerHTML =
        '<div class="price-main" style="color:var(--success)">Miễn phí</div>';
    } else {
      row.innerHTML = `
                <div class="price-main">${formatPrice(course.price)}</div>
                ${
                  discount > 0
                    ? `<div>
                    <div class="price-original">${formatPrice(originalPrice)}</div>
                    <div class="discount-badge">🔥 Giảm ${discount}%</div>
                </div>`
                    : ""
                }
            `;
    }
  });

  // Hide timer if free
  if (isFree) {
    document
      .querySelectorAll(".sale-timer")
      .forEach((el) => (el.style.display = "none"));
  }

  // Update enroll buttons
  const enrollBtns = document.querySelectorAll(".btn-enroll, .btn-cta-enroll");
  enrollBtns.forEach((btn) => {
    btn.innerHTML = `<i class="fas fa-graduation-cap"></i> ${isFree ? "Đăng Ký Miễn Phí" : "Đăng Ký Ngay"}`;
  });
}

/* ── Load Sections (Curriculum) ── */
async function loadSections() {
  const data = await apiGet(`/section/course/${detailState.courseId}`);
  if (!data?.result) return;

  detailState.sections = data.result;
  renderCurriculum(detailState.sections);
}

/* ── Render Curriculum ── */
function renderCurriculum(sections) {
  if (!sections || sections.length === 0) {
    document.querySelector(".curriculum-header").innerHTML =
      '<span class="curriculum-summary">Chưa có nội dung khóa học</span>';
    return;
  }

  const totalLessons = sections.reduce(
    (sum, s) => sum + (s.lessons?.length || 0),
    0,
  );
  const totalDuration = sections.reduce((sum, s) => {
    return sum + (s.lessons?.reduce((ls, l) => ls + (l.duration || 0), 0) || 0);
  }, 0);

  // Update summary
  document.querySelector(".curriculum-summary").textContent =
    `${sections.length} chương · ${totalLessons} bài học · ${formatDuration(totalDuration)}`;

  // Render chapters
  const curriculumBlock = document.querySelector(
    ".section-block:has(.curriculum-header)",
  );
  const existingChapters =
    curriculumBlock.querySelector(".chapter-item")?.parentElement;

  const chaptersHTML = sections
    .map((section, idx) => {
      const lessons = section.lessons || [];
      const sectionDuration = lessons.reduce(
        (sum, l) => sum + (l.duration || 0),
        0,
      );

      return `
            <div class="chapter-item">
                <div class="chapter-header ${idx === 0 ? "active" : ""}" onclick="toggleChapter(this)">
                    <div class="chapter-num">${idx + 1}</div>
                    <div class="chapter-title">${section.title || `Chương ${idx + 1}`}</div>
                    <div class="chapter-meta">
                        <span>${lessons.length} bài</span>
                        <span>${formatDuration(sectionDuration)}</span>
                    </div>
                    <div class="chapter-toggle"><i class="fas fa-chevron-down"></i></div>
                </div>
                <div class="lesson-list ${idx === 0 ? "open" : ""}">
                    ${lessons.map((lesson) => renderLesson(lesson)).join("")}
                </div>
            </div>
        `;
    })
    .join("");

  // Insert before "Show more" button
  const showMoreBtn = curriculumBlock.querySelector(
    'div[style*="text-align:center"]',
  );
  if (showMoreBtn) {
    showMoreBtn.insertAdjacentHTML("beforebegin", chaptersHTML);
    // Remove old chapters if any
    curriculumBlock.querySelectorAll(".chapter-item").forEach((ch, i) => {
      if (i < sections.length) return;
      ch.remove();
    });
    showMoreBtn.style.display = "none"; // Hide "show more" for now
  }
}

/* ── Render Lesson ── */
function renderLesson(lesson) {
  const isFree = lesson.isFree || lesson.isPreview || false;
  const iconType =
    lesson.type === "VIDEO"
      ? "video"
      : lesson.type === "DOCUMENT"
        ? "doc"
        : lesson.type === "QUIZ"
          ? "quiz"
          : "video";
  const iconClass = isFree ? iconType : "lock";
  const iconSymbol = isFree
    ? iconType === "video"
      ? "fa-play"
      : iconType === "doc"
        ? "fa-file-alt"
        : "fa-question-circle"
    : "fa-lock";

  return `
        <div class="lesson-item">
            <div class="lesson-icon ${iconClass}"><i class="fas ${iconSymbol}"></i></div>
            <span class="lesson-name">${lesson.title || "Bài học"}</span>
            ${isFree ? '<span class="lesson-free-tag">Miễn phí</span>' : ""}
            <span class="lesson-duration">${formatDuration(lesson.duration || 0)}</span>
        </div>
    `;
}

/* ── Load Reviews ── */
async function loadReviews() {
  const data = await apiGet(
    `/review/get-reviewsForCourse?courseId=${detailState.courseId}&page=0&size=10`,
  );
  if (!data?.result?.content) return;

  detailState.reviews = data.result.content;
  renderReviews(detailState.reviews);
}

/* ── Render Reviews ── */
function renderReviews(reviews) {
  if (!reviews || reviews.length === 0) return;

  const course = detailState.course;
  const rating = parseFloat(course.averageRating) || 0;

  // Update rating overview
  document.querySelector(".rating-big-num").textContent = rating.toFixed(1);
  document.querySelector(".rating-big-stars").innerHTML = renderStars(rating);

  // Calculate rating distribution
  const total = reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return {
      star,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  // Update rating bars
  const ratingBars = document.querySelectorAll(".rating-bar-row");
  distribution.forEach((dist, idx) => {
    if (ratingBars[idx]) {
      ratingBars[idx].querySelector(".rating-bar-fill").style.width =
        `${dist.percent}%`;
      ratingBars[idx].querySelector(".rating-bar-pct").textContent =
        `${dist.percent}%`;
    }
  });

  // Render review items
  const reviewsContainer = document.querySelector(
    ".section-block:has(.rating-big)",
  );
  const existingReviews = reviewsContainer.querySelectorAll(".review-item");
  existingReviews.forEach((r) => r.remove());

  const reviewsHTML = reviews
    .slice(0, 3)
    .map((review) => {
      const userName =
        review.userName || review.studentName || review.user?.userName || "Học viên";
      const initial = userName[0].toUpperCase();
      const colors = [
        "linear-gradient(135deg,#818cf8,#a78bfa)",
        "linear-gradient(135deg,#10b981,#06b6d4)",
        "linear-gradient(135deg,#f97316,#fbbf24)",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const date = review.createdAt
        ? new Date(review.createdAt).toLocaleDateString("vi-VN")
        : "";

      return `
            <div class="review-item">
                <div class="review-avatar" style="background:${color}">${initial}</div>
                <div class="review-content">
                    <div class="review-header">
                        <span class="review-name">${userName}</span>
                        <div class="review-stars">${renderStars(review.rating)}</div>
                        <span class="review-date">${date}</span>
                    </div>
                    <p class="review-text">${review.comment || "Khóa học rất tốt!"}</p>
                </div>
            </div>
        `;
    })
    .join("");

  console.log('[renderReviews] reviewsHTML:', reviewsHTML);
  console.log('[renderReviews] reviewsContainer:', reviewsContainer);

  // Tìm nơi insert reviews
  let insertTarget = reviewsContainer.querySelector('div[style*="text-align:center"]');
  
  if (!insertTarget) {
    // Nếu không tìm thấy, tìm phần tử cuối cùng trong reviews section
    insertTarget = reviewsContainer.querySelector('.reviews-overview');
  }
  
  console.log('[renderReviews] insertTarget:', insertTarget);
  
  if (insertTarget) {
    insertTarget.insertAdjacentHTML('afterend', reviewsHTML);
  } else {
    // Fallback: append vào cuối reviewsContainer
    reviewsContainer.insertAdjacentHTML('beforeend', reviewsHTML);
  }
}

/* ── Load Related Courses ── */
async function loadRelatedCourses() {
  const course = detailState.course;
  if (!course.categories?.[0]?.id) return;

  const data = await apiGet(
    `/course/search?categoryId=${course.categories[0].id}&page=0&size=5`,
  );
  if (!data?.result?.content) return;

  // Filter out current course
  detailState.relatedCourses = data.result.content
    .filter((c) => c.id !== detailState.courseId)
    .slice(0, 4);
  renderRelatedCourses(detailState.relatedCourses);
}

/* ── Load Instructor Stats ── */
async function loadInstructorStats() {
  const course = detailState.course;
  if (!course?.userId) return;

  const data = await apiGet(`/instructor/stats?instructorId=${course.userId}`);
  if (!data?.result) return;

  const stats = data.result;
  renderInstructorStats(stats);
}

/* ── Render Instructor Stats ── */
function renderInstructorStats(stats) {
  // Update instructor stats in the instructor section
  const instructorStatsDiv = document.querySelector(".instructor-stats");
  if (!instructorStatsDiv) return;

  const averageRating = stats.averageRating 
    ? parseFloat(stats.averageRating).toFixed(1) 
    : "Chưa có";
  const totalStudents = stats.totalStudents || 0;
  const totalCourses = stats.totalCourses || 0;

  instructorStatsDiv.innerHTML = `
    <div class="ins-stat">
      <i class="fas fa-star" style="color: #f59e0b"></i> ${averageRating} đánh giá
    </div>
    <div class="ins-stat">
      <i class="fas fa-users"></i> ${totalStudents.toLocaleString()} học viên
    </div>
    <div class="ins-stat">
      <i class="fas fa-play-circle"></i> ${totalCourses} khóa học
    </div>
  `;

  // Make instructor name clickable
  const instructorNameEl = document.querySelector(".instructor-name");
  if (instructorNameEl && detailState.course?.userId) {
    instructorNameEl.style.cursor = "pointer";
    instructorNameEl.style.transition = "color 0.2s";
    instructorNameEl.onmouseover = () => {
      instructorNameEl.style.color = "var(--primary)";
    };
    instructorNameEl.onmouseout = () => {
      instructorNameEl.style.color = "";
    };
    instructorNameEl.onclick = () => {
      window.location.href = `detailprofileteacher.html?teacherId=${detailState.course.userId}`;
    };
  }

  // Make instructor avatar clickable
  const instructorAvatarBig = document.querySelector(".instructor-avatar-big");
  if (instructorAvatarBig && detailState.course?.userId) {
    instructorAvatarBig.style.cursor = "pointer";
    instructorAvatarBig.onclick = () => {
      window.location.href = `detailprofileteacher.html?teacherId=${detailState.course.userId}`;
    };
  }
}

/* ── Render Related Courses ── */
function renderRelatedCourses(courses) {
  if (!courses || courses.length === 0) return;

  const relatedSection = document.querySelector(".related-section");
  if (!relatedSection) return;

  const existingCards = relatedSection.querySelectorAll(".related-card");
  existingCards.forEach((c) => c.remove());

  const emojis = ["💻", "🎨", "📊", "🚀", "📱", "🎵", "✏️", "🔬"];
  const colors = [
    "linear-gradient(135deg,#1e3a8a,#2563eb)",
    "linear-gradient(135deg,#065f46,#10b981)",
    "linear-gradient(135deg,#7c3aed,#a78bfa)",
    "linear-gradient(135deg,#dc2626,#f97316)",
  ];

  const cardsHTML = courses
    .map((course, idx) => {
      const emoji = course.thumbnailUrl ? "" : emojis[idx % emojis.length];
      const bg = colors[idx % colors.length];
      const instructorName =
        course.instructorName || course.user?.userName || "Giáo viên";

      return `
            <div class="related-card" onclick="window.location.href='detailcourse.html?courseId=${course.id}'">
                <div class="related-thumb" style="background:${bg}">
                    ${course.thumbnailUrl ? `<img src="${course.thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : emoji}
                </div>
                <div class="related-info">
                    <div class="related-instructor">${instructorName}</div>
                    <div class="related-name">${course.title}</div>
                    <div class="related-price">${formatPrice(course.price)}</div>
                </div>
            </div>
        `;
    })
    .join("");

  relatedSection
    .querySelector(".related-title")
    .insertAdjacentHTML("afterend", cardsHTML);
}

/* ── Check Enrollment Status ── */
async function checkEnrollmentStatus() {
  const data = await apiGet(
    `/enrollment/status?userId=${detailState.userId}&courseId=${detailState.courseId}`,
  );
  if (data?.result?.isEnrolled) {
    detailState.isEnrolled = true;
    // Update buttons to "Continue Learning"
    const enrollBtns = document.querySelectorAll(
      ".btn-enroll, .btn-cta-enroll",
    );
    enrollBtns.forEach((btn) => {
      btn.innerHTML = '<i class="fas fa-play"></i> Tiếp Tục Học';
      btn.onclick = () =>
        (window.location.href = `learn.html?courseId=${detailState.courseId}`);
    });
  }
}

/* ── Handle Enroll ── */
async function handleEnroll() {
  if (detailState.isEnrolled) {
    window.location.href = `learn.html?courseId=${detailState.courseId}`;
    return;
  }

  const course = detailState.course;
  const isFree = !course.price || Number(course.price) === 0;

  if (isFree) {
    // Free enrollment
    try {
      const res = await fetch(`${API_BASE}/enrollment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: detailState.userId,
          courseId: detailState.courseId,
        }),
      });

      if (res.ok) {
        showToast("Đăng ký khóa học thành công!", "success");
        detailState.isEnrolled = true;
        setTimeout(() => {
          window.location.href = `learn.html?courseId=${detailState.courseId}`;
        }, 1500);
      } else {
        showToast("Đăng ký thất bại, vui lòng thử lại", "error");
      }
    } catch (err) {
      console.error("Enroll error:", err);
      showToast("Có lỗi xảy ra, vui lòng thử lại", "error");
    }
  } else {
    // Redirect to payment
    window.location.href = `payment.html?courseId=${detailState.courseId}`;
  }
}

/* ── Setup Event Listeners ── */
function setupEventListeners() {
  // Enroll buttons
  document.querySelectorAll(".btn-enroll, .btn-cta-enroll").forEach((btn) => {
    btn.addEventListener("click", handleEnroll);
  });

  // Wishlist button
  const wishlistBtns = document.querySelectorAll(".btn-wishlist");
  wishlistBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.classList.toggle("active");
      const icon = this.querySelector("i");
      if (this.classList.contains("active")) {
        icon.classList.remove("far");
        icon.classList.add("fas");
        icon.style.color = "var(--danger)";
        this.innerHTML =
          '<i class="fas fa-heart" style="color:var(--danger)"></i> Đã thêm vào yêu thích';
        showToast("Đã thêm vào danh sách yêu thích", "success");
      } else {
        this.innerHTML =
          '<i class="far fa-heart"></i> Thêm vào danh sách yêu thích';
        showToast("Đã xóa khỏi danh sách yêu thích", "info");
      }
    });
  });

  // Copy link button
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.innerHTML = '<i class="fas fa-check"></i>';
        this.style.background = "var(--success)";
        this.style.color = "white";
        showToast("Đã sao chép link khóa học", "success");
        setTimeout(() => {
          this.innerHTML = '<i class="fas fa-link"></i>';
          this.style.background = "";
          this.style.color = "";
        }, 2000);
      });
    });
  }

  // Navbar scroll
  const navbar = document.getElementById("navbar");
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const bottomCta = document.getElementById("bottomCta");
  const buyCard = document.querySelector(".buy-card-sticky-wrap");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar?.classList.add("scrolled");
      scrollTopBtn?.classList.add("show");
    } else {
      navbar?.classList.remove("scrolled");
      scrollTopBtn?.classList.remove("show");
    }

    // Show bottom CTA when buy card is out of view
    if (buyCard) {
      const rect = buyCard.getBoundingClientRect();
      if (rect.bottom < 0) {
        bottomCta?.classList.add("visible");
      } else {
        bottomCta?.classList.remove("visible");
      }
    }
  });

  scrollTopBtn?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );

  // Tab navigation
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const tab = this.dataset.tab;
      const sections = document.querySelectorAll(".section-block");
      if (tab === "overview" && sections[0])
        sections[0].scrollIntoView({ behavior: "smooth", block: "start" });
      if (tab === "curriculum" && sections[2])
        sections[2].scrollIntoView({ behavior: "smooth", block: "start" });
      if (tab === "instructor" && sections[3])
        sections[3].scrollIntoView({ behavior: "smooth", block: "start" });
      if (tab === "reviews" && sections[4])
        sections[4].scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Expand all chapters
  let allExpanded = false;
  const expandAllBtn = document.getElementById("expandAllBtn");
  if (expandAllBtn) {
    expandAllBtn.addEventListener("click", function () {
      allExpanded = !allExpanded;
      document.querySelectorAll(".chapter-header").forEach((h) => {
        const ll = h.nextElementSibling;
        if (allExpanded) {
          h.classList.add("active");
          ll.classList.add("open");
        } else {
          h.classList.remove("active");
          ll.classList.remove("open");
        }
      });
      this.textContent = allExpanded ? "Thu gọn tất cả" : "Mở tất cả";
    });
  }
}

/* ── Toggle Chapter (called from HTML onclick) ── */
function toggleChapter(header) {
  const lessonList = header.nextElementSibling;
  header.classList.toggle("active");
  lessonList.classList.toggle("open");
}

/* ── Countdown Timer ── */
function startCountdown(elementId, totalSeconds) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const timer = setInterval(() => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    if (totalSeconds <= 0) clearInterval(timer);
    totalSeconds--;
  }, 1000);
}

/* ── Initialize ── */
async function init() {
  // Get courseId from URL
  detailState.courseId = getCourseIdFromURL();

  if (!detailState.courseId) {
    showToast("Không tìm thấy khóa học", "error");
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  // Setup event listeners
  setupEventListeners();

  // Load course data
  await loadCourseDetail();

  // Start countdown timers
  startCountdown("countdown", 11 * 3600 + 45 * 60 + 30);
  startCountdown("countdown2", 11 * 3600 + 45 * 60 + 30);
}

// Run when DOM ready
document.addEventListener("DOMContentLoaded", init);

// Make toggleChapter available globally for onclick
window.toggleChapter = toggleChapter;
