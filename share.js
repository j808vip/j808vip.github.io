async function ShareIG() {
  try {
    const chance = document.getElementById("chance")?.innerText || "";
    const resultHTML = document.getElementById("result")?.innerText || "尚未抽卡";
    const isWin = resultHTML.includes("恭喜");
    const code = resultHTML.replace("🎉 恭喜中獎", "").trim();

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    // ==========================================
    // 1. 【底圖層】基礎背景
    // ==========================================
    const bg = ctx.createLinearGradient(0, 0, 0, 1920);
    bg.addColorStop(0, "#0a0a0a");
    bg.addColorStop(1, "#000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // ==========================================
    // 2. 【中層】裝飾框、卡片元件
    // ==========================================
    
    // 中央大黑卡外框
    drawRoundRect(ctx, 120, 520, 840, 1000, 40, "#111");
    
    // 內部小卡容器
    drawRoundRect(ctx, 260, 620, 560, 820, 30, "#0d0d0d");

    // 金色發光效果卡片
    ctx.save();
    ctx.shadowColor = "gold";
    ctx.shadowBlur = 80;
    drawRoundRect(ctx, 360, 780, 360, 480, 30, "gold");
    ctx.restore();

    // ==========================================
    // 3. 【頂層】文字訊息 (方便後續修改座標/內容)
    // ==========================================
    ctx.textAlign = "center";

    // 總標題
    ctx.fillStyle = "#fff";
    ctx.font = "bold 90px sans-serif";
    ctx.fillText("🎴 抽卡結果", 540, 220);

    // 剩餘次數
    ctx.fillStyle = "#fff";
    ctx.font = "40px sans-serif";
    ctx.fillText(chance, 540, 640);

    // 卡片內自訂標題
    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText("可自訂文字", 540, 700);

    // 金色卡片內文字 (黑色)
    ctx.fillStyle = "#000";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("🎉 文字可自訂", 540, 960);
    
    // 驗證碼 (金色卡片內)
    ctx.font = "48px monospace";
    wrapText(ctx, code, 540, 1020, 600, 60);

    // 中獎狀態文字
    ctx.fillStyle = isWin ? "#fff" : "#777";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(isWin ? "🎉 恭喜中獎" : "未中獎", 540, 1350);

    // 如果中獎，底部的 16 位碼
    if (isWin) {
      ctx.font = "48px monospace";
      ctx.fillStyle = "#fff";
      wrapText(ctx, code, 540, 1420, 600, 60);
    }

    // 頁尾資訊
    ctx.fillStyle = "#666";
    ctx.font = "30px sans-serif";
    ctx.fillText("自訂分享專用卡片", 540, 1820);

    // ==========================================
    // 4. 【按鈕層】最上層的互動元件
    // ==========================================
    // 頂部小按鈕 (登出)
    drawBtn(ctx, 470, 380, 140, 60, "#222", "登出");

    // 底部功能按鈕群
    drawBtn(ctx, 260, 1450, 200, 80, "#222", "📤 SSR分享");
    drawBtn(ctx, 440, 1450, 220, 80, "#222", "📋 複製驗證碼");
    drawBtn(ctx, 660, 1450, 220, 80, "orange", "🎴 再抽一次");

    // ==========================================
    // 📤 輸出行為
    // ==========================================
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "ig-share.png", { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "抽卡結果" });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "ig-share.png";
        a.click();
      }
    });

  } catch (e) {
    console.error("分享失敗:", e);
  }
}

// --- 輔助函式保持不變 ---
function drawRoundRect(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawBtn(ctx, x, y, w, h, color, text) {
  drawRoundRect(ctx, x, y, w, h, 20, color);
  ctx.fillStyle = "#fff";
  ctx.font = "26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, x + w/2, y + h/2 + 8);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split("");
  let line = "";
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = chars[i];
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}
