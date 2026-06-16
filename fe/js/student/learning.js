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
    
    if (!token || !userId) {
        alert("Vui lòng đăng nhập để học.");
        window.location.href = '../login.html';
        return;
    }

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

async function loadLearningData(courseId, userId, token) {
    const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'http://localhost:8080';
    try {
        // Fetch course info & syllabus
        const resCourse = await fetch(`${API_BASE}/course/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!resCourse.ok) throw new Error("Course info not found");
        const jsonCourse = await resCourse.json();
        currentCourseData = jsonCourse.result;
        
        if (!currentCourseData) throw new Error("No course data");

        // Inject sectionId to all lessons so that they have their parent section's ID populated
        if (currentCourseData.sections) {
            currentCourseData.sections.forEach(sec => {
                if (sec.lessons) {
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
        let completedLessons = [];
        try {
            const resProg = await fetch(`${API_BASE}/lessonprogess?courseId=${courseId}&userId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resProg.ok) {
                const progData = await resProg.json();
                if (progData.result && progData.result.completedLessonIds) {
                    completedLessons = progData.result.completedLessonIds;
                }
            }
        } catch (e) {
            console.warn("Could not fetch progress", e);
        }

        renderSyllabus(currentCourseData.sections, completedLessons);

        // Calculate progress text
        let totalLessons = 0;
        if (currentCourseData.sections) {
            currentCourseData.sections.forEach(sec => {
                if (sec.lessons) totalLessons += sec.lessons.length;
            });
        }
        const percent = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
        const progressEl = document.getElementById('progressText');
        if (progressEl) {
            progressEl.textContent = `${percent}% Hoàn thành`;
        }

        // Tự động play lesson đầu tiên nếu chưa có lesson nào được chọn
        if (currentCourseData.sections && currentCourseData.sections.length > 0) {
            const firstSection = currentCourseData.sections[0];
            if (firstSection.lessons && firstSection.lessons.length > 0) {
                playLesson(firstSection.lessons[0], completedLessons.includes(firstSection.lessons[0].id));
            }
        }

    } catch (error) {
        console.warn("API lỗi hoặc không tìm thấy course, dùng dữ liệu mẫu (Dummy data):", error);
        
        // Dummy Fallback Data
        currentCourseData = {
            title: "Dữ liệu mẫu: Khóa học Spring Boot",
            sections: [
                {
                    title: "Giới thiệu khóa học",
                    lessons: [
                        { id: "les-1", title: "Giới thiệu Spring Boot", content: "Bài này giới thiệu về Spring Boot.", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
                        { id: "les-2", title: "Cài đặt môi trường", content: "Cách cài đặt Java và IDE.", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" }
                    ]
                },
                {
                    title: "Kiến trúc REST API",
                    lessons: [
                        { id: "les-3", title: "RESTful API là gì?", content: "Lý thuyết RESTful API.", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" }
                    ]
                }
            ]
        };
        
        const courseTitleHeader = document.getElementById('courseTitleHeader');
        if (courseTitleHeader) {
            courseTitleHeader.textContent = currentCourseData.title;
        }
        renderSyllabus(currentCourseData.sections, []);
        const progressEl = document.getElementById('progressText');
        if (progressEl) {
            progressEl.textContent = "0% Hoàn thành";
        }
        
        if (currentCourseData.sections.length > 0) {
            playLesson(currentCourseData.sections[0].lessons[0], false);
        }
    }
}

function renderSyllabus(sections, completedLessons) {
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
                const isCompleted = completedLessons.includes(les.id);
                const li = document.createElement('li');
                li.className = `lesson-item ${isCompleted ? 'completed' : ''}`;
                li.dataset.lessonId = les.id;
                
                const icon = isCompleted ? 'fa-check-circle' : 'fa-play-circle';
                
                li.innerHTML = `
                    <i class="fas ${icon} lesson-icon"></i>
                    <span>${lIdx + 1}. ${les.title}</span>
                `;

                li.onclick = () => playLesson(les, isCompleted);
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

function playLesson(lesson, isCompleted) {
    const API_BASE = typeof window.API_BASE !== 'undefined' ? window.API_BASE : 'http://localhost:8080';
    currentLessonId = lesson.id;
    currentSectionId = lesson.sectionId || null;
    document.getElementById('lessonTitleDisplay').textContent = lesson.title;
    const descEl = document.getElementById('lessonDescDisplay');
    if (descEl) descEl.innerHTML = lesson.content || lesson.description || '';
    
    const videoObj = document.getElementById('lessonVideo');
    let videoUrl = lesson.contentUrl || lesson.videoUrl || '';
    if (videoUrl && !videoUrl.startsWith('http')) {
        videoUrl = `${API_BASE}/uploads/${videoUrl}`;
    }
    
    // Nếu URL vẫn rỗng, set mặc định để không bị lỗi player
    if (!videoUrl) {
        videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    }
    
    videoObj.src = videoUrl;
    videoObj.load();

    // Update btn status
    const btn = document.getElementById('markCompleteBtn');
    if (isCompleted) {
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

    try {
        const btn = document.getElementById('markCompleteBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        btn.disabled = true;

        console.log("Submitting complete-lesson request:", {
            courseId: courseId,
            sectionId: currentSectionId,
            lessonId: currentLessonId
        });

        const res = await fetch(`${API_BASE}/lessonprogess/complete-lesson?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                lessonId: currentLessonId, 
                courseId: courseId,
                sectionId: currentSectionId
            })
        });

        if (res.ok) {
            // Cập nhật giao diện local
            btn.className = "btn-complete completed";
            btn.innerHTML = '<i class="fas fa-check-double"></i> Đã hoàn thành';
            btn.disabled = true;

            const activeLi = document.querySelector(`.lesson-item[data-lesson-id="${currentLessonId}"]`);
            if (activeLi) {
                activeLi.classList.add('completed');
                const icon = activeLi.querySelector('.lesson-icon');
                if (icon) {
                    icon.classList.remove('fa-play-circle');
                    icon.classList.add('fa-check-circle');
                }
            }
        } else {
            alert("Không thể đánh dấu hoàn thành bài học.");
            btn.innerHTML = '<i class="fas fa-check"></i> Đánh dấu hoàn thành';
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi hệ thống.");
        const btn = document.getElementById('markCompleteBtn');
        btn.innerHTML = '<i class="fas fa-check"></i> Đánh dấu hoàn thành';
        btn.disabled = false;
    }
}
