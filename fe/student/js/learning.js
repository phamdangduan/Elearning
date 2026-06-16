const API_BASE = 'http://localhost:8080';
        let courseData = null;
        let completedLessonIds = [];
        let activeLesson = null;
        let courseId = '';
        let userId = '';
        let token = '';

        // Mock Curriculums for Offline/Fallback Mode
        const mockCurriculums = {
            "course_1": {
                title: "Kiến trúc Bảo mật Hệ thống Cloud & DevOps",
                sections: [
                    {
                        id: "sec_1",
                        title: "Phần 1: Bảo mật hạ tầng Cloud & AWS cơ bản",
                        lessons: [
                            { id: "les_1_1", sectionId: "sec_1", title: "1.1 Giới thiệu về Shared Responsibility Model", contentType: "video", contentUrl: "", durationInSeconds: 600 },
                            { id: "les_1_2", sectionId: "sec_1", title: "1.2 Cấu hình AWS IAM Policies chuẩn Security", contentType: "video", contentUrl: "", durationInSeconds: 900 },
                            { id: "les_1_3", sectionId: "sec_1", title: "1.3 Thực hành quét lỗ hổng với AWS Inspector", contentType: "video", contentUrl: "", durationInSeconds: 720 }
                        ]
                    },
                    {
                        id: "sec_2",
                        title: "Phần 2: Bảo mật Container (Docker & Kubernetes)",
                        lessons: [
                            { id: "les_2_1", sectionId: "sec_2", title: "2.1 Docker Image Security & Multi-stage Builds", contentType: "video", contentUrl: "", durationInSeconds: 840 },
                            { id: "les_2_2", sectionId: "sec_2", title: "2.2 Quét mã độc container registry với Trivy", contentType: "video", contentUrl: "", durationInSeconds: 960 }
                        ]
                    }
                ]
            },
            "course_2": {
                title: "Lập trình AI căn bản với Python & TensorFlow",
                sections: [
                    {
                        id: "sec_ai_1",
                        title: "Phần 1: Tổng quan về AI & Thiết lập môi trường",
                        lessons: [
                            { id: "les_ai_1_1", sectionId: "sec_ai_1", title: "1.1 Lịch sử và tương lai của trí tuệ nhân tạo (AI)", contentType: "video", contentUrl: "", durationInSeconds: 724 },
                            { id: "les_ai_1_2", sectionId: "sec_ai_1", title: "1.2 Hướng dẫn cài đặt Python & Anaconda", contentType: "video", contentUrl: "", durationInSeconds: 500 },
                            { id: "les_ai_1_3", sectionId: "sec_ai_1", title: "1.3 Thực hành làm quen với Jupyter Notebook", contentType: "video", contentUrl: "", durationInSeconds: 920 },
                            { id: "les_ai_1_4", sectionId: "sec_ai_1", title: "1.4 Cấu trúc thư mục chuẩn cho dự án AI", contentType: "video", contentUrl: "", durationInSeconds: 495 }
                        ]
                    },
                    {
                        id: "sec_ai_2",
                        title: "Phần 2: Toán học & Xác suất cho Machine Learning",
                        lessons: [
                            { id: "les_ai_2_1", sectionId: "sec_ai_2", title: "2.1 Đại số tuyến tính & Ma trận cơ bản", contentType: "video", contentUrl: "", durationInSeconds: 1215 },
                            { id: "les_ai_2_2", sectionId: "sec_ai_2", title: "2.2 Sử dụng thư viện NumPy tính toán ma trận", contentType: "video", contentUrl: "", durationInSeconds: 1530 }
                        ]
                    }
                ]
            }
        };

        function getGenericMock(title) {
            return {
                title: title || "Khóa học của tôi",
                sections: [
                    {
                        id: "sec_gen_1",
                        title: "Phần 1: Nội dung giới thiệu & Kiến thức nền tảng",
                        lessons: [
                            { id: "les_gen_1_1", sectionId: "sec_gen_1", title: "1.1 Giới thiệu tổng quan lộ trình học tập", contentType: "video", contentUrl: "", durationInSeconds: 450 },
                            { id: "les_gen_1_2", sectionId: "sec_gen_1", title: "1.2 Thuật ngữ cốt lõi và các khái niệm cơ bản", contentType: "video", contentUrl: "", durationInSeconds: 680 }
                        ]
                    },
                    {
                        id: "sec_gen_2",
                        title: "Phần 2: Thực hành ứng dụng & Bài tập củng cố",
                        lessons: [
                            { id: "les_gen_2_1", sectionId: "sec_gen_2", title: "2.1 Thực hành dựng môi trường thử nghiệm", contentType: "video", contentUrl: "", durationInSeconds: 900 },
                            { id: "les_gen_2_2", sectionId: "sec_gen_2", title: "2.2 Tổng kết chương học & Bài tập thử thách", contentType: "video", contentUrl: "", durationInSeconds: 1200 }
                        ]
                    }
                ]
            };
        }

        async function fetchLearningData() {
            try {
                const headers = {};
                if (token) headers['Authorization'] = 'Bearer ' + token;

                // 0. Verify enrollment & payment request status (skip check for Admin/Instructor roles)
                const role = localStorage.getItem('role');
                if (role !== 'ADMIN' && role !== 'INSTRUCTOR' && role !== 'TEACHER') {
                    const enrollRes = await fetch(`${API_BASE}/enrollment/status?userId=${userId}&courseId=${courseId}`, { headers });
                    if (enrollRes.ok) {
                        const enrollData = await enrollRes.json();
                        const isEnrolled = !!(enrollData.result && (enrollData.result.isEnrolled || enrollData.result.enrolled));
                        const paymentStatus = enrollData.result ? enrollData.result.paymentStatus : null;
                        
                        if (!isEnrolled || (paymentStatus && paymentStatus !== 'CONFIRMED')) {
                            alert("⚠️ Khóa học này chưa được đăng ký hoặc đang chờ duyệt thanh toán. Vui lòng hoàn tất thanh toán trước khi vào học!");
                            window.location.href = `course-detail.html?id=${courseId}`;
                            return;
                        }
                    }
                }

                // 1. Fetch Course details
                const courseRes = await fetch(`${API_BASE}/course/${courseId}`, { headers });
                if (courseRes.ok) {
                    const courseJson = await courseRes.json();
                    if (courseJson && courseJson.result) {
                        courseData = courseJson.result;
                    }
                }

                // 2. Fetch Progress (Completed lessons list)
                const progressRes = await fetch(`${API_BASE}/lessonprogess?courseId=${courseId}&userId=${userId}`, { headers });
                if (progressRes.ok) {
                    const progressJson = await progressRes.json();
                    if (progressJson && progressJson.result && progressJson.result.completedLessonIds) {
                        completedLessonIds = progressJson.result.completedLessonIds;
                    }
                }

                // Check if fetched data has sections, else load mock
                if (!courseData || !courseData.sections || courseData.sections.length === 0) {
                    console.log("Empty database course curriculum, loading fallback mockup.");
                    loadMockFallback();
                }
            } catch (error) {
                console.warn("Backend offline or failed to fetch learning data. Loading mock fallback.", error);
                loadMockFallback();
            }

            // Update title
            const headerTitle = document.querySelector('.learning-header-title');
            if (headerTitle) {
                headerTitle.textContent = courseData?.title || "Tiếp tục học";
            }

            renderCurriculum();
            updateProgressUI();
            selectDefaultLesson();
        }

        function loadMockFallback() {
            if (mockCurriculums[courseId]) {
                courseData = mockCurriculums[courseId];
            } else {
                courseData = getGenericMock(localStorage.getItem('lastCourseTitle') || "Python cho Data Science và Machine Learning 01");
            }

            // Restore mock progress from localstorage
            try {
                const savedProgress = localStorage.getItem('completed_' + courseId);
                if (savedProgress) {
                    completedLessonIds = JSON.parse(savedProgress);
                } else {
                    completedLessonIds = [];
                }
            } catch (e) {
                completedLessonIds = [];
            }
        }

        function formatDuration(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        function renderCurriculum() {
            const listContainer = document.getElementById('curriculumList');
            if (!listContainer || !courseData) return;

            listContainer.innerHTML = courseData.sections.map((section, sIndex) => {
                const totalLessons = section.lessons ? section.lessons.length : 0;
                const completedCount = section.lessons ? section.lessons.filter(l => completedLessonIds.includes(l.id)).length : 0;
                
                const totalSecs = section.lessons ? section.lessons.reduce((sum, l) => sum + (l.durationInSeconds || 0), 0) : 0;
                const durationText = totalSecs > 0 ? `${Math.round(totalSecs / 60)} phút` : 'Tài liệu';

                const lessonsHTML = (section.lessons || []).map(lesson => {
                    const isCompleted = completedLessonIds.includes(lesson.id);
                    const isActive = activeLesson && activeLesson.id === lesson.id;
                    
                    const iconClass = isCompleted ? 'fas fa-check-circle' : 'far fa-play-circle';
                    const durationStr = lesson.durationInSeconds > 0 ? formatDuration(lesson.durationInSeconds) : 'Tài liệu';

                    return `
                        <div class="lesson-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}" data-lesson-id="${lesson.id}" data-section-id="${section.id}" onclick="selectLesson('${section.id}', '${lesson.id}')">
                            <div class="lesson-name">
                                <i class="${iconClass}"></i>
                                <span>${lesson.title}</span>
                            </div>
                            <div class="lesson-duration">${durationStr}</div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="section-item ${sIndex === 0 ? 'open' : ''}">
                        <div class="section-header" onclick="toggleSection(this)">
                            <div class="section-info">
                                <h4>${section.title}</h4>
                                <div class="section-meta">${completedCount} / ${totalLessons} | ${durationText}</div>
                            </div>
                            <i class="fas fa-chevron-down section-toggle"></i>
                        </div>
                        <div class="section-body">
                            ${lessonsHTML}
                        </div>
                    </div>
                `;
            }).join('');
        }

        window.toggleSection = function(headerEl) {
            const sectionItem = headerEl.closest('.section-item');
            sectionItem.classList.toggle('open');
        };

        window.selectLesson = function(sectionId, lessonId) {
            if (!courseData) return;

            const section = courseData.sections.find(s => s.id === sectionId);
            if (!section) return;

            const lesson = section.lessons.find(l => l.id === lessonId);
            if (!lesson) return;

            activeLesson = { ...lesson, sectionId: sectionId };

            // Update sidebar active classes
            document.querySelectorAll('.lesson-item').forEach(item => {
                const itemLessonId = item.getAttribute('data-lesson-id');
                const isCompleted = completedLessonIds.includes(itemLessonId);
                item.classList.remove('active');
                
                const icon = item.querySelector('.lesson-name i');
                if (itemLessonId === lessonId) {
                    item.classList.add('active');
                    if (icon) icon.className = isCompleted ? 'fas fa-check-circle' : 'far fa-play-circle';
                } else {
                    if (icon) icon.className = isCompleted ? 'fas fa-check-circle' : 'far fa-play-circle';
                }
            });

            // Render lesson content in main area
            const lessonTitle = document.querySelector('.lesson-title');
            if (lessonTitle) {
                lessonTitle.textContent = lesson.title;
            }
            
            const overview = document.getElementById('overview');
            if (overview) {
                overview.innerHTML = `
                    <p>Chào mừng bạn đến với bài học <strong>${lesson.title}</strong>.</p>
                    <p>Nội dung chi tiết của bài học đang được tải từ tài nguyên học liệu. Vui lòng học kỹ các tài liệu liên quan và theo dõi video hướng dẫn để hoàn thành mục tiêu bài học.</p>
                `;
            }

            // Update Video Player
            const videoContainer = document.querySelector('.video-container');
            if (videoContainer) {
                if (lesson.contentUrl && (lesson.contentUrl.endsWith('.mp4') || lesson.contentUrl.includes('video'))) {
                    videoContainer.innerHTML = `
                        <video src="${lesson.contentUrl}" controls autoplay style="width:100%; height:100%; object-fit:cover; outline:none;"></video>
                    `;
                } else {
                    videoContainer.innerHTML = `
                        <img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80" alt="Video cover" style="width:100%; height:100%; object-fit:cover; filter: brightness(0.65);">
                        <div class="video-play-btn" style="position: absolute; top:50%; left:50%; transform:translate(-50%, -50%); display:flex; align-items:center; justify-content:center; width:64px; height:64px; background:var(--primary); color:white; border-radius:50%; font-size:20px; cursor:pointer; box-shadow:0 0 20px rgba(99,102,241,0.5);">
                            <i class="fas fa-play" style="margin-left: 4px;"></i>
                        </div>
                    `;
                }
            }

            // Update Mark Complete Button state
            const markCompleteBtn = document.getElementById('markCompleteBtn');
            if (markCompleteBtn) {
                const isCompleted = completedLessonIds.includes(lessonId);
                if (isCompleted) {
                    markCompleteBtn.classList.add('completed');
                    markCompleteBtn.innerHTML = '<i class="fas fa-check-circle"></i> Đã hoàn thành';
                } else {
                    markCompleteBtn.classList.remove('completed');
                    markCompleteBtn.innerHTML = '<i class="fas fa-check"></i> Đánh dấu hoàn thành';
                }
            }
        };

        function selectDefaultLesson() {
            if (!courseData || !courseData.sections || courseData.sections.length === 0) return;

            // Find first in-progress lesson
            for (const section of courseData.sections) {
                if (section.lessons) {
                    for (const lesson of section.lessons) {
                        if (!completedLessonIds.includes(lesson.id)) {
                            selectLesson(section.id, lesson.id);
                            return;
                        }
                    }
                }
            }

            // If all lessons are completed, select the first lesson
            const firstSection = courseData.sections[0];
            if (firstSection && firstSection.lessons && firstSection.lessons.length > 0) {
                selectLesson(firstSection.id, firstSection.lessons[0].id);
            }
        }

        function updateProgressUI() {
            if (!courseData) return;

            let totalLessons = 0;
            courseData.sections.forEach(s => {
                if (s.lessons) totalLessons += s.lessons.length;
            });

            // Get count of completed lessons belonging to this course
            let completedCount = 0;
            courseData.sections.forEach(s => {
                if (s.lessons) {
                    s.lessons.forEach(l => {
                        if (completedLessonIds.includes(l.id)) {
                            completedCount++;
                        }
                    });
                }
            });
            
            const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
            
            const fill = document.querySelector('.progress-bar-fill');
            const txt = document.querySelector('.progress-text');
            
            if (fill) fill.style.width = `${progressPercent}%`;
            if (txt) txt.textContent = `${progressPercent}% Hoàn thành`;
        }

        document.addEventListener('DOMContentLoaded', () => {
            // Check auth status
            token = localStorage.getItem('authToken') || localStorage.getItem('token');
            userId = localStorage.getItem('userId');
            if (!token || !userId) {
                window.location.href = '../login.html';
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            courseId = urlParams.get('id');
            if (!courseId) {
                alert("Lỗi: Không tìm thấy thông tin khóa học!");
                window.location.href = 'courses.html';
                return;
            }

            fetchLearningData();

            // Section Accordion Toggle (backup, normally done via inline onclick)
            const sectionHeaders = document.querySelectorAll('.section-header');
            sectionHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const sectionItem = header.closest('.section-item');
                    sectionItem.classList.toggle('open');
                });
            });

            // Tabs Toggle
            const tabs = document.querySelectorAll('.learning-tab');
            const panes = document.querySelectorAll('.tab-content-pane');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    panes.forEach(p => p.classList.remove('active'));

                    tab.classList.add('active');
                    const targetId = tab.getAttribute('data-target');
                    const targetPane = document.getElementById(targetId);
                    if (targetPane) {
                        targetPane.classList.add('active');
                    }
                });
            });

            // Mark Complete button click handler
            const markCompleteBtn = document.getElementById('markCompleteBtn');
            if (markCompleteBtn) {
                markCompleteBtn.addEventListener('click', async function() {
                    if (!activeLesson) return;

                    const isCompleted = completedLessonIds.includes(activeLesson.id);
                    if (isCompleted) {
                        return; // already completed
                    }

                    try {
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = 'Bearer ' + token;

                        const res = await fetch(`${API_BASE}/lessonprogess/complete-lesson?userId=${userId}`, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({
                                courseId: courseId,
                                sectionId: activeLesson.sectionId,
                                lessonId: activeLesson.id
                            })
                        });

                        if (res.ok) {
                            completedLessonIds.push(activeLesson.id);
                            
                            renderCurriculum();
                            updateProgressUI();
                            
                            this.classList.add('completed');
                            this.innerHTML = '<i class="fas fa-check-circle"></i> Đã hoàn thành';
                            
                            alert("Bài học đã được đánh dấu hoàn thành!");
                        } else {
                            console.warn("Backend completion failed, using local memory fallback.");
                            localComplete();
                        }
                    } catch (error) {
                        console.error("Network error on complete-lesson, using local memory fallback.", error);
                        localComplete();
                    }
                });
            }

            function localComplete() {
                completedLessonIds.push(activeLesson.id);
                localStorage.setItem('completed_' + courseId, JSON.stringify(completedLessonIds));
                
                renderCurriculum();
                updateProgressUI();
                
                if (markCompleteBtn) {
                    markCompleteBtn.classList.add('completed');
                    markCompleteBtn.innerHTML = '<i class="fas fa-check-circle"></i> Đã hoàn thành';
                }
                
                alert("Bài học đã được đánh dấu hoàn thành (Chế độ Demo)!");
            }
        });
