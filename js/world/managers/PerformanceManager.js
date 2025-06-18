import * as THREE from 'three';

/**
 * Performance Manager class that handles performance monitoring and optimization
 * Extracted from MapManager for better maintainability
 */
export class PerformanceManager {
    constructor(game) {
        this.game = game;
        
        // Performance tracking for LOD adjustments
        this.lastPerformanceLevel = null; // Track last performance level to detect changes
        
        // Performance monitoring
        this.frameRateHistory = [];
        this.frameRateHistoryMaxLength = 30; // Reduced from 60 to 30 frames
        this.lastPerformanceAdjustment = Date.now();
        this.performanceAdjustmentInterval = 5000; // Adjust every 5 seconds
        this.lowPerformanceMode = false;
        
        // Memory management
        this.lastMemoryCheck = Date.now();
        this.memoryCheckInterval = 10000; // Check every 10 seconds
        this.lastGarbageCollection = Date.now();
        this.gcInterval = 30000; // Force GC hint every 30 seconds
        
        // Environment density levels - reduced for better performance
        this.densityLevels = {
            high: 2.0,    // Reduced from 3.0
            medium: 1.2,  // Reduced from 2.0
            low: 0.6,     // Reduced from 1.0
            minimal: 0.3  // Reduced from 0.5
        };
        
        this.environmentDensity = this.densityLevels.medium; // Default to medium density
    }
    
    /**
     * Track frame rate for performance monitoring
     */
    trackFrameRate() {
        if (this.game && this.game.stats && this.game.stats.fps) {
            this.frameRateHistory.push(this.game.stats.fps);
            
            // Keep history at max length
            if (this.frameRateHistory.length > this.frameRateHistoryMaxLength) {
                this.frameRateHistory.shift();
            }
        }
    }
    
    /**
     * Calculate average FPS from frame rate history
     * @returns {number} - Average FPS
     */
    calculateAverageFPS() {
        if (this.frameRateHistory.length === 0) return 60; // Default to 60 if no history
        return this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / this.frameRateHistory.length;
    }
    
    /**
     * Determine performance level based on FPS
     * @param {number} avgFPS - Average FPS
     * @returns {Object} - Performance level information
     */
    determinePerformanceLevel(avgFPS) {
        let densityLevel, performanceMode;
        
        if (avgFPS < 20) {
            // Very low FPS - minimal density
            densityLevel = 'minimal';
            performanceMode = 'MINIMAL';
            this.lowPerformanceMode = true;
        } else if (avgFPS < 30) {
            // Low FPS - low density
            densityLevel = 'low';
            performanceMode = 'LOW';
            this.lowPerformanceMode = true;
        } else if (avgFPS < 45) {
            // Medium FPS - medium density
            densityLevel = 'medium';
            performanceMode = 'NORMAL';
            this.lowPerformanceMode = false;
        } else {
            // High FPS - high density
            densityLevel = 'high';
            performanceMode = 'HIGH';
            this.lowPerformanceMode = false;
        }
        
        return { densityLevel, performanceMode };
    }
    
    /**
     * Adjust performance settings based on current frame rate
     * @param {Function} setDensityLevelCallback - Callback to set density level
     * @param {Function} clearDistantChunksCallback - Callback to clear distant chunks
     */
    adjustPerformanceSettings(setDensityLevelCallback, clearDistantChunksCallback) {
        // Only proceed if we have enough frame rate history
        if (this.frameRateHistory.length <= 10) return;
        
        // Calculate average FPS
        const avgFPS = this.calculateAverageFPS();
        
        // Adjust performance mode and density based on FPS
        const wasLowPerformanceMode = this.lowPerformanceMode;
        
        // Determine performance level and density
        const { densityLevel, performanceMode } = this.determinePerformanceLevel(avgFPS);
        
        // Apply the new density level
        if (setDensityLevelCallback) {
            setDensityLevelCallback(densityLevel);
        }
        
        // Notify if performance mode changed
        if (wasLowPerformanceMode !== this.lowPerformanceMode || this.lastPerformanceLevel !== densityLevel) {
            console.debug(`Performance mode changed to: ${performanceMode} (density: ${densityLevel})`);
            this.lastPerformanceLevel = densityLevel;
            
            // Notify user if performance mode changed
            this.notifyPerformanceModeChange(performanceMode, densityLevel);
            
            // If switching to low performance mode, force terrain cleanup
            if (this.lowPerformanceMode && clearDistantChunksCallback) {
                clearDistantChunksCallback();
            }
        }
    }
    
    /**
     * Notify user of performance mode change
     * @param {string} performanceMode - New performance mode
     * @param {string} densityLevel - New density level
     */
    notifyPerformanceModeChange(performanceMode, densityLevel) {
        if (this.game && this.game.hudManager && this.game.hudManager.showNotification) {
            const message = `Performance mode: ${performanceMode} - Environment density set to ${densityLevel}`;
            this.game.hudManager.showNotification(message, 3000);
        }
    }
    
    /**
     * Calculate effective draw distance based on performance settings
     * @param {number} drawDistanceMultiplier - Base multiplier for draw distance
     * @returns {number} - Effective draw distance multiplier
     */
    calculateEffectiveDrawDistance(drawDistanceMultiplier) {
        // Get performance level from game if available
        let performanceLevel = 'medium';
        if (this.game && this.game.performanceManager) {
            performanceLevel = this.game.performanceManager.getCurrentPerformanceLevel();
        }
        
        // Apply more aggressive distance reduction based on performance level
        let effectiveMultiplier = drawDistanceMultiplier;
        
        switch (performanceLevel) {
            case 'low':
                effectiveMultiplier = Math.min(0.4, drawDistanceMultiplier);
                break;
            case 'medium':
                effectiveMultiplier = Math.min(0.7, drawDistanceMultiplier);
                break;
            case 'high':
                effectiveMultiplier = Math.min(1.0, drawDistanceMultiplier);
                break;
            default:
                effectiveMultiplier = Math.min(0.7, drawDistanceMultiplier);
        }
        
        return effectiveMultiplier;
    }
    
    /**
     * Set environment density level
     * @param {string} level - Density level: 'high', 'medium', 'low', or 'minimal'
     * @returns {number} - The new density value
     */
    setDensityLevel(level) {
        if (!this.densityLevels[level]) {
            console.warn(`Invalid density level: ${level}. Using 'medium' instead.`);
            level = 'medium';
        }
        
        this.environmentDensity = this.densityLevels[level];
        console.debug(`Environment density set to ${level} (${this.environmentDensity})`);
        
        return this.environmentDensity;
    }
    
    /**
     * Get current density level
     * @returns {number} - Current environment density
     */
    getDensityLevel() {
        return this.environmentDensity;
    }
    
    /**
     * Check if system is in low performance mode
     * @returns {boolean} - True if in low performance mode
     */
    isLowPerformanceMode() {
        return this.lowPerformanceMode;
    }
    
    /**
     * Log memory usage information if available
     */
    logMemoryUsage() {
        // Log memory usage if performance.memory is available (Chrome)
        if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory;
            const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024);
            const percentUsed = Math.round((usedMB / totalMB) * 100);
            
            console.debug(`Memory usage: ${usedMB}MB / ${totalMB}MB (${percentUsed}%)`);
            
            // Warn if memory usage is high
            if (percentUsed > 80) {
                console.warn(`⚠️ High memory usage detected: ${percentUsed}% of available heap`);
            }
        }
    }
    
    /**
     * Hint for garbage collection
     */
    hintGarbageCollection() {
        // Force garbage collection hint if available (Chrome with --js-flags="--expose-gc")
        if (window.gc) {
            try {
                window.gc();
                console.debug("Garbage collection hint triggered");
            } catch (e) {
                // Ignore if not available
            }
        } else {
            // Alternative approach for browsers without explicit GC
            // Create and release a large object to encourage GC
            try {
                const largeArray = new Array(10000).fill(0);
                largeArray.length = 0;
            } catch (e) {
                // Ignore any errors
            }
        }
        
        // Log memory usage
        this.logMemoryUsage();
    }
}