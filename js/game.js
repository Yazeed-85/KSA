// =============================================
//   المتغيرات العالمية للمحرك (Core State)
// =============================================
let selectedBase = null;
let fireMode = false;
let trackingMode = false;
let firedCount = 0;
let hitCount = 0;
let rangeCircle = null;
let engagementActive = false;
let gameOver = false;
let defenseTriggered = false;

// =============================================
//   تهيئة الخريطة والنظام (Map Initialization)
// =============================================
const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([24.5, 44.0], 6);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 17
}).addTo(map);

// رسم القواعد العسكرية عند التشغيل (بناءً على ملف config.js)
militaryBases.forEach(base => {
    const wrapper = document.createElement('div');
    wrapper.className = 'base-wrapper';
    wrapper.innerHTML = `
        <div class="base-pulse-air"></div>
        <div class="base-icon-air"></div>
    `;

    const marker = L.marker(base.coords, {
        icon: L.divIcon({ html: wrapper, className: '', iconSize: [44, 44], iconAnchor: [22, 22] })
    }).addTo(map);

    // ربط تفاعل الضغط على القاعدة
    marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectBase(base, marker, wrapper);
    });

    base.marker = marker;
    base.markerEl = wrapper;
});

// =============================================
//   منطق اختيار القاعدة والسلاح (Selection Logic)
// =============================================
function selectBase(base, marker, wrapper) {
    if (selectedBase) selectedBase.markerEl.classList.remove('selected');
    selectedBase = base;
    wrapper.classList.add('selected');

    document.getElementById('base-info-panel').style.display = 'block';
    document.getElementById('base-info-name').innerText = base.name;
    document.getElementById('base-info-type').innerText = base.detail;
    document.getElementById('sel-base-name').innerText = base.name.split(' ').slice(-2).join(' ');
    
    // إظهار زر الاشتباك فقط إذا تم اختيار صاروخ مسبقاً
    document.getElementById('base-fire-btn').style.display = selectedMissile ? 'inline-block' : 'none';

    if (rangeCircle) map.removeLayer(rangeCircle);
    if (selectedMissile) drawRangeCircle();
    
    updateSteps(); // تحديث المؤشرات في ui.js
    log(`تم تحديد مركز القيادة: ${base.name}`, 'info');
}

function drawRangeCircle() {
    if (rangeCircle) map.removeLayer(rangeCircle);
    if (!selectedBase || !selectedMissile) return;
    const m = MISSILES[selectedMissile];
    rangeCircle = L.circle(selectedBase.coords, {
        radius: m.range * 1000,
        color: m.color,
        fillColor: m.color,
        fillOpacity: 0.04,
        weight: 1,
        dashArray: '6, 6'
    }).addTo(map);
}

// =============================================
//   نظام الاشتباك والإطلاق (Combat System)
// =============================================
function enterFireMode() {
    if (!selectedBase || !selectedMissile) return;
    if (engagementActive) return;

    engagementActive = true;
    fireMode = true;
    
    const btn = document.getElementById('base-fire-btn');
    btn.innerText = '🎯 انقر على الهدف...';
    btn.style.background = '#ff6000';
    log('تم تفعيل بروتوكول الاشتباك - بانتظار تحديد الإحداثيات', 'info');
}

// معالجة الضغط على الخريطة للإطلاق
map.on('click', (e) => {
    if (!fireMode) return;
    
    const target = e.latlng;
    const distMeters = map.distance(selectedBase.coords, [target.lat, target.lng]);
    const mData = MISSILES[selectedMissile];

    firedCount++;
    document.getElementById('fired-count').innerText = firedCount;

    // تنفيذ عملية الإطلاق (بناءً على التتبع أو الموقع الثابت)
    launchMissile(selectedBase.coords, { lat: target.lat, lng: target.lng }, distMeters, mData.range * 1000, null, trackingMode);

    // إعادة ضبط الحالة
    fireMode = false;
    engagementActive = false;
    document.getElementById('base-fire-btn').innerText = '🎯 تفعيل وضع الاشتباك';
    document.getElementById('base-fire-btn').style.background = '';
});

// =============================================
//   حركة الصواريخ والانفجارات (Animation & Effects)
// =============================================
function launchMissile(start, end, totalDist, maxRange, targetEnemy, useTracking) {
    if (totalDist > maxRange) {
        log('⚠ الهدف خارج المدى العملياتي!', 'fail');
        return;
    }

    const m = MISSILES[selectedMissile];
    playSound('snd-missile');

    const duration = Math.min(3000, Math.max(1200, totalDist / m.speed * 1000));
    const startTime = performance.now();
    const line = L.polyline([start, start], { color: m.color, weight: 1.5, dashArray: '4, 4' }).addTo(map);

    function animate(now) {
        let p = (now - startTime) / duration;
        if (p > 1) p = 1;

        const currentLat = start[0] + (end.lat - start[0]) * p;
        const currentLng = start[1] + (end.lng - start[1]) * p;
        line.setLatLngs([start, [currentLat, currentLng]]);

        if (p < 1) requestAnimationFrame(animate);
        else {
            map.removeLayer(line);
            createExplosion([end.lat, end.lng], false, m);
        }
    }
    requestAnimationFrame(animate);
}

function createExplosion(coords, failed, m) {
    playSound('snd-explosion');
    const color = failed ? '#888' : m.color;
    const radius = failed ? 4000 : m.radius;

    const wave = L.circle(coords, { radius: radius * 0.2, color: color, fillOpacity: 0.7 }).addTo(map);
    
    let step = 0;
    const anim = setInterval(() => {
        step++;
        wave.setRadius(radius * (0.2 + step * 0.08));
        wave.setStyle({ fillOpacity: 0.7 - step * 0.07 });
        if (step > 10) { clearInterval(anim); map.removeLayer(wave); }
    }, 80);

    // تدمير الأعداء المتواجدين في منطقة الانفجار
    enemies.forEach(en => {
        if (en.alive && map.distance(coords, [en.lat, en.lng]) < radius) {
            en.destroy();
            hitCount++;
            document.getElementById('hit-count').innerText = hitCount;
            playSound('snd-destroyed');
        }
    });
}

// =============================================
//   حلقة اللعبة الأساسية (Game Loop)
// =============================================
function gameLoop() {
    if (!gameOver) {
        // تحديث حركة كافة الأعداء
        enemies.forEach(e => e.update());
        
        // تحديث حركة الصواريخ الباليستية (إن وجدت في سيناريو المرحلة 4)
        if (typeof updateBallisticMissiles === "function") {
            updateBallisticMissiles();
        }
        
        requestAnimationFrame(gameLoop);
    }
}

// =============================================
//   بدء تشغيل النظام (System Activation)
// =============================================
window.onload = () => {
    console.log("Strategic Command System: ONLINE");
    
    // تشغيل الرادار الصغير
    drawRadar();
    
    // تشغيل سيناريو رسبون الأعداء
    startGameSpawning();
    
    // بدء الحلقة البرمجية
    gameLoop();
    
    log('تم استعادة الاتصال بكافة القواعد الجوية', 'success');
};
