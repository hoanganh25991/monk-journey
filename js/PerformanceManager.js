import Stats from 'three/addons/libs/stats.module.js';
import { STORAGE_KEYS } from './config/storage-keys.js';

export class PerformanceManager {
    constructor(game) {
        this.game = game;
        this.stats = null;
        this.statsEnabled = false;
        this.currentQualityLevel = 'high';
        this.performanceSettings = {};
        this.expandedStatsView = true; // Default to expanded view
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
            this.stats.dom.style.zIndex = 50;
            this.stats.dom.style.position = "fixed";
            this.stats.dom.style.top = "0px";
            this.stats.dom.style.left = "0px";
            
            // Apply expanded view if enabled
            if (this.expandedStatsView) {
                this.applyExpandedStatsView();
            }
            
            this.statsEnabled = true;
        } else if (!shouldShowStats && this.stats) {
            // Hide and remove stats
            if (this.stats.dom && this.stats.dom.parentNode) {
                this.stats.dom.parentNode.removeChild(this.stats.dom);
            }
            this.stats = null;
            this.statsEnabled = false;
        } else if (shouldShowStats && this.stats && this.statsEnabled) {
            // Update the view mode if stats are already visible
            if (this.expandedStatsView) {
                this.applyExpandedStatsView();
            } else {
                this.applyDefaultStatsView();
            }
        }
    }
    
    applyExpandedStatsView() {
        if (!this.stats || !this.stats.dom) return;
        
        // Find all canvas elements inside stats.dom
        const panels = this.stats.dom.children;
        for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            // Make all panels visible
            panel.style.display = 'block';
            // Add some margin between panels
            panel.style.marginBottom = '5px';
        }
        
        // Adjust the container to accommodate all panels
        this.stats.dom.style.width = 'auto';
        this.stats.dom.style.height = 'auto';
        this.stats.dom.style.display = 'flex';
        this.stats.dom.style.flexDirection = 'column';
    }
    
    applyDefaultStatsView() {
        if (!this.stats || !this.stats.dom) return;
        
        // Reset to default Three.js Stats styling
        const panels = this.stats.dom.children;
        for (let i = 0; i < panels.length; i++) {
            const panel = panels[i];
            // Only the first panel is visible by default in Three.js Stats
            panel.style.display = i === 0 ? 'block' : 'none';
            panel.style.marginBottom = '0';
        }
        
        // Reset container to default Three.js Stats styling
        this.stats.dom.style.width = '80px';
        this.stats.dom.style.height = '48px';
        this.stats.dom.style.display = 'block';
    }
    
    toggleStatsViewMode() {
        this.expandedStatsView = !this.expandedStatsView;
        this.updateStatsVisibility();
        return this.expandedStatsView;
    }
    
    setExpandedStatsView(enabled) {
        this.expandedStatsView = enabled;
        this.updateStatsVisibility();
        return this.expandedStatsView;
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
    
    isExpandedStatsViewEnabled() {
        return this.expandedStatsView;
    }
    
    update() {
        // Check if settings changed and update visibility accordingly
        this.updateStatsVisibility();
        
        if (this.stats && this.statsEnabled) {
            this.stats.update();
        }
    }
}