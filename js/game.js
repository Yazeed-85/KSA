// =============================================
//  المتغيرات العالمية للمحرك — مأخوذة نصاً من الملف الأصلي
// =============================================
let selectedBase = null, selectedMissile = null, fireMode = false, gameOver = false;
let trackingMode = false, engagementActive = false, firedCount = 0, hitCount = 0;
let defenseTriggered = false, rangeCircle = null;

// =============================================
//  تهيئة الخريطة والنظام (Initialization)
// =============================================
const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([24.5, 44.0], 6);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 17
}).addTo(map);

// رسم القواعد العسكرية من ملف config.js
militaryBases.forEach(base => {
    const wrapper = document.createElement('div');
    wrapper.className = 'base-wrapper';
    wrapper.innerHTML = `<div class="base-pulse-air"></div><div class="base-icon-air"></div>`;

    const marker = L.marker(base.coords, {
        icon: L.divIcon({ html: wrapper, className: '', iconSize: [44, 44], iconAnchor: [22, 22] }),
        pane: 'markerPane' // لضمان ظهورها فوق الطبقات الأخرى
    }).addTo(map);

    marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectBase(base, marker, wrapper);
    });

    base.marker = marker;
    base.markerEl = wrapper;
});

// =============================================
//  ميكانيكا القتال والإطلاق (Combat System)
// =============================================
function selectMissile(type) {
    const m = MISSILES[type];
    if (m.locked) {
        log('🔒 هذا الصاروخ مقفل — يُفعَّل بعد 3 دقائق', 'fail');
        return;
    }
    selectedMissile = type;
    document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + type).classList.add('active');
    document.getElementById('sel-missile-name').innerText = m.name;
    document.getElementById('selected-info').innerText = `${m.name} — مدى ${m.range} كم`;
    document.getElementById('selected-info').style.color = m.color;
    
    if (selectedBase) {
        document.getElementById('base-fire-btn').style.display = 'inline-block';
        drawRangeCircle();
    }
    updateSteps();
}

function drawRangeCircle() {
    if (rangeCircle) map.removeLayer(rangeCircle);
    const m = MISSILES[selectedMissile];
    rangeCircle = L.circle(selectedBase.coords, {
        radius: m.range * 1000,
        color: m.color,
        fillColor: m.color,
        fillOpacity: 0.04,
        weight: 1,
        dashArray: '6,6'
    }).addTo(map);
}

function enterFireMode() {
    if (!selectedBase || !selectedMissile) return;
    engagementActive = true; fireMode = true;
    document.getElementById('base-fire-btn').innerText = '🎯 انقر على الهدف...';
    document.getElementById('base-fire-btn').style.background = '#ff6000';
    log('وضع الاشتباك مفعّل — حدد الهدف على الخريطة', 'info');
}

// معالجة النقر للإطلاق
map.on('click', e => {
    if (!fireMode) return;
    const target = e.latlng;
    const dist = map.distance(selectedBase.coords, [target.lat, target.lng]);
    const maxRange = MISSILES[selectedMissile].range * 1000;
    
    firedCount++;
    document.getElementById('fired-count').innerText = firedCount;
    
    launchMissile(selectedBase.coords, { lat: target.lat, lng: target.lng }, dist, maxRange);
    
    fireMode = false; engagementActive = false;
    document.getElementById('base-fire-btn').innerText = '🎯 تفعيل وضع الاشتباك';
    document.getElementById('base-fire-btn').style.background = '';
});

// تحريك المقذوف
function launchMissile(startCoords, endLatLng, totalDist, maxRange) {
    if (totalDist > maxRange) {
        document.getElementById('range-detail').innerText = `المسافة: ${Math.round(totalDist/1000)} كم | المدى: ${MISSILES[selectedMissile].range} كم`;
        const w = document.getElementById('range-warning');
        w.style.display = 'block'; setTimeout(() => w.style.display = 'none', 2500);
        log('⚠ الهدف خارج المدى!', 'fail'); return;
    }
    
    const m = MISSILES[selectedMissile];
    playSound('snd-missile');
    const dur = Math.min(3000, Math.max(1200, totalDist / m.speed * 1000));
    const st = performance.now();
    const line = L.polyline([startCoords, startCoords], { color: m.color, weight: 1.5, dashArray: '4,4' }).addTo(map);
    
    function anim(now) {
        let p = Math.min(1, (now - st) / dur);
        const lat = startCoords[0] + (endLatLng.lat - startCoords[0]) * p;
        const lng = startCoords[1] + (endLatLng.lng - startCoords[1]) * p;
        line.setLatLngs([startCoords, [lat, lng]]);
        if (p < 1) requestAnimationFrame(anim);
        else {
            map.removeLayer(line);
            createExplosion([endLatLng.lat, endLatLng.lng], false, m);
        }
    }
    requestAnimationFrame(anim);
}

function createExplosion(coords, failed, m) {
    playSound('snd-explosion');
    const radius = m.radius;
    const wave = L.circle(coords, { radius: radius * 0.25, color: m.color, fillOpacity: 0.8 }).addTo(map);
    
    let step = 0;
    const ani = setInterval(() => {
        step++;
        wave.setRadius(radius * 0.25 * (1 + step * 0.1));
        wave.setStyle({ fillOpacity: Math.max(0, 0.8 - step * 0.08) });
        if (step > 10) { clearInterval(ani); map.removeLayer(wave); }
    }, 80);

    // تدمير الأعداء في منطقة الانفجار
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
//  بدء تشغيل النظام (Initialization)
// =============================================
window.onload = () => {
    drawRadar(); // من ui.js
    startGameSpawning(); // من scenario.js
    
    // حلقة التحديث المستمر
    function loop() {
        if (!gameOver) {
            enemies.forEach(e => e.update());
            updateBallisticMissiles(); // من scenario.js
            requestAnimationFrame(loop);
        }
    }
    loop();
    log('تم استعادة الاتصال بكافة مراكز القيادة والسيطرة', 'success');
};