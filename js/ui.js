// =============================================
//   UI HELPERS — مأخوذة نصاً من الملف الأصلي
// =============================================

// دالة تسجيل العمليات في اللوحة الجانبية
function log(msg, type = 'info') {
    const container = document.getElementById('log-container');
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="time">${t}</span>${msg}`;
    container.prepend(entry);
    // الاحتفاظ بآخر 10 سجلات فقط لضمان الأداء
    while (container.children.length > 10) container.removeChild(container.lastChild);
}

// تحديث مؤشرات الخطوات (Guide Steps)
function updateSteps() {
    document.getElementById('s1').classList.toggle('done', !!selectedBase);
    document.getElementById('s2').classList.toggle('done', !!selectedMissile);
    document.getElementById('s3').classList.toggle('done', false);
}

// تحديث وقت النظام كل ثانية
setInterval(() => {
    const now = new Date();
    document.getElementById('sys-time').innerText =
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}, 1000);

// تحديث إحداثيات الماوس العلوية عند الحركة على الخريطة
map.on('mousemove', e => {
    document.getElementById('m-coords-top').innerText = `${e.latlng.lat.toFixed(4)}°N  ${e.latlng.lng.toFixed(4)}°E`;
});

// =============================================
//   MINI RADAR — نظام الرادار النبضي
// =============================================
const rc = document.getElementById('radar-canvas');
function resizeRC() {
    const c = document.getElementById('mini-radar');
    rc.width = c.offsetWidth;
    rc.height = c.offsetHeight;
}
resizeRC();

let radarAngle = 0;
function drawRadar() {
    const ctx = rc.getContext('2d'), w = rc.width, h = rc.height, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 4;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.15)';
    ctx.lineWidth = 0.5;
    
    // رسم دوائر الرادار
    [0.33, 0.66, 1].forEach(f => {
        ctx.beginPath(); ctx.arc(cx, cy, r * f, 0, Math.PI * 2); ctx.stroke();
    });
    
    // رسم خطوط المحاور
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    
    // رسم شعاع المسح (Sweep)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(radarAngle);
    const sg = ctx.createLinearGradient(0, 0, r, 0);
    sg.addColorStop(0, 'rgba(0, 255, 157, 0.5)');
    sg.addColorStop(1, 'rgba(0, 255, 157, 0)');
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.4, 0.4);
    ctx.fillStyle = sg; ctx.fill();
    ctx.restore();

    // رسم الأعداء على الرادار
    enemies.forEach(en => {
        if (en.hidden) return;
        const bx = cx + (en.lng - 46.0) / 20 * r * 0.85;
        const by = cy - (en.lat - 24.5) / 18 * r * 0.85;
        ctx.beginPath();
        if (en.type === 'ship') ctx.rect(bx - 4, by - 2, 8, 4);
        else if (en.type === 'tank') ctx.rect(bx - 2.5, by - 2.5, 5, 5);
        else ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3b3b';
        ctx.fill();
    });

    // رسم الصواريخ الباليستية على الرادار (مثلث برتقالي)
    ballisticMissiles.forEach(bm => {
        if (!bm.alive) return;
        const bx = cx + (bm.lng - 46.0) / 20 * r * 0.85;
        const by = cy - (bm.lat - 24.5) / 18 * r * 0.85;
        ctx.beginPath();
        ctx.moveTo(bx, by - 6); ctx.lineTo(bx - 5, by + 4); ctx.lineTo(bx + 5, by + 4); ctx.closePath();
        ctx.fillStyle = '#ff8800'; ctx.fill();
    });

    radarAngle += 0.03;
    requestAnimationFrame(drawRadar);
}

// =============================================
//   ALERTS — نظام التنبيهات
// =============================================
let alertTO = null;
function showRadarAlertNormal(msg) {
    const el = document.getElementById('radar-alert');
    el.innerText = msg; el.style.display = 'block';
    el.style.background = 'rgba(180, 0, 0, 0.92)';
    el.style.borderColor = '#ff4444';
    el.style.boxShadow = '0 0 25px rgba(255, 0, 0, 0.5)';
    if (alertTO) clearTimeout(alertTO);
    alertTO = setTimeout(() => el.style.display = 'none', 4000);
}

let ballisticAlertTO = null;
function showBallisticAlert(msg) {
    const el = document.getElementById('ballistic-alert');
    document.getElementById('ballistic-msg').innerText = msg;
    el.style.display = 'block';
    if (ballisticAlertTO) clearTimeout(ballisticAlertTO);
    ballisticAlertTO = setTimeout(() => el.style.display = 'none', 5000);
    playSound('snd-alert');
}

// دالة مساعدة لتنبيهات الرادار العامة
function showRadarAlert(msg) { showRadarAlertNormal(msg); }