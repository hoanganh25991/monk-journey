import Stats from 'three/addons/libs/stats.module.js';

export class PerformanceManager {
    constructor(game) {
        this.game = game;
        this.stats = null;
    }
    
    async init() {
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
        this.stats.dom.style.zIndex = 9999;
        this.stats.dom.style.position = "fixed";
        this.stats.dom.style.top = "0px";
        this.stats.dom.style.left = "0px";
        return this;
    }

    getDrawDistanceMultiplier() {
        return 1.0;
    }

    getCurrentQualityLevel() {
        return "ultra";
    }
    
    update() {
        if (this.stats) {
            this.stats.update();
        }
    }
}