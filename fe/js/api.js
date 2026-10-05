/* =====================================================================
   api.js — Quản lý phiên đăng nhập dùng chung cho mọi trang
   ---------------------------------------------------------------------
   Phải được nạp TRƯỚC các script khác của trang (đặt trong <head>).

   1. Tự làm mới access token khi BE trả 401 (token hết hạn sau 1 giờ):
      bọc window.fetch, nên mọi lời gọi fetch() sẵn có đều được hưởng
      mà không phải sửa từng chỗ.
   2. Api.logout(): thu hồi refresh token ở BE rồi xóa dữ liệu đăng nhập.
   3. Api.requireRole(...): chặn người chưa đăng nhập / sai vai trò.

   Lưu ý: KHÔNG khai báo `const API_BASE` ở top-level trong file này,
   vì nhiều trang đã tự khai báo biến đó → sẽ lỗi "already declared".
===================================================================== */
(function () {
  'use strict';
  if (window.Api) return;

  const BASE = 'http://localhost:8080';
  const AUTH_KEYS = ['token', 'authToken', 'refreshToken', 'userId', 'userRole',
                     'userName', 'userEmail', 'userAvatar', 'user', 'cart'];
  const AREAS = { student: 'STUDENT', teacher: 'TEACHER', admin: 'ADMIN' };

  const originalFetch = window.fetch.bind(window);
  let refreshing = null;      // nhiều request cùng gặp 401 chỉ refresh 1 lần
  let authRequired = false;   // trang hiện tại có bắt buộc đăng nhập không

  // ── Vị trí trang hiện tại so với thư mục gốc fe/ ──
  function currentArea() {
    const parts = location.pathname.split('/').filter(Boolean);
    const dir = parts.length >= 2 ? parts[parts.length - 2] : '';
    return AREAS[dir] ? dir : null;
  }
  function rootPrefix() {
    return currentArea() ? '../' : '';
  }

  function clearAuth() {
    AUTH_KEYS.forEach(k => localStorage.removeItem(k));
  }

  function goLogin() {
    clearAuth();
    const file = location.pathname.split('/').pop() || 'index.html';
    const area = currentArea();
    const back = (area ? area + '/' : '') + file + location.search;
    location.href = `${rootPrefix()}login.html?redirect=${encodeURIComponent(back)}`;
  }

  async function refreshToken() {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return false;
    try {
      const res = await originalFetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.token) return false;
      localStorage.setItem('token', data.token);
      localStorage.setItem('authToken', data.token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch (e) {
      return false;
    }
  }

  function withNewToken(init) {
    const headers = new Headers(init && init.headers);
    headers.set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return { ...(init || {}), headers };
  }

  function hasAuthHeader(init) {
    return !!(init && init.headers && new Headers(init.headers).get('Authorization'));
  }

  // ── Bọc fetch: request tới BE có kèm token mà bị 401 → refresh rồi gửi lại 1 lần ──
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const res = await originalFetch(input, init);

    const isApi = url.startsWith(BASE) && !url.startsWith(`${BASE}/api/auth/`);
    if (res.status !== 401 || !isApi || !hasAuthHeader(init)) {
      return res;
    }

    refreshing = refreshing || refreshToken().finally(() => { refreshing = null; });
    if (await refreshing) {
      return originalFetch(input, withNewToken(init));
    }

    // Không làm mới được → phiên đã hết
    if (authRequired) {
      goLogin();
    } else {
      clearAuth();          // trang công khai: chuyển về giao diện khách
      location.reload();
    }
    return res;
  };

  async function logout() {
    if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try {
        await originalFetch(`${BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt })
        });
      } catch (e) { /* BE tắt vẫn cho đăng xuất ở FE */ }
    }
    clearAuth();
    // Trang công khai (trang chủ, danh sách khóa học...) ở lại trang với giao diện khách
    if (currentArea()) {
      location.href = `${rootPrefix()}login.html`;
    } else {
      location.reload();
    }
  }

  // Gắn xử lý cho mọi nút đăng xuất (id khác nhau giữa các trang)
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#logoutBtn, #landingLogoutBtn, #dropdownLogout').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });
  });

  // Gọi ở đầu script của trang cần đăng nhập, vd Api.requireRole('STUDENT')
  function requireRole(...roles) {
    authRequired = true;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    if (!token) {
      goLogin();
      return false;
    }
    if (roles.length && !roles.includes(role)) {
      alert('Bạn không có quyền truy cập trang này.');
      location.href = `${rootPrefix()}index.html`;
      return false;
    }
    return true;
  }

  // Khối báo lỗi dùng chung thay cho dữ liệu giả khi API lỗi
  function errorHtml(message) {
    return `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#64748b;">
        <i class="fas fa-exclamation-circle" style="font-size:40px;color:#cbd5e1;margin-bottom:12px;"></i>
        <p style="margin-bottom:16px;">${message || 'Không tải được dữ liệu. Vui lòng thử lại.'}</p>
        <button class="btn btn-outline" onclick="location.reload()">Thử lại</button>
      </div>`;
  }

  // Khối thông báo khi API trả về danh sách rỗng
  function emptyHtml(message) {
    return `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#94a3b8;">
        <i class="fas fa-inbox" style="font-size:40px;color:#cbd5e1;margin-bottom:12px;"></i>
        <p>${message || 'Chưa có dữ liệu.'}</p>
      </div>`;
  }

  // Một số mã lỗi BE trả message tiếng Anh → dịch để hiện cho người dùng
  const ERROR_MESSAGES = {
    600: 'Bạn đã đánh giá khóa học này rồi.',
    601: 'Bạn cần đăng ký khóa học trước khi đánh giá.',
    602: 'Bạn cần hoàn thành 100% khóa học trước khi đánh giá.'
  };

  // Lấy thông báo lỗi từ body JSON của BE ({status, message})
  function errorMessage(json, fallback) {
    if (json && ERROR_MESSAGES[json.status]) return ERROR_MESSAGES[json.status];
    return (json && json.message) || fallback || 'Đã có lỗi xảy ra.';
  }

  // ── Chuông thông báo (GIẢNG VIÊN + HỌC VIÊN) ──
  // Trang giảng viên: gắn vào nút #notiBell có sẵn.
  // Trang học viên / trang công khai khi đã đăng nhập: tự chèn chuông cạnh #navLoggedIn.
  // BE hiện chỉ tạo thông báo về thanh toán → bấm vào thông báo mở trang thanh toán.
  const NOTI_STYLE = `
    .api-noti-bell { position: relative; width: 40px; height: 40px; border-radius: 50%; border: none;
      background: #f1f5f9; color: #475569; font-size: 17px; cursor: pointer; display: inline-flex;
      align-items: center; justify-content: center; }
    .api-noti-bell:hover { background: #e2e8f0; color: #2563eb; }
    .api-noti-badge { position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 4px;
      border-radius: 9px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; line-height: 18px;
      text-align: center; border: 2px solid #fff; box-sizing: content-box; }
    .api-noti-panel { position: fixed; z-index: 2000; width: min(360px, calc(100vw - 32px)); max-height: 440px;
      display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
      box-shadow: 0 20px 40px rgba(15,23,42,.18); font-family: inherit; color: #0f172a; }
    .api-noti-panel[hidden] { display: none; }
    .api-noti-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9; font-weight: 700; font-size: 15px; }
    .api-noti-head button { border: none; background: none; color: #2563eb; font-size: 13px; font-weight: 600; cursor: pointer; }
    .api-noti-list { overflow-y: auto; }
    .api-noti-item { display: block; width: 100%; text-align: left; border: none; background: #fff; padding: 12px 16px;
      border-bottom: 1px solid #f8fafc; cursor: pointer; font: inherit; color: inherit; }
    .api-noti-item:hover { background: #f8fafc; }
    .api-noti-item.unread { background: #eff6ff; }
    .api-noti-item .t { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
    .api-noti-item .m { font-size: 13px; color: #475569; line-height: 1.45; }
    .api-noti-item .d { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .api-noti-empty { padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 14px; }`;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function timeAgo(str) {
    if (!str) return '';
    const diff = Math.floor((Date.now() - new Date(str)) / 1000);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    return Math.floor(diff / 86400) + ' ngày trước';
  }

  function initNotifications() {
    const role = localStorage.getItem('userRole');
    if (!localStorage.getItem('token') || !['STUDENT', 'TEACHER'].includes(role)) return;

    let bell = document.getElementById('notiBell');
    if (!bell && role === 'STUDENT') {
      const anchor = document.getElementById('navLoggedIn');
      if (!anchor) return;
      bell = document.createElement('button');
      bell.type = 'button';
      bell.className = 'api-noti-bell';
      bell.setAttribute('aria-label', 'Thông báo');
      bell.innerHTML = '<i class="fas fa-bell"></i>';
      anchor.parentNode.insertBefore(bell, anchor);
    }
    if (!bell) return;

    const style = document.createElement('style');
    style.textContent = NOTI_STYLE;
    document.head.appendChild(style);

    // Badge: dùng #notiBadge có sẵn ở trang giảng viên, nếu không có thì tạo
    let badge = document.getElementById('notiBadge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'api-noti-badge';
      bell.appendChild(badge);
    }
    badge.style.display = 'none';

    const panel = document.createElement('div');
    panel.className = 'api-noti-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="api-noti-head"><span>Thông báo</span><button type="button" data-act="all">Đánh dấu đã đọc tất cả</button></div>
      <div class="api-noti-list"><div class="api-noti-empty">Đang tải...</div></div>`;
    document.body.appendChild(panel);
    const list = panel.querySelector('.api-noti-list');

    const paymentsPage = `${rootPrefix()}${role === 'TEACHER' ? 'teacher' : 'student'}/payments.html`;
    const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

    function setCount(n) {
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.style.display = n > 0 ? '' : 'none';
    }

    async function loadCount() {
      try {
        const res = await fetch(`${BASE}/notifications/unread-count`, { headers: authHeaders() });
        if (res.ok) setCount(Number((await res.json()).result) || 0);
      } catch (e) { /* BE tắt: giữ chuông không badge */ }
    }

    async function loadList() {
      try {
        const res = await fetch(`${BASE}/notifications/my-notifications`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = ((await res.json()).result || [])
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 20);
        setCount(items.filter(n => !n.isRead).length);
        list.innerHTML = items.length
          ? items.map(n => `
              <button type="button" class="api-noti-item ${n.isRead ? '' : 'unread'}" data-id="${escapeHtml(n.id)}" data-read="${n.isRead ? 1 : 0}">
                <div class="t">${escapeHtml(n.title)}</div>
                <div class="m">${escapeHtml(n.message)}</div>
                <div class="d">${timeAgo(n.createdAt)}</div>
              </button>`).join('')
          : '<div class="api-noti-empty">Chưa có thông báo</div>';
      } catch (e) {
        list.innerHTML = '<div class="api-noti-empty">Không tải được thông báo</div>';
      }
    }

    function place() {
      const r = bell.getBoundingClientRect();
      panel.style.top = `${r.bottom + 8}px`;
      panel.style.right = `${Math.max(16, window.innerWidth - r.right)}px`;
    }

    bell.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (panel.hidden) {
        place();
        panel.hidden = false;
        loadList();
      } else {
        panel.hidden = true;
      }
    });
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true;
    });
    window.addEventListener('resize', () => { if (!panel.hidden) place(); });

    panel.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (e.target.closest('[data-act="all"]')) {
        try {
          await fetch(`${BASE}/notifications/mark-all-read`, { method: 'PUT', headers: authHeaders() });
        } catch (err) { /* bỏ qua */ }
        loadList();
        return;
      }
      const item = e.target.closest('.api-noti-item');
      if (!item) return;
      if (item.dataset.read === '0') {
        try {
          await fetch(`${BASE}/notifications/${encodeURIComponent(item.dataset.id)}/mark-read`, {
            method: 'PUT', headers: authHeaders()
          });
        } catch (err) { /* vẫn chuyển trang */ }
      }
      location.href = paymentsPage;
    });

    loadCount();
  }

  document.addEventListener('DOMContentLoaded', initNotifications);

  window.Api = { BASE, logout, requireRole, goLogin, clearAuth, errorHtml, emptyHtml, errorMessage };
})();
