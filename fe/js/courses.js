async function loadFeaturedCourses() {
    const grid = document.getElementById('courseGrid');
    try {
        const data = await fetch(`${API_BASE}/course/search?page=0&size=8&sort=totalEnrollments,desc`).then(r => r.json());
        const courses = data?.result?.content || [];
        if (!courses.length) {
            grid.innerHTML = Api.emptyHtml('Chưa có khóa học nào.');
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
        grid.innerHTML = Api.errorHtml();
    }
}
