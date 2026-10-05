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

  window.Api = { BASE, logout, requireRole, goLogin, clearAuth, errorHtml, emptyHtml };
})();
