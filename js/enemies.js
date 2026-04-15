
// ═══════════════════════════════════════════════════════════
//  مسار السفن الإيرانية في الخليج
// ═══════════════════════════════════════════════════════════
const GULF_SEA_PATH = [
    [29.91685, 50.17456],[28.93125, 48.18604],[28.41073, 48.53760],[27.75161, 48.91113],
    [27.60567, 48.93860],[27.56185, 49.22974],[27.48878, 49.32312],[27.34737, 49.38354],
    [27.33761, 49.61426],[27.33761, 49.72412],[27.23021, 49.66370],[27.12270, 49.64172],
    [27.06891, 49.72412],[26.98572, 49.71863],[26.90738, 49.84497],[26.87308, 49.97131],
    [26.77014, 50.05920],[26.68182, 50.17456],[26.57379, 50.13062],[26.50007, 50.14709],
    [26.49516, 50.22949],[26.36726, 50.28442],[26.28356, 50.25696],[26.09625, 50.22949],
    [25.99755, 50.19653],[25.82462, 50.20203],[25.73558, 50.27344],[25.62667, 50.33386],
    [25.78505, 50.51514],[25.92347, 50.42725],[26.08639, 50.40527],[26.28356, 50.42175],
    [26.31311, 50.51514],[26.37711, 50.60852],[26.35250, 50.70190],[26.21952, 50.71289],
    [26.08145, 50.70190],[25.91359, 50.65796],[25.80484, 50.63599],[25.66628, 50.53711],
    [25.51270, 50.44373],[25.46311, 50.52612],[25.81967, 50.80627],[26.25401, 51.21826],
    [25.69104, 51.99829],[26.59835, 53.88794],[27.17647, 52.86621],[27.62514, 52.31689],
    [27.74188, 52.04224],[28.07198, 51.24023],[28.74840, 51.02051],[29.13297, 50.64697],
    [29.45873, 50.58105]
];

const SHIP_SPAWN_INDICES = [53, 54, 51, 52, 50];
const COAST_LANDING_INDICES = [17, 18, 19, 20, 21, 27, 28];
const DISEMBARK_TARGETS = [
    {lat:26.20, lng:50.05},
    {lat:26.40, lng:50.00},
    {lat:27.00, lng:49.55},
    {lat:26.65, lng:49.85},
    {lat:25.85, lng:50.45},
];

const SPAWN_VARIANTS = {
    iran_sea: [
        {idx:53},{idx:52},{idx:51},{idx:50},{idx:49}
    ],
    iran_iraq: [
        {spawnLat:33.65121,spawnLng:50.22949, targetLat:29.80,targetLng:46.30},
        {spawnLat:31.17521,spawnLng:50.55908, targetLat:29.50,targetLng:46.80},
        {spawnLat:30.67572,spawnLng:48.84521, targetLat:29.60,targetLng:47.00},
        {spawnLat:32.68331,spawnLng:47.24396, targetLat:30.20,targetLng:46.00},
        {spawnLat:33.22950,spawnLng:48.49365, targetLat:29.90,targetLng:46.50},
        {spawnLat:33.39476,spawnLng:49.15283, targetLat:29.70,targetLng:46.80},
    ],
    yemen: [
        {spawnLat:15.91907,spawnLng:45.52734, targetLat:17.30,targetLng:44.80},
        {spawnLat:16.29905,spawnLng:47.30713, targetLat:17.10,targetLng:46.50},
        {spawnLat:16.57302,spawnLng:51.67969, targetLat:17.00,targetLng:50.30},
        {spawnLat:15.39014,spawnLng:49.19678, targetLat:17.05,targetLng:48.50},
        {spawnLat:14.26438,spawnLng:45.46143, targetLat:16.80,targetLng:44.50},
        {spawnLat:14.77488,spawnLng:43.43994, targetLat:17.00,targetLng:43.30},
        {spawnLat:15.49603,spawnLng:43.42896, targetLat:17.20,targetLng:43.20},
        {spawnLat:16.06693,spawnLng:44.32983, targetLat:17.10,targetLng:44.00},
    ]
};

class Enemy {
    constructor(routeKey, cfg, farSpawn=false) {
        this.routeKey = routeKey;
        this.faction  = routeKey.startsWith('iran') ? 'iran' : 'yemen';
        this.method   = routeKey === 'iran_sea' ? 'sea' : 'land';
        this.alive    = true;
        this.stopped  = false;
        this.alertSent  = false;
        this.alert50km  = false;
        this.disembarked = false;
        this.marker   = null;
        this.hidden   = false;
        this.detected = true;

        const variants = SPAWN_VARIANTS[routeKey];
        const v = cfg || variants[Math.floor(Math.random()*variants.length)];

        if (routeKey === 'iran_sea' && !cfg) {
            const spawnIdx = SHIP_SPAWN_INDICES[Math.floor(Math.random()*SHIP_SPAWN_INDICES.length)];
            const spawnPt = GULF_SEA_PATH[spawnIdx];
            this.lat = spawnPt[0] + (Math.random()-0.5)*0.15;
            this.lng = spawnPt[1] + (Math.random()-0.5)*0.15;
            const coastIdx = COAST_LANDING_INDICES[Math.floor(Math.random()*COAST_LANDING_INDICES.length)];
            const coastPt = GULF_SEA_PATH[coastIdx];
            this.targetLat = coastPt[0];
            this.targetLng = coastPt[1];
            this.type  = 'ship';
            this.speed = 0.00008 + Math.random()*0.00004;
            this.hidden   = (this.lng > 52.0);
            this.detected = !this.hidden;
            if (!this.hidden) this._buildMarker();
        } else if (routeKey === 'iran_sea' && cfg) {
            this.lat = 0; this.lng = 0;
            this.targetLat = 0; this.targetLng = 0;
            this.type  = 'soldier';
            this.speed = 0.00006 + Math.random()*0.00004;
            this.hidden = false; this.detected = true;
        } else if (farSpawn && routeKey === 'yemen') {
            const yemenFarVariants = [
                {spawnLat:14.26438,spawnLng:45.46143, targetLat:16.80,targetLng:44.50},
                {spawnLat:14.77488,spawnLng:43.43994, targetLat:17.00,targetLng:43.30},
                {spawnLat:15.39014,spawnLng:49.19678, targetLat:17.05,targetLng:48.50},
                {spawnLat:15.49603,spawnLng:43.42896, targetLat:17.20,targetLng:43.20},
                {spawnLat:15.91907,spawnLng:45.52734, targetLat:17.30,targetLng:44.80},
            ];
            const fv = yemenFarVariants[Math.floor(Math.random()*yemenFarVariants.length)];
            this.lat = fv.spawnLat + (Math.random()-0.5)*0.4;
            this.lng = fv.spawnLng + (Math.random()-0.5)*0.4;
            this.targetLat = fv.targetLat + (Math.random()-0.5)*0.3;
            this.targetLng = fv.targetLng + (Math.random()-0.5)*0.3;
            this.type  = Math.random()>0.45 ? 'tank' : 'soldier';
            this.speed = 0.00006 + Math.random()*0.00004;
        } else {
            this.lat = v.spawnLat + (Math.random()-0.5)*0.8;
            this.lng = v.spawnLng + (Math.random()-0.5)*0.8;
            this.targetLat = v.targetLat + (Math.random()-0.5)*0.3;
            this.targetLng = v.targetLng + (Math.random()-0.5)*0.3;
            this.type  = Math.random()>0.45 ? 'tank' : 'soldier';
            this.speed = 0.00006 + Math.random()*0.00004;
            this._buildMarker();
        }
    }

    _buildMarker() {
        if (this.marker) { map.removeLayer(this.marker); this.marker = null; }
        const wrap = document.createElement('div');
        wrap.className = 'enemy-wrapper';
        const ring = document.createElement('div');
        ring.className = 'enemy-ring';
        const core = document.createElement('div');
        if      (this.type==='tank')    core.className = 'enemy-tank';
        else if (this.type==='soldier') core.className = 'enemy-soldier';
        else                            core.className = 'enemy-ship';
        wrap.appendChild(ring);
        wrap.appendChild(core);
        wrap.style.cursor = 'pointer';

        this.marker = L.marker([this.lat, this.lng], {
            icon: L.divIcon({html:wrap, className:'', iconSize:[30,30], iconAnchor:[15,15]})
        }).addTo(map);

        const lbl = this.type==='tank'?'🟥 دبابة معادية':this.type==='soldier'?'🔴 قوات مشاة':'🟥 سفينة حربية';
        const fac = this.faction==='iran' ? 'إيرانية' : 'يمنية (حوثي)';
        this.marker.bindTooltip(`${lbl}<br><span style="color:#888">${fac}</span>`,
            {direction:'top', offset:[0,-16]});

        this.marker.on('click', ev => {
            L.DomEvent.stopPropagation(ev);
            if (fireMode && selectedBase && selectedMissile && !this.hidden) {
                const useTrack = trackingMode;
                fireMode=false; engagementActive=false; trackingMode=false;
                document.getElementById('tracking-badge').style.display='none';
                document.getElementById('base-fire-btn').innerText='🎯 تفعيل وضع الاشتباك';
                document.getElementById('base-fire-btn').style.background='';
                if (useTrack) launchTrackingMissile(selectedBase.coords, this);
                else          launchMissileAtEnemy(selectedBase.coords, this);
            }
        });
    }

    _distToSaudiBorder() {
        let minDist = Infinity;
        for (let i = 0; i < saudiBorder.length-1; i++) {
            const d = map.distance([this.lat,this.lng], saudiBorder[i]);
            if (d < minDist) minDist = d;
        }
        return minDist / 1000;
    }

    update() {
        if (!this.alive || this.stopped) return;

        const dlat = this.targetLat - this.lat;
        const dlng = this.targetLng - this.lng;
        const distDeg = Math.sqrt(dlat*dlat + dlng*dlng);
        if (distDeg < 0.001) return;

        this.lat += (dlat/distDeg) * this.speed;
        this.lng += (dlng/distDeg) * this.speed;

        if (this.type === 'ship' && this.hidden) {
            if (this.lng <= 52.0) {
                this.hidden   = false;
                this.detected = true;
                this._buildMarker();
                const km = Math.round(this._distToSaudiBorder());
                showRadarAlertNormal(`📡 رُصدت سفن حربية إيرانية في الخليج — على بُعد ${km} كم`);
                log(`📡 كشف راداري: سفن إيرانية في الخليج (${km} كم من حدودنا)`, 'fail');
                playSound('snd-alert');
            }
            return;
        }

        if (this.marker) this.marker.setLatLng([this.lat, this.lng]);

        const kmToBorder = this._distToSaudiBorder();

        if (kmToBorder < 200 && !this.alertSent) {
            this.alertSent = true;
            const unit = this.type==='ship'?'سفن حربية':this.type==='tank'?'دبابات إيرانية':'قوات مشاة';
            const origin = this.faction==='iran'
                ? (this.method==='sea' ? 'الخليج العربي' : 'العراق')
                : 'اليمن';
            showRadarAlertNormal(`⚠ رصد: ${unit} من ${origin} — ${Math.round(kmToBorder)} كم من حدودنا`);
            log(`⚠ رصد مبكر: ${unit} من ${origin} — ${Math.round(kmToBorder)} كم`, 'fail');
        }

        if (kmToBorder < 50 && !this.alert50km) {
            this.alert50km = true;
            const unit = this.type==='ship'?'سفن':'دبابات/مشاة';
            const origin = this.faction==='iran'
                ? (this.method==='sea' ? 'الخليج' : 'الحدود الشمالية')
                : 'الحدود الجنوبية';
            showRadarAlertNormal(`🚨 تحذير! ${unit} على بُعد ${Math.round(kmToBorder)} كم — ${origin}`);
            log(`🚨 اقتراب خطير: ${unit} ${Math.round(kmToBorder)} كم من الحدود`, 'fail');
        }

        if (this.type === 'ship') {
            if (distDeg < 0.10) {
                this.stopped = true;
                if (!this.disembarked) { this.disembarked = true; this._disembark(); }
                return;
            }
            if (this.lng < 49.3) {
                this.stopped = true;
                if (!this.disembarked) { this.disembarked = true; this._disembark(); }
                return;
            }
        }

        if (this.type !== 'ship' && distDeg < 0.20) {
            this.stopped = true;
            return;
        }

        if (this.type !== 'ship' && isInsideSaudi(this.lat, this.lng)) {
            triggerDefenseResponse();
        }
    }

    _disembark() {
        const count = 2 + Math.floor(Math.random()*2);
        log('🚢 السفينة رست — ينزل الجنود على الساحل', 'fail');
        playSound('snd-alert');
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (gameOver) return;
                const soldierLat = this.lat + (Math.random()-0.5)*0.05;
                const soldierLng = this.lng + (Math.random()-0.5)*0.05;
                const dTarget = DISEMBARK_TARGETS[Math.floor(Math.random()*DISEMBARK_TARGETS.length)];
                const s = new Enemy('iran_sea', {idx:0});
                s.lat = soldierLat;
                s.lng = soldierLng;
                s.type   = 'soldier';
                s.method = 'land';
                s.hidden = false;
                s.detected = true;
                s.targetLat = dTarget.lat;
                s.targetLng = dTarget.lng;
                s._buildMarker();
                enemies.push(s);
            }, i * 2000);
        }
    }

    destroy() {
        if (!this.alive) return;
        this.alive  = false;
        this.hidden = false;
        if (this.marker) { map.removeLayer(this.marker); this.marker = null; }
        enemies = enemies.filter(e => e !== this);
    }
}

// =============================================
//   DEFENSE RESPONSE
// =============================================
function triggerDefenseResponse() {
    if (defenseTriggered||gameOver) return;
    defenseTriggered=true; gameOver=true;
    playSound('snd-alert');
    log('🚨 خرق للحدود! تفعيل الدفاع الصاروخي الشامل!','fail');
    showRadarAlertNormal('🚨 تجاوز الحدود! الدفاع الصاروخي الشامل مُفعَّل!');

    const alive=[...enemies];
    let shots=0;
    militaryBases.forEach((base,bi)=>{
        alive.forEach((en,ei)=>{
            if(!en.alive) return;
            setTimeout(()=>{
                if(!en.alive) return;
                const mk=['df21','stormshadow','thaad','gemt','pac3'][Math.floor(Math.random()*5)];
                const m=MISSILES[mk];
                const d=map.distance(base.coords,[en.lat,en.lng]);
                const dur=Math.min(3000,Math.max(1000,d/m.speed*1000));
                playSound('snd-missile');
                const line=L.polyline([base.coords,base.coords],{color:m.color,weight:1.5,dashArray:'3,3',opacity:0.8}).addTo(map);
                const hEl=document.createElement('div');
                hEl.style.cssText=`width:7px;height:7px;background:${m.color};border-radius:50%;box-shadow:0 0 10px ${m.color}`;
                const hM=L.marker(base.coords,{icon:L.divIcon({html:hEl,className:'',iconSize:[7,7],iconAnchor:[3,3]})}).addTo(map);
                const st=performance.now();
                function anim(now){
                    const p=Math.min(1,(now-st)/dur);
                    const lat=base.coords[0]+(en.lat-base.coords[0])*p;
                    const lng=base.coords[1]+(en.lng-base.coords[1])*p;
                    line.setLatLngs([base.coords,[lat,lng]]); hM.setLatLng([lat,lng]);
                    if(p<1){requestAnimationFrame(anim);}else{
                        map.removeLayer(line); map.removeLayer(hM);
                        createExplosion([en.lat,en.lng],false,m);
                        if(en.alive){en.alive=false;setTimeout(()=>{if(en.marker){map.removeLayer(en.marker);en.marker=null;}enemies=enemies.filter(e=>e!==en);},100);}
                    }
                }
                requestAnimationFrame(anim);
            },bi*300+ei*600+Math.random()*400);
            shots++;
        });
    });
    setTimeout(()=>{ document.getElementById('end-screen').style.display='flex'; },Math.max(5000,shots*200));
}

// =============================================
//   SPAWN ENEMY
// =============================================
function spawnEnemy(routeKey, forceType) {
    if (gameOver) return;

    let en;
    if (routeKey === 'yemen_far') {
        en = new Enemy('yemen', null, true);
        if (forceType) en.type = forceType;
        en._buildMarker();
    } else {
        en = new Enemy(routeKey);
        if (forceType && routeKey !== 'iran_sea') {
            en.type = forceType;
            en._buildMarker();
        }
    }

    if (en.lat === 0 && en.lng === 0) { return; }

    enemies.push(en);

    if (routeKey !== 'iran_sea' || !en.hidden) {
        const names = {
            iran_sea:   'سفن إيرانية في الخليج',
            iran_iraq:  en.type==='tank'?'دبابات إيرانية من العراق':'مشاة إيرانية من العراق',
            yemen:      en.type==='tank'?'دبابات حوثية من اليمن':'مشاة حوثية من اليمن',
            yemen_far:  en.type==='tank'?'دبابات حوثية — جنوب الحدود':'مشاة حوثية — جنوب الحدود'
        };
        const nm = names[routeKey] || 'قوات معادية';
        log(`📡 رُصد: ${nm}`, 'fail');
    }
    updateEnemyCount();
}