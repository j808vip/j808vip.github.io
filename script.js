const API_URL = "https://script.google.com/macros/s/AKfycbxq5NZTqAuM72Wfw-hg1Gtb-r2UbDgnx-iGWqehIFaHSaQEnh-ewA1_gc4hC2_WQYL3/exec";

let currentUser = null;
let lastCode = "";
let remainingTimes = 0;

/* ⭐ 核心控制 */
let isDrawing = false;
let canPickCard = false;

/* login */
let loginLock = false;
let lastLoginTime = 0;

/* fetch timeout */
function fetchWithTimeout(url, timeout = 8000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    )
  ]);
}

/* ================= UI ================= */
function updateLoginUI(isLogin) {
  const uid = document.getElementById("uid");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  uid.style.display = isLogin ? "none" : "inline-block";
  loginBtn.style.display = isLogin ? "none" : "inline-block";
  logoutBtn.style.display = isLogin ? "inline-block" : "none";
}

/* ================= 登出 ================= */
function logout() {

  currentUser = null;
  remainingTimes = 0;
  lastCode = "";

  isDrawing = false;
  canPickCard = false;

  document.getElementById("chance").innerText = "";
  document.getElementById("cards").innerHTML = "";
  document.getElementById("result").innerText = "";
  document.getElementById("overlay").classList.remove("show");

  document.getElementById("drawAgainBtn").style.display = "none";
  document.getElementById("copyBtn").style.display = "none";

  updateLoginUI(false);
}

/* ================= 初始化 ================= */
window.onload = function () {
  const saved = localStorage.getItem("uid");
  if (saved) document.getElementById("uid").value = saved;

  document.getElementById("drawAgainBtn").onclick = createCards;
};

/* ================= 建卡 ================= */
function createCards() {

  const cardsDiv = document.getElementById("cards");
  cardsDiv.innerHTML = "";

  isDrawing = false;
  canPickCard = true;   // ⭐ 每一回合才允許點

  document.getElementById("overlay").classList.remove("show");
  document.getElementById("result").innerText = "";

  document.getElementById("copyBtn").style.display = "none";
  document.getElementById("drawAgainBtn").style.display = "none";

  for (let i = 0; i < 3; i++) {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="inner">
        <div class="front">抽卡</div>
        <div class="back">?</div>
      </div>
    `;

    card.onclick = () => handleClick(card);
    cardsDiv.appendChild(card);
  }
}

/* ================= 登入 ================= */
async function login() {

  const now = Date.now();
  const btn = document.getElementById("loginBtn");

  if (loginLock || now - lastLoginTime < 3000) return;

  loginLock = true;
  lastLoginTime = now;

  btn.disabled = true;
  btn.innerText = "登入中...";

  try {

    const uid = document.getElementById("uid").value.trim();
    if (!uid) return alert("請輸入編號姓名");

    localStorage.setItem("uid", uid);

    const res = await fetchWithTimeout(`${API_URL}?action=user&id=${uid}`);
    const t = await res.text();

    if (t === "NO_USER") return alert("查無此用戶");

    const data = JSON.parse(t);

    currentUser = uid;
    remainingTimes = data.times;

    document.getElementById("chance").innerText =
      `${currentUser} 剩餘次數：${remainingTimes}`;

    createCards();
    updateLoginUI(true);

  } catch (e) {
    alert(e.message === "timeout" ? "系統忙碌中" : "登入失敗");

  } finally {
    loginLock = false;
    setTimeout(() => {
      btn.disabled = false;
      btn.innerText = "登入";
    }, 2000);
  }
}

/* ================= 抽卡核心 ================= */
async function handleClick(card) {

  if (isDrawing) return;
  if (!canPickCard) return;
  if (!currentUser) return alert("請先登入");
  if (remainingTimes <= 0) return alert("已無抽卡次數");

  isDrawing = true;
  canPickCard = false; // ⭐ 抽一次後鎖死

  document.getElementById("overlay").classList.add("show");

  const inner = card.querySelector(".inner");

  remainingTimes--;
  document.getElementById("chance").innerText =
    `${currentUser} 剩餘次數：${remainingTimes}`;

  inner.classList.add("spinning");

  try {

    const ip = await fetchWithTimeout("https://api.ipify.org");
    const ipText = await ip.text();

    const res = await fetchWithTimeout(
      `${API_URL}?action=draw&id=${currentUser}&ip=${ipText}`
    );

    const t = await res.text();
    if (t === "NO_CHANCE") throw new Error("NO_CHANCE");

    const data = JSON.parse(t);

    lastCode = data.win ? data.code : "";
    remainingTimes = data.remain;

    const allCards = document.querySelectorAll(".card");

    requestAnimationFrame(() => {

      inner.classList.remove("spinning");
      card.classList.add("glow-selected");

      inner.classList.add("flipped");
      inner.querySelector(".back").innerHTML =
          data.win
              ? `🎉 文字可自訂<br>${data.code.slice(0, 16)}`
              : "未中獎";
        

      requestAnimationFrame(() => {

        const others = [...allCards].filter(c => c !== card);

        setTimeout(() => {

          if (data.win) {
            others.forEach(c => {
              const i = c.querySelector(".inner");
              i.querySelector(".back").innerHTML = "未中獎";
              i.classList.add("flipped");
            });
          } else {
            const shuffled = others.sort(() => Math.random() - 0.5);

            shuffled[0].querySelector(".back").innerHTML = "🎉 中獎";
            shuffled[1].querySelector(".back").innerHTML = "未中獎";

            shuffled.forEach(c =>
              c.querySelector(".inner").classList.add("flipped")
            );
          }

        }, 200);

        setTimeout(() => {

          const resultDiv = document.getElementById("result");
          const copyBtn = document.getElementById("copyBtn");

          if (data.win) {
            resultDiv.innerHTML = `🎉 恭喜中獎<br>${data.code}`;
            copyBtn.style.display = "inline-block";
          } else {
            resultDiv.innerHTML = "未中獎";
            copyBtn.style.display = "none";
          }

          document.getElementById("overlay").classList.remove("show");

          setTimeout(() => {

            document.getElementById("chance").innerText =
              `${currentUser} 剩餘次數：${remainingTimes}`;

            document.getElementById("drawAgainBtn").style.display =
              remainingTimes > 0 ? "inline-block" : "none";

            isDrawing = false;

          }, 300);

        }, 400);

      });

    });

  } catch (e) {

    alert("抽卡失敗");

    document.getElementById("overlay").classList.remove("show");
    inner.classList.remove("spinning");

  } finally {
    setTimeout(() => isDrawing = false, 300);
  }
}

/* ================= 工具 ================= */
function copyCode() {
  if (!lastCode) return alert("無中獎碼");
  navigator.clipboard.writeText(lastCode);
}

function capture() {
  html2canvas(document.body).then(canvas => {
    const a = document.createElement("a");
    a.href = canvas.toDataURL();
    a.download = "抽獎結果.png";
    a.click();
  });
}

