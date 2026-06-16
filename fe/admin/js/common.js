/* ======================================================
   common.js — Admin Portal Shared Utilities
====================================================== */
(function () {
  'use strict';
  if (window.ADMIN_INITIALIZED) return;
  window.ADMIN_INITIALIZED = true;
  window.API_BASE = 'http://localhost:8080';
  window.ADMIN_ID = localStorage.getItem('adminId') || 'admin-001';
  console.log('[Admin] common.js initialized');

  // Kiểm tra quyền truy cập Admin
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  if (!token || role !== 'ADMIN') {
    alert('Bạn không có quyền truy cập trang quản trị! Vui lòng đăng nhập bằng tài khoản Admin.');
    window.location.href = '../login.html';
  }
})();

/* ── API Helpers ── */
async function apiGet(path) {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    console.log('[API GET]', API_BASE + path, 'Token:', token ? 'Present' : 'Missing');
    
    const res = await fetch(API_BASE + path, { headers });
    const data = await res.json();
    
    if (!res.ok) {
      console.error('[API GET Error]', path, 'Status:', res.status, 'Response:', data);
      return data; // Return error response for handling
    }
    
    console.log('[API GET Success]', path, 'Data:', data);
    return data;
  } catch (e) {
    console.error('[API GET Exception]', path, e);
    return { status: 500, message: e.message, result: null };
  }
}
async function apiPost(path, body) {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
    return await res.json();
  } catch (e) { console.error('[POST]', path, e.message); return null; }
}
async function apiPut(path, body = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_BASE + path, { method: 'PUT', headers, body: JSON.stringify(body) });
    return await res.json();
  } catch (e) { console.error('[PUT]', path, e.message); return null; }
}
async function apiPatch(path, body = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_BASE + path, { method: 'PATCH', headers, body: JSON.stringify(body) });
    return await res.json();
  } catch (e) { console.error('[PATCH]', path, e.message); return null; }
}
async function apiDelete(path) {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_BASE + path, { method: 'DELETE', headers });
    return await res.json();
  } catch (e) { console.error('[DELETE]', path, e.message); return null; }
}

/* ── Toast ── */
function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── Format Helpers ── */
function formatMoney(n) {
  if (n == null) return '0 đ';
  return Number(n).toLocaleString('vi-VN') + 'đ';
}
function formatDate(str) {
  if (!str) return '–';
  return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(str) {
  if (!str) return '–';
  const d = new Date(str);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function timeAgo(str) {
  if (!str) return '';
  const diff = Math.floor((Date.now() - new Date(str)) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  return Math.floor(diff / 86400) + ' ngày trước';
}
function shortNum(n) {
  // Với số tiền, hiển thị đầy đủ có dấu phẩy
  return n.toLocaleString('vi-VN');
}

function shortNumCompact(n) {
  // Hàm rút gọn cho các trường hợp cần (không dùng cho tiền)
  if (n >= 1000000000) return (n / 1000000000).toFixed(2) + 'B';
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('vi-VN');
}

/* ── Modal Helpers ── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

/* ── Debounce ── */
function debounce(fn, delay = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/* ── Animate Count ── */
function animateCount(el, target, isFloat = false) {
  const duration = 800;
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const cur = target * ease;
    el.textContent = isFloat ? cur.toFixed(1) : Math.floor(cur).toLocaleString('vi-VN');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ── Sidebar active ── */
function initSidebarActive() {
  const currentPage = window.location.pathname.split('/').pop();
  const currentSearch = window.location.search;
  document.querySelectorAll('.sidebar .nav-item').forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    const [hrefPage, hrefQuery] = href.split('?');
    if (href === currentPage + currentSearch) el.classList.add('active');
    else if (!currentSearch && hrefPage === currentPage && !hrefQuery) el.classList.add('active');
    else el.classList.remove('active');
  });
}

/* ── Dropdowns ── */
function initDropdowns() {
  const userPillBtn = document.getElementById('userPillBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userPillBtn && userDropdown) {
    userPillBtn.addEventListener('click', e => { e.stopPropagation(); userDropdown.classList.toggle('show'); });
  }
  const notiBell = document.getElementById('notiBell');
  const notiDropdown = document.getElementById('notiDropdown');
  if (notiBell && notiDropdown) {
    notiBell.addEventListener('click', e => { e.stopPropagation(); notiDropdown.classList.toggle('show'); });
  }
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.show, .noti-dropdown.show').forEach(el => el.classList.remove('show'));
  });
  ['logoutBtn', 'dropdownLogout'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminAvatar');
        window.location.href = '../login.html';
      }
    });
  });
  const markBtn = document.getElementById('markAllRead');
  if (markBtn) markBtn.addEventListener('click', () => {
    document.querySelectorAll('.noti-item.unread').forEach(el => el.classList.remove('unread'));
    const badge = document.getElementById('notiBadge');
    if (badge) badge.style.display = 'none';
  });
}

/* ── Nav user init ── */
async function initNavUser() {
  // Admin user display — use stored name or default
  const name = localStorage.getItem('adminName') || 'Quản trị viên';
  const avatar = localStorage.getItem('adminAvatar') || null;
  const sidebarName = document.getElementById('sidebarName');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const topNavAvatar = document.getElementById('topNavAvatar');
  const topNavUserName = document.getElementById('topNavUserName');
  if (sidebarName) sidebarName.textContent = name;
  const shortName = name.split(' ').at(-1);
  if (topNavUserName) topNavUserName.textContent = shortName;
  if (avatar) {
    const html = `<img src="${avatar}" alt="${name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    if (sidebarAvatar) sidebarAvatar.innerHTML = html;
    if (topNavAvatar) topNavAvatar.innerHTML = html;
  } else {
    const init = name[0].toUpperCase();
    if (sidebarAvatar) sidebarAvatar.textContent = init;
    if (topNavAvatar) topNavAvatar.textContent = init;
  }
}

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  initNavUser();
  initDropdowns();
  initSidebarActive();
});
