// =============================================
//  نظام السيناريو والتحكم الزمني — مأخوذ نصاً من الملف الأصلي
// =============================================

let gameStartTime = 0;
let gameElapsedSec = 0;
let phaseTimers = [];
let ballisticMissiles = [];
let wavePhase = 0;

// أداة مساعدة للتأخير العشوائي الموزع
function rnd(min, max) { return min + Math.random() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }

// جدولة آمنة تضمن عدم التنفيذ في حال انتهاء اللعبة
function scheduleT(fn, ms) {
    const id = setTimeout(() => { if (!gameOver) fn(); }, ms);
    phaseTimers.push(id);
    return id;
}

// ═══════════════════════════════════════════════
//  إدارة مراحل اللعبة (الجدول الزمني)
// ═══════════════════════════════════════════════
function startGameSpawning() {
    gameStartTime = Date.now();
    gameElapsedSec = 0;
    wavePhase = 0;

    // تهيئة حالة الصواريخ عند البداية
    MISSILES.df3.ammoLeft = 0;
    MISSILES.df21.ammoLeft = 0;

    // تحديث العداد الزمني العام
    const clockInterval = setInterval(() => {
        if (gameOver) { clearInterval(clockInterval); return; }
        gameElapsedSec = Math.floor((Date.now() - gameStartTime) / 1000);
    }, 1000);
    phaseTimers.push(clockInterval);

    // البدء بالمرحلة 1 فوراً
    runPhase1();

    // المرحلة 2: فتح الصواريخ الاستراتيجية (بعد 3 دقائق / 180 ثانية)
    scheduleT(() => {
        MISSILES.df3.locked = false;
        MISSILES.df21.locked = false;
        MISSILES.df3.ammoLeft = 5;
        MISSILES.df21.ammoLeft = 5;
        
        // تحديث أزرار الصواريخ في الواجهة
        ['df3', 'df21'].forEach(id => {
            const btn = document.getElementById('btn-' + id);
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('weapon-locked');
                btn.classList.add('weapon-unlocked');
                const nm = id === 'df3' ? 'DF-3A' : 'DF-21C رياح الشرق';
                btn.innerHTML = `▲ ${nm} — <span class="ammo-count" id="ammo-${id}">5/5</span><span class="weapon-range">مدى: ${MISSILES[id].range} كم | متاح الآن ×5</span>`;
            }
        });
        
        showRadarAlertNormal('🟢 تم تفعيل الصواريخ الباليستية DF-3A و DF-21C!');
        log('🟢 الصواريخ الباليستية جاهزة للعمليات استجابة للتصعيد', 'success');
        playSound('snd-alert');
        wavePhase = 1;
        runPhase2();
    }, 180000);

    // المرحلة 3: الهجوم الشامل (بعد 5 دقائق / 300 ثانية)
    scheduleT(() => { wavePhase = 2; runPhase3(); }, 300000);

    // المرحلة 4: ذروة التصعيد والصواريخ الباليستية (بعد 8 دقائق / 480 ثانية)
    scheduleT(() => { wavePhase = 3; runPhase4(); }, 480000);
}

// ── المرحلة 1: مناوشات بسيطة ──
function runPhase1() {
    log('🟢 نظام الرصد جاهز — مراقبة الحدود النشطة', 'info');
    // رسبون متفرق من اليمن والعراق
    for (let i = 0; i < rndInt(1, 2); i++) scheduleT(() => spawnEnemy('yemen'), rnd(8000, 90000));
    for (let i = 0; i < rndInt(1, 2); i++) scheduleT(() => spawnEnemy('iran_iraq'), rnd(20000, 150000));
}

// ── المرحلة 2: تصاعد متوسط ──
function runPhase2() {
    const duration = 120000;
    // ظهور أول للسفن الإيرانية
    for (let i = 0; i < rndInt(1, 3); i++) scheduleT(() => spawnEnemy('iran_sea'), rnd(5000, duration));
    // تعزيزات برية
    for (let i = 0; i < rndInt(3, 4); i++) scheduleT(() => spawnEnemy('yemen', 'soldier'), rnd(10000, duration));
    for (let i = 0; i < rndInt(5, 6); i++) scheduleT(() => spawnEnemy('iran_iraq', 'tank'), rnd(10000, duration));
}

// ── المرحلة 3: هجوم كثيف ──
function runPhase3() {
    showRadarAlertNormal('🚨 هجوم شامل! رصد تعزيزات ضخمة من كافة المحاور!');
    log('🚨 تحذير: هجوم منسق عابر للحدود', 'fail');
    const duration = 180000;
    // أسراب من السفن والوحدات البرية
    for (let i = 0; i < rndInt(8, 12); i++) scheduleT(() => spawnEnemy('iran_sea'), rnd(5000, duration));
    for (let i = 0; i < rndInt(18, 20); i++) scheduleT(() => spawnEnemy('iran_iraq'), rnd(3000, duration));
    for (let i = 0; i < rndInt(10, 15); i++) scheduleT(() => spawnEnemy('yemen_far'), rnd(3000, duration));
}

// ── المرحلة 4: الصواريخ الباليستية ──
function runPhase4() {
    showBallisticAlert('🚀 رصد إطلاق صواريخ باليستية من العمق الإيراني!');
    log('🚀 هجوم باليستي معادٍ قيد التنفيذ!', 'fail');
    
    const missileCount = rndInt(10, 40);
    let launched = 0;
    function nextMissile() {
        if (gameOver || launched >= missileCount) return;
        spawnBallisticMissile();
        launched++;
        scheduleT(nextMissile, rnd(5000, 18000));
    }
    nextMissile();
    
    // استمرار الرسبون البري والبحري بكثافة
    setInterval(() => {
        if (!gameOver) {
            spawnEnemy('iran_sea');
            spawnEnemy('iran_iraq');
            spawnEnemy('yemen_far');
        }
    }, 15000);
}