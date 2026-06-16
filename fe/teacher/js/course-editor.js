const API_BASE = 'http://localhost:8080';
        
        // Retrieve course ID from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');

        let courseData = null;
        let categories = [];
        let syllabus = []; // Cached Sections & Lessons

        const dummyCategories = [
            { id: "cat_frontend", name: "Frontend" },
            { id: "cat_backend", name: "Backend" },
            { id: "cat_mobile", name: "Mobile" },
            { id: "cat_database", name: "Database" },
            { id: "cat_devops", name: "DevOps" }
        ];

        // ── Auth Verification ──
        function checkTeacherAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            const role = localStorage.getItem('userRole');
            
            if (!token || !uid || role !== 'TEACHER' || !courseId) {
                window.location.href = 'courses.html';
                return null;
            }
            return { token, uid };
        }

        // ── Feedback Banner ──
        function showFeedback(message, type = 'success') {
            const banner = document.getElementById('alertBanner');
            if (banner) {
                banner.textContent = message;
                banner.className = `alert-banner ${type}`;
                banner.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => banner.style.display = 'none', 4000);
            }
        }

        // ── Load Categories ──
        async function loadCategories() {
            try {
                const res = await fetch(`${API_BASE}/category`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        categories = data.result;
                        populateCategoryDropdown(categories);
                        return;
                    }
                }
                throw new Error("Failed to load categories");
            } catch (e) {
                categories = dummyCategories;
                populateCategoryDropdown(categories);
            }
        }

        function populateCategoryDropdown(cats) {
            const select = document.getElementById('categorySelect');
            if (select) {
                select.innerHTML = '<option value="">Chọn danh mục</option>' + 
                    cats.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            }
        }

        // ── Load Course Metadata ──
        async function loadCourseDetails(auth) {
            try {
                const res = await fetch(`${API_BASE}/course/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        courseData = data.result;
                        populateCourseDetails(courseData);
                        return;
                    }
                }
                throw new Error("Failed to load course details");
            } catch (error) {
                console.warn("Course Details API failed or offline, trying local mockup database.", error);
                
                let localCourses = [];
                try {
                    const localSaved = localStorage.getItem('mockTeacherCourses');
                    if (localSaved) {
                        localCourses = JSON.parse(localSaved);
                    }
                } catch (e) {
                    console.error("Failed to parse mockTeacherCourses from localStorage", e);
                }
                
                courseData = Array.isArray(localCourses) ? localCourses.find(c => c.id === courseId) : null;
                
                if (!courseData) {
                    // Create default fallback course metadata
                    courseData = {
                        id: courseId,
                        title: "Khóa học mẫu của tôi",
                        price: 1500000,
                        thumbnailUrl: "",
                        categoryIds: ["cat_1"],
                        description: "Mô tả khóa học chi tiết đang được cập nhật...",
                        status: "DRAFT"
                    };
                }
                
                populateCourseDetails(courseData);
            }
        }

        function populateCourseDetails(course) {
            document.getElementById('courseTitleHeader').textContent = course.title;
            
            // Set Status badge
            const badge = document.getElementById('courseStatusBadge');
            const isPub = course.status === 'PUBLISH' || course.status === 'PUBLISHED';
            badge.textContent = isPub ? 'Publish' : 'Draft';
            badge.className = `badge ${isPub ? 'publish' : 'draft'}`;
            
            // Hide publish button if already published
            const btnPublish = document.getElementById('btnPublishCourse');
            if (isPub) {
                btnPublish.disabled = true;
                btnPublish.innerHTML = '<i class="fas fa-check-circle" style="margin-right:6px;"></i> Đã xuất bản';
            }

            // Fill inputs
            document.getElementById('titleInput').value = course.title || '';
            document.getElementById('priceInput').value = course.price || 0;
            document.getElementById('descInput').value = course.description || '';
            const defaultSvg = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238b5cf6'/%3E%3Cstop offset='100%25' stop-color='%236366f1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='360' fill='url(%23g)'/%3E%3Cpath d='M300 130c-16.5 0-30 13.5-30 30s13.5 30 30 30 30-13.5 30-30-13.5-30-30-30zm0 48c-9.9 0-18-8.1-18-18s8.1-18 18-18 18 8.1 18 18-8.1 18-18 18z' fill='white' fill-opacity='0.85'/%3E%3Cpath d='M336 112h-18.3l-8.5-11.4c-1.9-2.5-4.8-4-8-4H298.8c-3.2 0-6.1 1.5-8 4l-8.5 11.4H264c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h72c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16zm4 80c0 2.2-1.8 4-4 4H264c-2.2 0-4-1.8-4-4v-64c0-2.2 1.8-4 4-4h22.2c3.2 0 6.1-1.5 8-4l8.5-11.4c.6-.8 1.6-1.2 2.6-1.2h21.4c1 0 2 .4 2.6 1.2l8.5 11.4c1.9 2.5 4.8 4 8 4H336c2.2 0 4 1.8 4 4v64z' fill='white' fill-opacity='0.85'/%3E%3Ctext x='300' y='242' fill='white' fill-opacity='0.85' font-family='sans-serif' font-size='16' font-weight='600' text-anchor='middle'%3EEduVN Nền Tảng Giảng Viên%3C/text%3E%3C/svg%3E";
            document.getElementById('courseThumbnail').src = course.thumbnailUrl || defaultSvg;
            
            // Set category
            if (course.categoryIds && course.categoryIds.length > 0) {
                document.getElementById('categorySelect').value = course.categoryIds[0];
            } else if (course.categoryId) {
                document.getElementById('categorySelect').value = course.categoryId;
            }
        }

        // ── Load Syllabus (Sections & Lessons) ──
        async function loadSyllabus(auth) {
            try {
                const res = await fetch(`${API_BASE}/section/course/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        syllabus = data.result;
                        renderSyllabus(syllabus);
                        return;
                    }
                }
                throw new Error("Failed to load syllabus");
            } catch (error) {
                console.warn("Syllabus API failed or offline. Using mock syllabus in local session.", error);
                
                let localSyllabusData = null;
                try {
                    const localSaved = localStorage.getItem(`mockSyllabus_${courseId}`);
                    if (localSaved) {
                        localSyllabusData = JSON.parse(localSaved);
                    }
                } catch (e) {
                    console.error("Failed to parse mock syllabus", e);
                }

                if (localSyllabusData && Array.isArray(localSyllabusData)) {
                    syllabus = localSyllabusData;
                } else {
                    // Generate initial mock section outline
                    syllabus = [
                        {
                            id: "sec_1",
                            title: "Chương 1: Khởi động cơ bản",
                            lessons: [
                                {
                                    id: "les_1",
                                    title: "1.1 Giới thiệu tổng quan lộ trình",
                                    contentUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
                                    durationInSeconds: 320
                                }
                            ]
                        }
                    ];
                    localStorage.setItem(`mockSyllabus_${courseId}`, JSON.stringify(syllabus));
                }
                renderSyllabus(syllabus);
            }
        }

        function renderSyllabus(sections) {
            const container = document.getElementById('syllabusContainer');
            if (!container) return;

            if (sections.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding: 40px 0; color:var(--text-muted);">
                        Chưa có chương học nào được tạo. Hãy bấm "Thêm chương mới" để bắt đầu xây dựng bài giảng!
                    </div>
                `;
                return;
            }

            container.innerHTML = sections.map((sec, secIdx) => {
                const lessonsHTML = (!sec.lessons || sec.lessons.length === 0) ? `
                    <div style="text-align: center; color: var(--text-muted); font-size:12.5px; padding: 15px 0;">
                        Chưa có bài học nào được tạo cho chương này.
                    </div>
                ` : sec.lessons.map(les => {
                    const mins = Math.floor(les.durationInSeconds / 60);
                    const secs = les.durationInSeconds % 60;
                    const durationText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                    return `
                        <div class="lesson-item">
                            <div class="lesson-meta">
                                <i class="far fa-play-circle" style="color: var(--primary); font-size:16px;"></i>
                                <div>
                                    <span class="lesson-title-text">${les.title}</span>
                                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                                        URL: <a href="${les.contentUrl}" target="_blank" style="color:inherit; word-break:break-all;">${les.contentUrl}</a>
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span class="lesson-duration">${durationText}</span>
                                <button class="section-action-btn delete" onclick="deleteLesson('${les.id}')" title="Xóa bài học"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="section-box" id="section_box_${sec.id}">
                        <div class="section-header">
                            <div class="section-title-wrap">
                                <i class="fas fa-folder-open" style="color: var(--primary);"></i>
                                <span>${sec.title}</span>
                            </div>
                            <div class="section-actions">
                                <button class="section-action-btn edit" onclick="openEditSectionModal('${sec.id}', '${sec.title}')" title="Sửa tên chương"><i class="fas fa-pen"></i> Sửa</button>
                                <button class="section-action-btn delete" onclick="deleteSection('${sec.id}')" title="Xóa chương"><i class="fas fa-trash"></i> Xóa</button>
                            </div>
                        </div>
                        <div class="lessons-list">
                            ${lessonsHTML}
                        </div>
                        <button class="add-lesson-btn" onclick="openAddLessonModal('${sec.id}')">
                            <i class="fas fa-plus"></i> Thêm bài giảng vào chương này
                        </button>
                    </div>
                `;
            }).join('');
        }

        // ── Save General Settings ──
        async function saveGeneralSettings(e) {
            e.preventDefault();
            const auth = checkTeacherAuth();
            if (!auth) return;

            const btnSave = document.getElementById('btnSaveSettings');
            const originalText = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 6px;"></i> Đang lưu...';

            const title = document.getElementById('titleInput').value.trim();
            const price = parseFloat(document.getElementById('priceInput').value);
            const categoryId = document.getElementById('categorySelect').value;
            const description = document.getElementById('descInput').value.trim();
            const thumbnailUrl = document.getElementById('courseThumbnail').src;

            const requestBody = {
                title: title,
                price: price,
                categoryIds: [categoryId],
                description: description,
                thumbnailUrl: thumbnailUrl.includes('via.placeholder.com') ? "" : thumbnailUrl
            };

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/course/${courseId}/update?instructorId=${auth.uid}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        courseData = data.result;
                        populateCourseDetails(courseData);
                        showFeedback("Lưu thiết lập chung khóa học thành công!");
                        
                        btnSave.disabled = false;
                        btnSave.innerHTML = originalText;
                        return;
                    }
                }
                throw new Error("Failed to update settings");
            } catch (error) {
                console.warn("Backend update API offline. Saving mockup settings locally.", error);
                
                await new Promise(r => setTimeout(r, 600));
                
                // Update local courses cache database
                const localCourses = JSON.parse(localStorage.getItem('mockTeacherCourses') || '[]');
                const idx = localCourses.findIndex(c => c.id === courseId);
                
                const selectedCat = categories.find(c => c.id === categoryId);
                const updatedCourse = {
                    ...courseData,
                    title: title,
                    price: price,
                    categoryIds: [categoryId],
                    categoryName: selectedCat ? selectedCat.name : "Chưa phân loại",
                    description: description,
                    thumbnailUrl: requestBody.thumbnailUrl
                };

                if (idx !== -1) {
                    localCourses[idx] = updatedCourse;
                } else {
                    localCourses.push(updatedCourse);
                }
                
                localStorage.setItem('mockTeacherCourses', JSON.stringify(localCourses));
                courseData = updatedCourse;
                populateCourseDetails(courseData);
                
                showFeedback("Lưu thiết lập thành công (Chế độ Demo)!");
                btnSave.disabled = false;
                btnSave.innerHTML = originalText;
            }
        }

        // ── Publish Course ──
        async function publishCourse() {
            const auth = checkTeacherAuth();
            if (!auth) return;

            if (!confirm("Bạn có chắc muốn xuất bản khóa học này lên trang bán hàng để học viên có thể đăng ký không?")) {
                return;
            }

            const btnPublish = document.getElementById('btnPublishCourse');
            btnPublish.disabled = true;
            btnPublish.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Đang xuất bản...';

            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/course/${courseId}/publish?instructorId=${auth.uid}`, {
                    method: 'PATCH',
                    headers: headers
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        courseData = data.result;
                        populateCourseDetails(courseData);
                        showFeedback("Xuất bản khóa học thành công!");
                        return;
                    }
                }
                throw new Error("Failed to publish");
            } catch (error) {
                console.warn("Backend publish API failed. Updating mockup status locally.", error);
                
                const localCourses = JSON.parse(localStorage.getItem('mockTeacherCourses') || '[]');
                const idx = localCourses.findIndex(c => c.id === courseId);
                
                const updatedCourse = {
                    ...courseData,
                    status: "PUBLISH"
                };

                if (idx !== -1) {
                    localCourses[idx] = updatedCourse;
                }
                localStorage.setItem('mockTeacherCourses', JSON.stringify(localCourses));
                courseData = updatedCourse;
                populateCourseDetails(courseData);
                
                showFeedback("Xuất bản khóa học thành công (Chế độ Demo)!");
            }
        }

        // ── Course Thumbnail Upload ──
        async function handleThumbnailUpload(file) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            const headers = {};
            if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

            const formData = new FormData();
            formData.append('image', file);

            try {
                // Upload thumbnail image file
                const res = await fetch(`${API_BASE}/course/upload-thumbnail?instructorId=${auth.uid}`, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result && data.result.url) {
                        document.getElementById('courseThumbnail').src = data.result.url;
                        showFeedback("Tải ảnh bìa lên thành công! Bấm 'Lưu thiết lập chung' để áp dụng.");
                        return;
                    }
                }
                throw new Error("Upload failed");
            } catch (error) {
                console.warn("Backend upload failed. Simulating local image upload preview.", error);
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('courseThumbnail').src = e.target.result;
                    showFeedback("Tải ảnh lên thành công (Chế độ Demo)! Bấm 'Lưu thiết lập chung' để áp dụng.");
                };
                reader.readAsDataURL(file);
            }
        }

        // ── Section Submit (Add / Edit) ──
        async function handleSectionSubmit(e) {
            e.preventDefault();
            const auth = checkTeacherAuth();
            if (!auth) return;

            const sectionId = document.getElementById('editSectionId').value;
            const title = document.getElementById('sectionTitleInput').value.trim();

            const isEdit = sectionId !== "";
            
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                let res;
                if (isEdit) {
                    res = await fetch(`${API_BASE}/section/update/${sectionId}?instructorId=${auth.uid}`, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify({ title: title })
                    });
                } else {
                    res = await fetch(`${API_BASE}/section/created/${courseId}?instructorId=${auth.uid}`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ title: title })
                    });
                }

                if (res.ok) {
                    showFeedback(isEdit ? "Cập nhật chương học thành công!" : "Thêm chương học mới thành công!");
                    closeSectionModal();
                    loadSyllabus(auth);
                    return;
                }
                throw new Error("Failed to process section");
            } catch (e) {
                console.warn("Section API offline, updating local mock state.");
                
                if (isEdit) {
                    const sec = syllabus.find(s => s.id === sectionId);
                    if (sec) sec.title = title;
                } else {
                    const mockNewSection = {
                        id: 'sec_' + Date.now(),
                        title: title,
                        lessons: []
                    };
                    syllabus.push(mockNewSection);
                }

                localStorage.setItem(`mockSyllabus_${courseId}`, JSON.stringify(syllabus));
                renderSyllabus(syllabus);
                closeSectionModal();
                showFeedback("Lưu chương học thành công (Chế độ Demo)!");
            }
        }

        // ── Delete Section ──
        window.deleteSection = async function(sectionId) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            if (!confirm("Bạn có chắc muốn xóa chương học này cùng tất cả bài học bên trong không?")) {
                return;
            }

            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/section/${sectionId}/delete?instructorId=${auth.uid}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (res.ok) {
                    showFeedback("Xóa chương học thành công!");
                    loadSyllabus(auth);
                    return;
                }
                throw new Error("Failed to delete section");
            } catch(error) {
                console.warn("Section API failed. Deleting locally in mockup mode.");
                syllabus = syllabus.filter(s => s.id !== sectionId);
                localStorage.setItem(`mockSyllabus_${courseId}`, JSON.stringify(syllabus));
                renderSyllabus(syllabus);
                showFeedback("Xóa chương học thành công (Chế độ Demo)!");
            }
        };

        // ── Lesson Submit ──
        async function handleLessonSubmit(e) {
            e.preventDefault();
            const auth = checkTeacherAuth();
            if (!auth) return;

            const sectionId = document.getElementById('lessonSectionId').value;
            const title = document.getElementById('lessonTitleInput').value.trim();
            const contentUrl = document.getElementById('lessonUrlInput').value.trim();
            const duration = parseInt(document.getElementById('lessonDurationInput').value);

            const requestBody = {
                title: title,
                contentUrl: contentUrl,
                contentType: 'VIDEO',
                durationInSeconds: duration
            };

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/lesson/create/${sectionId}?instructorId=${auth.uid}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });

                if (res.ok) {
                    showFeedback("Thêm bài giảng mới thành công!");
                    closeLessonModal();
                    loadSyllabus(auth);
                    return;
                }
                throw new Error("Failed to create lesson");
            } catch(error) {
                console.warn("Lesson API offline. Creating lesson in mock database locally.");

                const section = syllabus.find(s => s.id === sectionId);
                if (section) {
                    if (!section.lessons) section.lessons = [];
                    section.lessons.push({
                        id: 'les_' + Date.now(),
                        title: title,
                        contentUrl: contentUrl,
                        durationInSeconds: duration
                    });
                }

                localStorage.setItem(`mockSyllabus_${courseId}`, JSON.stringify(syllabus));
                renderSyllabus(syllabus);
                closeLessonModal();
                showFeedback("Thêm bài giảng thành công (Chế độ Demo)!");
            }
        }

        // ── Delete Lesson ──
        window.deleteLesson = async function(lessonId) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            if (!confirm("Bạn có chắc chắn muốn xóa bài giảng này không?")) {
                return;
            }

            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/lesson/${lessonId}/delete?instructorId=${auth.uid}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (res.ok) {
                    showFeedback("Xóa bài giảng thành công!");
                    loadSyllabus(auth);
                    return;
                }
                throw new Error("Failed to delete lesson");
            } catch(error) {
                console.warn("Lesson API failed, deleting lesson locally in mockup db.");
                syllabus.forEach(sec => {
                    if (sec.lessons) {
                        sec.lessons = sec.lessons.filter(l => l.id !== lessonId);
                    }
                });
                localStorage.setItem(`mockSyllabus_${courseId}`, JSON.stringify(syllabus));
                renderSyllabus(syllabus);
                showFeedback("Xóa bài giảng thành công (Chế độ Demo)!");
            }
        };

        // ── Video Upload Handler ──
        async function handleVideoUpload(file) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            const progressContainer = document.getElementById('videoProgressContainer');
            const progressFill = document.getElementById('videoProgressBarFill');
            const progressText = document.getElementById('videoProgressText');

            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            progressText.textContent = "Đang tải lên: 0%";

            const headers = {};
            if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

            const formData = new FormData();
            formData.append('video', file);

            try {
                // Simulate progress updates on frontend for aesthetics since standard fetch doesn't support progress events
                let progress = 0;
                const progressInterval = setInterval(() => {
                    if (progress < 90) {
                        progress += 10;
                        progressFill.style.width = `${progress}%`;
                        progressText.textContent = `Đang tải lên: ${progress}%`;
                    }
                }, 300);

                const res = await fetch(`${API_BASE}/lesson/upload-video?instructorId=${auth.uid}`, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });

                clearInterval(progressInterval);

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result && data.result.url) {
                        progressFill.style.width = '100%';
                        progressText.textContent = "Tải lên thành công! 100%";
                        document.getElementById('lessonUrlInput').value = data.result.url;
                        setTimeout(() => progressContainer.style.display = 'none', 1000);
                        return;
                    }
                }
                throw new Error("Upload failed");
            } catch (error) {
                console.warn("Backend video upload failed. Simulating upload progress bar.", error);
                
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 20;
                    progressFill.style.width = `${progress}%`;
                    progressText.textContent = `Đang tải lên (Chế độ Demo): ${progress}%`;
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                        // Generate mock video URL using Cloudinary sample
                        document.getElementById('lessonUrlInput').value = "https://res.cloudinary.com/demo/video/upload/dog.mp4";
                        progressText.textContent = "Hoàn thành! 100%";
                        setTimeout(() => progressContainer.style.display = 'none', 1000);
                    }
                }, 200);
            }
        }

        // ── Modal Handlers ──
        const sectionModal = document.getElementById('sectionModal');
        const lessonModal = document.getElementById('lessonModal');

        window.openAddSectionModal = function() {
            document.getElementById('sectionForm').reset();
            document.getElementById('editSectionId').value = "";
            document.getElementById('sectionModalTitle').textContent = "Thêm chương học mới";
            sectionModal.style.display = 'flex';
        };

        window.openEditSectionModal = function(id, title) {
            document.getElementById('sectionTitleInput').value = title;
            document.getElementById('editSectionId').value = id;
            document.getElementById('sectionModalTitle').textContent = "Sửa tên chương học";
            sectionModal.style.display = 'flex';
        };

        window.openAddLessonModal = function(sectionId) {
            document.getElementById('lessonForm').reset();
            document.getElementById('lessonSectionId').value = sectionId;
            document.getElementById('videoProgressContainer').style.display = 'none';
            lessonModal.style.display = 'flex';
        };

        function closeSectionModal() { sectionModal.style.display = 'none'; }
        function closeLessonModal() { lessonModal.style.display = 'none'; }

        // ── DOM Listeners ──
        document.addEventListener('DOMContentLoaded', () => {
            const auth = checkTeacherAuth();
            if (!auth) return;

            // Username display
            const nameEl = document.getElementById('instructorName');
            if (nameEl) {
                nameEl.textContent = localStorage.getItem('userName') || 'Giảng viên';
            }

            loadCategories();
            loadCourseDetails(auth);
            loadSyllabus(auth);

            // Thumbnail Click trigger
            const thumbContainer = document.getElementById('thumbnailContainer');
            const thumbFileInput = document.getElementById('thumbnailFileInput');
            thumbContainer.addEventListener('click', () => thumbFileInput.click());
            thumbFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleThumbnailUpload(file);
            });

            // Video Upload click trigger
            const btnUploadVideo = document.getElementById('btnTriggerVideoUpload');
            const videoFileInput = document.getElementById('videoFileInput');
            btnUploadVideo.addEventListener('click', () => videoFileInput.click());
            videoFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleVideoUpload(file);
            });

            // Settings form submit
            document.getElementById('courseSettingsForm').addEventListener('submit', saveGeneralSettings);

            // Publish trigger
            document.getElementById('btnPublishCourse').addEventListener('click', publishCourse);

            // Modal Toggles
            document.getElementById('btnOpenSectionModal').addEventListener('click', window.openAddSectionModal);
            document.getElementById('btnCloseSectionModal').addEventListener('click', closeSectionModal);
            document.getElementById('btnCancelSection').addEventListener('click', closeSectionModal);
            document.getElementById('btnCloseLessonModal').addEventListener('click', closeLessonModal);
            document.getElementById('btnCancelLesson').addEventListener('click', closeLessonModal);

            sectionModal.addEventListener('click', (e) => { if (e.target === sectionModal) closeSectionModal(); });
            lessonModal.addEventListener('click', (e) => { if (e.target === lessonModal) closeLessonModal(); });

            // Form Submissions
            document.getElementById('sectionForm').addEventListener('submit', handleSectionSubmit);
            document.getElementById('lessonForm').addEventListener('submit', handleLessonSubmit);

            // Logout
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        });
