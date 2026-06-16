/* ============================================================
   EduVN Admin - Courses Management
   Duyệt và quản lý khóa học từ API backend hoặc mock data
============================================================ */

const PAGE_SIZE = 15;
let allCourses = [], filteredCourses = [], currentPage = 0;
let activeStatus = '', rejectTargetId = null;

const MOCK_COURSES = [
  { id:'c1', title:'ReactJS từ cơ bản đến nâng cao', instructor:'Nguyễn Văn An', price:499000, enrollments:342, status:'PENDING', createdAt:'2026-04-28', thumbnail:null },
  { id:'c2', title:'Spring Boot Microservices', instructor:'Trần Thị Bình', price:699000, enrollments:218, status:'PENDING', createdAt:'2026-04-29', thumbnail:null },
  { id:'c3', title:'Python Machine Learning', instructor:'Lê Quốc Cường', price:599000, enrollments:501, status:'PUBLISHED', createdAt:'2026-04-01', thumbnail:null },
  { id:'c4', title:'DevOps với Docker & Kubernetes', instructor:'Phạm Minh Đức', price:799000, enrollments:189, status:'PUBLISHED', createdAt:'2026-03-15', thumbnail:null },
  { id:'c5', title:'Lập trình Java cơ bản', instructor:'Hoàng Thị Em', price:399000, enrollments:632, status:'PUBLISHED', createdAt:'2026-02-10', thumbnail:null },
  { id:'c6', title:'Angular 17 Advanced', instructor:'Vũ Văn Phong', price:549000, enrollments:0, status:'DRAFT', createdAt:'2026-04-30', thumbnail:null },
  { id:'c7', title:'Node.js & Express API', instructor:'Đỗ Thị Giang', price:449000, enrollments:87, status:'ARCHIVED', createdAt:'2026-01-20', thumbnail:null },
  { id:'c8', title:'UI/UX Design Figma', instructor:'Ngô Đức Hùng', price:349000, enrollments:421, status:'PUBLISHED', createdAt:'2026-03-05', thumbnail:null },
  { id:'c9', title:'SQL & Database Design', instructor:'Đinh Thị Lan', price:299000, enrollments:298, status:'PUBLISHED', createdAt:'2026-02-28', thumbnail:null },
  { id:'c10', title:'Flutter Mobile App', instructor:'Trương Văn Minh', price:649000, enrollments:156, status:'PENDING', createdAt:'2026-04-27', thumbnail:null },
];

const STATUS_MAP = {
  PUBLISHED: { cls:'badge-success', txt:'✅ Published' },
  PENDING:   { cls:'badge-warning', txt:'⏳ Chờ duyệt' },
  DRAFT:     { cls:'badge-muted',   txt:'📝 Nháp' },
  ARCHIVED:  { cls:'badge-danger',  txt:'🗄️ Archived' },
};

const EMOJIS = { react:'⚛️', spring:'🌿', python:'🐍', devops:'🐳', docker:'🐋', java:'☕', angular:'🅰️', node:'🟢', sql:'🗄️', flutter:'📱', design:'🎨', ui:'🎨' };
function getEmoji(title='') { const t=title.toLowerCase(); for(const[k,v] of Object.entries(EMOJIS)) if(t.includes(k)) return v; return '📚'; }

async function loadCourses() {
  showSkeleton();
  try {
    const r = await apiGet('/course/search/admin?page=0&size=500');
    console.log('[Courses] API Response:', r);
    
    if (r && (r.status === 200 || r.status === 211) && r.result) {
      // API trả về PageResponse với structure: { status, message, result: { content: [], totalElements, ... } }
      allCourses = r.result.content || [];
      console.log('[Courses] Loaded from API:', allCourses.length, 'courses');
      
      if (allCourses.length === 0) {
        console.warn('[Courses] API returned empty array, using MOCK_COURSES as fallback');
        allCourses = MOCK_COURSES;
      }
    } else if (r && r.status !== 200 && r.status !== 211) {
      console.error('[Courses] API error:', r.message, '- Status:', r.status);
      showToast(`Lỗi API: ${r.message || 'Không thể tải khóa học'}`, 'error');
      allCourses = MOCK_COURSES;
    } else {
      console.error('[Courses] Invalid API response format:', r);
      showToast('Lỗi: Không nhận được dữ liệu từ server', 'error');
      allCourses = MOCK_COURSES;
    }
  } catch (err) {
    console.error('[Courses] Exception:', err);
    showToast('Lỗi kết nối: Đang dùng dữ liệu mẫu', 'warning');
    allCourses = MOCK_COURSES;
  }
  updateStats();
  applyFilter();
}

function showSkeleton() {
  document.getElementById('courseTableBody').innerHTML = `<tr><td colspan="8"><div style="padding:16px;display:flex;flex-direction:column;gap:10px">
    <div class="skeleton" style="height:56px;border-radius:var(--radius-sm)"></div>
    <div class="skeleton" style="height:56px;border-radius:var(--radius-sm)"></div>
    <div class="skeleton" style="height:56px;border-radius:var(--radius-sm)"></div>
  </div></td></tr>`;
}

function updateStats() {
  document.getElementById('statTotal').textContent = allCourses.length;
  document.getElementById('statPublished').textContent = allCourses.filter(c=>c.status==='PUBLISHED').length;
  document.getElementById('statPending').textContent = allCourses.filter(c=>c.status==='PENDING').length;
  document.getElementById('statDraft').textContent = allCourses.filter(c=>c.status==='DRAFT').length;
}

function switchTab(btn, status) {
  document.querySelectorAll('#statusTabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeStatus = status;
  currentPage = 0;
  applyFilter();
}

function applyFilter() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const sort = document.getElementById('sortFilter').value;
  let list = [...allCourses];
  if (activeStatus) list = list.filter(c=>c.status===activeStatus);
  if (q) list = list.filter(c=>(c.title||'').toLowerCase().includes(q)||(c.instructorName||c.instructor||'').toLowerCase().includes(q));
  if (sort==='oldest') list.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  else if (sort==='title_asc') list.sort((a,b)=>(a.title||'').localeCompare(b.title||''));
  else if (sort==='price_desc') list.sort((a,b)=>(b.price||0)-(a.price||0));
  else list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  filteredCourses = list;
  currentPage = 0;
  render();
}

function render() {
  const start = currentPage * PAGE_SIZE;
  const page = filteredCourses.slice(start, start+PAGE_SIZE);
  const total = filteredCourses.length;
  document.getElementById('displayCount').textContent = total;
  document.getElementById('tableCount').textContent = total ? `${start+1}–${Math.min(start+page.length,total)} / ${total}` : '';
  document.getElementById('pageInfo').textContent = total ? `Tổng ${total} khóa học` : '';

  if (!page.length) {
    document.getElementById('courseTableBody').innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📚</div><h3>Không có khóa học</h3><p>Thử thay đổi bộ lọc hoặc tab trạng thái</p></div></td></tr>`;
    document.getElementById('paginationWrap').innerHTML = '';
    return;
  }

  document.getElementById('courseTableBody').innerHTML = page.map((c,i) => {
    const s = STATUS_MAP[c.status] || { cls:'badge-muted', txt:c.status };
    const emoji = getEmoji(c.title);
    const approveBtn = c.status==='PENDING' ? `
      <button class="tbl-action success" title="Duyệt" onclick="approveCourse('${c.id}')"><i class="fas fa-check"></i></button>
      <button class="tbl-action danger" title="Từ chối" onclick="openReject('${c.id}')"><i class="fas fa-times"></i></button>` : '';
    const archiveBtn = c.status==='PUBLISHED' ? `<button class="tbl-action" title="Ẩn khóa học" onclick="archiveCourse('${c.id}')"><i class="fas fa-eye-slash"></i></button>` : '';
    
    // Lấy tên giảng viên từ API (instructorName) hoặc mock data (instructor)
    const insName = c.instructorName || c.instructor || '–';
    // Lấy ảnh khóa học từ API (thumbnailUrl) hoặc mock data (thumbnail)
    const thumbUrl = c.thumbnailUrl || c.thumbnail;
    const thumbDisplay = thumbUrl ? `<img src="${thumbUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)">` : `<span>${emoji}</span>`;
    
    return `<tr>
      <td style="color:var(--text-muted);font-size:12px">${start+i+1}</td>
      <td><div style="display:flex;align-items:center;gap:12px">
        <div class="course-thumb-sm">${thumbDisplay}</div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.title}</div>
          <div style="font-size:11px;color:var(--text-muted)">${formatDate(c.createdAt)}</div>
        </div>
      </div></td>
      <td style="font-size:13px;font-weight:600">${insName}</td>
      <td style="font-size:13px;font-weight:700;color:var(--primary)">${formatMoney(c.price)}</td>
      <td style="font-size:13px">${(c.enrollments||0).toLocaleString('vi-VN')}</td>
      <td><span class="badge ${s.cls}">${s.txt}</span></td>
      <td style="font-size:12px;color:var(--text-muted)">${formatDate(c.createdAt)}</td>
      <td><div style="display:flex;gap:6px">
        <button class="tbl-action" title="Chi tiết" onclick="viewCourse('${c.id}')"><i class="fas fa-eye"></i></button>
        ${approveBtn}${archiveBtn}
        <button class="tbl-action danger" title="Xóa" onclick="deleteCourse('${c.id}')"><i class="fas fa-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('');

  const totalPages = Math.ceil(total/PAGE_SIZE);
  if (totalPages<=1) { document.getElementById('paginationWrap').innerHTML=''; return; }
  let pHtml = `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===0?'disabled':''}><i class="fas fa-chevron-left"></i></button>`;
  for (let p=0;p<totalPages;p++) {
    if (p===0||p===totalPages-1||Math.abs(p-currentPage)<=1)
      pHtml += `<button class="page-btn ${p===currentPage?'active':''}" onclick="goPage(${p})">${p+1}</button>`;
    else if (Math.abs(p-currentPage)===2) pHtml += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
  }
  pHtml += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===totalPages-1?'disabled':''}><i class="fas fa-chevron-right"></i></button>`;
  document.getElementById('paginationWrap').innerHTML = pHtml;
}

function goPage(p) { currentPage=p; render(); window.scrollTo(0,0); }

function viewCourse(id) {
  const c = allCourses.find(x=>x.id===id);
  if (!c) return;
  const s = STATUS_MAP[c.status] || { cls:'badge-muted', txt:c.status };
  const emoji = getEmoji(c.title);
  
  const insName = c.instructorName || c.instructor || '–';
  const thumbUrl = c.thumbnailUrl || c.thumbnail;
  const thumbDisplay = thumbUrl ? `<img src="${thumbUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm)">` : `<span>${emoji}</span>`;
  
  document.getElementById('courseDetailBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding:20px;background:var(--bg-primary);border-radius:var(--radius-lg);margin-bottom:20px">
      <div class="course-thumb-sm" style="width:80px;height:60px;font-size:28px">${thumbDisplay}</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:6px">${c.title}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge ${s.cls}">${s.txt}</span>
          <span class="badge badge-info"><i class="fas fa-user"></i> ${insName}</span>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div><label class="form-label">Giá khóa học</label><p style="font-size:16px;font-weight:700;color:var(--primary)">${formatMoney(c.price)}</p></div>
      <div><label class="form-label">Số học viên</label><p style="font-size:16px;font-weight:700">${(c.enrollments||0).toLocaleString('vi-VN')}</p></div>
      <div><label class="form-label">Ngày tạo</label><p>${formatDate(c.createdAt)}</p></div>
    </div>`;
  const footer = document.getElementById('courseDetailFooter');
  const approveAction = c.status==='PENDING'
    ? `<button class="btn btn-success" onclick="approveCourse('${c.id}');closeModal('courseDetailModal')"><i class="fas fa-check"></i> Duyệt</button>
       <button class="btn btn-danger" onclick="closeModal('courseDetailModal');openReject('${c.id}')"><i class="fas fa-times"></i> Từ chối</button>` : '';
  footer.innerHTML = `<button class="btn btn-outline" onclick="closeModal('courseDetailModal')">Đóng</button>${approveAction}`;
  openModal('courseDetailModal');
}

async function approveCourse(id) {
  const r = await apiPut(`/admin/courses/${id}/approve`);
  if (r && (r.status === 200 || r.status === 202)) {
    const c = allCourses.find(x=>x.id===id);
    if (c) c.status = 'PUBLISHED';
    updateStats(); applyFilter();
    showToast('Đã duyệt khóa học thành công!','success');
  } else {
    showToast(r?.message || 'Không thể duyệt khóa học!', 'error');
  }
}

function openReject(id) { rejectTargetId=id; document.getElementById('rejectReason').value=''; openModal('rejectModal'); }
async function confirmReject() {
  const reason = document.getElementById('rejectReason').value.trim();
  if (!reason) { showToast('Vui lòng nhập lý do từ chối!','error'); return; }
  const r = await apiPut(`/admin/courses/${rejectTargetId}/reject`, { reason });
  if (r && (r.status === 200 || r.status === 202)) {
    const c = allCourses.find(x=>x.id===rejectTargetId);
    if (c) c.status = 'ARCHIVED';
    closeModal('rejectModal'); updateStats(); applyFilter();
    showToast('Đã từ chối khóa học!','warning');
  } else {
    showToast(r?.message || 'Không thể từ chối khóa học!', 'error');
  }
}

async function archiveCourse(id) {
  if (!confirm('Ẩn khóa học này khỏi hệ thống?')) return;
  const r = await apiPatch(`/admin/courses/${id}`, { status:'ARCHIVED' });
  if (r && (r.status === 200 || r.status === 202)) {
    const c = allCourses.find(x=>x.id===id);
    if (c) c.status = 'ARCHIVED';
    updateStats(); applyFilter();
    showToast('Đã ẩn khóa học!','warning');
  } else {
    showToast(r?.message || 'Không thể ẩn khóa học!', 'error');
  }
}

async function deleteCourse(id) {
  if (!confirm('Xóa vĩnh viễn khóa học này? Không thể hoàn tác!')) return;
  const r = await apiDelete(`/admin/courses/${id}`);
  if (r && (r.status === 200 || r.status === 203)) {
    allCourses = allCourses.filter(c=>c.id!==id);
    updateStats(); applyFilter();
    showToast('Đã xóa khóa học!','success');
  } else {
    showToast(r?.message || 'Không thể xóa khóa học!', 'error');
  }
}

document.getElementById('searchInput').addEventListener('input', debounce(applyFilter));
document.getElementById('sortFilter').addEventListener('change', applyFilter);

document.addEventListener('DOMContentLoaded', () => {
  loadCourses();
  // Auto-switch tab if URL has ?status=
  const params = new URLSearchParams(location.search);
  const st = params.get('status');
  if (st) {
    const btn = document.querySelector(`[data-status="${st}"]`);
    if (btn) switchTab(btn, st);
  }
});
