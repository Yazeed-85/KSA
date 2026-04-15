// =============================================
//   المتغيرات العالمية للمحرك (Core Variables)
// =============================================
let selectedMissile = null;
let fireMode = false;
let trackingMode = false;
let hitCount = 0;
let firedCount = 0;
let gameOver = false;
let engagementActive = false;
let rangeCircle = null;
let spawnInterval = null;

// =============================================
//   تهيئة الخريطة والنظام (Initialization)
// =============================================
const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([24.5, 44.0], 6);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 17
}).addTo(map);

// رسم القواعد عند التشغيل
militaryBases.forEach(base => {
    const markerEl = document.createElement('div');
    markerEl.className = `base-marker ${base.type}`;
    markerEl.innerHTML = `<div class="base-pulse"></div><div class="base-icon"></div>`;
    
    const marker = L.marker(base.coords, {
        icon: L.divIcon({ html: markerEl, className: '', iconSize: [40, 40], iconAnchor: [20, 20] })
    }).addTo(map);

    marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectBase(base, marker, markerEl);
    });
});

// =============================================
//   ميكانيكا القتال والإطلاق (Combat System)
// =============================================
function selectMissile(type) {
    selectedMissile = type;
    const m = MISSILES[type];
    document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('btn-' + type).classList.add('selected');
    log(`تم تذخير المنظومة بـ: ${m.name}`, 'info');
    updateSteps();
}

function enterFireMode() {
    if (!selectedBase || !selectedMissile) return;
    fireMode = true;
    engagementActive = true;
    document.getElementById('status-text').innerText = "في انتظار الهدف...";
    document.getElementById('status-text').style.color = 'var(--danger)';
    updateSteps();
}

map.on('click', (e) => {
    if (!fireMode) return;
    
    const target = e.latlng;
    const mData = MISSILES[selectedMissile];
    const dist = map.distance(selectedBase.coords, [target.lat, target.lng]);

    if (dist / 1000 > mData.range) {
        log("الهدف خارج المدى العملياتي!", "danger");
        return;
    }

    executeLaunch(selectedBase.coords, target, mData);
    fireMode = false;
    engagementActive = false;
    document.getElementById('status-text').innerText = "إعادة التذخير...";
    document.getElementById('status-text').style.color = 'var(--warning)';
    updateSteps();
});

function executeLaunch(start, end, missileData) {
    firedCount++;
    playSound('snd-launch');
    
    // رسم مسار الصاروخ (تأثير بصري)
    const line = L.polyline([start, start], { color: missileData.color, weight: 2, dashArray: '5, 5' }).addTo(map);
    
    let progress = 0;
    const duration = 1500; // سرعة وصول الصاروخ تخيلياً
    const startTime = performance.now();

    function animateMissile(now) {
        const elapsed = now - startTime;
        progress = elapsed / duration;

        if (progress < 1) {
            const currentLat = start[0] + (end.lat - start[0]) * progress;
            const currentLng = start[1] + (end.lng - start[1]) * progress;
            line.setLatLngs([start, [currentLat, currentLng]]);
            requestAnimationFrame(animateMissile);
        } else {
            map.removeLayer(line);
            createExplosion(end, missileData);
        }
    }
    requestAnimationFrame(animateMissile);
}

function createExplosion(coords, mData) {
    playSound('snd-exp');
    const circle = L.circle(coords, { radius: mData.radius, color: 'orange', fillOpacity: 0.5 }).addTo(map);
    
    // فحص تدمير الأعداء في منطقة الانفجار
    enemies.forEach(en => {
        const d = map.distance([coords.lat, coords.lng], [en.lat, en.lng]);
        if (d < mData.radius + 10000) { // مدى تدمير إضافي بسيط
            en.destroy();
            hitCount++;
        }
    });

    setTimeout(() => map.removeLayer(circle), 500);
}

// =============================================
//   بدء النظام (System Start)
// =============================================
function triggerDefenseResponse() {
    gameOver = true;
    document.getElementById('game-over').style.display = 'flex';
    playSound('snd-alarm');
}

// تشغيل المحركات
drawRadar();
startScenario();

function gameLoop() {
    if (!gameOver) {
        enemies.forEach(e => e.update());
        requestAnimationFrame(gameLoop);
    }
}
gameLoop();