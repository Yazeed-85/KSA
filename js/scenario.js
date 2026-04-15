// =============================================
//   إدارة مراحل اللعبة وتصعيد الصعوبة
// =============================================

let gameStartTime = null;
let currentPhase = 0; // 0: هدوء، 1: استطلاع، 2: اشتباك، 3: هجوم شامل، 4: ذروة الصعوبة
let scenarioInterval = null;

function startScenario() {
    gameStartTime = Date.now();
    log("◈ تم تفعيل نظام السيناريو القتالي — الجولة: 15 دقيقة", "info");
    
    scenarioInterval = setInterval(updateScenario, 1000);
}

function updateScenario() {
    if (gameOver) {
        clearInterval(scenarioInterval);
        return;
    }

    const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    // تحديث عداد الوقت في الواجهة
    document.getElementById('mission-timer').innerText = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // --- منطق المراحل بناءً على الوقت ---

    // المرحلة 1: (0 - 3 دقائق) - هدوء واستطلاع
    if (elapsedSeconds < 180 && currentPhase !== 1) {
        currentPhase = 1;
        log("🛰 رصد تحركات استطلاعية معادية عند الحدود", "info");
        setSpawnRate(8000); // عدو كل 8 ثوانٍ
    }

    // المرحلة 2: (3 - 5 دقائق) - مناوشات
    else if (elapsedSeconds >= 180 && elapsedSeconds < 300 && currentPhase !== 2) {
        currentPhase = 2;
        log("⚠️ تصاعد وتيرة الاشتباك - رصد تعزيزات إضافية", "warning");
        setSpawnRate(5000); // عدو كل 5 ثوانٍ
    }

    // المرحلة 3: (5 - 8 دقائق) - هجوم منسق
    else if (elapsedSeconds >= 300 && elapsedSeconds < 480 && currentPhase !== 3) {
        currentPhase = 3;
        log("🚨 تحذير: هجوم منسق من عدة محاور!", "danger");
        setSpawnRate(3000); 
    }

    // المرحلة 4: (8 - 15 دقيقة) - الصعوبة القصوى (الدقيقة 8)
    else if (elapsedSeconds >= 480 && elapsedSeconds < 900 && currentPhase !== 4) {
        currentPhase = 4;
        log("🔥 ذروة الاشتباك - نظام الدفاع تحت ضغط أقصى!", "danger");
        showRadarAlert("🚨 هجوم انتحاري شامل - الدفاعات مهددة!");
        setSpawnRate(1200); // عدو كل ثانية تقريباً - صعوبة بالغة
    }

    // نهاية اللعبة بنصر (صمود 15 دقيقة)
    else if (elapsedSeconds >= 900) {
        victory();
    }
}

function setSpawnRate(rate) {
    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        if (!gameOver) {
            const routes = Object.keys(SPAWN_VARIANTS);
            const randomRoute = routes[Math.floor(Math.random() * routes.length)];
            enemies.push(new Enemy(randomRoute));
        }
    }, rate);
}

function victory() {
    gameOver = true;
    clearInterval(scenarioInterval);
    clearInterval(spawnInterval);
    document.getElementById('end-screen').style.display = 'flex';
    log("🏆 صمود أسطوري - تم دحر كافة التهديدات", "success");
}