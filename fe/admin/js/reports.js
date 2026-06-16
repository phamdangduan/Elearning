/* ============================================================
   EduVN Admin - Reports & Analytics
   Xử lý hiển thị biểu đồ doanh thu, đăng ký và báo cáo của Admin
============================================================ */

const REVENUE_MONTH = [
  {label:'T1',value:18500000},{label:'T2',value:22300000},{label:'T3',value:19800000},
  {label:'T4',value:31200000},{label:'T5',value:28600000},{label:'T6',value:35100000},
  {label:'T7',value:42000000},{label:'T8',value:38500000},{label:'T9',value:45200000},
  {label:'T10',value:51000000},{label:'T11',value:47800000},{label:'T12',value:62000000},
];
const REVENUE_QUARTER = [
  {label:'Q1',value:60600000},{label:'Q2',value:94900000},{label:'Q3',value:125700000},{label:'Q4',value:160800000},
];
const REVENUE_YEAR = [
  {label:'2023',value:180000000},{label:'2024',value:245000000},{label:'2025',value:312000000},{label:'2026',value:128000000},
];
const ENROLL_DATA = [
  {label:'T1',value:280},{label:'T2',value:340},{label:'T3',value:290},{label:'T4',value:510},
  {label:'T5',value:470},{label:'T6',value:620},{label:'T7',value:780},{label:'T8',value:650},
  {label:'T9',value:820},{label:'T10',value:910},{label:'T11',value:840},{label:'T12',value:1110},
];
const TOP_COURSES = [
  {title:'Lập trình Java cơ bản',instructor:'Hoàng Thị Em',revenue:42000000,students:632,rating:4.8},
  {title:'Python Machine Learning',instructor:'Lê Quốc Cường',revenue:38500000,students:501,rating:4.9},
  {title:'UI/UX Design Figma',instructor:'Ngô Đức Hùng',revenue:31200000,students:421,rating:4.7},
  {title:'DevOps với Docker',instructor:'Phạm Minh Đức',revenue:28600000,students:189,rating:4.6},
  {title:'ReactJS Nâng cao',instructor:'Nguyễn Văn An',revenue:24900000,students:342,rating:4.8},
];
const TOP_INSTRUCTORS = [
  {name:'Lê Quốc Cường',courses:12,students:2103,revenue:32000000},
  {name:'Nguyễn Văn An',courses:8,students:1240,revenue:18500000},
  {name:'Hoàng Đức Em',courses:7,students:1560,revenue:21000000},
  {name:'Trần Thị Bình',courses:5,students:892,revenue:12300000},
  {name:'Phạm Thị Dung',courses:3,students:421,revenue:7800000},
];
const CATEGORIES = [
  {name:'Web Development',revenue:98000000,pct:34},
  {name:'Data Science & AI',revenue:72000000,pct:25},
  {name:'DevOps & Cloud',revenue:51000000,pct:18},
  {name:'Mobile Dev',revenue:43000000,pct:15},
  {name:'UI/UX Design',revenue:22000000,pct:8},
];

function renderChart(containerId, data, colorStart='var(--primary)', colorEnd='var(--accent)') {
  const maxVal = Math.max(...data.map(d=>d.value),1);
  document.getElementById(containerId).innerHTML = `<div class="chart-wrap">${data.map(d=>{
    const pct = Math.max((d.value/maxVal)*100,2);
    const val = d.value>=1000000 ? (d.value/1000000).toFixed(1)+'tr' : (d.value/1000).toFixed(0)+'k';
    return `<div class="chart-bar" style="height:${pct}%;background:linear-gradient(to top,${colorStart},${colorEnd})" data-label="${d.label}" data-value="${val}đ"></div>`;
  }).join('')}</div>`;
}

function switchPeriod(btn, period) {
  document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const data = period==='quarter' ? REVENUE_QUARTER : period==='year' ? REVENUE_YEAR : REVENUE_MONTH;
  renderChart('mainChart', data);
}

function renderTopCourses() {
  const by = document.getElementById('topCourseBy').value;
  const sorted = [...TOP_COURSES].sort((a,b)=>(b[by]||0)-(a[by]||0));
  const rankClass = ['gold','silver','bronze'];
  document.getElementById('topCoursesList').innerHTML = sorted.map((c,i)=>`
    <div class="top-item">
      <div class="top-rank ${rankClass[i]||''}">${i+1}</div>
      <div class="top-info">
        <div class="top-title">${c.title}</div>
        <div class="top-sub">${c.instructor} · ★${c.rating} · ${c.students.toLocaleString('vi-VN')} HV</div>
      </div>
      <div class="top-value">${by==='students'?c.students.toLocaleString('vi-VN')+' HV':by==='rating'?c.rating+' ★':shortNum(c.revenue)+'đ'}</div>
    </div>`).join('');
}

function renderTopInstructors() {
  const rankClass = ['gold','silver','bronze'];
  document.getElementById('topInstructorsList').innerHTML = TOP_INSTRUCTORS.map((t,i)=>`
    <div class="top-item">
      <div class="top-rank ${rankClass[i]||''}">${i+1}</div>
      <div class="top-info">
        <div class="top-title">${t.name}</div>
        <div class="top-sub">${t.courses} khóa · ${t.students.toLocaleString('vi-VN')} HV</div>
      </div>
      <div class="top-value">${shortNum(t.revenue)}đ</div>
    </div>`).join('');
}

function renderCategories() {
  document.getElementById('categoryList').innerHTML = CATEGORIES.map(c=>`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${c.name}</span>
        <span style="font-size:13px;font-weight:700;color:var(--primary)">${shortNum(c.revenue)}đ</span>
      </div>
      <div style="height:8px;background:var(--bg-primary);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${c.pct}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:4px;transition:width 0.8s ease"></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${c.pct}% tổng doanh thu</div>
    </div>`).join('');
}

function exportReport() {
  const rows = [['Tháng','Doanh thu (đ)'],...REVENUE_MONTH.map(d=>[d.label,d.value])];
  const csv = rows.map(r=>r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download = 'report-eduvn.csv'; a.click();
  showToast('Đã xuất báo cáo thành công!','success');
}

document.addEventListener('DOMContentLoaded', () => {
  renderChart('mainChart', REVENUE_MONTH);
  renderChart('enrollChart', ENROLL_DATA, 'var(--teacher-green)', '#34d399');
  renderTopCourses();
  renderTopInstructors();
  renderCategories();
  // Animate KPI numbers
  setTimeout(()=>{
    document.querySelectorAll('.stat-value').forEach(el=>{
      const raw = parseFloat(el.textContent.replace(/[^0-9.]/g,''));
      if(!isNaN(raw)&&raw>0) animateCount(el,raw);
    });
  },200);
});
