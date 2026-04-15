// =============================================
//   بيانات القواعد العسكرية (إحداثيات دقيقة)
// =============================================
const militaryBases = [
    // القوات الجوية
    { id: 'khamis', name: "قاعدة الملك خالد الجوية", coords: [18.3069, 42.8092], type: "air", detail: "خميس مشيط — عسير" },
    { id: 'dhahran', name: "قاعدة الملك عبدالعزيز الجوية", coords: [26.2653, 50.1519], type: "air", detail: "الظهران — المنطقة الشرقية" },
    { id: 'tabuk', name: "قاعدة الملك فيصل الجوية", coords: [28.3972, 36.5789], type: "air", detail: "تبوك — المنطقة الشمالية الغربية" },
    { id: 'sultan', name: "قاعدة الأمير سلطان الجوية", coords: [24.0625, 47.5803], type: "air", detail: "السيح — الخرج" },
    { id: 'taif', name: "قاعدة الملك فهد الجوية", coords: [21.4834, 40.5415], type: "air", detail: "الطائف — المنطقة الغربية" },
    { id: 'jeddah', name: "قاعدة الملك عبدالله الجوية", coords: [21.6794, 39.1567], type: "air", detail: "جدة — المنطقة الغربية" },
    { id: 'hafr-air', name: "قاعدة الملك سعود الجوية", coords: [27.9008, 45.5283], type: "air", detail: "حفر الباطن — المنطقة الشمالية الشرقية" },
    { id: 'riyadh', name: "قاعدة الملك سلمان الجوية", coords: [24.7097, 46.7253], type: "air", detail: "الرياض — المنطقة الوسطى" },
    
    // القوات البرية
    { id: 'kfm-land', name: "مدينة الملك فيصل العسكرية", coords: [18.3300, 42.7500], type: "land", detail: "خميس مشيط — المنطقة الجنوبية" },
    { id: 'kaz-land', name: "مدينة الملك عبدالعزيز العسكرية", coords: [28.4100, 36.6200], type: "land", detail: "تبوك — المنطقة الشمالية" },
    { id: 'kkh-land', name: "مدينة الملك خالد العسكرية", coords: [27.9800, 45.5500], type: "land", detail: "حفر الباطن — المنطقة الشمالية" },
    { id: 'kfh-land', name: "مدينة الملك فهد العسكرية", coords: [26.3500, 49.9500], type: "land", detail: "المنطقة الشرقية" }
];

// =============================================
//   بيانات الصواريخ والمنظومات الدفاعية
// =============================================
const MISSILES = {
    df21:        { name: 'DF-21C رياح الشرق',    range: 1750, color: '#ff4400', radius: 25000, speed: 5500 },
    df3:         { name: 'DF-3A',                 range: 2800, color: '#ff2200', radius: 30000, speed: 4800 },
    stormshadow: { name: 'ستورم شادو',            range: 550,  color: '#ff7700', radius: 10000, speed: 2500 },
    brimstone:   { name: 'بريمستون',              range: 60,   color: '#ffaa00', radius: 5000,  speed: 2800 },
    maverick:    { name: 'AGM-65 مافريك',         range: 30,   color: '#ffcc00', radius: 4000,  speed: 2000 },
    pac3:        { name: 'باتريوت PAC-3',         range: 40,   color: '#00ccff', radius: 4000,  speed: 4000 },
    gemt:        { name: 'باتريوت GEM-T',         range: 70,   color: '#00aaff', radius: 6000,  speed: 4500 },
    thaad:       { name: 'ثاد THAAD',             range: 200,  color: '#aa66ff', radius: 15000, speed: 3500 },
    crotale:     { name: 'كروتال / شاهين',        range: 15,   color: '#88ff44', radius: 3000,  speed: 2200 }
};

// =============================================
//   إعدادات اللعبة العامة
// =============================================
const GAME_SETTINGS = {
    MAX_SESSION_TIME: 900, // 15 دقيقة بالثواني
    DIFFICULTY_SPIKE_TIME: 480, // تبدأ الصعوبة القصوى عند الدقيقة 8
    SPAWN_RATE_START: 8000, // معدل ظهور الأعداء في البداية (8 ثوانٍ)
    SPAWN_RATE_MIN: 2000, // أقل معدل ظهور عند الذروة
    SNAP_DISTANCE: 20000 // مسافة الإصابة المباشرة (20 كم)
};