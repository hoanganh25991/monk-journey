import Stats from 'three/addons/libs/stats.module.js';
import { STORAGE_KEYS } from './config/storage-keys.js';

export class PerformanceManager {
    constructor(game) {
        this.game = game;
        this.stats = null;
        this.statsEnabled = false;
        this.currentQualityLevel = 'high';
        this.performanceSettings = {};
    }
    
    async init() {
        this.updateStatsVisibility();
        return this;
    }

    updateStatsVisibility() {
        const shouldShowStats = localStorage.getItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO) === 'true';
        
        if (shouldShowStats && !this.stats) {
            // Create and show stats
            this.stats = new Stats();
            document.body.appendChild(this.stats.dom);
            this.stats.dom.style.zIndex = 9999;
            this.stats.dom.style.position = "fixed";
            this.stats.dom.style.top = "0px";
            this.stats.dom.style.left = "0px";
            this.statsEnabled = true;
        } else if (!shouldShowStats && this.stats) {
            // Hide and remove stats
            if (this.stats.dom && this.stats.dom.parentNode) {
                this.stats.dom.parentNode.removeChild(this.stats.dom);
            }
            this.stats = null;
            this.statsEnabled = false;
        }
    }

    getDrawDistanceMultiplier() {
        return 1.0;
    }

    getCurrentQualityLevel() {
        return this.currentQualityLevel;
    }

    getCurrentPerformanceLevel() {
        return this.currentQualityLevel;
    }

    togglePerformanceStats(enabled) {
        localStorage.setItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, enabled.toString());
        this.updateStatsVisibility();
    }

    isPerformanceStatsEnabled() {
        return localStorage.getItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO) === 'true';
    }
    
    update() {
        // Check if settings changed and update visibility accordingly
        this.updateStatsVisibility();
        
        if (this.stats && this.statsEnabled) {
            this.stats.update();
        }
    }
}