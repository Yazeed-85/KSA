// =============================================
//   إدارة سجل العمليات (Logs)
// =============================================
function log(msg, type = 'info') {
    const container = document.getElementById('log-container');
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="time">${t}</span>${msg}`;
    
    container.prepend(entry);
    
    // الاحتفاظ بآخر 10 عمليات فقط لضمان الأداء
    while (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

// =============================================
//   تحديث مؤشرات الخطوات (Step Indicators)
// =============================================
function updateSteps() {
    document.getElementById('s1').classList.toggle('done', !!selectedBase);
    document.getElementById('s2').classList.toggle('done', !!selectedMissile);
    document.getElementById('s3').classList.toggle('done', engagementActive);
}

// =============================================
//   تحديث الوقت وإحداثيات الماوس
// =============================================
setInterval(() => {
    const now = new Date();
    document.getElementById('sys-time').innerText = 
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}, 1000);

map.on('mousemove', e => {
    document.getElementById('m-coords-top').innerText = 
        `${e.latlng.lat.toFixed(4)}°N  ${e.latlng.lng.toFixed(4)}°E`;
});

// =============================================
//   نظام الرادار المصغر (Mini-Radar)
// =============================================
const radarCanvas = document.getElementById('radar-canvas');
let radarAngle = 0;

function drawRadar() {
    const ctx = radarCanvas.getContext('2d');
    const w = radarCanvas.width = 220;
    const h = radarCanvas.height = 220;
    const cx = w / 2, cy = h / 2, r = w / 2 - 5;

    ctx.clearRect(0, 0, w, h);
    
    // رسم الدوائر والخطوط المتقاطعة
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.2)';
    ctx.lineWidth = 1;
    [0.3, 0.6, 1].forEach(f => {
        ctx.beginPath(); ctx.arc(cx, cy, r * f, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

    // رسم شعاع المسح (Sweep)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(radarAngle);
    const grad = ctx.createLinearGradient(0, 0, r, 0);
    grad.addColorStop(0, 'rgba(0, 255, 157, 0.4)');
    grad.addColorStop(1, 'rgba(0, 255, 157, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.3, 0.3); ctx.fill();
    ctx.restore();

    // رسم نقاط الأعداء على الرادار
    enemies.forEach(en => {
        const relLat = (en.lat - 24.5) / 15;
        const relLng = (en.lng - 45.0) / 15;
        const bx = cx + relLng * r;
        const by = cy - relLat * r;
        
        ctx.fillStyle = '#ff3b3b';
        ctx.beginPath();
        if (en.type === 'ship') ctx.rect(bx - 4, by - 2, 8, 4);
        else ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    radarAngle += 0.03;
    requestAnimationFrame(drawRadar);
}

// =============================================
//   التنبيهات الصوتية والبصرية
// =============================================
function showRadarAlert(msg) {
    const el = document.getElementById('radar-alert');
    if (el) {
        el.innerText = msg;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

function playSound(id) {
    const s = document.getElementById(id);
    if (s) { s.currentTime = 0; s.play().catch(() => {}); }
}