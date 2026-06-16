const dummyCourses = `
    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80" alt="Cybersecurity">
            <span class="course-badge hot">Bán chạy</span>
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i>
                </div>
                <span class="score">4.9</span>
                <span class="count">(2.5k)</span>
            </div>
            <h3 class="course-title">Kiến trúc Bảo mật Hệ thống Cloud & DevOps</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Trần Văn A</span>
            </div>
            <div class="course-footer">
                <span class="course-price">1.299.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-1', 'Kiến trúc Bảo mật Hệ thống Cloud & DevOps', 1299000, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', 'Trần Văn A')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>
    
    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80" alt="AI">
            <span class="course-badge">Mới</span>
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#e2e8f0"></i>
                </div>
                <span class="score">4.5</span>
                <span class="count">(1.2k)</span>
            </div>
            <h3 class="course-title">Lập trình AI căn bản với Python & TensorFlow</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Nguyễn Thị B</span>
            </div>
            <div class="course-footer">
                <span class="course-price">899.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-2', 'Lập trình AI căn bản với Python & TensorFlow', 899000, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80', 'Nguyễn Thị B')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>

    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80" alt="UI/UX">
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i>
                </div>
                <span class="score">4.8</span>
                <span class="count">(3.1k)</span>
            </div>
            <h3 class="course-title">Thiết kế UI/UX Nâng cao cho Sản phẩm SaaS</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Lê Văn C</span>
            </div>
            <div class="course-footer">
                <span class="course-price">1.500.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-3', 'Thiết kế UI/UX Nâng cao cho Sản phẩm SaaS', 1500000, 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80', 'Lê Văn C')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>
    
    <div class="course-card" onclick="location.href='course-detail.html'">
        <div class="course-thumb">
            <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80" alt="Web Dev">
        </div>
        <div class="course-body">
            <div class="course-rating">
                <div class="stars">
                    <i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#f5a623"></i><i class="fas fa-star" style="color:#e2e8f0"></i>
                </div>
                <span class="score">4.7</span>
                <span class="count">(5.4k)</span>
            </div>
            <h3 class="course-title">Fullstack Web Development với Spring Boot & React</h3>
            <div class="course-instructor">
                <i class="fas fa-user-circle"></i> <span>Phạm D</span>
            </div>
            <div class="course-footer">
                <span class="course-price">2.000.000đ</span>
                <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('demo-4', 'Fullstack Web Development với Spring Boot & React', 2000000, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80', 'Phạm D')"><i class="fas fa-shopping-cart"></i></div>
            </div>
        </div>
    </div>
`;

async function loadFeaturedCourses() {
    const grid = document.getElementById('courseGrid');
    try {
        const data = await fetch(`${API_BASE}/course/search?page=0&size=8&sort=totalEnrollments,desc`).then(r => r.json());
        const courses = data?.result?.content || [];
        if (!courses.length) {
            grid.innerHTML = dummyCourses;
            return;
        }
        grid.innerHTML = courses.map((c, i) => `
            <div class="course-card" onclick="location.href='course-detail.html?id=${c.id}'">
                <div class="course-thumb">
                    <img src="${c.thumbnailUrl || 'https://via.placeholder.com/400x250?text=Course'}" alt="${c.title}">
                    ${i === 0 ? '<span class="course-badge hot">Bán chạy</span>' : (i === 1 ? '<span class="course-badge">Mới</span>' : '')}
                </div>
                <div class="course-body">
                    <div class="course-rating">
                        <div class="stars">
                            ${Array(5).fill(0).map((_, idx) => `<i class="fas fa-star" style="color:${idx < Math.round(c.averageRating || 5) ? '#f5a623' : '#e2e8f0'}"></i>`).join('')}
                        </div>
                        <span class="score">${(c.averageRating || 5).toFixed(1)}</span>
                        <span class="count">(${c.totalEnrollments || 0})</span>
                    </div>
                    <h3 class="course-title">${c.title}</h3>
                    <div class="course-instructor">
                        <i class="fas fa-user-circle"></i> <span>${c.instructorName || 'Giảng viên'}</span>
                    </div>
                    <div class="course-footer">
                        <span class="course-price ${!c.price ? 'free' : ''}">${c.price ? c.price.toLocaleString('vi-VN') + 'đ' : 'Miễn phí'}</span>
                        <div class="course-cart-btn" onclick="event.stopPropagation(); addToCart('\${c.id}', '\${c.title.replace(/\'/g, &quot;\\\\'&quot;)}', \${c.price || 0}, '\${c.thumbnailUrl || &quot;&quot;}', '\${(c.instructorName || &quot;Giảng viên&quot;).replace(/\'/g, &quot;\\\\'&quot;)}')"><i class="fas fa-shopping-cart"></i></div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Courses error:', e);
        grid.innerHTML = dummyCourses;
    }
}
