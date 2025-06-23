import * as THREE from 'three';
import { FOG_CONFIG } from '../../config/render.js';

/**
 * Manages fog effects in the game world
 * Provides realistic atmospheric fog that adjusts based on:
 * - Player position
 * - Zone type
 * - Time of day
 * - Weather conditions
 * - Performance settings
 */
export class FogManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Current fog settings
        this.currentFogColor = new THREE.Color(FOG_CONFIG.color);
        this.currentFogDensity = FOG_CONFIG.density;
        this.targetFogColor = new THREE.Color(FOG_CONFIG.color);
        this.targetFogDensity = FOG_CONFIG.density;
        
        // Initialize fog based on config
        this.initFog();
        
        // Track player's last position for optimization
        this.lastPlayerPosition = new THREE.Vector3(0, 0, 0);
        this.positionUpdateThreshold = 50; // Increased threshold to reduce updates (was 5)
        
        // For time-based fog effects
        this.timeOfDay = 'day'; // 'day', 'dawn', 'dusk', 'night'
        
        // For weather-based fog effects
        this.currentWeather = 'clear'; // 'clear', 'rain', 'fog', 'storm'
        
        // Performance tracking
        this.qualityLevel = 'ultra';
        this.drawDistanceMultiplier = 1.0;
    }
    
    // setGame method removed - game is now passed in constructor
    
    /**
     * Initialize fog based on configuration
     */
    initFog() {
        if (!FOG_CONFIG.enabled) {
            this.scene.fog = null;
            return;
        }
        
        // Create the appropriate fog type
        switch (FOG_CONFIG.type) {
            case 'exp2':
                this.scene.fog = new THREE.FogExp2(
                    FOG_CONFIG.color,
                    FOG_CONFIG.density
                );
                break;
            case 'exp':
                // THREE.js doesn't have exponential fog, so we use FogExp2 with adjusted density
                this.scene.fog = new THREE.FogExp2(
                    FOG_CONFIG.color,
                    FOG_CONFIG.density * 0.7 // Adjust density for exponential fog
                );
                break;
            case 'linear':
                this.scene.fog = new THREE.Fog(
                    FOG_CONFIG.color,
                    FOG_CONFIG.near,
                    FOG_CONFIG.far
                );
                break;
            default:
                // Default to exponential squared fog
                this.scene.fog = new THREE.FogExp2(
                    FOG_CONFIG.color,
                    FOG_CONFIG.density
                );
        }
        
        console.debug(`Fog initialized with type: ${FOG_CONFIG.type}, density: ${FOG_CONFIG.density}`);
    }
    
    /**
     * Update fog based on player position, zone, time of day, and performance settings
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    update(deltaTime, playerPosition) {
        if (!this.scene.fog || !FOG_CONFIG.enabled) {
            return;
        }
        
        // Skip update if player hasn't moved much
        if (playerPosition.distanceTo(this.lastPlayerPosition) < this.positionUpdateThreshold) {
            // Still update fog color and density transitions
            this.updateFogTransitions(deltaTime);
            return;
        }
        
        // Update last player position
        this.lastPlayerPosition.copy(playerPosition);
        
        // Get current zone at player position
        let zone = null;
        if (this.worldManager && this.worldManager.zoneManager) {
            zone = this.worldManager.zoneManager.getZoneAt(playerPosition);
        }
        
        // Get current performance settings
        if (this.game && this.game.performanceManager) {
            this.qualityLevel = this.game.performanceManager.getCurrentQualityLevel();
            this.drawDistanceMultiplier = this.game.performanceManager.getDrawDistanceMultiplier();
        }
        
        // Calculate base fog density based on performance settings
        let baseDensity = FOG_CONFIG.density;
        if (FOG_CONFIG.qualityMultipliers[this.qualityLevel]) {
            baseDensity *= FOG_CONFIG.qualityMultipliers[this.qualityLevel];
        }
        
        // Adjust density based on draw distance
        if (this.drawDistanceMultiplier < 1.0) {
            // Increase fog density when draw distance is reduced
            baseDensity *= (1.0 / this.drawDistanceMultiplier) * 0.5;
        }
        
        // Set target fog color based on zone
        if (zone) {
            this.setFogColorForZone(zone.name);
        } else {
            // Default sky color if no zone
            this.targetFogColor.set(FOG_CONFIG.color);
        }
        
        // Adjust fog based on time of day
        this.adjustFogForTimeOfDay();
        
        // Adjust fog based on weather
        this.adjustFogForWeather();
        
        // Set target fog density
        this.targetFogDensity = baseDensity;
        
        // Update fog transitions
        this.updateFogTransitions(deltaTime);
    }
    
    /**
     * Smoothly transition fog color and density
     * @param {number} deltaTime - Time since last update
     */
    updateFogTransitions(deltaTime) {
        if (!this.scene.fog) {
            return;
        }
        
        // Calculate transition speed based on delta time, but much slower
        // Reduced transition speed to 0.1 of original to make changes more gradual
        const transitionSpeed = FOG_CONFIG.transitionSpeed * (deltaTime * 60) * 0.1; // Normalize for 60fps
        
        // Smoothly transition fog color
        this.currentFogColor.lerp(this.targetFogColor, transitionSpeed);
        this.scene.fog.color.copy(this.currentFogColor);
        
        // Smoothly transition fog density
        if (this.scene.fog instanceof THREE.FogExp2) {
            this.currentFogDensity += (this.targetFogDensity - this.currentFogDensity) * transitionSpeed;
            this.scene.fog.density = this.currentFogDensity;
        } else if (this.scene.fog instanceof THREE.Fog) {
            // For linear fog, adjust near and far values
            const near = FOG_CONFIG.near;
            const baseFar = FOG_CONFIG.far;
            
            // Adjust far value based on density (inverse relationship)
            const far = baseFar * (FOG_CONFIG.density / this.currentFogDensity);
            
            this.scene.fog.near = near;
            this.scene.fog.far = far;
        }
    }
    
    /**
     * Set fog color based on zone type
     * @param {string} zoneName - The name of the zone
     */
    setFogColorForZone(zoneName) {
        switch (zoneName) {
            case 'Forest':
                this.targetFogColor.set(0x7ab07c); // Lighter greenish fog for forest
                break;
            case 'Desert':
                this.targetFogColor.set(0xd8c090); // Lighter tan fog for desert
                break;
            case 'Mountains':
                this.targetFogColor.set(0x90a0c0); // Lighter blue fog for mountains
                break;
            case 'Swamp':
                this.targetFogColor.set(0x6a8040); // Less dark green fog for swamp
                break;
            case 'Dark Sanctum':
                this.targetFogColor.set(0x483060); // Less dark purple fog for dark sanctum
                break;
            case 'Ruins':
                this.targetFogColor.set(0x909090); // Lighter gray fog for ruins
                break;
            default:
                this.targetFogColor.set(FOG_CONFIG.color); // Default lighter blue-gray
        }
    }
    
    /**
     * Adjust fog based on time of day
     */
    adjustFogForTimeOfDay() {
        switch (this.timeOfDay) {
            case 'dawn':
                // Lighter pinkish tint at dawn
                this.targetFogColor.lerp(new THREE.Color(0xffc0d0), 0.3);
                // Slightly increase density at dawn
                this.targetFogDensity *= 1.1;
                break;
            case 'dusk':
                // Lighter orange tint at dusk
                this.targetFogColor.lerp(new THREE.Color(0xffa060), 0.3);
                // Slightly increase density at dusk
                this.targetFogDensity *= 1.2;
                break;
            case 'night':
                // Less dark blue at night
                this.targetFogColor.lerp(new THREE.Color(0x202045), 0.5);
                // Moderately increase density at night
                this.targetFogDensity *= 1.5;
                break;
            default: // day
                // During day, add a slight brightness
                this.targetFogColor.lerp(new THREE.Color(0x90b0e0), 0.2);
                // Keep density normal during day
                this.targetFogDensity *= 1.0;
        }
    }
    
    /**
     * Adjust fog based on weather conditions
     */
    adjustFogForWeather() {
        switch (this.currentWeather) {
            case 'rain':
                // Lighter gray fog during rain
                this.targetFogColor.lerp(new THREE.Color(0x8090a0), 0.4);
                // Moderately increase density during rain
                this.targetFogDensity *= 1.3;
                break;
            case 'fog':
                // Lighter gray fog during foggy weather
                this.targetFogColor.lerp(new THREE.Color(0xc0c0c0), 0.6);
                // Increase density during fog, but less dramatically
                this.targetFogDensity *= 2.5;
                break;
            case 'storm':
                // Less dark gray fog during storms
                this.targetFogColor.lerp(new THREE.Color(0x505050), 0.5);
                // Increase density during storms, but less dramatically
                this.targetFogDensity *= 2.0;
                break;
            default: // clear weather
                // In clear weather, add a slight brightness
                this.targetFogColor.lerp(new THREE.Color(0x90b0e0), 0.2);
                // Keep normal density in clear weather
                this.targetFogDensity *= 1.0;
        }
    }
    
    /**
     * Set the current time of day
     * @param {string} timeOfDay - 'day', 'dawn', 'dusk', or 'night'
     */
    setTimeOfDay(timeOfDay) {
        this.timeOfDay = timeOfDay;
    }
    
    /**
     * Set the current weather condition
     * @param {string} weather - 'clear', 'rain', 'fog', or 'storm'
     */
    setWeather(weather) {
        this.currentWeather = weather;
    }
    
    /**
     * Enable or disable fog
     * @param {boolean} enabled - Whether fog should be enabled
     */
    setFogEnabled(enabled) {
        if (enabled && !this.scene.fog) {
            this.initFog();
        } else if (!enabled && this.scene.fog) {
            this.scene.fog = null;
        }
    }
    
    /**
     * Set fog density directly (overrides automatic settings)
     * @param {number} density - The fog density
     */
    setFogDensity(density) {
        this.targetFogDensity = density;
    }
    
    /**
     * Set fog color directly (overrides automatic settings)
     * @param {number|string} color - The fog color as hex
     */
    setFogColor(color) {
        this.targetFogColor.set(color);
    }
}