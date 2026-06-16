const dummyInstructors = `
    <div class="instructor-card">
        <div class="ins-avatar-wrapper">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80" alt="Ins 1">
        </div>
        <h3>TS. Nguyễn Thành Nam</h3>
        <span class="ins-title">Chuyên gia AI</span>
        <p class="ins-desc">Tiến sĩ có bề dày kinh nghiệm trong việc nghiên cứu và triển khai các hệ thống học sâu.</p>
    </div>
    <div class="instructor-card">
        <div class="ins-avatar-wrapper">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80" alt="Ins 2">
        </div>
        <h3>Trần Thu Trang</h3>
        <span class="ins-title">Senior UI/UX Designer</span>
        <p class="ins-desc">Giám đốc thiết kế với 10 năm kinh nghiệm làm việc tại các tập đoàn công nghệ lớn.</p>
    </div>
    <div class="instructor-card">
        <div class="ins-avatar-wrapper">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80" alt="Ins 3">
        </div>
        <h3>Lê Hoàng Long</h3>
        <span class="ins-title">Cyber Security Expert</span>
        <p class="ins-desc">Chứng chỉ CISSP, CISM, dẫn dắt nhiều dự án bảo mật trọng điểm.</p>
    </div>
    <div class="instructor-card">
        <div class="ins-avatar-wrapper">
            <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80" alt="Ins 4">
        </div>
        <h3>Phạm Mai Hương</h3>
        <span class="ins-title">Digital Marketing Manager</span>
        <p class="ins-desc">Hơn 8 năm kinh nghiệm thực chiến trong các chiến dịch marketing trị giá hàng triệu USD.</p>
    </div>
`;

async function loadTopInstructors() {
    const grid = document.getElementById('instructorGrid');
    const nextBtn = document.getElementById('insNextBtn');
    const prevBtn = document.getElementById('insPrevBtn');
    try {
        const data = await fetch(`${API_BASE}/profile/instructors`).then(r => r.json());
        const instructors = (data?.result || []).slice(0, 12); // Load up to 12 instructors
        if (!instructors.length) {
            grid.innerHTML = dummyInstructors;
            if (nextBtn) nextBtn.style.display = 'none';
            if (prevBtn) prevBtn.style.display = 'none';
            return;
        }
        grid.innerHTML = instructors.map(ins => `
            <div class="instructor-card">
                <div class="ins-avatar-wrapper">
                    <img src="${ins.avatar || ins.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80'}" alt="${ins.fullName}">
                </div>
                <h3>${ins.fullName}</h3>
                <span class="ins-title">${ins.specialization || 'Senior Lecturer'}</span>
                <p class="ins-desc">${ins.bio || 'Chuyên gia có nhiều năm kinh nghiệm thực chiến trong các dự án lớn.'}</p>
            </div>
        `).join('');

        if (instructors.length > 4) {
            if (nextBtn) nextBtn.style.display = 'flex';
            setupInstructorSlider(grid, prevBtn, nextBtn);
        } else {
            if (nextBtn) nextBtn.style.display = 'none';
            if (prevBtn) prevBtn.style.display = 'none';
        }
    } catch (e) {
        console.error('Instructors error:', e);
        grid.innerHTML = dummyInstructors;
        if (nextBtn) nextBtn.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
    }
}

function setupInstructorSlider(grid, prevBtn, nextBtn) {
    if (!grid || !nextBtn || !prevBtn) return;
    
    grid.addEventListener('scroll', () => {
        const scrollLeft = grid.scrollLeft;
        const maxScrollLeft = grid.scrollWidth - grid.clientWidth;
        
        if (prevBtn) {
            prevBtn.style.display = scrollLeft > 15 ? 'flex' : 'none';
        }
        if (nextBtn) {
            nextBtn.style.display = scrollLeft < maxScrollLeft - 15 ? 'flex' : 'none';
        }
    });
    
    nextBtn.addEventListener('click', () => {
        const cardWidth = grid.querySelector('.instructor-card')?.offsetWidth || 280;
        const gap = 24;
        grid.scrollBy({ left: (cardWidth + gap) * 2, behavior: 'smooth' });
    });
    
    prevBtn.addEventListener('click', () => {
        const cardWidth = grid.querySelector('.instructor-card')?.offsetWidth || 280;
        const gap = 24;
        grid.scrollBy({ left: -(cardWidth + gap) * 2, behavior: 'smooth' });
    });
}
