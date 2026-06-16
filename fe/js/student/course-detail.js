(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        if (token && userId) {
            let dispName = localStorage.getItem('userName') || 'Sinh viên';
            let avatarUrl = localStorage.getItem('userAvatar') || '';
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const data = JSON.parse(userStr);
                    dispName = data.fullName || data.username || dispName;
                    if (!avatarUrl) {
                        avatarUrl = data.avatar || data.avatarUrl || '';
                    }
                } catch(e) {}
            }
            
            const nameEl = document.getElementById('userNameDisplay') || document.getElementById('landingUserName');
            if(nameEl) nameEl.textContent = dispName;
            
            const avatarEl = document.getElementById('navUserAvatar');
            
            const renderAvatar = (url) => {
                if (avatarEl) {
                    if (url) {
                        avatarEl.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    } else {
                        avatarEl.textContent = dispName.charAt(0).toUpperCase();
                    }
                }
            };

            if (avatarUrl) {
                renderAvatar(avatarUrl);
            } else {
                renderAvatar('');
                
                // Fetch trực tiếp từ DB để đồng bộ avatar
                const API_BASE = 'http://localhost:8080';
                fetch(`${API_BASE}/profile/me?userId=${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => {
                    if (res.ok) return res.json();
                })
                .then(json => {
                    if (json && json.result) {
                        const data = json.result;
                        const newAvatar = data.avatar || data.avatarUrl || '';
                        if (newAvatar) {
                            localStorage.setItem('userAvatar', newAvatar);
                            localStorage.setItem('user', JSON.stringify(data));
                            renderAvatar(newAvatar);
                        }
                    }
                })
                .catch(err => console.warn("Failed to sync avatar in background", err));
            }
        }
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    // Check login for header
    const token = localStorage.getItem('token');
    const guestNav = document.getElementById('navGuestActions');
    const userNav = document.getElementById('navLoggedIn');
    
    if (token) {
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) userNav.style.display = 'block';
    } else {
        if (guestNav) guestNav.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        alert("Không tìm thấy ID khóa học.");
        window.location.href = '../catalog.html';
        return;
    }

    
    loadCourseDetail(courseId);
    loadReviews(courseId);

    if (token) {
        checkEnrollmentStatus(courseId);
    }

    document.getElementById('enrollBtn').addEventListener('click', () => {
        if (!token) {
            alert("Vui lòng đăng nhập để đăng ký khóa học.");
            window.location.href = `../login.html?redirect=student/course-detail.html?id=${courseId}`;
            return;
        }
        enrollCourse(courseId, token);
    });

    // Star rating hover and click handlers
    let selectedRating = 0;
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
        btn.addEventListener('mouseover', () => {
            const val = parseInt(btn.getAttribute('data-value'));
            highlightStars(val);
        });
        btn.addEventListener('mouseout', () => {
            highlightStars(selectedRating);
        });
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.getAttribute('data-value'));
            highlightStars(selectedRating);
        });
    });

    function highlightStars(rating) {
        starBtns.forEach(btn => {
            const val = parseInt(btn.getAttribute('data-value'));
            if (val <= rating) {
                btn.className = 'fas fa-star star-btn';
            } else {
                btn.className = 'far fa-star star-btn';
            }
        });
    }

    // Submit review click handler
    document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!userId || !token) {
            alert("Vui lòng đăng nhập để thực hiện đánh giá.");
            return;
        }
        if (selectedRating === 0) {
            alert("Vui lòng chọn số sao đánh giá.");
            return;
        }
        const comment = document.getElementById('reviewCommentInput').value.trim();
        const btn = document.getElementById('submitReviewBtn');
        btn.disabled = true;
        btn.textContent = "Đang gửi...";
        
        try {
            const res = await fetch(`${API_BASE}/review/create?userId=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseId: courseId,
                    rating: selectedRating,
                    comment: comment
                })
            });
            
            if (res.ok) {
                alert("Đánh giá khóa học thành công!");
                document.getElementById('writeReviewSection').style.display = 'none';
                loadReviews(courseId);
                loadCourseDetail(courseId);
            } else {
                const err = await res.json();
                alert("Lỗi gửi đánh giá: " + (err.message || "Không xác định"));
                btn.disabled = false;
                btn.textContent = "Gửi đánh giá";
            }
        } catch(e) {
            console.error(e);
            alert("Lỗi kết nối khi gửi đánh giá.");
            btn.disabled = false;
            btn.textContent = "Gửi đánh giá";
        }
    });
});

async function loadCourseDetail(courseId) {
    try {
        const res = await fetch(`${API_BASE}/course/${courseId}`);
        if (!res.ok) throw new Error("Course not found");
        const json = await res.json();
        const data = json.result || json;
        renderCourse(data);
    } catch (error) {
        console.error("API Error, using dummy data:", error);
        // DUMMY FALLBACK DATA
        const dummyData = {
            title: "Khóa học Lập trình Web Fullstack với Spring Boot và React",
            description: "Học cách xây dựng các ứng dụng web phức tạp từ con số không. Khóa học bao gồm cả phần Frontend hiện đại và Backend mạnh mẽ.",
            thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
            price: 599000,
            teacherName: "Nguyễn Văn A",
            sections: [
                {
                    title: "Giới thiệu khóa học",
                    lessons: [
                        { title: "Giới thiệu chung" },
                        { title: "Cài đặt môi trường" }
                    ]
                },
                {
                    title: "Kiến trúc hệ thống",
                    lessons: [
                        { title: "RESTful API là gì?" },
                        { title: "Phân tích Database" }
                    ]
                }
            ]
        };
        renderCourse(dummyData);
    }
}

function renderCourse(data) {
    window.currentCourseData = data;
    document.getElementById('courseTitle').textContent = data.title;
    document.getElementById('courseDescShort').textContent = data.description || "Chưa có mô tả ngắn.";
    document.getElementById('courseDescFull').innerHTML = data.description ? `<p>${data.description}</p>` : "<p>Không có thông tin chi tiết.</p>";
    
    let thumbUrl = data.thumbnailUrl || data.thumbnail;
    if (thumbUrl) {
        if (!thumbUrl.startsWith('http')) {
            thumbUrl = `${API_BASE}/uploads/${thumbUrl}`;
        }
        document.getElementById('courseThumb').src = thumbUrl;
    }
    
    if (data.price > 0) {
        document.getElementById('coursePrice').textContent = data.price.toLocaleString('vi-VN') + ' đ';
    } else {
        document.getElementById('coursePrice').textContent = "Miễn phí";
    }

    // Dynamic Meta
    const avgRating = data.averageRating != null ? data.averageRating : 0;
    const totalReviews = data.totalReviews != null ? data.totalReviews : 0;
    const ratingEl = document.getElementById('courseRatingDisplay');
    if (ratingEl) ratingEl.textContent = `${avgRating} (${totalReviews} Đánh giá)`;

    const totalStudents = data.totalStudents != null ? data.totalStudents : (data.totalEnrollments || 0);
    const studentsEl = document.getElementById('courseStudents');
    if (studentsEl) studentsEl.textContent = totalStudents;

    // Instructor logic based on updated UserResponse { id, userName, email, fullName, avatar, bio }
    let teacherName = 'Giảng viên';
    if (data.instructor && data.instructor.fullName) {
        teacherName = data.instructor.fullName;
    } else if (data.instructor && data.instructor.userName) {
        teacherName = data.instructor.userName;
    } else if (data.instructor && data.instructor.email) {
        teacherName = data.instructor.email.split('@')[0];
    } else if (data.teacherName) {
        teacherName = data.teacherName; // fallback for old dummy data
    }
    
    document.getElementById('instructorName').textContent = teacherName;
    const instructorNameBox = document.getElementById('instructorNameBox');
    if(instructorNameBox) instructorNameBox.textContent = teacherName;
    
    // Avatar logic
    const avatarEl = document.getElementById('instructorAvatar');
    if (data.instructor && data.instructor.avatar) {
        let avtUrl = data.instructor.avatar;
        if (!avtUrl.startsWith('http')) avtUrl = `${API_BASE}/uploads/${avtUrl}`;
        avatarEl.innerHTML = `<img src="${avtUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
        avatarEl.textContent = teacherName.charAt(0).toUpperCase();
    }

    // Bio logic
    if (data.instructor && data.instructor.bio) {
        const bioEl = document.querySelector('.cd-instructor-bio');
        if (bioEl) bioEl.textContent = data.instructor.bio;
    }

    // Sections & Lessons logic mapping LessonResponse { durationInSeconds }
    if (data.sections && data.sections.length > 0) {
        const syllabusDiv = document.getElementById('syllabusList');
        syllabusDiv.innerHTML = '';
        data.sections.forEach((sec, idx) => {
            const lessonsCount = sec.lessons ? sec.lessons.length : 0;
            
            let lessonsHtml = '';
            const isEnrolled = window.isEnrolled === true;

            if (sec.lessons) {
                sec.lessons.forEach((les, lidx) => {
                    const isUnlocked = isEnrolled || (idx === 0 && lidx === 0);
                    
                    if (!isUnlocked) {
                        return;
                    }

                    let durationText = "10:00"; // fallback
                    if (les.durationInSeconds != null) {
                        const m = Math.floor(les.durationInSeconds / 60);
                        const s = les.durationInSeconds % 60;
                        durationText = `${m}:${s.toString().padStart(2, '0')}`;
                    }

                    lessonsHtml += `
                        <div class="cd-lesson-row">
                            <div class="cd-lesson-info">
                                <i class="fas fa-play-circle" style="color: var(--primary, #4f46e5);"></i>
                                <span>${lidx + 1}. ${les.title}</span>
                                ${(idx === 0 && lidx === 0 && !isEnrolled) ? `<span class="preview-badge" style="background: #e0f2fe; color: #0369a1; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 500; margin-left: 8px;">Học thử</span>` : ''}
                            </div>
                            <div class="cd-lesson-duration">${durationText}</div>
                        </div>
                    `;
                });
            }

            const fallbackHtml = isEnrolled 
                ? '<p style="color: #94a3b8; font-size: 14px;">Chưa có bài học nào.</p>'
                : `<p style="color: #94a3b8; font-size: 14px; display: flex; align-items: center; gap: 8px; margin: 8px 0;"><i class="fas fa-lock" style="color: #cbd5e1;"></i> Đăng ký khóa học để xem nội dung.</p>`;

            syllabusDiv.innerHTML += `
                <div class="cd-accordion-item">
                    <div class="cd-accordion-header" onclick="this.parentElement.classList.toggle('open')">
                        <div class="cd-accordion-title">
                            <span>Phần ${idx + 1}:</span> ${sec.title}
                        </div>
                        <div class="cd-accordion-meta">
                            <span>${lessonsCount} bài học</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    <div class="cd-accordion-body">
                        ${lessonsHtml || fallbackHtml}
                    </div>
                </div>
            `;
        });
        
        if(syllabusDiv.firstElementChild) {
            syllabusDiv.firstElementChild.classList.add('open');
        }
    }
}

async function loadReviews(courseId) {
    try {
        const res = await fetch(`${API_BASE}/review/get-reviewsForCourse?courseId=${courseId}&page=0&size=5`);
        if (!res.ok) throw new Error("Failed to load reviews");
        const json = await res.json();
        const data = json.result || json;
        
        const reviewContainer = document.getElementById('courseReviewsList');
        if (!reviewContainer) return;

        if (data.content && data.content.length > 0) {
            let html = '';
            data.content.forEach(review => {
                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= review.rating) {
                        stars += '<i class="fas fa-star"></i>';
                    } else {
                        stars += '<i class="far fa-star" style="color:#cbd5e1;"></i>';
                    }
                }
                
                let avatarHtml = `<div class="cd-review-avatar">${review.userName.charAt(0).toUpperCase()}</div>`;
                if (review.avatar) {
                    let avtUrl = review.avatar;
                    if (!avtUrl.startsWith('http')) avtUrl = `${API_BASE}/uploads/${avtUrl}`;
                    avatarHtml = `<div class="cd-review-avatar"><img src="${avtUrl}"></div>`;
                }
                
                const dateText = new Date(review.createdAt).toLocaleDateString('vi-VN');

                html += `
                    <div class="cd-review-item">
                        <div class="cd-review-header">
                            ${avatarHtml}
                            <div class="cd-review-meta">
                                <div class="cd-review-name">${review.userName} <span class="cd-review-date">${dateText}</span></div>
                                <div class="cd-review-stars">${stars}</div>
                            </div>
                        </div>
                        <div class="cd-review-body">
                            ${review.comment || "Không có bình luận."}
                        </div>
                    </div>
                `;
            });
            reviewContainer.innerHTML = html;
        } else {
            reviewContainer.innerHTML = '<p style="color: #94a3b8; font-size: 14.5px;">Chưa có đánh giá nào cho khóa học này.</p>';
        }
    } catch (error) {
        console.error("Error loading reviews:", error);
        // Fallback dummy reviews
        const reviewContainer = document.getElementById('courseReviewsList');
        if (reviewContainer) {
            reviewContainer.innerHTML = `
                <div class="cd-review-item">
                    <div class="cd-review-header">
                        <div class="cd-review-avatar">H</div>
                        <div class="cd-review-meta">
                            <div class="cd-review-name">Học viên ẩn danh <span class="cd-review-date">10/06/2026</span></div>
                            <div class="cd-review-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                        </div>
                    </div>
                    <div class="cd-review-body">Khóa học rất hay và bổ ích, giảng viên siêu nhiệt tình!</div>
                </div>
            `;
        }
    }
}


async function checkEnrollmentStatus(courseId) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    try {
        const res = await fetch(`${API_BASE}/enrollment/status?userId=${userId}&courseId=${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const result = data.result || data;
            
            // Fix: Only set enrolled if it's explicitly true or paymentStatus is PENDING/CONFIRMED
            if (result.isEnrolled === true) {
                setEnrolledState(courseId);
                checkReviewStatus(courseId);
            } else if (result.paymentStatus === 'PENDING') {
                const btn = document.getElementById('enrollBtn');
                if (btn) btn.style.display = 'none';
                const statusDiv = document.getElementById('enrollStatus');
                if (statusDiv) {
                    statusDiv.style.display = 'flex';
                    statusDiv.innerHTML = '<i class="fas fa-clock" style="color:#eab308;"></i> Đang chờ duyệt thanh toán';
                    statusDiv.style.background = '#fef9c3';
                    statusDiv.style.color = '#ca8a04';
                }
            }
        }
    } catch (e) {
        console.log("Not enrolled or error checking status.");
    }
}

async function enrollCourse(courseId, token) {
    // Navigate to checkout page directly
    window.location.href = `checkout.html?courseId=${courseId}`;
}

function setEnrolledState(courseId) {
    window.isEnrolled = true;
    const btn = document.getElementById('enrollBtn');
    if (btn) {
        btn.style.display = 'none';
    }
    const statusDiv = document.getElementById('enrollStatus');
    if (statusDiv) {
        statusDiv.style.display = 'flex';
        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Bạn đã đăng ký khóa này';
    }
    // Re-render course to unlock all lessons
    if (window.currentCourseData) {
        renderCourse(window.currentCourseData);
    }
}

async function checkReviewStatus(courseId) {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    try {
        const res = await fetch(`${API_BASE}/review/check-reviewed?userId=${userId}&courseId=${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const hasReviewed = data.result === true;
            const writeSec = document.getElementById('writeReviewSection');
            if (writeSec) {
                writeSec.style.display = hasReviewed ? 'none' : 'block';
            }
        }
    } catch (e) {
        console.log("Could not check review status.", e);
    }
}

