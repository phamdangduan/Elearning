async function loadTopInstructors() {
    const grid = document.getElementById('instructorGrid');
    const nextBtn = document.getElementById('insNextBtn');
    const prevBtn = document.getElementById('insPrevBtn');
    try {
        const data = await fetch(`${API_BASE}/profile/instructors`).then(r => r.json());
        const instructors = (data?.result || []).slice(0, 12); // Load up to 12 instructors
        if (!instructors.length) {
            grid.innerHTML = Api.emptyHtml('Chưa có giảng viên nào.');
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
        grid.innerHTML = Api.errorHtml();
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
