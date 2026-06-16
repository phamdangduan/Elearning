// ══ SHOPPING CART FEATURE (FRONTEND ONLY) ══

(function() {
    let cart = [];

    // Identify if the current page is in student subfolder to resolve paths
    const isSubDir = window.location.pathname.includes('/student/') || 
                    window.location.pathname.includes('/teacher/') || 
                    window.location.pathname.includes('/admin/');
    const pathPrefix = isSubDir ? '../' : '';

    // Load Cart from localStorage
    function loadCart() {
        const stored = localStorage.getItem('cart');
        try {
            cart = stored ? JSON.parse(stored) : [];
        } catch (e) {
            cart = [];
        }
    }

    // Save Cart to localStorage
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateBadge();
        renderCartDrawer();
    }

    // Add CSS dynamically to head
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .nav-cart-wrapper {
                position: relative;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                background: #f3f4f6;
                transition: all 0.2s ease;
                margin-right: 12px;
            }
            .nav-cart-wrapper:hover {
                background: #e5e7eb;
                transform: translateY(-1px);
            }
            .nav-cart-wrapper i {
                font-size: 18px;
                color: #4b5563;
            }
            .cart-badge {
                position: absolute;
                top: -6px;
                right: -6px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                box-shadow: 0 2px 5px rgba(239, 68, 68, 0.4);
            }
            .cart-drawer {
                position: fixed;
                top: 0;
                right: -380px;
                width: 380px;
                height: 100%;
                background: white;
                box-shadow: -5px 0 25px rgba(0,0,0,0.15);
                z-index: 10000;
                transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
            }
            .cart-drawer.active {
                right: 0;
            }
            .cart-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.4);
                backdrop-filter: blur(2px);
                z-index: 9999;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .cart-overlay.active {
                display: block;
                opacity: 1;
            }
            .cart-item {
                display: flex;
                gap: 12px;
                padding: 12px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                background: #f9fafb;
                align-items: center;
                transition: all 0.2s ease;
            }
            .cart-item:hover {
                border-color: #cbd5e1;
                background: #f1f5f9;
            }
            .cart-item img {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                object-fit: cover;
                background: #e5e7eb;
            }
            .cart-item-info {
                flex: 1;
                min-width: 0;
            }
            .cart-item-title {
                font-weight: 600;
                font-size: 13px;
                color: #1e293b;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .cart-item-instructor {
                font-size: 11px;
                color: #64748b;
                margin-bottom: 4px;
            }
            .cart-item-price {
                font-weight: 700;
                font-size: 13px;
                color: #4f46e5;
            }
            .cart-item-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: flex-end;
            }
            .cart-item-remove {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                font-size: 14px;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            .cart-item-remove:hover {
                color: #ef4444;
                background: #fee2e2;
            }
            .cart-item-checkout {
                background: #4f46e5;
                color: white;
                border: none;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: 600;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .cart-item-checkout:hover {
                background: #4338ca;
            }
            
            /* Custom Toast styling */
            .cart-toast {
                position: fixed;
                bottom: 24px;
                left: 24px;
                background: #1e293b;
                color: white;
                padding: 12px 24px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .cart-toast.show {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    // Inject UI elements (Cart Icon, Drawer, Overlay)
    function injectUI() {
        // 1. Inject Cart Icon into Nav Actions
        const navActions = document.querySelector('.nav-actions');
        if (navActions && !document.getElementById('navCart')) {
            const cartWrapper = document.createElement('div');
            cartWrapper.className = 'nav-cart-wrapper';
            cartWrapper.id = 'navCart';
            cartWrapper.innerHTML = `
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-badge" id="cartBadge">0</span>
            `;
            
            // Insert before the user dropdown or login actions
            const loggedIn = document.getElementById('navLoggedIn');
            const guestActions = document.getElementById('navGuestActions');
            
            if (loggedIn && !loggedIn.hidden) {
                navActions.insertBefore(cartWrapper, loggedIn);
            } else if (guestActions) {
                navActions.insertBefore(cartWrapper, guestActions);
            } else {
                navActions.appendChild(cartWrapper);
            }

            // Click listener to toggle drawer
            cartWrapper.addEventListener('click', toggleCartDrawer);
        }

        // 2. Inject Cart Drawer and Overlay into Body
        if (!document.getElementById('cartDrawer')) {
            // Overlay
            const overlay = document.createElement('div');
            overlay.className = 'cart-overlay';
            overlay.id = 'cartOverlay';
            document.body.appendChild(overlay);

            // Drawer
            const drawer = document.createElement('div');
            drawer.className = 'cart-drawer';
            drawer.id = 'cartDrawer';
            drawer.innerHTML = `
                <div class="cart-drawer-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="font-weight: 700; font-size: 16px; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-shopping-cart" style="color: #4f46e5;"></i>Giỏ hàng của bạn
                    </h3>
                    <button id="closeCartBtn" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b;"><i class="fas fa-times"></i></button>
                </div>
                <div class="cart-drawer-items" id="cartDrawerItems" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                    <!-- Items populated dynamically -->
                </div>
                <div class="cart-drawer-footer" style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-weight: 700; font-size: 15px; color: #1e293b;">
                        <span>Tổng cộng:</span>
                        <span id="cartTotal">0 đ</span>
                    </div>
                    <button id="cartCheckoutBtn" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 600; border-radius: 10px; background:#4f46e5; color:white; border:none; cursor:pointer;">
                        Thanh toán tất cả
                    </button>
                </div>
            `;
            document.body.appendChild(drawer);

            // Close listeners
            document.getElementById('closeCartBtn').addEventListener('click', closeCartDrawer);
            overlay.addEventListener('click', closeCartDrawer);

            // Checkout all button listener
            document.getElementById('cartCheckoutBtn').addEventListener('click', checkoutAll);
        }
    }

    // Toggle Drawer
    function toggleCartDrawer() {
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartOverlay');
        if (drawer && overlay) {
            drawer.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    }

    // Close Drawer
    function closeCartDrawer() {
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartOverlay');
        if (drawer && overlay) {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    // Update Badge Count
    function updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = cart.length;
            badge.style.display = cart.length > 0 ? 'flex' : 'none';
        }
    }

    // Show Toast Notification
    function showToast(message) {
        let toast = document.getElementById('cartToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'cart-toast';
            toast.id = 'cartToast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> ${message}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Render Cart Drawer Content
    function renderCartDrawer() {
        const itemsContainer = document.getElementById('cartDrawerItems');
        const totalContainer = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('cartCheckoutBtn');
        
        if (!itemsContainer) return;

        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div style="text-align: center; color: #94a3b8; margin-top: 40px;">
                    <i class="fas fa-shopping-cart" style="font-size: 40px; margin-bottom: 12px; opacity: 0.3; display:block;"></i>
                    <p style="font-size: 13px; margin: 0;">Giỏ hàng của bạn đang trống</p>
                </div>
            `;
            if (totalContainer) totalContainer.textContent = '0 đ';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            return;
        }

        if (checkoutBtn) checkoutBtn.style.display = 'block';

        let total = 0;
        let html = '';

        cart.forEach(item => {
            total += Number(item.price || 0);
            const formattedPrice = Number(item.price || 0) === 0 ? 'Miễn phí' : Number(item.price).toLocaleString('vi-VN') + ' đ';
            
            html += `
                <div class="cart-item">
                    <img src="${item.thumbnail || 'https://via.placeholder.com/60?text=Course'}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/60?text=Course'">
                    <div class="cart-item-info">
                        <div class="cart-item-title" title="${item.title}">${item.title}</div>
                        <div class="cart-item-instructor"><i class="fas fa-user"></i> ${item.instructor}</div>
                        <div class="cart-item-price">${formattedPrice}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="cart-item-remove" data-id="${item.id}" title="Xóa khỏi giỏ hàng">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        ${Number(item.price) > 0 ? `
                            <button class="cart-item-checkout" data-id="${item.id}">Thanh toán</button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        itemsContainer.innerHTML = html;
        if (totalContainer) totalContainer.textContent = total.toLocaleString('vi-VN') + ' đ';

        // Attach event listeners to remove buttons
        itemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                removeFromCart(id);
            });
        });

        // Attach event listeners to item checkout buttons
        itemsContainer.querySelectorAll('.cart-item-checkout').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                checkoutItem(id);
            });
        });
    }

    // Add Course to Cart
    window.addToCart = function(id, title, price, thumbnail, instructor) {
        // Prevent adding if already in cart
        if (cart.some(item => item.id === id)) {
            showToast("Khóa học đã có sẵn trong giỏ hàng!");
            toggleCartDrawer();
            return;
        }

        cart.push({ id, title, price, thumbnail, instructor });
        saveCart();
        showToast("Đã thêm khóa học vào giỏ hàng!");
        
        // Open drawer to show it
        setTimeout(toggleCartDrawer, 300);
    };

    // Remove Course from Cart
    window.removeFromCart = function(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        showToast("Đã xóa khóa học khỏi giỏ hàng");
    };

    // Checkout single item
    function checkoutItem(id) {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            alert("Vui lòng đăng nhập để thực hiện thanh toán!");
            window.location.href = pathPrefix + 'login.html';
            return;
        }
        
        // Redirect to checkout page
        window.location.href = `${pathPrefix}student/checkout.html?courseId=${id}`;
    }

    // Checkout all items
    function checkoutAll() {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            alert("Vui lòng đăng nhập để thực hiện thanh toán!");
            window.location.href = pathPrefix + 'login.html';
            return;
        }

        if (cart.length === 0) return;

        if (cart.length === 1) {
            checkoutItem(cart[0].id);
            return;
        }

        // Multiple courses case
        const first = cart[0];
        const confirmMsg = `Giỏ hàng của bạn đang có ${cart.length} khóa học. Vì các khóa học có thể thuộc về các giảng viên khác nhau, hệ thống sẽ giúp bạn thanh toán lần lượt từng khóa học một.\n\nNhấp OK để tiến hành thanh toán khóa học đầu tiên: "${first.title}".`;
        
        if (confirm(confirmMsg)) {
            checkoutItem(first.id);
        }
    }

    // Run Initialization
    document.addEventListener('DOMContentLoaded', () => {
        loadCart();
        injectStyles();
        injectUI();
        updateBadge();
        renderCartDrawer();
    });
})();
