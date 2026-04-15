
// =============================================
//   BASE SELECTION
// =============================================
function selectBase(base, marker, wrapper) {
    if (selectedBase) selectedBase.markerEl.classList.remove('selected');
    selectedBase = base;
    wrapper.classList.add('selected');

    document.getElementById('base-info-panel').style.display = 'block';
    document.getElementById('base-info-name').innerText = base.name;
    document.getElementById('base-info-type').innerText = base.detail;
    document.getElementById('sel-base-name').innerText = base.name.split(' ').slice(-2).join(' ');
    document.getElementById('base-fire-btn').style.display = selectedMissile ? 'inline-block' : 'none';

    if (rangeCircle) map.removeLayer(rangeCircle);
    if (selectedMissile) drawRangeCircle();
    updateSteps();
    log(`تم تحديد: ${base.name}`, 'info');
}

function drawRangeCircle() {
    if (rangeCircle) map.removeLayer(rangeCircle);
    if (!selectedBase || !selectedMissile) return;
    const m = MISSILES[selectedMissile];
    rangeCircle = L.circle(selectedBase.coords, {radius:m.range*1000,color:m.color,fillColor:m.color,fillOpacity:0.04,weight:1,dashArray:'6,6'}).addTo(map);
}

// =============================================
//   MISSILE SELECTION
// =============================================
function selectMissile(type) {
    const m = MISSILES[type];
    if (m.locked) { log('🔒 هذا الصاروخ مقفل — يُفعَّل بعد 3 دقائق', 'fail'); return; }
    if (m.ammoLeft !== undefined && m.ammoLeft <= 0) { log(`⚠ نفدت ذخيرة ${m.name}!`, 'fail'); return; }
    selectedMissile = type;
    document.querySelectorAll('.weapon-btn').forEach(b=>b.classList.remove('active'));
    const btn = document.getElementById('btn-'+type);
    if(btn) btn.classList.add('active');
    document.getElementById('sel-missile-name').innerText = m.name;
    document.getElementById('selected-info').innerText = `${m.name} — مدى ${m.range} كم`;
    document.getElementById('selected-info').style.color = m.color;
    if (selectedBase) { document.getElementById('base-fire-btn').style.display='inline-block'; drawRangeCircle(); }
    updateSteps();
}

// =============================================
//   FIRE MODE
// =============================================
document.addEventListener('keydown', e => {
    if (e.key==='Shift'&&fireMode) { trackingMode=true; document.getElementById('tracking-badge').style.display='block'; document.getElementById('base-fire-btn').innerText='🎯 انقر الهدف (تتبع ذكي)...'; }
});
document.addEventListener('keyup', e => {
    if (e.key==='Shift'&&!fireMode) { trackingMode=false; document.getElementById('tracking-badge').style.display='none'; }
});

function enterFireMode() {
    if (!selectedBase||!selectedMissile) return;
    if (engagementActive) { log('نظام الاشتباك فعّال بالفعل','info'); return; }
    engagementActive=true; fireMode=true; trackingMode=false;
    document.getElementById('base-fire-btn').innerText='🎯 انقر على الهدف...';
    document.getElementById('base-fire-btn').style.background='#ff6000';
    log('وضع الاشتباك مفعّل — انقر على الهدف','info');
}

map.on('click', e => {
    if (!fireMode) return;
    if (!selectedBase||!selectedMissile) { log('الرجاء اختيار قاعدة وصاروخ أولاً','fail'); return; }
    const target=e.latlng;
    const dist=map.distance(selectedBase.coords,[target.lat,target.lng]);
    const maxRange=MISSILES[selectedMissile].range*1000;
    firedCount++; document.getElementById('fired-count').innerText=firedCount;
    launchMissile(selectedBase.coords,{lat:target.lat,lng:target.lng},dist,maxRange,null,trackingMode);
    fireMode=false; engagementActive=false; trackingMode=false;
    document.getElementById('tracking-badge').style.display='none';
    document.getElementById('base-fire-btn').innerText='🎯 تفعيل وضع الاشتباك';
    document.getElementById('base-fire-btn').style.background='';
});

// =============================================
//   MISSILE ANIMATION
// =============================================
function launchMissile(startCoords, endLatLng, totalDist, maxRange, targetEnemy, useTracking) {
    if (totalDist>maxRange) {
        document.getElementById('range-detail').innerText=`المسافة: ${Math.round(totalDist/1000)} كم | المدى: ${MISSILES[selectedMissile].range} كم`;
        const w=document.getElementById('range-warning'); w.style.display='block'; setTimeout(()=>w.style.display='none',2500);
        log(`⚠ صاروخ خارج المدى!`,'fail'); return;
    }
    const m=MISSILES[selectedMissile];
    playSound('snd-missile');
    if (m.ammoLeft !== undefined && m.ammoLeft > 0) {
        m.ammoLeft--;
        const ammoEl = document.getElementById('ammo-'+selectedMissile);
        if (ammoEl) ammoEl.innerText = `${m.ammoLeft}/5`;
        if (m.ammoLeft === 0) {
            log(`⚠ نفدت ذخيرة ${m.name}!`, 'fail');
            document.getElementById('btn-'+selectedMissile)?.classList.add('weapon-locked');
        }
    }
    const dur=Math.min(3000,Math.max(1200,totalDist/m.speed*1000));
    const st=performance.now();
    const line=L.polyline([startCoords,startCoords],{color:m.color,weight:1.5,dashArray:'4,4',opacity:0.9}).addTo(map);
    let end={lat:endLatLng.lat,lng:endLatLng.lng};
    const hEl=document.createElement('div');
    hEl.style.cssText=`width:8px;height:8px;background:${m.color};border-radius:50%;box-shadow:0 0 10px ${m.color},0 0 20px ${m.color}`;
    const hM=L.marker(startCoords,{icon:L.divIcon({html:hEl,className:'',iconSize:[8,8],iconAnchor:[4,4]})}).addTo(map);
    function anim(now){
        let p=Math.min(1,(now-st)/dur);
        if(useTracking&&targetEnemy&&targetEnemy.alive) end={lat:targetEnemy.lat,lng:targetEnemy.lng};
        const lat=startCoords[0]+(end.lat-startCoords[0])*p;
        const lng=startCoords[1]+(end.lng-startCoords[1])*p;
        line.setLatLngs([startCoords,[lat,lng]]); hM.setLatLng([lat,lng]);
        if(p<1){requestAnimationFrame(anim);}else{map.removeLayer(line);map.removeLayer(hM);createExplosion([end.lat,end.lng],false,m);}
    }
    requestAnimationFrame(anim);
}

function launchMissileAtEnemy(startCoords, enemy) {
    if (!selectedMissile) return;
    if (enemy.hidden) { log('⚠ الهدف خارج نطاق الرصد','fail'); return; }
    const m=MISSILES[selectedMissile];
    const dist=map.distance(startCoords,[enemy.lat,enemy.lng]);
    if (dist>m.range*1000) { log(`⚠ هدف خارج المدى!`,'fail'); return; }
    playSound('snd-missile');
    firedCount++; document.getElementById('fired-count').innerText=firedCount;
    const dur=Math.min(3000,Math.max(1200,dist/m.speed*1000));
    const st=performance.now();
    const snapLat=enemy.lat, snapLng=enemy.lng;
    const line=L.polyline([startCoords,startCoords],{color:m.color,weight:1.5,dashArray:'4,4',opacity:0.9}).addTo(map);
    const hEl=document.createElement('div');
    hEl.style.cssText=`width:8px;height:8px;background:${m.color};border-radius:50%;box-shadow:0 0 10px ${m.color},0 0 20px ${m.color}`;
    const hM=L.marker(startCoords,{icon:L.divIcon({html:hEl,className:'',iconSize:[8,8],iconAnchor:[4,4]})}).addTo(map);
    function anim(now){
        let p=Math.min(1,(now-st)/dur);
        const tLat=enemy.alive?enemy.lat:snapLat;
        const tLng=enemy.alive?enemy.lng:snapLng;
        const lat=startCoords[0]+(tLat-startCoords[0])*p;
        const lng=startCoords[1]+(tLng-startCoords[1])*p;
        line.setLatLngs([startCoords,[lat,lng]]); hM.setLatLng([lat,lng]);
        if(p<1){requestAnimationFrame(anim);}else{
            map.removeLayer(line); map.removeLayer(hM);
            createExplosion([tLat,tLng],false,m);
            if(enemy.alive){
                enemy.alive=false;
                if(enemy.marker) map.removeLayer(enemy.marker);
                enemies=enemies.filter(e=>e!==enemy);
                hitCount++; document.getElementById('hit-count').innerText=hitCount;
                playSound('snd-destroyed');
                log(`✓ تم تدمير هدف (${enemy.faction==='iran'?'إيران':'اليمن'})`,'success');
            }
        }
    }
    requestAnimationFrame(anim);
}

function launchTrackingMissile(startCoords, enemy) {
    if (!selectedMissile) return;
    const m=MISSILES[selectedMissile];
    const dist=map.distance(startCoords,[enemy.lat,enemy.lng]);
    playSound('snd-missile');
    firedCount++; document.getElementById('fired-count').innerText=firedCount;
    const dur=Math.min(4000,Math.max(1500,dist/m.speed*1000));
    const st=performance.now();
    const line=L.polyline([startCoords,startCoords],{color:m.color,weight:2,dashArray:'3,3',opacity:1}).addTo(map);
    const hEl=document.createElement('div');
    hEl.style.cssText=`width:10px;height:10px;background:${m.color};border-radius:50%;box-shadow:0 0 14px ${m.color},0 0 28px ${m.color}`;
    const hM=L.marker(startCoords,{icon:L.divIcon({html:hEl,className:'',iconSize:[10,10],iconAnchor:[5,5]})}).addTo(map);
    let cLat=startCoords[0], cLng=startCoords[1];
    function anim(now){
        const p=Math.min(1,(now-st)/dur);
        const tLat=enemy.alive?enemy.lat:cLat;
        const tLng=enemy.alive?enemy.lng:cLng;
        cLat=startCoords[0]+(tLat-startCoords[0])*p;
        cLng=startCoords[1]+(tLng-startCoords[1])*p;
        line.setLatLngs([startCoords,[cLat,cLng]]); hM.setLatLng([cLat,cLng]);
        if(p<1){requestAnimationFrame(anim);}else{
            map.removeLayer(line); map.removeLayer(hM);
            createExplosion([cLat,cLng],false,m);
            if(enemy.alive){
                enemy.alive=false;
                if(enemy.marker) map.removeLayer(enemy.marker);
                enemies=enemies.filter(e=>e!==enemy);
                hitCount++; document.getElementById('hit-count').innerText=hitCount;
                playSound('snd-destroyed');
                log(`✓ هدف محايَد بالتتبع الذكي`,'success');
            }
        }
    }
    requestAnimationFrame(anim);
}

// =============================================
//   EXPLOSION
// =============================================
function createExplosion(coords, failed, m) {
    playSound('snd-explosion');
    const color=failed?'#888':m.color;
    const radius=failed?4000:m.radius;

    const wave=L.circle(coords,{radius:radius*0.25,color,fillColor:color,fillOpacity:0.8,weight:2}).addTo(map);
    const wave2=L.circle(coords,{radius,color,fillColor:color,fillOpacity:0.18,weight:1,dashArray:'4,4'}).addTo(map);

    let step=0;
    const ani=setInterval(()=>{
        step++;
        wave.setStyle({fillOpacity:Math.max(0,0.8-step*0.08),radius:radius*0.25*(1+step*0.1)});
        wave2.setStyle({fillOpacity:Math.max(0,0.18-step*0.018)});
        if(step>10){clearInterval(ani);map.removeLayer(wave);map.removeLayer(wave2);}
    },80);

    if (!failed) {
        const toDestroy=enemies.filter(en=>en.alive&&!en.hidden&&map.distance(coords,[en.lat,en.lng])<radius);
        toDestroy.forEach(en=>{
            en.alive=false;
            setTimeout(()=>{
                if(en.marker){map.removeLayer(en.marker);en.marker=null;}
                enemies=enemies.filter(e=>e!==en);
                hitCount++; document.getElementById('hit-count').innerText=hitCount;
                playSound('snd-destroyed');
            },200+Math.random()*300);
        });
        log(`✓ انفجار في (${coords[0].toFixed(2)},${coords[1].toFixed(2)})`,'success');
    } else {
        log(`✗ الصاروخ سقط خارج المدى`,'fail');
    }
}

// =============================================
//   GAME LOOP
// =============================================
function gameLoop() {
    enemies.forEach(e=>{ try{e.update();}catch(ex){} });
    updateBallisticMissiles();
    updateEnemyCount();
    requestAnimationFrame(gameLoop);
}
gameLoop();

// =============================================
//   RESTART
// =============================================
function restartGame() {
    document.getElementById('end-screen').style.display='none';

    enemies.forEach(e=>{ try{ if(e.marker)map.removeLayer(e.marker); }catch(ex){} });
    enemies=[];

    ballisticMissiles.forEach(bm=>{ try{ if(bm.marker)map.removeLayer(bm.marker); }catch(ex){} });
    ballisticMissiles=[];

    phaseTimers.forEach(id=>{ clearTimeout(id); clearInterval(id); });
    phaseTimers=[];
    if(midWaveInterval){clearInterval(midWaveInterval);midWaveInterval=null;}
    if(heavyWaveInterval){clearInterval(heavyWaveInterval);heavyWaveInterval=null;}
    if(ballisticInterval){clearInterval(ballisticInterval);ballisticInterval=null;}

    document.getElementById('radar-alert').style.display='none';
    document.getElementById('ballistic-alert').style.display='none';
    document.getElementById('mini-radar').classList.remove('radar-missile-mode');

    gameOver=false; defenseTriggered=false; firedCount=0; hitCount=0; wavePhase=0;
    phase3Active=false;
    document.getElementById('fired-count').innerText=0;
    document.getElementById('hit-count').innerText=0;
    document.getElementById('e-count').innerText=0;
    document.getElementById('e-count-top').innerText=0;
    document.getElementById('threat-level').innerText='منخفض';
    document.getElementById('threat-level').className='value';
    if(selectedBase){selectedBase.markerEl.classList.remove('selected');selectedBase=null;}
    selectedMissile=null; fireMode=false; engagementActive=false; trackingMode=false;
    document.querySelectorAll('.weapon-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('selected-info').innerText='لا يوجد صاروخ محدد';
    document.getElementById('selected-info').style.color='#888';
    document.getElementById('base-info-panel').style.display='none';
    document.getElementById('base-fire-btn').style.display='none';
    if(rangeCircle){map.removeLayer(rangeCircle);rangeCircle=null;}

    document.getElementById('log-container').innerHTML='';

    MISSILES.df3.locked  = true;
    MISSILES.df21.locked = true;
    MISSILES.df3.ammoLeft  = 0;
    MISSILES.df21.ammoLeft = 0;
    ['df3','df21'].forEach(id=>{
        const btn = document.getElementById('btn-'+id);
        if(btn){
            btn.disabled=true;
            btn.classList.remove('weapon-unlocked');
            btn.classList.add('weapon-locked');
            const nm=id==='df3'?'DF-3A':'DF-21C رياح الشرق';
            btn.innerHTML=`🔒 ${nm} — <span class="ammo-count" id="ammo-${id}">0/5</span><span class="weapon-range">مدى: ${MISSILES[id].range} كم | يُفعَّل بعد 3 دقائق</span>`;
        }
    });

    log('النظام جاهز — جولة جديدة بدأت','success');
    log('رصد الحدود — إيران / اليمن...','info');
    startGameSpawning();
}

// =============================================
//   START
// =============================================
log('النظام جاهز للعمليات','success');
log('رصد الحدود — إيران / اليمن...','info');
startGameSpawning();