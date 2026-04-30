const API = "https://script.google.com/macros/s/AKfycbxq5NZTqAuM72Wfw-hg1Gtb-r2UbDgnx-iGWqehIFaHSaQEnh-ewA1_gc4hC2_WQYL3/exec";

/* =========================
   📦 分頁變數
========================= */
let allLogs = [];
let currentPage = 1;
const pageSize = 12;

/* =========================
   🔐 登入
========================= */
async function adminLogin() {
  let u = document.getElementById("user").value.trim();
  let p = document.getElementById("pass").value.trim();

  let res = await fetch(`${API}?action=login&user=${encodeURIComponent(u)}&pass=${encodeURIComponent(p)}`);
  let t = await res.text();

  if (t === "OK") {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
  } else {
    alert("帳號或密碼錯誤");
  }
}

/* =========================
   👤 讀取使用者
========================= */
async function getUserData() {
  let id = document.getElementById("searchUser").value.trim();
  if (!id) return alert("請輸入使用者編號");

  document.getElementById("editUser").innerText = "";

  let res = await fetch(`${API}?action=user&id=${encodeURIComponent(id)}`);
  let t = await res.text();

  if (t === "NO_USER") {
    alert("查無此使用者");
    return;
  }

  let data = JSON.parse(t);

  document.getElementById("editUser").innerText = id;
  document.getElementById("editTimes").value = data.times;
  document.getElementById("editRate").value = data.rate || 0;
  document.getElementById("editMust").value = data.must || 0;
  document.getElementById("editUsed").value = data.used || 0;
}

/* =========================
   ✏️ 更新使用者
========================= */
async function updateUser() {
  let id = document.getElementById("editUser").innerText.trim();
  let times = document.getElementById("editTimes").value.trim();
  let rate = document.getElementById("editRate").value.trim();
  let must = document.getElementById("editMust").value.trim();

  if (!id) return alert("請先讀取使用者資料");

  let params = [];
  if (times) params.push(`times=${encodeURIComponent(times)}`);
  if (rate) params.push(`rate=${encodeURIComponent(rate)}`);
  if (must) params.push(`must=${encodeURIComponent(must)}`);

  if (params.length === 0) return alert("沒有要更新的資料");

  await fetch(`${API}?action=updateUser&id=${encodeURIComponent(id)}&${params.join("&")}`);
  alert("更新成功");
}

/* =========================
   📜 載入 log
========================= */
async function loadLogs() {
  let res = await fetch(`${API}?action=getLogs`);
  allLogs = await res.json();

  currentPage = 1;
  renderLogs();
}

/* =========================
   📄 render 分頁（7頁 + 跳頁）
========================= */
function renderLogs() {
  let start = (currentPage - 1) * pageSize;
  let end = start + pageSize;

  let pageData = allLogs.slice(start, end);
  let totalPages = Math.ceil(allLogs.length / pageSize);

  let html = `
    <table border=1 style="border-collapse:collapse; text-align:center; width:100%;">
      <tr>
        <th>開獎時間</th>
        <th>編號姓名</th>
        <th>是否中獎</th>
        <th>中獎16位碼</th>
        <th>IP</th>
      </tr>
  `;

  pageData.forEach(l => {
    html += `
      <tr>
        <td style="text-align:left;">${l[0]}</td>
        <td>${l[1]}</td>
        <td>${l[2]}</td>
        <td>${l[3]}</td>
        <td>${l[4] || ""}</td>
      </tr>
    `;
  });

  html += `</table>`;
  html += renderPagination(totalPages);

  document.getElementById("logArea").innerHTML = html;
}

/* =========================
   📦 分頁 UI
========================= */
function renderPagination(totalPages) {
  let html = `<div style="margin-top:10px; display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">`;

  html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>上一頁</button>`;

  let max = 7;
  let half = Math.floor(max / 2);

  let start = currentPage - half;
  let end = currentPage + half;

  if (start < 1) {
    start = 1;
    end = max;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - max + 1;
    if (start < 1) start = 1;
  }

  for (let i = start; i <= end; i++) {
    html += `
      <button onclick="changePage(${i})"
        style="
          font-weight:${i === currentPage ? "bold" : "normal"};
          background:${i === currentPage ? "#ffb300" : "#222"};
          color:${i === currentPage ? "#000" : "#fff"};
        ">
        ${i}
      </button>
    `;
  }

  html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>下一頁</button>`;

  html += `
    <input id="jumpPage" type="number" min="1" max="${totalPages}" placeholder="頁">
    <button onclick="jumpToPage(${totalPages})">跳</button>
  `;

  html += `</div>`;
  return html;
}

/* =========================
   🔁 換頁
========================= */
function changePage(page) {
  let totalPages = Math.ceil(allLogs.length / pageSize);

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderLogs();
}

/* =========================
   🎯 跳頁
========================= */
function jumpToPage(totalPages) {
  let p = parseInt(document.getElementById("jumpPage").value);

  if (!p || p < 1 || p > totalPages) {
    alert("頁碼錯誤");
    return;
  }

  currentPage = p;
  renderLogs();
}

/* =========================
   🚪 登出
========================= */
function adminLogout() {
  document.getElementById("loginArea").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";

  document.getElementById("editUser").innerText = "";
  document.getElementById("editTimes").value = "";
  document.getElementById("editRate").value = "";
  document.getElementById("editMust").value = "";
  document.getElementById("editUsed").value = "";
  document.getElementById("searchUser").value = "";
  document.getElementById("logArea").innerHTML = "";
}
