// =============================================
//   MILITARY BASES — مأخوذة نصاً من الملف الأصلي
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
//   MISSILES CONFIG — مأخوذة نصاً من الملف الأصلي
// =============================================
const MISSILES = {
    df3:         {name:'DF-3A',                range:2800, color:'#ff2200', radius:30000, speed:4800, ammo:5,  locked:true},
    df21:        {name:'DF-21C رياح الشرق',   range:1750, color:'#ff4400', radius:25000, speed:5500, ammo:5,  locked:true},
    thaad:       {name:'ثاد THAAD',            range:400,  color:'#aa66ff', radius:15000, speed:4000, ammo:999,locked:false},
    stormshadow: {name:'ستورم شادو',           range:550,  color:'#ff7700', radius:10000, speed:2500, ammo:999,locked:false},
    gemt:        {name:'باتريوت GEM-T',        range:70,   color:'#00aaff', radius:6000,  speed:4500, ammo:999,locked:false},
    brimstone:   {name:'بريمستون',             range:60,   color:'#ffaa00', radius:5000,  speed:2800, ammo:999,locked:false},
    pac3:        {name:'باتريوت PAC-3',        range:40,   color:'#00ccff', radius:4000,  speed:4000, ammo:999,locked:false},
    maverick:    {name:'AGM-65 مافريك',        range:30,   color:'#ffcc00', radius:4000,  speed:2000, ammo:999,locked:false},
    crotale:     {name:'كروتال / شاهين',       range:15,   color:'#88ff44', radius:3000,  speed:2200, ammo:999,locked:false},
};

// =============================================
//   SAUDI REGIONS — مأخوذة نصاً من الملف الأصلي
// =============================================
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

// =============================================
//   NEIGHBOR COUNTRIES — مأخوذة نصاً من الملف الأصلي
// =============================================
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