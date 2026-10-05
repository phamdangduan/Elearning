const catVisuals = {
    'Frontend': 'fa-laptop-code',
    'Backend': 'fa-server',
    'Mobile': 'fa-mobile-alt',
    'Database': 'fa-database',
    'DevOps': 'fa-infinity'
};

async function loadCategories() {
    const grid = document.getElementById('categoryGrid');
    try {
        const data = await fetch(`${API_BASE}/category`).then(r => r.json());
        const categories = (data?.result || []).slice(0, 5); // Take top 5
        if (!categories.length) {
            grid.innerHTML = Api.emptyHtml('Chưa có danh mục nào.');
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
        grid.innerHTML = Api.errorHtml();
    }
}
