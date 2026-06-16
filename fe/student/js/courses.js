const API_BASE = 'http://localhost:8080';
        let myCourses = [];

        const dummyCoursesList = [
            {
                id: "course_1",
                courseId: "course_1",
                courseTitle: "Kiến trúc Bảo mật Hệ thống Cloud & DevOps",
                courseThumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
                instructorName: "Trần Văn A",
                progress: 75.0,
                completedLessons: 15,
                totalLessons: 20,
                enrollmentDate: "2023-09-01T10:00:00",
                myReview: null
            },
            {
                id: "course_2",
                courseId: "course_2",
                courseTitle: "Lập trình AI căn bản với Python & TensorFlow",
                courseThumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
                instructorName: "Nguyễn Thị B",
                progress: 22.0,
                completedLessons: 4,
                totalLessons: 18,
                enrollmentDate: "2023-09-15T14:30:00",
                myReview: null
            },
            {
                id: "course_3",
                courseId: "course_3",
                courseTitle: "Thiết kế UI/UX Nâng cao cho Sản phẩm SaaS",
                courseThumbnailUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80",
                instructorName: "Lê Văn C",
                progress: 100.0,
                completedLessons: 12,
                totalLessons: 12,
                enrollmentDate: "2023-08-10T09:00:00",
                myReview: null
            },
            {
                id: "course_4",
                courseId: "course_4",
                courseTitle: "Fullstack Web Development với Spring Boot & React",
                courseThumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
                instructorName: "Phạm D",
                progress: 100.0,
                completedLessons: 30,
                totalLessons: 30,
                enrollmentDate: "2023-07-20T11:00:00",
                myReview: {
                    rating: 5,
                    comment: "Khóa học rất hay và bổ ích!"
                }
            }
        ];

        // ── Auth Handling ──
        function applyLandingNavAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            
            if (!token || !uid) {
                window.location.href = '../login.html';
                return;
            }

            const guest = document.getElementById('navGuestActions');
            const logged = document.getElementById('navLoggedIn');
            const nameEl = document.getElementById('landingUserName');

            // Dynamically update the "Khóa học" navigation link
            const isStudentFolder = window.location.pathname.includes('/student/');
            const coursesLink = Array.from(document.querySelectorAll('.nav-link')).find(el => el.textContent.trim() === 'Khóa học');
            if (coursesLink) {
                coursesLink.href = isStudentFolder ? 'courses.html' : 'student/courses.html';
            }
            
            if (guest) guest.hidden = true;
            if (logged) logged.hidden = false;
            if (nameEl) {
                const disp = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Học viên';
                nameEl.textContent = disp.length > 26 ? disp.slice(0, 23) + '…' : disp;
                nameEl.title = disp;
            }
        }

        async function fetchMyCourses() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                console.warn("User not logged in, using dummy data.");
                myCourses = [...dummyCoursesList];
                updateStats();
                renderCourses('all');
                return;
            }

            try {
                const headers = {};
                if (token) {
                    headers['Authorization'] = 'Bearer ' + token;
                }
                const res = await fetch(`${API_BASE}/enrollment/my-enrollment?userId=${userId}&page=0&size=100`, { headers });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result && data.result.content) {
                        const enrollments = data.result.content;
                        
                        myCourses = await Promise.all(enrollments.map(async (e) => {
                            let myReview = null;
                            if (e.progress === 100.0) {
                                try {
                                    const revRes = await fetch(`${API_BASE}/review/my-review?userId=${userId}&courseId=${e.courseId}`, { headers });
                                    const revData = await revRes.json();
                                    if (revData && revData.result) {
                                        myReview = revData.result;
                                    }
                                } catch (err) {
                                    console.error("Error checking review for course " + e.courseId, err);
                                }
                            }
                            
                            return {
                                id: e.id,
                                courseId: e.courseId,
                                courseTitle: e.courseTitle,
                                courseThumbnailUrl: e.courseThumbnailUrl,
                                instructorName: e.instructorName,
                                progress: e.progress || 0,
                                completedLessons: e.completedLessons || 0,
                                totalLessons: e.totalLessons || 0,
                                enrollmentDate: e.enrollmentDate,
                                myReview: myReview
                            };
                        }));
                    } else {
                        myCourses = [];
                    }
                } else {
                    console.warn("Backend returned error response, falling back to dummy data.");
                    myCourses = [...dummyCoursesList];
                }
            } catch (error) {
                console.error("Failed to fetch courses (network offline), falling back to dummy data.", error);
                myCourses = [...dummyCoursesList];
            }
            
            updateStats();
            renderCourses('all');
        }

        function updateStats() {
            const learningCount = myCourses.filter(c => c.progress < 100).length;
            const completedCount = myCourses.filter(c => c.progress === 100).length;
            
            const activeStatText = document.querySelector('.active-stat h3');
            const completedStatText = document.querySelector('.completed-stat h3');
            
            if (activeStatText) activeStatText.textContent = String(learningCount).padStart(2, '0');
            if (completedStatText) completedStatText.textContent = String(completedCount).padStart(2, '0');
        }

        function renderCourses(tab) {
            const grid = document.querySelector('.my-courses-grid');
            if (!grid) return;

            let filtered = [];
            if (tab === 'all') {
                filtered = myCourses;
            } else if (tab === 'learning') {
                filtered = myCourses.filter(c => c.progress < 100);
            } else if (tab === 'completed') {
                filtered = myCourses.filter(c => c.progress === 100);
            } else if (tab === 'reviewed') {
                filtered = myCourses.filter(c => c.progress === 100 && c.myReview !== null);
            }

            if (filtered.length === 0) {
                let emptyMsg = "Không có khóa học nào trong danh mục này.";
                let ctaHTML = "";
                if (tab === 'all') {
                    emptyMsg = "Bạn chưa đăng ký khóa học nào. Hãy khám phá các khóa học hấp dẫn tại trang danh mục!";
                    ctaHTML = `<a href="../catalog.html" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">Khám phá khóa học ngay <i class="fas fa-arrow-right" style="margin-left: 6px;"></i></a>`;
                }
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                        <i class="fas fa-graduation-cap" style="font-size: 56px; margin-bottom: 16px; color: #cbd5e1;"></i>
                        <p style="font-size: 16px; font-weight: 500; max-width: 500px; margin: 0 auto; line-height: 1.6;">${emptyMsg}</p>
                        ${ctaHTML}
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(course => {
                const isPending = course.paymentStatus === 'PENDING';
                const isRejected = course.paymentStatus === 'REJECTED';

                if (course.progress < 100) {
                    let badgeHTML = `<span class="mcc-badge progress-badge">${Math.round(course.progress)}% Hoàn thành</span>`;
                    let metaHTML = `<i class="far fa-play-circle"></i> <span>Bài học tiếp: Đang cập nhật</span>`;
                    let actionHTML = `<a href="learning.html?id=${course.courseId}" class="btn btn-primary" style="width: 100%;">Tiếp tục học <i class="fas fa-arrow-right" style="margin-left: 6px;"></i></a>`;
                    
                    if (isPending) {
                        badgeHTML = `<span class="mcc-badge progress-badge" style="background:#f59e0b; color:white; border-radius: 4px; padding: 4px 8px; font-weight:600;"><i class="fas fa-hourglass-half" style="margin-right:4px;"></i> Chờ duyệt</span>`;
                        metaHTML = `<i class="fas fa-info-circle" style="color:#f59e0b; margin-right:4px;"></i> <span style="color:#d97706; font-weight:500; font-size:13px;">Thanh toán đang chờ duyệt</span>`;
                        actionHTML = `<button class="btn" style="width: 100%; background: #fef3c7; color: #d97706; border: 1px solid #fde68a; cursor: not-allowed; font-weight:600;" disabled><i class="fas fa-lock" style="margin-right: 6px;"></i> Đợi duyệt học phí</button>`;
                    } else if (isRejected) {
                        badgeHTML = `<span class="mcc-badge progress-badge" style="background:#ef4444; color:white; border-radius: 4px; padding: 4px 8px; font-weight:600;"><i class="fas fa-times-circle" style="margin-right:4px;"></i> Bị từ chối</span>`;
                        metaHTML = `<i class="fas fa-exclamation-circle" style="color:#ef4444; margin-right:4px;"></i> <span style="color:#dc2626; font-weight:500; font-size:13px;">Chuyển khoản bị từ chối</span>`;
                        actionHTML = `<a href="checkout.html?id=${course.courseId}" class="btn" style="width: 100%; display:block; text-align:center; background:#fecaca; color:#dc2626; border: 1px solid #fca5a5; font-weight:600; text-decoration:none;">Đăng ký lại <i class="fas fa-redo-alt" style="margin-left: 6px;"></i></a>`;
                    }

                    return `
                        <div class="my-course-card">
                            <div class="mcc-image-wrap">
                                ${badgeHTML}
                                <img src="${course.courseThumbnailUrl || 'https://via.placeholder.com/600x400?text=Course'}" alt="${course.courseTitle}">
                            </div>
                            <div class="mcc-body">
                                <h3 class="mcc-title">${course.courseTitle}</h3>
                                <div class="mcc-meta">
                                    ${metaHTML}
                                </div>
                                
                                <div class="mcc-progress-container" style="${isPending || isRejected ? 'visibility: hidden; margin-bottom: 0;' : ''}">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">
                                        <span>Tiến độ: ${course.completedLessons}/${course.totalLessons} bài học</span>
                                        <span>${Math.round(course.progress)}%</span>
                                    </div>
                                    <div class="mcc-progress-bar-bg">
                                        <div class="mcc-progress-bar-fill" style="width: ${course.progress}%;"></div>
                                    </div>
                                </div>

                                <div class="mcc-actions">
                                    ${actionHTML}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    let reviewHTML = '';
                    let actionButtonsHTML = '';
                    
                    if (course.myReview) {
                        const rating = course.myReview.rating;
                        const starsHTML = Array(5).fill(0).map((_, i) => {
                            if (i < rating) {
                                return `<i class="fas fa-star" style="color: #f5a623;"></i>`;
                            } else {
                                return `<i class="far fa-star"></i>`;
                            }
                        }).join('');

                        reviewHTML = `
                            <div class="mcc-review-block">
                                <div class="mcc-review-label">Đánh giá của bạn (${rating}⭐):</div>
                                <div class="mcc-stars">${starsHTML}</div>
                                <div style="font-size: 13px; color: var(--text-muted); margin-top: 8px; font-style: italic; word-break: break-word;">
                                    "${course.myReview.comment || ''}"
                                </div>
                            </div>
                        `;

                        actionButtonsHTML = `
                            <button class="btn btn-light-blue" onclick="location.href='learning.html?id=${course.courseId}'">Học lại</button>
                            <button class="btn btn-outline-primary" style="flex: 1;" disabled>Đã đánh giá</button>
                        `;
                    } else {
                        reviewHTML = `
                            <div class="mcc-review-block">
                                <div class="mcc-review-label">Đánh giá của bạn:</div>
                                <div class="mcc-stars">
                                    <i class="far fa-star" style="cursor:pointer;" onclick="openReviewModal('${course.courseId}', 1)"></i>
                                    <i class="far fa-star" style="cursor:pointer;" onclick="openReviewModal('${course.courseId}', 2)"></i>
                                    <i class="far fa-star" style="cursor:pointer;" onclick="openReviewModal('${course.courseId}', 3)"></i>
                                    <i class="far fa-star" style="cursor:pointer;" onclick="openReviewModal('${course.courseId}', 4)"></i>
                                    <i class="far fa-star" style="cursor:pointer;" onclick="openReviewModal('${course.courseId}', 5)"></i>
                                </div>
                            </div>
                        `;

                        actionButtonsHTML = `
                            <button class="btn btn-light-blue" onclick="location.href='learning.html?id=${course.courseId}'">Học lại</button>
                            <button class="btn btn-primary" onclick="openReviewModal('${course.courseId}')">Đánh giá ngay</button>
                        `;
                    }

                    const formattedDate = course.enrollmentDate ? new Date(course.enrollmentDate).toLocaleDateString('vi-VN') : 'Đang cập nhật';

                    return `
                        <div class="my-course-card">
                            <div class="mcc-image-wrap">
                                <span class="mcc-badge done-badge"><i class="fas fa-check-circle" style="margin-right:4px;"></i> Đã xong</span>
                                <img src="${course.courseThumbnailUrl || 'https://via.placeholder.com/600x400?text=Course'}" alt="${course.courseTitle}">
                            </div>
                            <div class="mcc-body">
                                <h3 class="mcc-title">${course.courseTitle}</h3>
                                <div class="mcc-meta">
                                    <span>Hoàn thành vào: ${formattedDate}</span>
                                </div>
                                
                                ${reviewHTML}

                                <div class="mcc-actions">
                                    ${actionButtonsHTML}
                                </div>
                            </div>
                        </div>
                    `;
                }
            }).join('');
        }

        let selectedRating = 0;

        window.openReviewModal = function(courseId, initialRating = 0) {
            document.getElementById('reviewCourseId').value = courseId;
            document.getElementById('reviewComment').value = '';
            document.getElementById('reviewModal').style.display = 'flex';
            setModalRating(initialRating);
        };

        window.closeReviewModal = function() {
            document.getElementById('reviewModal').style.display = 'none';
            selectedRating = 0;
            document.getElementById('ratingError').style.display = 'none';
        };

        window.setModalRating = function(rating) {
            selectedRating = rating;
            const stars = document.querySelectorAll('.rating-stars i');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.classList.remove('far');
                    star.classList.add('fas', 'active');
                } else {
                    star.classList.remove('fas', 'active');
                    star.classList.add('far');
                }
            });
            if (rating > 0) {
                document.getElementById('ratingError').style.display = 'none';
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            applyLandingNavAuth();
            fetchMyCourses();

            // Navbar User Dropdown toggle
            const dropdownBtn = document.getElementById('navUserDropdownBtn');
            const dropdownMenu = document.getElementById('navDropdownMenu');
            if (dropdownBtn && dropdownMenu) {
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('show');
                });
                
                document.addEventListener('click', () => {
                    dropdownMenu.classList.remove('show');
                });
            }

            // Mobile menu
            document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
                document.getElementById('navLinks').classList.toggle('mobile-open');
                dropdownMenu?.classList.remove('show');
            });

            // Logout
            document.getElementById('landingLogoutBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });

            // Newsletter submit
            document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Cảm ơn bạn đã đăng ký nhận bản tin!');
                e.target.reset();
            });
            
            // Tab interactions
            const tabs = document.querySelectorAll('.course-tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    const tabName = tab.getAttribute('data-tab');
                    renderCourses(tabName);
                });
            });

            // Handle Review Submit
            document.getElementById('reviewForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const courseId = document.getElementById('reviewCourseId').value;
                const comment = document.getElementById('reviewComment').value;
                
                if (selectedRating === 0) {
                    document.getElementById('ratingError').style.display = 'block';
                    return;
                }

                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const userId = localStorage.getItem('userId') || 'demo_user_123';
                
                try {
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = 'Bearer ' + token;
                    
                    const res = await fetch(`${API_BASE}/review/create?userId=${userId}`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            courseId: courseId,
                            rating: selectedRating,
                            comment: comment
                        })
                    });
                    
                    const data = await res.json();
                    if (res.ok || data.result) {
                        const course = myCourses.find(c => c.courseId === courseId);
                        if (course) {
                            course.myReview = {
                                rating: selectedRating,
                                comment: comment
                            };
                        }
                        alert("Đăng đánh giá thành công!");
                    } else {
                        console.warn("Backend review save failed, saving to local state for demo.");
                        const course = myCourses.find(c => c.courseId === courseId);
                        if (course) {
                            course.myReview = {
                                rating: selectedRating,
                                comment: comment
                            };
                        }
                        alert("Đánh giá thành công (Demo mode)!");
                    }
                } catch (error) {
                    console.error("Error submitting review, falling back to local memory update.", error);
                    const course = myCourses.find(c => c.courseId === courseId);
                    if (course) {
                        course.myReview = {
                            rating: selectedRating,
                            comment: comment
                        };
                    }
                    alert("Đánh giá thành công (Demo mode)!");
                }
                
                closeReviewModal();
                const activeTab = document.querySelector('.course-tab-btn.active').getAttribute('data-tab');
                renderCourses(activeTab);
                updateStats();
            });
        });
