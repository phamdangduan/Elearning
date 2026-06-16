const catVisuals = {
    'Frontend': 'fa-laptop-code',
    'Backend': 'fa-server',
    'Mobile': 'fa-mobile-alt',
    'Database': 'fa-database',
    'DevOps': 'fa-infinity'
};

const dummyCategories = `
    <div class="category-card" onclick="location.href='catalog.html'">
        <div class="cat-icon"><i class="fas fa-laptop-code"></i></div>
        <h3>Frontend</h3>
    </div>
    <div class="category-card" onclick="location.href='catalog.html'">
        <div class="cat-icon"><i class="fas fa-server"></i></div>
        <h3>Backend</h3>
    </div>
    <div class="category-card" onclick="location.href='catalog.html'">
        <div class="cat-icon"><i class="fas fa-mobile-alt"></i></div>
        <h3>Mobile</h3>
    </div>
    <div class="category-card" onclick="location.href='catalog.html'">
        <div class="cat-icon"><i class="fas fa-database"></i></div>
        <h3>Database</h3>
    </div>
    <div class="category-card" onclick="location.href='catalog.html'">
        <div class="cat-icon"><i class="fas fa-infinity"></i></div>
        <h3>DevOps</h3>
    </div>
`;

async function loadCategories() {
    const grid = document.getElementById('categoryGrid');
    try {
        const data = await fetch(`${API_BASE}/category`).then(r => r.json());
        const categories = (data?.result || []).slice(0, 5); // Take top 5
        if (!categories.length) {
            grid.innerHTML = dummyCategories;
            return;
        }

        grid.innerHTML = categories.map((cat) => {
            const icon = catVisuals[cat.name] || 'fa-code';
            return `
                <div class="category-card" onclick="location.href='catalog.html?categoryId=${cat.id}'">
                    <div class="cat-icon"><i class="fas ${icon}"></i></div>
                    <h3>${cat.name}</h3>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Categories error:', e);
        grid.innerHTML = dummyCategories;
    }
}
