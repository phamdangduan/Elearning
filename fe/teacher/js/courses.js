const API_BASE = 'http://localhost:8080';
        let myCourses = [];
        let categories = [];

        // Dummy data for mockup mode
        const dummyCourses = [
            {
                id: "course_1",
                title: "Kiến trúc Bảo mật Hệ thống Cloud & DevOps",
                price: 1899000,
                thumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&q=80",
                categoryName: "Lập trình",
                studentsCount: 15,
                averageRating: 4.8,
                status: "PUBLISH"
            },
            {
                id: "course_2",
                title: "Lập trình AI căn bản với Python & TensorFlow",
                price: 2499000,
                thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80",
                categoryName: "Lập trình",
                studentsCount: 8,
                averageRating: 4.9,
                status: "PUBLISH"
            },
            {
                id: "course_3",
                title: "Thiết kế UI/UX Nâng cao cho Sản phẩm SaaS",
                price: 1299000,
                thumbnailUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=150&q=80",
                categoryName: "Thiết kế",
                studentsCount: 12,
                averageRating: 4.7,
                status: "PUBLISH"
            },
            {
                id: "course_4",
                title: "Xây dựng microservices với Spring Cloud",
                price: 2199000,
                thumbnailUrl: "",
                categoryName: "Lập trình",
                studentsCount: 0,
                averageRating: 0.0,
                status: "DRAFT"
            }
        ];

        const dummyCategories = [
            { id: "cat_frontend", name: "Frontend" },
            { id: "cat_backend", name: "Backend" },
            { id: "cat_mobile", name: "Mobile" },
            { id: "cat_database", name: "Database" },
            { id: "cat_devops", name: "DevOps" }
        ];

        // ── Auth Check ──
        function checkTeacherAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            const role = localStorage.getItem('userRole');
            
            if (!token || !uid || role !== 'TEACHER') {
                window.location.href = '../login.html';
                return null;
            }
            return { token, uid };
        }

        // ── Show feedback banner ──
        function showFeedback(message, type = 'success') {
            const banner = document.getElementById('alertBanner');
            if (banner) {
                banner.textContent = message;
                banner.className = `alert-banner ${type}`;
                banner.style.display = 'block';
                setTimeout(() => banner.style.display = 'none', 4000);
            }
        }

        // ── Load Categories for select input ──
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
                throw new Error("Failed to fetch categories");
            } catch (e) {
                console.warn("Categories API offline, using dummy categories.");
                categories = dummyCategories;
                populateCategoryDropdown(categories);
            }
        }

        function populateCategoryDropdown(cats) {
            const select = document.getElementById('courseCategorySelect');
            if (!select) return;
            select.innerHTML = '<option value="">Chọn danh mục khóa học</option>' + 
                cats.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }

        // ── Load Instructor Courses ──
        async function loadCourses(auth) {
            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;
                
                const res = await fetch(`${API_BASE}/course/teacher?userId=${auth.uid}&page=0&size=100`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result && data.result.content) {
                        myCourses = data.result.content;
                        renderCourses(myCourses);
                        return;
                    }
                }
                throw new Error("Failed to fetch courses");
            } catch (error) {
                console.warn("Courses API offline, using local mockup fallback database.");
                const localSaved = localStorage.getItem('mockTeacherCourses');
                if (localSaved) {
                    try {
                        myCourses = JSON.parse(localSaved);
                    } catch(e) {
                        myCourses = [...dummyCourses];
                    }
                } else {
                    myCourses = [...dummyCourses];
                }
                renderCourses(myCourses);
            }
        }

        function renderCourses(courses) {
            const tbody = document.getElementById('coursesTableBody');
            if (!tbody) return;

            // Compute totals
            let totalCourses = courses.length;
            let totalStudents = 0;
            let totalRevenue = 0;

            courses.forEach(c => {
                const sCount = c.totalStudents !== undefined ? c.totalStudents : (c.totalEnrollments !== undefined ? c.totalEnrollments : (c.studentsCount || 0));
                totalStudents += sCount;
                totalRevenue += (c.price || 0) * sCount;
            });

            // Update DOM summary elements
            const sumCoursesEl = document.getElementById('sumTotalCourses');
            const sumStudentsEl = document.getElementById('sumTotalStudents');
            const sumRevenueEl = document.getElementById('sumTotalRevenue');

            if (sumCoursesEl) sumCoursesEl.textContent = totalCourses;
            if (sumStudentsEl) sumStudentsEl.textContent = totalStudents;
            if (sumRevenueEl) sumRevenueEl.textContent = totalRevenue.toLocaleString('vi-VN') + 'đ';

            if (courses.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                            Bạn chưa đăng tải khóa học nào. Hãy bấm nút "Tạo khóa học" để bắt đầu!
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = courses.map(course => {
                const defaultSvg = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='90'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238b5cf6'/%3E%3Cstop offset='100%25' stop-color='%236366f1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='150' height='90' fill='url(%23g)'/%3E%3C/svg%3E";
                const thumb = course.thumbnailUrl || defaultSvg;
                const isPublished = course.status === 'PUBLISH' || course.status === 'PUBLISHED';
                const statusLabel = isPublished ? 'Xuất bản' : 'Bản nháp';
                const statusClass = isPublished ? 'publish' : 'draft';
                const rating = course.averageRating ? Number(course.averageRating).toFixed(1) : '0.0';
                const sCount = course.totalStudents !== undefined ? course.totalStudents : (course.totalEnrollments !== undefined ? course.totalEnrollments : (course.studentsCount || 0));
                const revenue = (course.price || 0) * sCount;

                return `
                    <tr>
                        <td style="padding: 12px 30px;">
                            <img src="${thumb}" class="course-thumb-cell" alt="${course.title}" onerror="this.src='${defaultSvg}'">
                        </td>
                        <td style="max-width: 420px; padding: 18px 30px; line-height: 1.45;">
                            <a href="course-editor.html?id=${course.id}" class="course-title-link" style="font-weight: 600; color: var(--text-dark); text-decoration: none; display: block; font-family: var(--font-outfit); font-size: 15px; transition: var(--transition);">${course.title}</a>
                        </td>
                        <td style="font-weight: 600; color: var(--text-dark);">${(course.price || 0).toLocaleString('vi-VN')}đ</td>
                        <td style="font-weight: 500; color: var(--text-muted);">${sCount} học viên</td>
                        <td style="font-weight: 700; color: var(--primary);">${revenue.toLocaleString('vi-VN')}đ</td>
                        <td style="color:#f59e0b; font-weight: 600;"><i class="fas fa-star" style="font-size:11px; margin-right:4px;"></i>${rating}</td>
                        <td>
                            <span class="badge ${statusClass}">${statusLabel}</span>
                        </td>
                        <td>
                            <button class="action-icon-btn edit" onclick="location.href='course-editor.html?id=${course.id}'" title="Biên soạn khóa học">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-icon-btn delete" onclick="deleteCourse('${course.id}')" title="Xóa khóa học">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // ── Create Course ──
        async function createCourse(e) {
            e.preventDefault();
            const auth = checkTeacherAuth();
            if (!auth) return;

            const btnSubmit = document.getElementById('btnSubmitCreate');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Đang tạo...';

            const title = document.getElementById('courseTitleInput').value.trim();
            const price = parseFloat(document.getElementById('coursePriceInput').value);
            const categoryId = document.getElementById('courseCategorySelect').value;
            const description = document.getElementById('courseDescInput').value.trim();

            const requestBody = {
                title: title,
                price: price,
                categoryIds: [categoryId],
                description: description || "Mô tả khóa học đang cập nhật..."
            };

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/course/create?userId=${auth.uid}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        showFeedback("Tạo khóa học thành công!");
                        closeCreateModal();
                        loadCourses(auth);
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = originalText;
                        
                        // Redirect to editor to build sections/lessons immediately
                        setTimeout(() => {
                            window.location.href = `course-editor.html?id=${data.result.id}`;
                        }, 1200);
                        return;
                    }
                }
                throw new Error("Failed to create course");
            } catch (error) {
                console.warn("Backend API failed. Simulating mockup course creation.", error);
                
                await new Promise(r => setTimeout(r, 600));

                const selectedCat = categories.find(c => c.id === categoryId);
                const mockNewCourse = {
                    id: 'course_' + Date.now(),
                    title: title,
                    price: price,
                    thumbnailUrl: "",
                    categoryName: selectedCat ? selectedCat.name : "Chưa phân loại",
                    studentsCount: 0,
                    averageRating: 0.0,
                    status: "DRAFT",
                    description: description
                };

                myCourses.unshift(mockNewCourse);
                localStorage.setItem('mockTeacherCourses', JSON.stringify(myCourses));
                
                showFeedback("Tạo khóa học thành công (Chế độ Demo)!");
                closeCreateModal();
                renderCourses(myCourses);
                
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalText;

                setTimeout(() => {
                    window.location.href = `course-editor.html?id=${mockNewCourse.id}`;
                }, 1200);
            }
        }

        // ── Delete Course ──
        window.deleteCourse = async function(courseId) {
            const auth = checkTeacherAuth();
            if (!auth) return;

            if (!confirm("Bạn có chắc chắn muốn xóa khóa học này cùng toàn bộ chương học và bài giảng liên quan không?")) {
                return;
            }

            try {
                const headers = {};
                if (auth.token) headers['Authorization'] = 'Bearer ' + auth.token;

                const res = await fetch(`${API_BASE}/course/${courseId}?instructorId=${auth.uid}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (res.ok) {
                    showFeedback("Xóa khóa học thành công!");
                    loadCourses(auth);
                    return;
                }
                throw new Error("Failed to delete course");
            } catch (error) {
                console.warn("Backend API failed. Deleting mockup course locally.", error);
                
                myCourses = myCourses.filter(c => c.id !== courseId);
                localStorage.setItem('mockTeacherCourses', JSON.stringify(myCourses));
                
                showFeedback("Xóa khóa học thành công (Chế độ Demo)!");
                renderCourses(myCourses);
            }
        };

        // ── Modal Handling ──
        const modal = document.getElementById('createCourseModal');
        
        function openCreateModal() {
            document.getElementById('createCourseForm').reset();
            modal.style.display = 'flex';
        }

        function closeCreateModal() {
            modal.style.display = 'none';
        }

        // ── DOM Listeners ──
        document.addEventListener('DOMContentLoaded', () => {
            const auth = checkTeacherAuth();
            if (!auth) return;

            // Display Username
            document.getElementById('instructorName').textContent = localStorage.getItem('userName') || 'Giảng viên';

            loadCategories();
            loadCourses(auth);

            // Modal Triggers
            document.getElementById('btnOpenCreateModal').addEventListener('click', openCreateModal);
            document.getElementById('btnCloseCreateModal').addEventListener('click', closeCreateModal);
            document.getElementById('btnCancelCreate').addEventListener('click', closeCreateModal);
            
            // Close modal by clicking overlay
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeCreateModal();
            });

            // Form Submit
            document.getElementById('createCourseForm').addEventListener('submit', createCourse);

            // Logout
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        });
