const API_BASE = 'http://localhost:8080';

        // ── Auth Handling ──
        function applyLandingNavAuth() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const uid = localStorage.getItem('userId');
            const guest = document.getElementById('navGuestActions');
            const logged = document.getElementById('navLoggedIn');
            const nameEl = document.getElementById('landingUserName');

            // Dynamically update the "Khóa học" navigation link
            const isStudentFolder = window.location.pathname.includes('/student/');
            const coursesLink = Array.from(document.querySelectorAll('.nav-link')).find(el => el.textContent.trim() === 'Khóa học');
            if (coursesLink) {
                if (token && uid) {
                    coursesLink.href = isStudentFolder ? 'courses.html' : 'student/courses.html';
                } else {
                    coursesLink.href = isStudentFolder ? '../catalog.html' : 'catalog.html';
                }
            }

            if (!guest || !logged) return;
            if (token && uid) {
                guest.hidden = true;
                logged.hidden = false;
                if (nameEl) {
                    const disp = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Học viên';
                    nameEl.textContent = disp.length > 26 ? disp.slice(0, 23) + '…' : disp;
                    nameEl.title = disp;
                }
            } else {
                guest.hidden = false;
                logged.hidden = true;
            }
        }

        const fallbackInstructors = [
            {
                fullName: "Nguyễn Văn A",
                specialization: "Chuyên gia DevOps & Cloud @ Google",
                bio: "Hơn 10 năm kinh nghiệm thiết lập hạ tầng Kubernetes, CI/CD và vận hành hệ thống đám mây quy mô lớn.",
                avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
                coursesCount: 24,
                studentsCount: "15k+",
                rating: 4.9,
                reviewsCount: "1,240",
                category: "Lập trình"
            },
            {
                fullName: "Lê Thị B",
                specialization: "Chuyên gia Thiết kế UI/UX & Frontend @ VinGroup",
                bio: "Kỹ sư thiết kế UI/UX & Frontend Developer chuyên nghiệp, đam mê tạo ra giao diện tối ưu.",
                avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
                coursesCount: 18,
                studentsCount: "12k+",
                rating: 4.8,
                reviewsCount: "980",
                category: "Thiết kế"
            },
            {
                fullName: "Trần Văn C",
                specialization: "Chuyên gia Backend @ Techcombank",
                bio: "Hơn 8 năm xây dựng hệ thống lõi ngân hàng bảo mật bằng Java Spring Boot & SQL.",
                avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
                coursesCount: 12,
                studentsCount: "8.5k+",
                rating: 5.0,
                reviewsCount: "450",
                category: "Lập trình"
            },
            {
                fullName: "Phạm Mai Hương",
                specialization: "Digital Marketing Manager @ VCCorp",
                bio: "Hơn 8 năm kinh nghiệm thực chiến trong các chiến dịch marketing tổng lực trị giá hàng triệu USD.",
                avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
                coursesCount: 15,
                studentsCount: "9.2k+",
                rating: 4.8,
                reviewsCount: "620",
                category: "Marketing"
            },
            {
                fullName: "Hoàng Lê Minh",
                specialization: "Chuyên gia Quản trị dự án & PMP",
                bio: "Từng giữ vị trí Giám đốc Vận hành tại nhiều startup kỳ lân. Chuyên gia đào tạo Agile/Scrum.",
                avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
                coursesCount: 10,
                studentsCount: "6.8k+",
                rating: 4.7,
                reviewsCount: "340",
                category: "Kinh doanh"
            },
            {
                fullName: "Sarah Connor",
                specialization: "Giảng viên Tiếng Anh - IELTS 8.5",
                bio: "Cựu giám khảo chấm thi nói viết IELTS, kinh nghiệm giảng dạy tiếng Anh học thuật hơn 7 năm.",
                avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
                coursesCount: 8,
                studentsCount: "5.4k+",
                rating: 4.9,
                reviewsCount: "410",
                category: "Ngoại ngữ"
            }
        ];

        let allInstructors = [];

        async function loadInstructors() {
            const grid = document.getElementById('instructorGrid');
            try {
                // Try fetching from API
                const data = await fetch(`${API_BASE}/profile/instructors`).then(r => r.json());
                let baseInstructors = data?.result || [];
                
                // If API returns empty or fails, use fallback data to match the UI mockup
                if (!baseInstructors.length) {
                    baseInstructors = fallbackInstructors.map((ins, i) => ({ ...ins, id: 'mock_ins_' + i }));
                }

                // Fetch stats for each instructor
                allInstructors = await Promise.all(baseInstructors.map(async (ins) => {
                    // For fallback data, just return it as is
                    if (ins.id && ins.id.startsWith('mock_ins_')) return ins;
                    if (!ins.id && !ins.userId) return ins;
                    
                    try {
                        const statsData = await fetch(`${API_BASE}/instructor/stats?instructorId=${ins.id || ins.userId}`).then(r => r.json());
                        const stats = statsData?.result || {};
                        
                        // Infer category from specialization or bio
                        let category = "Lập trình";
                        const spec = (ins.specialization || "").toLowerCase() + " " + (ins.bio || "").toLowerCase();
                        if (spec.includes("marketing") || spec.includes("seo") || spec.includes("ads") || spec.includes("truyền thông") || spec.includes("pr") || spec.includes("sales")) {
                            category = "Marketing";
                        } else if (spec.includes("thiết kế") || spec.includes("design") || spec.includes("ui") || spec.includes("ux") || spec.includes("figma") || spec.includes("photoshop") || spec.includes("illustrator") || spec.includes("đồ họa") || spec.includes("graphic")) {
                            category = "Thiết kế";
                        } else if (spec.includes("kinh doanh") || spec.includes("business") || spec.includes("tài chính") || spec.includes("finance") || spec.includes("startup") || spec.includes("quản trị") || spec.includes("management") || spec.includes("pmp") || spec.includes("vận hành")) {
                            category = "Kinh doanh";
                        } else if (spec.includes("tiếng anh") || spec.includes("english") || spec.includes("ielts") || spec.includes("toeic") || spec.includes("ngoại ngữ") || spec.includes("tiếng nhật") || spec.includes("tiếng trung") || spec.includes("japanese") || spec.includes("language")) {
                            category = "Ngoại ngữ";
                        }

                        return {
                            ...ins,
                            category,
                            coursesCount: stats.totalCourses || 0,
                            studentsCount: stats.totalStudents || 0,
                            rating: stats.averageRating ? stats.averageRating.toFixed(1) : "0.0",
                            reviewsCount: stats.totalReviews || 0
                        };
                    } catch (e) {
                        return {
                            ...ins,
                            category: "Lập trình",
                            coursesCount: 0,
                            studentsCount: 0,
                            rating: "0.0",
                            reviewsCount: 0
                        };
                    }
                }));

                displayInstructors(allInstructors);
            } catch (e) {
                console.warn("Connection to instructors API failed, loading local fallback mock database.", e);
                allInstructors = fallbackInstructors;
                displayInstructors(allInstructors);
            }
        }

        function displayInstructors(list) {
            const grid = document.getElementById('instructorGrid');
            if (!grid) return;

            if (list.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 60px 0;">
                        <i class="fas fa-users-slash" style="font-size: 44px; margin-bottom: 16px; color: #cbd5e1;"></i>
                        <p style="font-size: 15px; font-weight: 600; color: var(--text-dark);">Không tìm thấy giảng viên nào phù hợp.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = list.map(ins => {
                const spec = ins.specialization || 'Chuyên gia giảng dạy';
                const rating = ins.rating ? Number(ins.rating).toFixed(1) : '0.0';
                return `
                    <div class="instructor-card-detailed">
                        <div class="ins-avatar-large">
                            <img src="${ins.avatar || ins.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80'}" alt="${ins.fullName}">
                        </div>
                        <h3>${ins.fullName}</h3>
                        <span class="ins-title">${spec}</span>
                        <p class="ins-desc">${ins.bio || 'Chuyên gia đào tạo với nhiều năm kinh nghiệm thực chiến.'}</p>
                        
                        <div class="ins-stats-block">
                            <div class="ins-stat-box">
                                <span class="ins-stat-val">${ins.coursesCount}</span>
                                <span class="ins-stat-label">Khóa học</span>
                            </div>
                            <div class="ins-stat-box">
                                <span class="ins-stat-val">${ins.studentsCount}</span>
                                <span class="ins-stat-label">Học viên</span>
                            </div>
                        </div>

                        <div class="ins-rating-block">
                            <i class="fas fa-star"></i>
                            ${rating} 
                            <span>(${ins.reviewsCount || 0} đánh giá)</span>
                        </div>

                        <a href="instructor-profile.html?id=${ins.id || ins.userId || ''}" class="btn btn-outline-primary">Xem hồ sơ</a>
                    </div>
                `;
            }).join('');
        }

        function filterInstructors(filter) {
            const searchVal = document.getElementById('searchInput').value.trim().toLowerCase();
            let filtered = allInstructors;
            
            if (filter !== "Tất cả") {
                filtered = filtered.filter(ins => {
                    const insCategory = (ins.category || "").toLowerCase();
                    const insSpecialization = (ins.specialization || "").toLowerCase();
                    const filterLower = filter.toLowerCase();
                    return insCategory === filterLower || insSpecialization.includes(filterLower);
                });
            }
            
            if (searchVal) {
                filtered = filtered.filter(ins => ins.fullName.toLowerCase().includes(searchVal));
            }
            
            displayInstructors(filtered);
        }

        document.addEventListener('DOMContentLoaded', () => {
            applyLandingNavAuth();
            loadInstructors();

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

            // Navbar scroll effect
            window.addEventListener('scroll', () => {
                document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
            });

            // Mobile menu
            document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
                document.getElementById('navLinks').classList.toggle('mobile-open');
                dropdownMenu?.classList.remove('show');
            });

            // Logout
            document.getElementById('landingLogoutBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                location.reload();
            });

            // Newsletter submit
            document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Cảm ơn bạn đã đăng ký nhận bản tin!');
                e.target.reset();
            });
            
            // Search Input handler
            document.getElementById('searchInput')?.addEventListener('input', () => {
                const activePill = document.querySelector('.filter-pill.active');
                const filter = activePill ? activePill.textContent.trim() : "Tất cả";
                filterInstructors(filter);
            });

            // Filter click logic
            const pills = document.querySelectorAll('.filter-pill');
            pills.forEach(pill => {
                pill.addEventListener('click', () => {
                    pills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    
                    const filter = pill.textContent.trim();
                    filterInstructors(filter);
                });
            });
        });
