/* ======================================================
   common.js — Shared teacher utilities
   Teacher ID: teacher-001 (Nguyen Van An)
====================================================== */

(function () {
  "use strict";

  // Avoid duplicate declaration by checking if already defined
  if (window.TEACHER_ID) {
    console.warn(
      "TEACHER_ID already defined, skipping common.js initialization",
    );
    return;
  }

  // Always use teacher-001 for now (can be changed to use localStorage later)
  window.TEACHER_ID = 'teacher-001';
  window.API_BASE = "http://localhost:8080";
  
  console.log('Teacher common.js initialized with userId:', window.TEACHER_ID);
})();

// const TEACHER_ID = window.TEACHER_ID;
// const API_BASE = window.API_BASE;

// ── API Helper ──────────────────────────────────────────
async function apiGet(path) {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(API_BASE + path, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
    return await res.json();
  } catch (e) {
    console.error("[API GET]", e.message);
    return null;
  }
}

async function apiPost(path, body) {
  try {
    const token = localStorage.getItem('token');
    const headers = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.error("[API POST]", e.message);
    return null;
  }
}

async function apiPut(path, body = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(API_BASE + path, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.error("[API PUT]", e.message);
    return null;
  }
}

async function apiPatch(path, body = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(API_BASE + path, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.error("[API PATCH]", e.message);
    return null;
  }
}

async function apiDelete(path) {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(API_BASE + path, { 
      method: "DELETE",
      headers 
    });
    return await res.json();
  } catch (e) {
    console.error("[API DELETE]", e.message);
    return null;
  }
}

// ── Toast ───────────────────────────────────────────────
function showToast(message, type = "info", duration = 3500) {
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastSlideIn 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Format helpers ───────────────────────────────────────
function formatMoney(n) {
  if (n == null) return "0 đ";
  return Number(n).toLocaleString("vi-VN") + "đ";
}
function formatDate(str) {
  if (!str) return "–";
  return new Date(str).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function formatDateTime(str) {
  if (!str) return "–";
  const d = new Date(str);
  return (
    d.toLocaleDateString("vi-VN") +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}
function timeAgo(str) {
  if (!str) return "";
  const now = new Date(),
    d = new Date(str);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
  if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
  return Math.floor(diff / 86400) + " ngày trước";
}

// ── Status helpers ───────────────────────────────────────
const PAYMENT_STATUS = {
  PENDING_PROOF: { cls: "badge-warning", txt: "⏳ Chờ bill" },
  PROOF_UPLOADED: { cls: "badge-orange", txt: "📋 Chờ duyệt" },
  CONFIRMED: { cls: "badge-success", txt: "✅ Đã xác nhận" },
  REJECTED: { cls: "badge-danger", txt: "❌ Từ chối" },
  CANCELLED: { cls: "badge-muted", txt: "🚫 Đã hủy" },
  EXPIRED: { cls: "badge-danger", txt: "⌛ Hết hạn" },
};
const COURSE_STATUS = {
  DRAFT: { cls: "badge-muted", txt: "📝 Nháp" },
  PENDING: { cls: "badge-warning", txt: "⏳ Chờ duyệt" },
  PUBLISHED: { cls: "badge-success", txt: "✅ Published" },
  ARCHIVED: { cls: "badge-danger", txt: "🗄️ Archived" },
};

// ── Navbar user init ─────────────────────────────────────
async function initNavUser() {
  const data = await apiGet(`/profile/me?userId=${TEACHER_ID}`);
  if (!data?.result) return;
  const p = data.result;
  const name = p.fullName || p.firstName || "Giảng viên";

  // Sidebar name
  const sidebarNameEl = document.getElementById("sidebarName");
  const sidebarAvatarEl = document.getElementById("sidebarAvatar");
  const topNavNameEl = document.getElementById("topNavName");
  const topNavUserEl = document.getElementById("topNavUserName");
  const topNavAvatarEl = document.getElementById("topNavAvatar");

  if (sidebarNameEl) sidebarNameEl.textContent = name;
  const shortName = name.split(" ").at(-1);
  if (topNavNameEl) topNavNameEl.textContent = shortName;
  if (topNavUserEl) topNavUserEl.textContent = shortName;

  if (p.avatar) {
    const html = `<img src="${p.avatar}" alt="${name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    if (sidebarAvatarEl) sidebarAvatarEl.innerHTML = html;
    if (topNavAvatarEl) topNavAvatarEl.innerHTML = html;
  } else {
    const init = name[0].toUpperCase();
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = init;
    if (topNavAvatarEl) topNavAvatarEl.textContent = init;
  }
}

// ── Dropdown toggle ──────────────────────────────────────
function initDropdowns() {
  // User pill
  const userPillBtn = document.getElementById("userPillBtn");
  const userDropdown = document.getElementById("userDropdown");
  if (userPillBtn && userDropdown) {
    userPillBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });
  }

  // Notification bell
  const notiBell = document.getElementById("notiBell");
  const notiDropdown = document.getElementById("notiDropdown");
  if (notiBell && notiDropdown) {
    notiBell.addEventListener("click", (e) => {
      e.stopPropagation();
      notiDropdown.classList.toggle("show");
    });
  }

  // Close on outside click
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".dropdown-menu.show, .noti-dropdown.show")
      .forEach((el) => el.classList.remove("show"));
  });

  // Logout
  ["logoutBtn", "dropdownLogout"].forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.addEventListener("click", () => {
        if (confirm("Bạn có chắc muốn đăng xuất?"))
          window.location.href = "../student/index.html";
      });
  });

  // Mark all read
  const markBtn = document.getElementById("markAllRead");
  if (markBtn)
    markBtn.addEventListener("click", () => {
      document
        .querySelectorAll(".noti-item.unread")
        .forEach((el) => el.classList.remove("unread"));
      const badge = document.getElementById("notiBadge");
      if (badge) badge.style.display = "none";
    });
}

// ── Sidebar active link ──────────────────────────────────
function initSidebarActive() {
  const currentPage = window.location.pathname.split("/").pop();
  const currentSearch = window.location.search;
  const currentFull = currentPage + currentSearch;
  
  document.querySelectorAll(".sidebar .nav-item").forEach((el) => {
    const href = el.getAttribute("href");
    if (!href) return;
    
    // Extract page and query from href
    const [hrefPage, hrefQuery] = href.split("?");
    const hrefFull = href;
    
    // Exact match (including query string)
    if (hrefFull === currentFull) {
      el.classList.add("active");
    } 
    // If no query string in current URL, match only page
    else if (!currentSearch && hrefPage === currentPage && !hrefQuery) {
      el.classList.add("active");
    } 
    else {
      el.classList.remove("active");
    }
  });
}

// ── Mobile sidebar ───────────────────────────────────────
function initMobileSidebar() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () =>
      sidebar.classList.toggle("mobile-open"),
    );
  }
}

// ── Debounce ─────────────────────────────────────────────
function debounce(fn, delay = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ── Init commons on DOMContentLoaded ────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initNavUser();
  initDropdowns();
  initSidebarActive();
  initMobileSidebar();
});
