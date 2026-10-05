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
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    // Chưa đăng nhập → về trang login (kèm redirect); sai vai trò → về trang chủ (js/api.js)
    if (!Api.requireRole('STUDENT')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');

    if (!courseId) {
        alert("Không tìm thấy khóa học.");
        window.location.href = 'profile.html';
        return;
    }

    loadLearningData(courseId, userId, token);

    document.getElementById('markCompleteBtn').addEventListener('click', () => {
        markLessonComplete(courseId, userId, token);
    });
});

let currentCourseData = null;
let currentLessonId = null;
let currentSectionId = null;
// Bài đã hoàn thành: cập nhật ngay khi BE báo thành công để bấm lại bài cũ vẫn đúng trạng thái
const completedLessons = new Set();
let totalLessons = 0;

async function loadLearningData(courseId, userId, token) {
    const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'http://localhost:8080';
    try {
        // Fetch course info & syllabus (endpoint /student trả link video, BE kiểm tra đã đăng ký)
        const resCourse = await fetch(`${API_BASE}/course/${courseId}/student?studentId=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resCourse.status === 403) {
            alert("Bạn chưa đăng ký khóa học này.");
            window.location.href = `course-detail.html?id=${courseId}`;
            return;
        }
        if (!resCourse.ok) throw new Error("Course info not found");
        const jsonCourse = await resCourse.json();
        currentCourseData = jsonCourse.result;

        if (!currentCourseData) throw new Error("No course data");

        // Inject sectionId to all lessons so that they have their parent section's ID populated
        totalLessons = 0;
        if (currentCourseData.sections) {
            currentCourseData.sections.forEach(sec => {
                if (sec.lessons) {
                    totalLessons += sec.lessons.length;
                    sec.lessons.forEach(les => {
                        les.sectionId = sec.id;
                    });
                }
            });
        }

        const courseTitleHeader = document.getElementById('courseTitleHeader');
        if (courseTitleHeader) {
            courseTitleHeader.textContent = currentCourseData.title || currentCourseData.courseTitle || 'Khóa học';
        }

        // Fetch progress data if any
        completedLessons.clear();
        try {
            const resProg = await fetch(`${API_BASE}/lessonprogess?courseId=${courseId}&userId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resProg.ok) {
                const progData = await resProg.json();
                (progData.result?.completedLessonIds || []).forEach(id => completedLessons.add(id));
            }
        } catch (e) {
            console.warn("Could not fetch progress", e);
        }

        renderSyllabus(currentCourseData.sections);
        updateProgressText();

        // Mở bài chưa học đầu tiên (hoặc bài đầu tiên nếu đã học hết)
        const allLessons = (currentCourseData.sections || []).flatMap(sec => sec.lessons || []);
        const firstLesson = allLessons.find(les => !completedLessons.has(les.id)) || allLessons[0];
        if (firstLesson) {
            playLesson(firstLesson);
        } else {
            document.getElementById('lessonTitleDisplay').textContent = 'Khóa học chưa có bài học nào.';
            document.getElementById('markCompleteBtn').style.display = 'none';
            showLessonDocument('<i class="fas fa-inbox doc-icon"></i><p>Khóa học chưa có bài học nào.</p>');
        }

    } catch (error) {
        console.error("Không tải được khóa học:", error);
        const courseTitleHeader = document.getElementById('courseTitleHeader');
        if (courseTitleHeader) courseTitleHeader.textContent = 'Không tải được khóa học';
        document.getElementById('lessonTitleDisplay').textContent = 'Không tải được nội dung khóa học. Vui lòng thử lại.';
        document.getElementById('markCompleteBtn').style.display = 'none';
        document.getElementById('syllabusContent').innerHTML = Api.errorHtml();
    }
}

function updateProgressText() {
    const percent = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;
    const progressEl = document.getElementById('progressText');
    if (progressEl) {
        progressEl.textContent = `${percent}% Hoàn thành`;
    }
}

function renderSyllabus(sections) {
    const container = document.getElementById('syllabusContent');
    container.innerHTML = '';

    if (!sections || sections.length === 0) {
        container.innerHTML = '<div style="padding: 20px; color: #9ca3af;">Khóa học chưa có nội dung.</div>';
        return;
    }

    sections.forEach((sec, sIdx) => {
        const group = document.createElement('div');
        group.className = 'section-group';

        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <span>Phần ${sIdx + 1}: ${sec.title}</span>
            <i class="fas fa-chevron-down"></i>
        `;

        const list = document.createElement('ul');
        list.className = 'lesson-list';

        if (sec.lessons) {
            sec.lessons.forEach((les, lIdx) => {
                const isCompleted = completedLessons.has(les.id);
                const li = document.createElement('li');
                li.className = `lesson-item ${isCompleted ? 'completed' : ''}`;
                li.dataset.lessonId = les.id;

                const icon = isCompleted ? 'fa-check-circle' : lessonTypeIcon(les.contentType);

                li.innerHTML = `
                    <i class="fas ${icon} lesson-icon"></i>
                    <span>${lIdx + 1}. ${les.title}</span>
                `;

                li.onclick = () => playLesson(les);
                list.appendChild(li);
            });
        }

        group.appendChild(header);
        group.appendChild(list);
        container.appendChild(group);

        // Toggle section
        header.onclick = () => {
            list.style.display = list.style.display === 'none' ? 'block' : 'none';
        };
    });
}

function lessonTypeIcon(contentType) {
    switch ((contentType || 'VIDEO').toUpperCase()) {
        case 'PDF': return 'fa-file-pdf';
        case 'DOCUMENT': return 'fa-file-alt';
        case 'QUIZ': return 'fa-question-circle';
        default: return 'fa-play-circle';
    }
}

// Ẩn video, hiện khung nội dung thay thế (tài liệu, quiz, bài chưa có nội dung)
function showLessonDocument(html) {
    const videoObj = document.getElementById('lessonVideo');
    videoObj.pause();
    videoObj.removeAttribute('src');
    videoObj.load();
    videoObj.hidden = true;

    const docEl = document.getElementById('lessonDocument');
    docEl.innerHTML = html;
    docEl.hidden = false;
}

function showLessonVideo(url) {
    document.getElementById('lessonDocument').hidden = true;
    const videoObj = document.getElementById('lessonVideo');
    videoObj.hidden = false;
    videoObj.src = url;
    videoObj.load();
}

function playLesson(lesson) {
    const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'http://localhost:8080';
    currentLessonId = lesson.id;
    currentSectionId = lesson.sectionId || null;
    document.getElementById('lessonTitleDisplay').textContent = lesson.title;
    const descEl = document.getElementById('lessonDescDisplay');
    if (descEl) descEl.innerHTML = lesson.content || lesson.description || '';

    let contentUrl = lesson.contentUrl || lesson.videoUrl || '';
    if (contentUrl && !contentUrl.startsWith('http')) {
        contentUrl = `${API_BASE}/uploads/${contentUrl}`;
    }

    const type = (lesson.contentType || 'VIDEO').toUpperCase();
    if (!contentUrl) {
        showLessonDocument('<i class="fas fa-hourglass-half doc-icon"></i><p>Bài học chưa có nội dung. Giảng viên sẽ cập nhật sau.</p>');
    } else if (type === 'VIDEO') {
        showLessonVideo(contentUrl);
    } else if (type === 'PDF') {
        showLessonDocument(`<iframe src="${contentUrl}" title="${lesson.title}"></iframe>`);
    } else {
        // DOCUMENT (docx, pptx...) và QUIZ: trình duyệt không nhúng được → mở ở tab mới
        const label = type === 'QUIZ' ? 'Làm bài kiểm tra' : 'Mở tài liệu';
        showLessonDocument(`
            <i class="fas ${lessonTypeIcon(type)} doc-icon"></i>
            <p>${type === 'QUIZ' ? 'Bài kiểm tra' : 'Tài liệu'}: ${lesson.title}</p>
            <a class="doc-open-btn" href="${contentUrl}" target="_blank" rel="noopener">${label} <i class="fas fa-external-link-alt"></i></a>`);
    }

    // Update btn status
    const btn = document.getElementById('markCompleteBtn');
    btn.style.display = '';
    if (completedLessons.has(lesson.id)) {
        btn.className = "btn-complete completed";
        btn.innerHTML = '<i class="fas fa-check-double"></i> Đã hoàn thành';
        btn.disabled = true;
    } else {
        btn.className = "btn-complete";
        btn.innerHTML = '<i class="fas fa-check"></i> Đánh dấu hoàn thành';
        btn.disabled = false;
    }

    // Highlight sidebar
    document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
    const activeLi = document.querySelector(`.lesson-item[data-lesson-id="${lesson.id}"]`);
    if (activeLi) activeLi.classList.add('active');
}

async function markLessonComplete(courseId, userId, token) {
    if (!currentLessonId) return;
    const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'http://localhost:8080';
    const lessonId = currentLessonId;
    const btn = document.getElementById('markCompleteBtn');

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        btn.disabled = true;

        const res = await fetch(`${API_BASE}/lessonprogess/complete-lesson?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lessonId: lessonId,
                courseId: courseId,
                sectionId: currentSectionId
            })
        });

        if (res.ok) {
            completedLessons.add(lessonId);
            updateProgressText();

            // Người dùng có thể đã chuyển sang bài khác trong lúc chờ BE
            if (currentLessonId === lessonId) {
                btn.className = "btn-complete completed";
                btn.innerHTML = '<i class="fas fa-check-double"></i> Đã hoàn thành';
                btn.disabled = true;
            }

            const li = document.querySelector(`.lesson-item[data-lesson-id="${lessonId}"]`);
            if (li) {
                li.classList.add('completed');
                const icon = li.querySelector('.lesson-icon');
                if (icon) icon.className = 'fas fa-check-circle lesson-icon';
            }
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.message || "Không thể đánh dấu hoàn thành bài học.");
            btn.innerHTML = '<i class="fas fa-check"></i> Đánh dấu hoàn thành';
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi kết nối máy chủ.");
        btn.innerHTML = '<i class="fas fa-check"></i> Đánh dấu hoàn thành';
        btn.disabled = false;
    }
}
