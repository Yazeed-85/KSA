// =============================================
//   تعريف أنواع الأعداء والمسارات
// =============================================
const SPAWN_VARIANTS = {
    iran_sea:  { lat: 28.5, lng: 52.0, target: [26.3, 50.1], faction: 'iran', type: 'ship' },
    iran_iraq: { lat: 32.0, lng: 46.5, target: [30.5, 45.8], faction: 'iran', type: 'tank' },
    yemen:     { lat: 15.0, lng: 44.5, target: [17.5, 44.0], faction: 'yemen', type: 'soldier' }
};

let enemies = [];

// =============================================
//   كلاس العدو (Enemy Class)
// =============================================
class Enemy {
    constructor(routeKey) {
        const config = SPAWN_VARIANTS[routeKey];
        this.alive = true;
        this.faction = config.faction;
        this.lat = config.lat + (Math.random() - 0.5) * 1.5; // إضافة عشوائية بسيطة في الرسبون
        this.lng = config.lng + (Math.random() - 0.5) * 1.5;
        this.target = config.target;
        this.type = config.type;
        this.speed = 0.0015 + (Math.random() * 0.001); // سرعة متغيرة
        
        this.el = document.createElement('div');
        this.updateIcon();
        
        this.marker = L.marker([this.lat, this.lng], {
            icon: L.divIcon({ html: this.el, className: '', iconSize: [30, 30] })
        }).addTo(map);
    }

    // تحديث الشكل بناءً على الموقع (بر/بحر)
    updateIcon() {
        // إذا كان في مياه الخليج العربي
        const inGulf = (this.lng > 48.5 && this.lng < 56.0 && this.lat > 24.0);
        if (inGulf && this.faction === 'iran') {
            this.type = 'ship';
            this.el.className = 'enemy-ship';
        } else {
            // العودة لشكل القوات البرية عند ملامسة اليابسة
            this.el.className = Math.random() > 0.5 ? 'enemy-tank' : 'enemy-soldier';
        }
    }

    // منطق الحركة والتحديث
    update() {
        if (!this.alive) return;

        let dLat = this.target[0] - this.lat;
        let dLng = this.target[1] - this.lng;
        let dist = Math.sqrt(dLat * dLat + dLng * dLng);

        if (dist > 0.01) {
            this.lat += (dLat / dist) * this.speed;
            this.lng += (dLng / dist) * this.speed;
            this.updateIcon();
            this.marker.setLatLng([this.lat, this.lng]);
        }

        // فحص اختراق الحدود باستخدام border.js
        if (isInsideSaudi(this.lat, this.lng)) {
            triggerDefenseResponse(); // سيتم تعريفها في game.js
        }
    }

    // تدمير الهدف
    destroy() {
        this.alive = false;
        map.removeLayer(this.marker);
        enemies = enemies.filter(e => e !== this);
    }
}