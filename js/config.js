// =============================================
//   AUDIO
// =============================================
function playSound(id) {
    try { const el=document.getElementById(id); if(el){el.currentTime=0;el.play().catch(()=>{});} } catch(e){}
}

// =============================================
//   STATE — متغيرات الحالة العامة
// =============================================
let selectedBase=null, selectedMissile=null, enemies=[], fireMode=false, trackingMode=false;
let firedCount=0, hitCount=0, rangeCircle=null, borderLayer=null, borderVisible=false;
let engagementActive=false, gameOver=false, wavePhase=0;
let midWaveInterval=null, heavyWaveInterval=null;
let defenseTriggered=false;

// ═══ توقيت اللعبة ═══
let gameStartTime = 0;
let gameElapsedSec = 0;
let phaseTimers = [];
let ballisticMissiles = [];
let ballisticInterval = null;
let phase3Active = false;
let phase3Interval = null;

// =============================================
//   MAP
// =============================================
const map = L.map('map',{zoomControl:false,attributionControl:false}).setView([24.5,44.0],6);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:17}).addTo(map);

// Grid overlay
const gridCanvas=document.createElement('canvas');
gridCanvas.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:500;opacity:0.07';
document.body.appendChild(gridCanvas);
function drawGrid(){gridCanvas.width=window.innerWidth;gridCanvas.height=window.innerHeight;const c=gridCanvas.getContext('2d');c.strokeStyle='#00ff9d';c.lineWidth=0.5;for(let x=0;x<gridCanvas.width;x+=60){c.beginPath();c.moveTo(x,0);c.lineTo(x,gridCanvas.height);c.stroke();}for(let y=0;y<gridCanvas.height;y+=60){c.beginPath();c.moveTo(0,y);c.lineTo(gridCanvas.width,y);c.stroke();}}
drawGrid(); window.addEventListener('resize',drawGrid);

// =============================================
//   MILITARY BASES
// =============================================
const militaryBases = [
    {id:'khamis',   name:"قاعدة الملك خالد الجوية",      coords:[18.3069,42.8092], detail:"خميس مشيط — عسير"},
    {id:'dhahran',  name:"قاعدة الملك عبدالعزيز الجوية", coords:[26.2653,50.1519], detail:"الظهران — المنطقة الشرقية"},
    {id:'tabuk',    name:"قاعدة الملك فيصل الجوية",      coords:[28.3972,36.5789], detail:"تبوك — الشمالية الغربية"},
    {id:'sultan',   name:"قاعدة الأمير سلطان الجوية",    coords:[24.0625,47.5803], detail:"السيح — الخرج"},
    {id:'taif',     name:"قاعدة الملك فهد الجوية",       coords:[21.4834,40.5415], detail:"الطائف — المنطقة الغربية"},
    {id:'jeddah',   name:"قاعدة الملك عبدالله الجوية",   coords:[21.6794,39.1567], detail:"جدة — المنطقة الغربية"},
    {id:'hafr',     name:"قاعدة الملك سعود الجوية",      coords:[27.9008,45.5283], detail:"حفر الباطن — الشمالية الشرقية"},
    {id:'riyadh',   name:"قاعدة الملك سلمان الجوية",     coords:[24.7097,46.7253], detail:"الرياض — المنطقة الوسطى"}
];

// =============================================
//   MISSILES — مرتبة من الأعلى مدى إلى الأدنى
// =============================================
const MISSILES = {
    df3:         {name:'DF-3A',                range:2800,color:'#ff2200',radius:30000,speed:4800, ammo:5,  locked:true},
    df21:        {name:'DF-21C رياح الشرق',   range:1750,color:'#ff4400',radius:25000,speed:5500, ammo:5,  locked:true},
    thaad:       {name:'ثاد THAAD',            range:400, color:'#aa66ff',radius:15000,speed:4000, ammo:999,locked:false},
    stormshadow: {name:'ستورم شادو',           range:550, color:'#ff7700',radius:10000,speed:2500, ammo:999,locked:false},
    gemt:        {name:'باتريوت GEM-T',        range:70,  color:'#00aaff',radius:6000, speed:4500, ammo:999,locked:false},
    brimstone:   {name:'بريمستون',             range:60,  color:'#ffaa00',radius:5000, speed:2800, ammo:999,locked:false},
    pac3:        {name:'باتريوت PAC-3',        range:40,  color:'#00ccff',radius:4000, speed:4000, ammo:999,locked:false},
    maverick:    {name:'AGM-65 مافريك',        range:30,  color:'#ffcc00',radius:4000, speed:2000, ammo:999,locked:false},
    crotale:     {name:'كروتال / شاهين',       range:15,  color:'#88ff44',radius:3000, speed:2200, ammo:999,locked:false},
};

// =============================================
//   BASE MARKERS
// =============================================
const baseMarkersMap = {};

map.createPane('basesPane');
map.getPane('basesPane').style.zIndex = 700;

militaryBases.forEach(base => {
    const wrapper = document.createElement('div');
    wrapper.className = 'base-wrapper';
    const pulse = document.createElement('div');
    pulse.className = 'base-pulse-air';
    const icon = document.createElement('div');
    icon.className = 'base-icon-air';
    wrapper.appendChild(pulse);
    wrapper.appendChild(icon);

    const marker = L.marker(base.coords, {
        icon: L.divIcon({html: wrapper, className:'', iconSize:[44,44], iconAnchor:[22,22]}),
        pane: 'basesPane'
    }).addTo(map);

    marker.bindTooltip(
        `<b style="font-size:13px;">✈ ${base.name}</b><br><span style="color:#888;font-size:11px;">${base.detail}</span>`,
        {direction:'top', offset:[0,-24], sticky:false}
    );

    marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectBase(base, marker, wrapper);
    });

    base.marker = marker;
    base.markerEl = wrapper;
    base.iconEl = icon;
    baseMarkersMap[base.id] = base;
});

// =============================================
//   مناطق المملكة العربية السعودية (13 منطقة إدارية)
// =============================================
map.createPane('regionPane');
map.getPane('regionPane').style.zIndex = 450;
map.getPane('regionPane').style.pointerEvents = 'none';

const saudiRegions = [
    {name:'منطقة الرياض',            lat:23.60, lng:46.00, size:13},
    {name:'المنطقة الشرقية',          lat:25.40, lng:49.20, size:12},
    {name:'منطقة مكة المكرمة',       lat:21.00, lng:40.80, size:12},
    {name:'منطقة المدينة المنورة',    lat:25.20, lng:38.80, size:11},
    {name:'منطقة تبوك',              lat:28.70, lng:37.20, size:12},
    {name:'منطقة حائل',              lat:27.70, lng:41.80, size:12},
    {name:'منطقة الحدود الشمالية',   lat:31.10, lng:41.30, size:11},
    {name:'منطقة الجوف',             lat:29.80, lng:39.60, size:12},
    {name:'منطقة القصيم',            lat:26.20, lng:43.50, size:12},
    {name:'منطقة عسير',              lat:18.80, lng:42.50, size:12},
    {name:'منطقة جازان',             lat:17.00, lng:42.90, size:11},
    {name:'منطقة نجران',             lat:18.00, lng:44.80, size:12},
    {name:'منطقة الباحة',            lat:20.00, lng:41.50, size:10},
];

saudiRegions.forEach(r => {
    L.marker([r.lat, r.lng], {
        icon: L.divIcon({
            html: `<div style="color:rgba(0,255,157,0.80);font-family:Cairo,sans-serif;font-size:${r.size}px;font-weight:700;white-space:nowrap;letter-spacing:0.5px;text-shadow:0 0 6px rgba(0,0,0,0.9),0 0 12px rgba(0,0,0,0.7);">${r.name}</div>`,
            className: '',
            iconAnchor: [0, 0]
        }),
        pane: 'regionPane',
        interactive: false
    }).addTo(map);
});

// =============================================
//   أسماء الدول المجاورة
// =============================================
map.createPane('countryPane');
map.getPane('countryPane').style.zIndex = 400;
map.getPane('countryPane').style.pointerEvents = 'none';

const neighborCountries = [
    {name:'العراق',                  lat:31.8,  lng:44.0,  size:16},
    {name:'الأردن',                  lat:31.2,  lng:36.5,  size:15},
    {name:'إيران',                   lat:32.5,  lng:54.0,  size:16},
    {name:'الكويت',                  lat:29.40, lng:47.50, size:12},
    {name:'قطر',                     lat:25.20, lng:51.20, size:11},
    {name:'البحرين',                 lat:26.10, lng:50.57, size:10},
    {name:'الإمارات\nالعربية المتحدة',lat:23.50, lng:54.00, size:13},
    {name:'سلطنة عُمان',             lat:21.50, lng:58.50, size:14},
    {name:'اليمن',                   lat:15.50, lng:47.50, size:16},
    {name:'مصر',                     lat:26.50, lng:30.50, size:15},
    {name:'سوريا',                   lat:34.80, lng:38.50, size:13},
    {name:'إسرائيل',                 lat:31.50, lng:35.00, size:11},
    {name:'إريتريا',                 lat:15.30, lng:38.90, size:11},
    {name:'البحر الأحمر',            lat:22.00, lng:37.00, size:12},
    {name:'الخليج العربي',           lat:27.00, lng:51.50, size:12},
    {name:'خليج عُمان',              lat:24.50, lng:58.00, size:11},
    {name:'بحر العرب',               lat:17.00, lng:61.00, size:12},
];

neighborCountries.forEach(c => {
    L.marker([c.lat, c.lng], {
        icon: L.divIcon({
            html: `<div style="color:rgba(255,240,180,0.88);font-family:Cairo,sans-serif;font-size:${c.size}px;font-weight:700;white-space:nowrap;letter-spacing:0.8px;text-shadow:1px 1px 4px rgba(0,0,0,0.95),0 0 8px rgba(0,0,0,0.8);text-align:center;">${c.name}</div>`,
            className:'',
            iconAnchor:[0,0]
        }),
        pane:'countryPane',
        interactive:false
    }).addTo(map);
});