
// ── أدوات مساعدة ──
function rnd(min, max) { return min + Math.random()*(max-min); }
function rndInt(min, max) { return Math.floor(rnd(min, max+1)); }

function scheduleT(fn, ms) {
    const id = setTimeout(() => { if(!gameOver) fn(); }, ms);
    phaseTimers.push(id);
    return id;
}

// =============================================
//   BALLISTIC MISSILES
// =============================================
const SAUDI_INTERIOR_TARGETS = [
    [24.68, 46.72],[21.48, 39.19],[26.26, 50.15],[24.06, 47.58],
    [27.90, 45.53],[21.48, 40.54],[28.39, 36.57],[25.39, 49.58],
    [22.00, 41.00],[20.50, 44.78],[18.30, 42.73],[24.71, 46.72],
    [23.50, 44.00],[26.50, 43.50],[29.00, 41.80],
];

function spawnBallisticMissile() {
    if (gameOver) return;

    const launchGroups = [
        [[32.65325,50.94910],[33.04090,51.80603],[32.56533,52.40479],[32.20815,51.58630]],
        [[29.68328,52.40753],[29.72741,52.59293],[29.53762,52.66708],[29.51253,52.47070]]
    ];
    const group = launchGroups[Math.floor(Math.random()*launchGroups.length)];
    const lp = group[Math.floor(Math.random()*group.length)];

    const tp = SAUDI_INTERIOR_TARGETS[Math.floor(Math.random()*SAUDI_INTERIOR_TARGETS.length)];
    const targetLat = tp[0] + (Math.random()-0.5)*2.0;
    const targetLng = tp[1] + (Math.random()-0.5)*2.0;

    const dLat = targetLat - lp[0];
    const dLng = targetLng - lp[1];
    const angleDeg = Math.atan2(dLng, dLat) * 180 / Math.PI;

    const bm = {
        alive: true,
        lat: lp[0], lng: lp[1],
        targetLat, targetLng,
        angleDeg,
        speed: 0.0008 + Math.random()*0.0004,
        marker: null,
    };

    const el = document.createElement('div');
    el.className = 'ballistic-missile';
    el.innerHTML = '<div class="ballistic-body"></div>';
    el.style.transform = `rotate(${angleDeg}deg)`;
    el.style.transformOrigin = 'center center';

    bm.marker = L.marker([bm.lat, bm.lng], {
        icon: L.divIcon({html: el, className:'', iconSize:[8,28], iconAnchor:[4,14]}),
        zIndexOffset: 1000
    }).addTo(map);

    bm.marker.bindTooltip(`🚀 صاروخ باليستي إيراني`, {direction:'top', offset:[0,-20]});

    bm.marker.on('click', ev => {
        L.DomEvent.stopPropagation(ev);
        interceptBallistic(bm);
    });

    ballisticMissiles.push(bm);
    showBallisticAlert('🚀 إطلاق صاروخ باليستي إيراني نحو الأراضي السعودية!');
    log('🚀 ⚡ صاروخ باليستي مُطلق من إيران!', 'fail');
    document.getElementById('mini-radar').classList.add('radar-missile-mode');
    setTimeout(() => document.getElementById('mini-radar').classList.remove('radar-missile-mode'), 5000);
    updateEnemyCount();
}

function interceptBallistic(bm) {
    if (!bm.alive) return;

    let nearestBase = militaryBases[0];
    let minDist = Infinity;
    militaryBases.forEach(base => {
        const d = map.distance(base.coords, [bm.lat, bm.lng]);
        if (d < minDist) { minDist = d; nearestBase = base; }
    });

    bm.alive = false;
    playSound('snd-missile');

    const intColor = '#00ddff';
    const dur = Math.max(800, Math.min(2500, minDist/6000*1000));
    const st = performance.now();
    const line = L.polyline([nearestBase.coords, nearestBase.coords],
        {color: intColor, weight:2, dashArray:'3,3', opacity:0.9}).addTo(map);
    const hEl = document.createElement('div');
    hEl.style.cssText = `width:8px;height:8px;background:${intColor};border-radius:50%;box-shadow:0 0 12px ${intColor}`;
    const hM = L.marker(nearestBase.coords, {
        icon: L.divIcon({html:hEl, className:'', iconSize:[8,8], iconAnchor:[4,4]})
    }).addTo(map);

    const snapLat=bm.lat, snapLng=bm.lng;
    function aintercept(now) {
        const p = Math.min(1, (now-st)/dur);
        const lat = nearestBase.coords[0] + (snapLat-nearestBase.coords[0])*p;
        const lng = nearestBase.coords[1] + (snapLng-nearestBase.coords[1])*p;
        line.setLatLngs([nearestBase.coords, [lat,lng]]);
        hM.setLatLng([lat, lng]);
        if (p < 1) {
            requestAnimationFrame(aintercept);
        } else {
            map.removeLayer(line); map.removeLayer(hM);
            const expColor = '#ff8800';
            const w1 = L.circle([snapLat,snapLng], {radius:15000, color:expColor, fillColor:expColor, fillOpacity:0.6, weight:2}).addTo(map);
            const w2 = L.circle([snapLat,snapLng], {radius:35000, color:expColor, fillColor:expColor, fillOpacity:0.15, weight:1}).addTo(map);
            let s=0;
            const ai=setInterval(()=>{s++;w1.setStyle({fillOpacity:Math.max(0,0.6-s*0.06)});w2.setStyle({fillOpacity:Math.max(0,0.15-s*0.015)});if(s>10){clearInterval(ai);map.removeLayer(w1);map.removeLayer(w2);}},80);
            if(bm.marker){map.removeLayer(bm.marker);bm.marker=null;}
            ballisticMissiles = ballisticMissiles.filter(m=>m!==bm);
            hitCount++; document.getElementById('hit-count').innerText=hitCount;
            playSound('snd-destroyed');
            log(`✓ اعتراض صاروخ باليستي — ${nearestBase.name}`, 'success');
            updateEnemyCount();
        }
    }
    requestAnimationFrame(aintercept);
}

function updateBallisticMissiles() {
    ballisticMissiles.forEach(bm => {
        if (!bm.alive) return;
        const dlat = bm.targetLat - bm.lat;
        const dlng = bm.targetLng - bm.lng;
        const d = Math.sqrt(dlat*dlat+dlng*dlng);
        if (d < 0.001) return;
        bm.lat += (dlat/d)*bm.speed;
        bm.lng += (dlng/d)*bm.speed;
        if (bm.marker) {
            bm.marker.setLatLng([bm.lat, bm.lng]);
            const angle = Math.atan2(dlng, dlat) * 180 / Math.PI;
            const el = bm.marker.getElement();
            if (el) {
                const inner = el.querySelector('.ballistic-missile');
                if (inner) inner.style.transform = `rotate(${angle}deg)`;
            }
        }
        if (d < 0.04) {
            bm.alive = false;
            if (bm.marker) { map.removeLayer(bm.marker); bm.marker=null; }
            ballisticMissiles = ballisticMissiles.filter(m=>m!==bm);
            const ec='#ff4400';
            const w=L.circle([bm.targetLat,bm.targetLng],{radius:20000,color:ec,fillColor:ec,fillOpacity:0.75,weight:2}).addTo(map);
            const w2=L.circle([bm.targetLat,bm.targetLng],{radius:50000,color:ec,fillColor:ec,fillOpacity:0.15,weight:1}).addTo(map);
            let s=0;const ai=setInterval(()=>{s++;w.setStyle({fillOpacity:Math.max(0,0.75-s*0.075)});w2.setStyle({fillOpacity:Math.max(0,0.15-s*0.015)});if(s>10){clearInterval(ai);map.removeLayer(w);map.removeLayer(w2);}},80);
            playSound('snd-explosion');
            log('💥 صاروخ باليستي أصاب هدفاً داخل الأراضي السعودية!', 'fail');
            updateEnemyCount();
        }
    });
}

// =============================================
//   GAME PHASES — السيناريو 4 مراحل (15 دقيقة)
// =============================================
function startGameSpawning() {
    gameStartTime = Date.now();
    gameElapsedSec = 0;
    wavePhase = 0;
    phase3Active = false;

    MISSILES.df3.ammoLeft  = 0;
    MISSILES.df21.ammoLeft = 0;

    const clockInterval = setInterval(() => {
        if (gameOver) { clearInterval(clockInterval); return; }
        gameElapsedSec = Math.floor((Date.now()-gameStartTime)/1000);
    }, 1000);
    phaseTimers.push(clockInterval);

    runPhase1();

    // فتح DF3 و DF21 بعد 3 دقائق
    scheduleT(() => {
        MISSILES.df3.locked  = false;
        MISSILES.df21.locked = false;
        MISSILES.df3.ammoLeft  = 5;
        MISSILES.df21.ammoLeft = 5;
        ['df3','df21'].forEach(id => {
            const btn = document.getElementById('btn-'+id);
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('weapon-locked');
                btn.classList.add('weapon-unlocked');
                const nm = id==='df3'? 'DF-3A' : 'DF-21C';
                btn.innerHTML = `▲ ${nm} — <span class="ammo-count" id="ammo-${id}">5/5</span><span class="weapon-range">مدى: ${MISSILES[id].range} كم | متاح الآن ×5</span>`;
                setTimeout(()=>btn.classList.remove('weapon-unlocked'), 2000);
            }
        });
        showRadarAlertNormal('🟢 تم تفعيل الصواريخ الباليستية DF-3A و DF-21C — ×5 لكل منهما!');
        log('🟢 الصواريخ الباليستية جاهزة — DF-3A و DF-21C (×5 لكل)', 'success');
        playSound('snd-alert');
        wavePhase=1; runPhase2();
    }, 180000);

    scheduleT(() => { wavePhase=2; runPhase3(); }, 300000);
    scheduleT(() => { wavePhase=3; runPhase4(); }, 480000);
}

function runPhase1() {
    const yemenCount = rndInt(1,2);
    for (let i=0; i<yemenCount; i++) scheduleT(() => spawnEnemy('yemen'), rnd(8000, 90000));
    const iraqCount = rndInt(1,2);
    for (let i=0; i<iraqCount; i++) scheduleT(() => spawnEnemy('iran_iraq'), rnd(20000, 150000));
    log('🟢 نظام الرصد جاهز — مراقبة الحدود', 'info');
}

function runPhase2() {
    showRadarAlertNormal('⚠ رُصدت تحركات معادية متزايدة على الحدود');
    log('⚠ تصاعد التهديد — رصد تحركات من متعدد المحاور', 'fail');

    const phase2Duration = 120000;
    const shipCount = rndInt(1,3);
    for (let i=0; i<shipCount; i++) scheduleT(() => spawnEnemy('iran_sea'), rnd(5000, phase2Duration));

    const yemenSoldiers = rndInt(3,4);
    const yemenTanks    = rndInt(3,4);
    for (let i=0; i<yemenSoldiers; i++) scheduleT(()=>spawnEnemy('yemen','soldier'), rnd(10000, phase2Duration));
    for (let i=0; i<yemenTanks;    i++) scheduleT(()=>spawnEnemy('yemen','tank'),    rnd(15000, phase2Duration));

    const iraqTanks   = rndInt(5,6);
    const iraqSoldiers= rndInt(5,8);
    for (let i=0; i<iraqTanks;    i++) scheduleT(()=>spawnEnemy('iran_iraq','tank'),    rnd(10000, phase2Duration));
    for (let i=0; i<iraqSoldiers; i++) scheduleT(()=>spawnEnemy('iran_iraq','soldier'), rnd(20000, phase2Duration));
}

function runPhase3() {
    phase3Active = true;
    showRadarAlertNormal('🚨 هجوم شامل! قوات ضخمة من جميع المحاور!');
    log('🚨 المرحلة الحرجة — هجوم كثيف متزامن!', 'fail');
    playSound('snd-alert');

    const phase3Duration = 180000;
    const shipCount = rndInt(8,12);
    for (let i=0; i<shipCount; i++) {
        const delay = rnd(5000, 40000) + i * rnd(8000, 18000);
        if (delay < phase3Duration) scheduleT(() => spawnEnemy('iran_sea'), delay);
    }

    const northTotal = rndInt(18,20);
    for (let i=0; i<northTotal; i++) {
        const isT = Math.random() > 0.45;
        scheduleT(() => spawnEnemy('iran_iraq', isT?'tank':'soldier'), rnd(3000, phase3Duration));
    }

    const southTotal = rndInt(10,15);
    for (let i=0; i<southTotal; i++) {
        const isT = Math.random() > 0.45;
        scheduleT(() => spawnEnemy('yemen_far', isT?'tank':'soldier'), rnd(3000, phase3Duration));
    }
}

function runPhase4() {
    log('🚀 ⚡ المرحلة النهائية — هجوم كامل الأبعاد!', 'fail');
    showBallisticAlert('🚀 صواريخ باليستية إيرانية + هجوم ساحق من الجهات كافة!');
    playSound('snd-alert');

    const phase4Duration = 420000;
    const missileCount = rndInt(10, 40);
    let launched = 0;

    function launchNextBallistic() {
        if (gameOver || launched >= missileCount) return;
        spawnBallisticMissile();
        launched++;
        const nextDelay = rnd(5000, 18000);
        const id = setTimeout(launchNextBallistic, nextDelay);
        phaseTimers.push(id);
    }
    launchNextBallistic();

    const extraShips = rndInt(4,6);
    for (let i=0; i<extraShips; i++) {
        scheduleT(()=>spawnEnemy('iran_sea'), rnd(3000, 60000) + i*rnd(8000,15000));
    }

    const northCount = rndInt(20,25);
    for (let i=0; i<northCount; i++) {
        const isT = Math.random()>0.4;
        scheduleT(()=>spawnEnemy('iran_iraq', isT?'tank':'soldier'), rnd(2000, phase4Duration));
    }

    const southCount = rndInt(15,20);
    for (let i=0; i<southCount; i++) {
        const isT = Math.random()>0.4;
        scheduleT(()=>spawnEnemy('yemen_far', isT?'tank':'soldier'), rnd(2000, phase4Duration));
    }
}