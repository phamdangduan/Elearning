const API_BASE = 'http://localhost:8080';

        // Dummy stats fallback database matching mock structure
        const dummyStats = {
            totalRevenue: 24396000,
            totalStudents: 35,
            totalCourses: 4,
            averageRating: 4.85,
            totalReviews: 14,
            courseStats: [
                {
                    courseId: "course_1",
                    courseTitle: "Kiến trúc Bảo mật Hệ thống Cloud & DevOps",
                    coursePrice: 1899000,
                    totalEnrollments: 15,
                    averageRating: 4.8,
                    revenue: 28485000
                },
                {
                    courseId: "course_2",
                    courseTitle: "Lập trình AI căn bản với Python & TensorFlow",
                    coursePrice: 2499000,
                    totalEnrollments: 8,
                    averageRating: 4.9,
                    revenue: 19992000
                },
                {
                    courseId: "course_3",
                    courseTitle: "Thiết kế UI/UX Nâng cao cho Sản phẩm SaaS",
                    coursePrice: 1299000,
                    totalEnrollments: 12,
                    averageRating: 4.7,
                    revenue: 15588000
                }
            ]
        };

        const dummyPayments = [
            {
                id: "pay_1",
                studentName: "nguyenvananh",
                courseTitle: "Kiến trúc Bảo mật Cloud & DevOps",
                amount: 1899000,
                status: "PENDING",
                createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
            },
            {
                id: "pay_2",
                studentName: "lethibich",
                courseTitle: "Thiết kế UI/UX Nâng cao",
                amount: 1299000,
                status: "PENDING",
                createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
            }
        ];

        // ── Auth Verification ──
        function checkTeacherAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            const role = localStorage.getItem('userRole');
            
            if (!token || !uid || role !== 'TEACHER') {
                console.warn("Unauthorized user attempted to load teacher page. Redirecting...");
                window.location.href = '../login.html';
                return null;
            }
            return { token, uid };
        }

        // ── Greetings ──
        function updateGreetings() {
            const disp = localStorage.getItem('userName') || 'Giảng viên';
            document.getElementById('instructorName').textContent = disp;

            const welcome = document.getElementById('welcomeGreeting');
            if (welcome) {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) {
                    welcome.textContent = `Chào buổi sáng, ${disp}! ☀️`;
                } else if (hour >= 12 && hour < 18) {
                    welcome.textContent = `Chào buổi chiều, ${disp}! 🌤️`;
                } else {
                    welcome.textContent = `Chào buổi tối, ${disp}! 🌙`;
                }
            }
        }

        // ── Fetch Instructor Statistics ──
        async function fetchDashboardStats(auth) {
            try {
                const headers = {};
                if (auth.token) {
                    headers['Authorization'] = 'Bearer ' + auth.token;
                }
                const res = await fetch(`${API_BASE}/instructor/stats?instructorId=${auth.uid}`, { headers });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        renderStats(data.result);
                        return;
                    }
                }
                throw new Error("API stats loading failed");
            } catch (error) {
                console.warn("Stats API connection failed, using local dummy data fallback.", error);
                renderStats(dummyStats);
            }
        }

        // ── Fetch Pending Payment Verification list ──
        async function fetchPendingPayments(auth) {
            try {
                const headers = {};
                if (auth.token) {
                    headers['Authorization'] = 'Bearer ' + auth.token;
                }
                const res = await fetch(`${API_BASE}/instructor/payment-requests?userId=${auth.uid}&status=PENDING`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                        renderPendingPayments(data.result.slice(0, 3)); // Display top 3
                        return;
                    }
                }
                throw new Error("API payments loading failed");
            } catch (error) {
                console.warn("Payments API connection failed, showing connection error.", error);
                const container = document.getElementById('pendingPaymentsList');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 20px 10px; color: #f87171;">
                            <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <p style="font-size: 13px; font-weight: 500;">Lỗi kết nối, không thể tải hóa đơn thực tế.</p>
                        </div>
                    `;
                }
            }
        }

        // ── Render Statistics ──
        function renderStats(stats) {
            // Stats blocks
            document.getElementById('statsRevenue').textContent = (stats.totalRevenue || 0).toLocaleString('vi-VN') + 'đ';
            document.getElementById('statsStudents').textContent = stats.totalStudents || 0;
            document.getElementById('statsCourses').textContent = stats.totalCourses || 0;
            
            const rating = stats.averageRating ? Number(stats.averageRating).toFixed(1) : '0.0';
            document.getElementById('statsRating').textContent = `${rating} ★`;

            // Top selling courses table
            const tableBody = document.getElementById('topCoursesTableBody');
            if (!stats.courseStats || stats.courseStats.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                            Bạn chưa có khóa học nào hoạt động hoặc chưa có doanh thu.
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = stats.courseStats.map(course => `
                <tr>
                    <td style="font-weight: 600; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${course.courseTitle}
                    </td>
                    <td>${(course.coursePrice || 0).toLocaleString('vi-VN')}đ</td>
                    <td style="font-weight: 500;">${course.totalEnrollments || 0} học viên</td>
                    <td style="color: #f59e0b; font-weight: 600;">
                        <i class="fas fa-star" style="font-size: 12px; margin-right: 4px;"></i>${course.averageRating ? Number(course.averageRating).toFixed(1) : '0.0'}
                    </td>
                    <td style="font-weight: 700; color: var(--primary);">${(course.revenue || 0).toLocaleString('vi-VN')}đ</td>
                </tr>
            `).join('');
        }

        // ── Render Pending Payments ──
        function renderPendingPayments(payments) {
            const container = document.getElementById('pendingPaymentsList');
            
            const pendingList = payments.filter(p => p.status === 'PENDING');
            if (pendingList.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 30px 10px; color: var(--text-muted);">
                        <i class="far fa-check-circle" style="font-size: 32px; color: #10b981; margin-bottom: 10px;"></i>
                        <p style="font-size: 13px; font-weight: 500;">Tất cả hóa đơn đã được phê duyệt!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = pendingList.map(pay => {
                const date = new Date(pay.createdAt);
                const timeText = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #f8fafc;">
                        <div style="min-width: 0; flex: 1;">
                            <div style="font-weight: 700; font-size: 13.5px; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                Học viên: ${pay.studentName}
                            </div>
                            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                Khóa: ${pay.courseTitle}
                            </div>
                        </div>
                        <div style="text-align: right; margin-left: 12px;">
                            <div style="font-weight: 800; color: #10b981; font-size: 14px;">
                                +${pay.amount.toLocaleString('vi-VN')}đ
                            </div>
                            <span style="font-size: 10px; color: var(--text-muted);">${timeText}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ── DOM Listeners ──
        document.addEventListener('DOMContentLoaded', () => {
            const auth = checkTeacherAuth();
            if (!auth) return;

            updateGreetings();
            fetchDashboardStats(auth);
            fetchPendingPayments(auth);

            // Logout Handler
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        });
